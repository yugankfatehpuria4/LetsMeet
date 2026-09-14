import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning)
warnings.filterwarnings("ignore", category=UserWarning)

import asyncio
import os
import sys
import ssl
import logging
from uuid import uuid4
from dotenv import load_dotenv

# Fix macOS SSL certificate verification for GetStream WebSockets / WSS connections
os.environ["PYTHONHTTPSVERIFY"] = "0"
try:
    import certifi
    os.environ["SSL_CERT_FILE"] = certifi.where()
    os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()
except Exception:
    pass

try:
    ssl._create_default_https_context = ssl._create_unverified_context
except Exception:
    pass

try:
    import aiohttp
    _orig_tcp_init = aiohttp.TCPConnector.__init__
    def _patched_tcp_init(self, *args, **kwargs):
        kwargs['ssl'] = False
        _orig_tcp_init(self, *args, **kwargs)
    aiohttp.TCPConnector.__init__ = _patched_tcp_init
except Exception:
    pass

from aiohttp import web

import pymongo

# Vision Agents imports
from vision_agents.core import agents
from vision_agents.plugins import getstream, gemini
from vision_agents.core.edge.types import User

# Runtime patch for Gemini Realtime audio-first classification
try:
    import vision_agents.core.agents.agents as agents_module
    from vision_agents.core.llm.llm import VideoLLM
    from vision_agents.core.llm.realtime import Realtime

    def _patched_is_video_llm(llm):
        if isinstance(llm, Realtime):
            return False
        return isinstance(llm, VideoLLM)

    agents_module._is_video_llm = _patched_is_video_llm
except Exception:
    pass

# Core events
try:
    from vision_agents.core.events import (
        CallSessionParticipantJoinedEvent,
        CallSessionParticipantLeftEvent,
        CallSessionStartedEvent,
        CallSessionEndedEvent,
        PluginErrorEvent,
    )
except Exception:
    from getstream.models import (  # type: ignore
        CallSessionParticipantJoinedEvent,
        CallSessionParticipantLeftEvent,
        CallSessionStartedEvent,
        CallSessionEndedEvent,
    )
    try:
        from vision_agents.core.events import PluginErrorEvent
    except Exception:
        try:
            from vision_agents.core.events.base import PluginErrorEvent  # type: ignore
        except Exception:
            PluginErrorEvent = None  # type: ignore[misc,assignment]

# LLM events
from vision_agents.core.llm.events import (
    RealtimeUserSpeechTranscriptionEvent, 
    LLMResponseChunkEvent
)

# Setup logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

logging.getLogger("vision_agents.core.utils.audio_queue").setLevel(logging.ERROR)
logging.getLogger("aiortc.codecs.vpx").setLevel(logging.ERROR)
logging.getLogger("getstream.video.rtc.audio_track").setLevel(logging.ERROR)

load_dotenv()

STREAM_API_KEY = os.getenv("STREAM_API_KEY")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/letsmeet")

if not STREAM_API_KEY or not STREAM_API_SECRET:
    logger.warning("⚠️ STREAM_API_KEY or STREAM_API_SECRET is missing from environment!")

try:
    mongo_client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
    mongo_client.admin.command('ping')
    db = mongo_client["letsmeet"]
    transcripts_collection = db["transcripts"]
    logger.info("✅ MongoDB connected successfully")
except Exception:
    try:
        fallback_uri = "mongodb://127.0.0.1:27017/letsmeet"
        mongo_client = pymongo.MongoClient(fallback_uri, serverSelectionTimeoutMS=2000)
        mongo_client.admin.command('ping')
        db = mongo_client["letsmeet"]
        transcripts_collection = db["transcripts"]
        logger.info("✅ Connected to local MongoDB fallback (mongodb://127.0.0.1:27017)")
    except Exception:
        logger.warning("⚠️ MongoDB is not accessible. Running with in-memory transcript buffer.")
        transcripts_collection = None

