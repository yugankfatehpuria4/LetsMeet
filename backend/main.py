import asyncio
import os
import logging
from uuid import uuid4
from dotenv import load_dotenv
import pymongo

# Vision Agents imports
from vision_agents.core import agents
from vision_agents.plugins import getstream, gemini
from vision_agents.core.edge.types import User

# Runtime patch:
# Vision Agents may treat Gemini Realtime as requiring video track subscription,
# which triggers heavy VP8 decode errors and can block the event loop.
# We override its internal classification so Realtime models are treated as
# audio-first (disable video track subscription).
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
    # If patching fails, we fall back to the library default behavior.
    pass

# Core events
# Note: vision-agents versions differ in where these are exported from.
# Prefer vision_agents.core.events, but fall back to getstream.models when needed.
try:
    from vision_agents.core.events import (
        CallSessionParticipantJoinedEvent,
        CallSessionParticipantLeftEvent,
        CallSessionStartedEvent,
        CallSessionEndedEvent,
        PluginErrorEvent,
    )
except ImportError:
    from getstream.models import (  # type: ignore
        CallSessionParticipantJoinedEvent,
        CallSessionParticipantLeftEvent,
        CallSessionStartedEvent,
        CallSessionEndedEvent,
    )
    from vision_agents.core.events import PluginErrorEvent

# LLM events
from vision_agents.core.llm.events import (
    RealtimeUserSpeechTranscriptionEvent, 
    LLMResponseChunkEvent
)

# Setup logging (can be overridden by LOG_LEVEL env var)
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Reduce repeated warnings that flood logs and can impact performance.
logging.getLogger("vision_agents.core.utils.audio_queue").setLevel(
    logging.ERROR
)

# Reduce noisy codec and scheduling warnings while we optimize runtime.
logging.getLogger("aiortc.codecs.vpx").setLevel(logging.ERROR)
logging.getLogger("getstream.video.rtc.audio_track").setLevel(logging.ERROR)

# Load environment variables
load_dotenv()

# MongoDB setup
MONGODB_URI = os.getenv("MONGODB_URI")
mongo_client = pymongo.MongoClient(MONGODB_URI)
db = mongo_client["letsmeet"]
transcripts_collection = db["transcripts"]

# Meeting data storage
meeting_data = {
    "transcript": [],
    "is_active": False
}

