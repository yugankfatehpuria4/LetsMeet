# LetsMeet — Python AI Assistant Backend

The backend of **LetsMeet** is an autonomous Python AI service powered by **Vision-Agents**, **GetStream SFU WebRTC**, and **Google Gemini Realtime Live API**.

---

## 🎯 Architecture & Capabilities

1. **WebRTC SFU Participant**: The Python bot joins Stream Video calls as an active WebRTC participant (`meeting-assistant-bot`).
2. **Real-time Audio Transcription**: Captures audio frames, streams speech to Gemini Realtime API, and generates instant transcripts.
3. **Hands-free Wake-Word Q&A**: Listens silently for *"Hey Assistant"* to answer questions contextually using recent meeting history.
4. **Non-blocking Asynchronous DB Persistence**: Uses buffered thread-pool flushes (`asyncio.to_thread` with `pymongo.insert_many`) to prevent database write latency from blocking audio frames.
5. **Cross-Platform SSL Handshake Safety**: Dynamic `certifi` CA certificate integration ensuring zero SSL handshake failures on macOS and Linux.

---

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.11+
- Virtual environment (recommended)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Environment Configuration (`.env`)
Create a `.env` file in the `backend/` directory:

```env
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
CALL_ID=demo-meeting-room
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/letsmeet?retryWrites=true&w=majority
```

---

## 🚀 Running the Bot

### Standard CLI Execution
```bash
python3 main.py
```

### Docker Container Execution
```bash
docker build -t letsmeet-backend .
docker run --env-file .env letsmeet-backend
```

---

## 🔒 Reliability Features

- **Automatic SSL CA Fallback**: Dynamically patches system CA certs via `certifi` to resolve macOS OpenSSL verification failures.
- **Graceful DB Degradation**: If MongoDB Atlas connection fails or DNS SRV records are unreachable, the bot logs a warning and operates in memory mode without crashing.
- **Clean Event Loop Shutdown**: Intercepts `KeyboardInterrupt` to flush remaining transcript buffers before unregistering from Stream call sessions.