# Active room bots registry
# Structure: { call_id: { "task": asyncio.Task, "stop_event": asyncio.Event, "transcript": [] } }
active_bots = {}

async def run_bot_for_room(call_id: str):
    logger.info(f"🤖 Launching Bot for Call ID: {call_id}")
    
    room_transcript = []
    
    agent = agents.Agent(
        edge=getstream.Edge(),
        agent_user=User(
            id="meeting-assistant-bot",
            name="Meeting Assistant"
        ),
        instructions="""
        You are a meeting transcription and Q&A bot.
        
        CRITICAL RULES - FOLLOW EXACTLY:
        1. YOU MUST NEVER SPEAK unless someone explicitly says "Hey Assistant"
        2. DO NOT respond to conversations between users
        3. DO NOT acknowledge anything users say to each other
        4. DO NOT explain that you're staying silent
        5. ONLY RESPOND when you explicitly hear "Hey Assistant" followed by a question
        6. If unsure whether to speak: DON'T SPEAK
        
        When you DO hear "Hey Assistant":
        - Answer the question using meeting transcript context
        - Keep answer short, clear, and factual
        """,
        llm=gemini.Realtime(fps=0),
    )
    
    transcript_buffer = []
    buffer_lock = asyncio.Lock()
    stop_event = asyncio.Event()
    buffer_max = 20
    flush_interval_sec = 2.0

    async def flush_transcript_buffer():
        batch = None
        async with buffer_lock:
            if not transcript_buffer:
                return
            batch = transcript_buffer[:]
            transcript_buffer.clear()

        try:
            if transcripts_collection is not None:
                await asyncio.to_thread(
                    transcripts_collection.insert_many, batch, False
                )
        except Exception as e:
            logger.error(f"❌ [{call_id}] Failed to flush transcript buffer: {e}")

    async def flush_loop():
        while not stop_event.is_set():
            await asyncio.sleep(flush_interval_sec)
            await flush_transcript_buffer()
        await flush_transcript_buffer()

    @agent.events.subscribe
    async def handle_session_started(event: CallSessionStartedEvent):
        logger.info(f"🎙️ [{call_id}] Meeting session started")

    @agent.events.subscribe
    async def handle_transcript(event: RealtimeUserSpeechTranscriptionEvent):
        if not event.text or len(event.text.strip()) == 0:
            return
        
        speaker = getattr(event, 'participant_id', 'Unknown')
        transcript_text = event.text.strip()
        
        room_transcript.append({
            "speaker": speaker,
            "text": transcript_text,
            "timestamp": getattr(event, 'timestamp', None)
        })

        transcript_doc = {
            "meeting_id": call_id,
            "speaker": speaker,
            "text": transcript_text,
            "timestamp": getattr(event, 'timestamp', None) or None
        }
        
        async with buffer_lock:
            transcript_buffer.append(transcript_doc)
            if len(transcript_buffer) >= buffer_max:
                asyncio.create_task(flush_transcript_buffer())

        # Q&A handling
        if transcript_text.lower().startswith("hey assistant"):
            question = transcript_text[13:].strip()
            if question:
                logger.info(f"❓ [{call_id}] Q&A triggered: {question}")
                context = "MEETING TRANSCRIPT:\n\n"
                for entry in room_transcript[-200:]:
                    context += f"[{entry['speaker']}]: {entry['text']}\n"
                
                prompt = f"{context}\n\nUSER QUESTION: {question}\n\nAnswer concisely based on the transcript."
                try:
                    await agent.simple_response(prompt)
                    logger.info(f"🤖 [{call_id}] Responding to question")
                except Exception as e:
                    logger.error(f"❌ [{call_id}] Q&A error: {e}")

    @agent.events.subscribe
    async def handle_llm_response(event: LLMResponseChunkEvent):
        if hasattr(event, 'delta') and event.delta:
            logger.info(f"🤖 Agent [{call_id}]: {event.delta}")

    flush_task = asyncio.create_task(flush_loop())

    try:
        await agent.create_user()
        call = agent.edge.client.video.call("default", call_id)
        logger.info(f"✅ [{call_id}] Joining WebRTC call...")

        with await agent.join(call):
            logger.info(f"🎙️ MEETING ASSISTANT ACTIVE for room {call_id}!")
            await agent.finish()
    except asyncio.CancelledError:
        logger.info(f"🛑 [{call_id}] Bot task cancelled, shutting down...")
    except Exception as e:
        logger.error(f"❌ [{call_id}] Agent runtime error: {e}")
    finally:
        stop_event.set()
        try:
            await flush_transcript_buffer()
        finally:
            flush_task.cancel()
            try:
                await flush_task
            except Exception:
                pass
        active_bots.pop(call_id, None)
        logger.info(f"✅ [{call_id}] Bot shutdown complete")