async def start_agent(call_id: str):
    logger.info("🤖 Starting Meeting Assistant...")
    logger.info(f"📞 Call ID: {call_id}")
    
    # Create agent with Gemini Realtime
    agent = agents.Agent(
        edge=getstream.Edge(),
        agent_user=User(
            id="meeting-assistant-bot",
            name="Meeting Assistant"
        ),
        instructions="""
        You are a meeting transcription bot.
        
        CRITICAL RULES - FOLLOW EXACTLY:
        1. YOU MUST NEVER SPEAK unless someone says "Hey Assistant"
        2. DO NOT respond to conversations between users
        3. DO NOT acknowledge anything users say to each other
        4. DO NOT explain that you're staying silent
        5. DO NOT say "I should remain silent" or any variation
        6. ONLY RESPOND when you explicitly hear "Hey Assistant" followed by a question
        7. If unsure whether to speak: DON'T SPEAK
        
        Your ONLY job:
        - Listen silently
        - Transcribe everything
        - Wait for "Hey Assistant"
        
        When you DO hear "Hey Assistant":
        - Answer the question using meeting transcript and notes
        - Keep answer short and factual
        - Use only information from this meeting
        
        Example:
        ❌ User: "Let's discuss the budget" → You: STAY COMPLETELY SILENT
        ❌ User: "What do you think?" → You: STAY COMPLETELY SILENT
        
        ✅ User: "Hey Assistant, what are the action items?" → You: Answer with action items
        ✅ User: "Hey Assistant, summarize the meeting" → You: Provide summary
        """,
        llm=gemini.Realtime(fps=0),
    )
    
    meeting_data["agent"] = agent
    meeting_data["call_id"] = call_id

    # Performance: avoid blocking the event loop.
    # MongoDB writes with pymongo are synchronous; doing them inside the
    # realtime audio/transcription callbacks can delay the audio scheduler.
    transcript_buffer = []
    buffer_lock = asyncio.Lock()
    stop_event = asyncio.Event()
    buffer_max = 25
    flush_interval_sec = 2.0

    async def flush_transcript_buffer():
        batch = None
        async with buffer_lock:
            if not transcript_buffer:
                return
            batch = transcript_buffer[:]
            transcript_buffer.clear()

        try:
            # Run sync pymongo in a worker thread so the event loop stays responsive.
            await asyncio.to_thread(
                transcripts_collection.insert_many, batch, False
            )
        except Exception as e:
            logger.error(f"❌ Failed to flush transcript buffer: {e}")

    async def flush_loop():
        while not stop_event.is_set():
            await asyncio.sleep(flush_interval_sec)
            await flush_transcript_buffer()

        # Final flush on stop
        await flush_transcript_buffer()
    
    @agent.events.subscribe
    async def handle_session_started(event: CallSessionStartedEvent):
        meeting_data["is_active"] = True
        logger.info("🎙️ Meeting started")
        
        try:
            channel = agent.edge.client.channel("messaging", call_id)
            await channel.watch()
            meeting_data["channel"] = channel
            logger.info("✅ Chat channel initialized")
        except Exception as e:
            logger.error(f"❌ Chat channel error: {e}")
    
    @agent.events.subscribe
    async def handle_participant_joined(event: CallSessionParticipantJoinedEvent):
        if event.participant.user.id == "meeting-assistant-bot":
            return
        participant_name = event.participant.user.name
        logger.info(f"👤 Participant joined: {participant_name}")
    
    @agent.events.subscribe
    async def handle_participant_left(event: CallSessionParticipantLeftEvent):
        if event.participant.user.id == "meeting-assistant-bot":
            return
        participant_name = event.participant.user.name
        logger.info(f"👋 Participant left: {participant_name}")
    
    @agent.events.subscribe
    async def handle_transcript(event: RealtimeUserSpeechTranscriptionEvent):
        """Handle transcripts"""
        if not event.text or len(event.text.strip()) == 0:
            return
        
        speaker = getattr(event, 'participant_id', 'Unknown')
        transcript_text = event.text
        
        # Store transcript in memory
        meeting_data["transcript"].append({
            "speaker": speaker,
            "text": transcript_text,
            "timestamp": getattr(event, 'timestamp', None)
        })

        # Buffer MongoDB writes to keep the audio event loop responsive.
        transcript_doc = {
            "meeting_id": meeting_data["call_id"],
            "speaker": speaker,
            "text": transcript_text,
            "timestamp": getattr(event, 'timestamp', None) or None
        }
        transcript_buffer.append(transcript_doc)
        if len(transcript_buffer) >= buffer_max:
            # Don't await here; flush runs in the background.
            asyncio.create_task(flush_transcript_buffer())

        # Reduce log spam (logging can also block / slow the loop).
        meeting_data["transcript_count"] = meeting_data.get("transcript_count", 0) + 1
        if meeting_data["transcript_count"] % 10 == 0:
            preview = transcript_text[:60].replace("\n", " ")
            logger.info(f"📝 [{speaker}]: {preview}...")
        
        # Q&A handling
        if transcript_text.lower().startswith("hey assistant"):
            question = transcript_text[13:].strip()
            
            if question:
                logger.info(f"❓ Q&A triggered: {question}")
                
                # Build context from transcript
                context = "MEETING TRANSCRIPT:\n\n"
                # Keep prompt small to avoid blocking realtime callbacks.
                # (Most recent turns are usually enough for a short Q&A.)
                for entry in meeting_data["transcript"][-200:]:
                    context += f"[{entry['speaker']}]: {entry['text']}\n"
                
                prompt = f"""
                {context}
                
                USER QUESTION: {question}
                
                Answer based ONLY on the meeting transcript above.
                Be concise and helpful.
                """
                
                try:
                    await agent.simple_response(prompt)
                    logger.info(f"🤖 Responding to question")
                except Exception as e:
                    logger.error(f"❌ Q&A error: {e}")
    
    @agent.events.subscribe
    async def handle_llm_response(event: LLMResponseChunkEvent):
        """Log agent responses"""
        if hasattr(event, 'delta') and event.delta:
            logger.info(f"🤖 Agent: {event.delta}")
    
    @agent.events.subscribe
    async def handle_session_ended(event: CallSessionEndedEvent):
        meeting_data["is_active"] = False
        logger.info("🛑 Meeting ended")
        stop_event.set()
        logger.info(f"📊 Final Stats:")
        logger.info(f"   - Transcript entries: {len(meeting_data['transcript'])}")
    
    @agent.events.subscribe
    async def handle_errors(event: PluginErrorEvent):
        logger.error(f"❌ Plugin error: {event.error_message}")
        if event.is_fatal:
            logger.error("🚨 Fatal error")
    
    flush_task = asyncio.create_task(flush_loop())

    # Initialize agent
    try:
        await agent.create_user()
        call = agent.edge.client.video.call("default", call_id)

        logger.info("✅ Joining call...")
        with await agent.join(call):
            logger.info("\n" + "=" * 60)
            logger.info("🎙️  MEETING ASSISTANT ACTIVE!")
            logger.info("=" * 60)
            logger.info("\n📋 Features:")
            logger.info("   1. ✅ Auto-transcription")
            logger.info("   2. ✅ Q&A (say 'Hey Assistant' + question)")
            logger.info(f"\n🔗 Meeting ID: {call_id}")
            logger.info("\nPress Ctrl+C to stop\n")
            logger.info("=" * 60 + "\n")

            await agent.finish()
    except asyncio.CancelledError:
        # Clean cancellation (Ctrl+C) - let outer handler finish shutdown.
        logger.info("🛑 Agent task cancelled, shutting down...")
        raise
    finally:
        stop_event.set()
        try:
            await flush_transcript_buffer()
        finally:
            flush_task.cancel()
            # Best-effort task cleanup.
            try:
                await flush_task
            except asyncio.CancelledError:
                pass
            except Exception:
                pass

    logger.info("✅ Agent finished")

def print_meeting_summary():
    """Print meeting summary"""
    print("\n" + "="*70)
    print("📋 MEETING SUMMARY")
    print("="*70)
    
    print(f"\n📝 Transcript ({len(meeting_data['transcript'])} entries):")
    print("-"*70)
    for entry in meeting_data['transcript']:
        print(f"[{entry['speaker']}]: {entry['text']}")
    
    print("\n" + "="*70)
    print("✅ Summary Complete")
    print("="*70 + "\n")

if __name__ == "__main__":
    call_id = os.getenv("CALL_ID", f"meeting-{uuid4().hex[:8]}")
    
    print("\n" + "="*70)
    print("🎯 SMART MEETING ASSISTANT")
    print("="*70)
    print("\n✨ Features:")
    print("   1. Auto-transcription")
    print("   2. Q&A with 'Hey Assistant'")
    print("="*70 + "\n")
    
    try:
        asyncio.run(start_agent(call_id))
    except KeyboardInterrupt:
        # Ctrl+C: shutdown noise from async generators/cleanup is common; suppress it.
        print("\n\n🛑 Stopped by user")
    except RuntimeError as e:
        # vision-agents / stream cleanup sometimes throws during shutdown.
        msg = str(e)
        if "aclose(): asynchronous generator is already running" in msg:
            print("\n\n🛑 Shutdown cleanup error suppressed")
        else:
            raise
    finally:
        if meeting_data["transcript"]:
            print_meeting_summary()