# HTTP Server Handlers for Next.js Integration
async def handle_health(request):
    return web.json_response({
        "status": "healthy",
        "service": "letsmeet-python-bot-manager",
        "active_bots": list(active_bots.keys()),
        "active_count": len(active_bots)
    })

async def handle_bot_join(request):
    try:
        data = await request.json()
        call_id = data.get("call_id")
        if not call_id:
            return web.json_response({"ok": False, "message": "call_id is required"}, status=400)

        if call_id in active_bots:
            return web.json_response({
                "ok": true,
                "message": f"Bot already running for room {call_id}",
                "call_id": call_id
            })

        task = asyncio.create_task(run_bot_for_room(call_id))
        active_bots[call_id] = {
            "task": task,
            "created_at": asyncio.get_event_loop().time()
        }

        return web.json_response({
            "ok": True,
            "message": f"Bot launched for room {call_id}",
            "call_id": call_id
        })
    except Exception as e:
        logger.error(f"Error in handle_bot_join: {e}")
        return web.json_response({"ok": False, "message": str(e)}, status=500)

async def handle_bot_leave(request):
    try:
        data = await request.json()
        call_id = data.get("call_id")
        if not call_id:
            return web.json_response({"ok": False, "message": "call_id is required"}, status=400)

        bot_info = active_bots.get(call_id)
        if bot_info and not bot_info["task"].done():
            bot_info["task"].cancel()

        return web.json_response({
            "ok": True,
            "message": f"Bot shutdown requested for room {call_id}"
        })
    except Exception as e:
        return web.json_response({"ok": False, "message": str(e)}, status=500)

async def init_app():
    app = web.Application()
    app.router.add_get('/health', handle_health)
    app.router.add_get('/api/bot/health', handle_health)
    app.router.add_post('/join', handle_bot_join)
    app.router.add_post('/api/bot/join', handle_bot_join)
    app.router.add_post('/leave', handle_bot_leave)
    app.router.add_post('/api/bot/leave', handle_bot_leave)
    return app

async def main():
    port = int(os.getenv("PORT", "8000"))
    app = await init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    
    logger.info("=" * 60)
    logger.info(f"🎯 LETSMEET AI BOT SERVER RUNNING ON PORT {port}")
    logger.info(f"📡 API Health: http://localhost:{port}/health")
    logger.info(f"🔗 Bot Join Endpoint: POST http://localhost:{port}/join")
    logger.info("=" * 60)

    # Optional default call_id auto-join from env
    default_call_id = os.getenv("CALL_ID")
    if default_call_id:
        logger.info(f"🚀 Auto-joining default call ID from .env: {default_call_id}")
        asyncio.create_task(run_bot_for_room(default_call_id))

    # Keep server running until shutdown
    try:
        await asyncio.Event().wait()
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("🛑 Shutting down AI bot server...")
        for call_id, bot_info in list(active_bots.items()):
            if not bot_info["task"].done():
                bot_info["task"].cancel()
        await runner.cleanup()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Server stopped by user")