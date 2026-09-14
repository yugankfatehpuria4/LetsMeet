# LetsMeet — Production AI Video Meeting Platform & Real-Time Assistant

<div align="center">

![LetsMeet Logo](https://img.shields.io/badge/LetsMeet-AI%20Meeting%20Assistant-00f5ff?style=for-the-badge&logo=google)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Stream.io](https://img.shields.io/badge/Stream.io-WebRTC%20Video-0055ff?style=flat-square)](https://getstream.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini-Realtime%20AI-8E75B2?style=flat-square&logo=google-gemini)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

**Real-Time Multimodal WebRTC Meetings · Live Speech Transcription · Interactive Voice/Text Q&A · Automated AI Summaries · Action Item Extraction & Tracking**

</div>

---

## 📌 Executive Summary

**LetsMeet** is an enterprise-grade, full-stack video conference platform integrated with an autonomous **AI Meeting Assistant**. Designed with a high-performance **Next.js 16 (React 19)** frontend, a non-blocking **Python WebRTC AI bot** running Google Gemini Realtime, and **MongoDB Atlas** persistence, LetsMeet transforms ordinary video calls into actionable team intelligence.

---

## 🎯 Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Next.js 16 Web Application"]
        UI[Cyberpunk HUD Meeting UI]
        StreamReact[Stream Video React SDK]
        TranscriptComp[Live Transcript Panel]
        SummaryComp[AI Summary & Action Items Panel]
    end

    subgraph Edge ["Real-time Infrastructure"]
        StreamSFU[Stream.io SFU / WebRTC Network]
    end

    subgraph AIBackend ["Python AI Bot (Vision Agents Engine)"]
        BotWorker[Async Event Loop Worker]
        AudioQueue[Non-Blocking Audio Buffer]
        GeminiRealtime[Google Gemini Realtime Live API]
    end

    subgraph Database ["MongoDB Atlas Persistence"]
        DBMeetings[(Meetings Collection)]
        DBTranscripts[(Transcripts Collection)]
        DBSummaries[(AI Summaries Collection)]
        DBActionItems[(Action Items Collection)]
    end

    UI <-->|WebRTC Video/Audio| StreamSFU
    BotWorker <-->|Join SFU Call Track| StreamSFU
    BotWorker <-->|Duplex Real-Time Audio| GeminiRealtime
    BotWorker -->|Async Batch Ingest| DBTranscripts
    UI <-->|REST APIs / JSON| DBMeetings
    UI <-->|Fetch Summaries & Action Items| DBSummaries
    UI <-->|Toggle Task Status| DBActionItems
```

---

## ✨ Key Features Matrix

| Feature Module | Technical Highlights | Production Value |
| :--- | :--- | :--- |
| **HD WebRTC Video Conference** | Built on Stream.io SDK with dynamic speaker layout, grid controls, and low-latency audio/video routing. | Enterprise-grade reliability with global SFU media servers. |
| **Instant Dynamic Rooms** | Host instant UUID meetings (`/meeting/room-xxxx`) or enter custom room codes. Share links with one click. | Eliminates hardcoded room locks; enables concurrent calls. |
| **Live Speech Transcription** | Closed captions ingested simultaneously from browser client and Python bot edge transport. | Zero transcript loss with dual client-bot fallbacks. |
| **Interactive Voice Q&A** | Trigger assistant verbally by saying *"Hey Assistant"*. Bot analyzes context and responds in real time. | Real-time multimodal voice intelligence. |
| **AI Summary Synthesis** | Post-call NLP synthesis via Gemini 1.5/2.0 Flash to generate key points, decisions, and next steps. | Automated executive notes generation. |
| **Action Items Manager** | Extracts structured tasks (Task, Owner, Deadline) with interactive status toggles (`Pending` / `Completed`). | Connects meeting discussion directly to task management. |
| **Meeting Intelligence Dashboard** | Dedicated `/dashboard` to search, view, and inspect past meeting logs, summaries, and transcripts. | Full audit trail and knowledge repository. |
| **Exportable Notes (.md)** | Download meeting notes and action item checklists as formatted Markdown documents with 1 click. | Integrates easily into Notion, Jira, or GitHub. |

---

## 🛠️ Complete Tech Stack

- **Frontend Core**: Next.js 16.1.1 (App Router), React 19, JavaScript ES2024.
- **UI & Styling**: Tailwind CSS v4, Cyberpunk Glassmorphism Design System, Lucide icons, Three.js (ArcReactor Canvas).
- **Video & WebRTC**: `@stream-io/video-react-sdk`, `@stream-io/node-sdk`, `Stream-Chat-React`.
- **AI Infrastructure**: `Google Gemini Realtime Live API`, `@google/generative-ai`, `vision-agents[gemini,getstream]`.
- **Backend & Async I/O**: Python 3.11, `asyncio`, PyMongo worker thread pools (`asyncio.to_thread`).
- **Database & Storage**: MongoDB Atlas, Mongoose 8.x schema design with indexed lookup.
- **Containerization & Health**: Docker, `docker-compose`, Health Check Probe (`/api/health`).

---

## 🚀 Quick Start Guide (Local Setup)

### Prerequisites
- **Node.js**: `v20.x` or later
- **Python**: `3.11.x`
- **MongoDB Atlas** connection string (or local MongoDB)
- **Stream.io** API credentials ([getstream.io](https://getstream.io))
- **Google Gemini API Key** ([ai.google.dev](https://ai.google.dev))

---

### Step 1: Clone & Configure Environment Variables

```bash
git clone https://github.com/yugankfatehpuria/LetsMeet.git
cd LetsMeet
```

Create `.env` inside `meet-assistant/` and `backend/`:

**`meet-assistant/.env`**:
```env
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
NEXT_PUBLIC_CALL_ID=demo-meeting-room
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/letsmeet?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key
```

**`backend/.env`**:
```env
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
CALL_ID=demo-meeting-room
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/letsmeet?retryWrites=true&w=majority
```

---

### Step 2: Start the Next.js Frontend

```bash
cd meet-assistant
npm install
npm run dev
```
*Access frontend at [http://localhost:3001](http://localhost:3001)*

---

### Step 3: Start the Python AI Meeting Bot

```bash
cd ../backend
python3 -m pip install -r requirements.txt
python3 main.py
```
*The AI Assistant will log `🤖 Agent ready to speak` and join WebRTC calls.*

---

## 🐳 Docker Deployment Setup

Run the entire application stack (Frontend + Backend Bot + MongoDB) with Docker Compose:

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3001](http://localhost:3001)
- **Health Check Probe**: [http://localhost:3001/api/health](http://localhost:3001/api/health)
- **MongoDB**: `localhost:27017`

---

## 📊 Database Schemas

### `Meeting` Collection
```typescript
{
  meeting_id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  created_by: { type: String, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  participants: [String],
  timestamps: true
}
```

### `ActionItem` Collection
```typescript
{
  meeting_id: { type: String, required: true, index: true },
  task: { type: String, required: true },
  assigned_to: { type: String, default: 'Unassigned' },
  deadline: { type: String, default: 'Not specified' },
  completed: { type: Boolean, default: false },
  timestamps: true
}
```

---

## 🎓 College Placement & Interview Cheat Sheet

Use these technical talking points when presenting this project during software engineering interviews:

### 1. High-Concurrency Non-Blocking Audio Pipeline
> *"To handle high-frequency speech transcription without delaying the WebRTC audio scheduler in Python, I implemented an asynchronous buffer flush queue using `asyncio.to_thread` and PyMongo's bulk `insert_many` operation, decoupling database I/O from the realtime media stream."*

### 2. Full-Stack Next.js 16 Architecture
> *"I built the client application using Next.js 16's App Router, leveraging Serverless API routes for Stream JWT token generation, MongoDB schema operations, and Gemini NLP text generation."*

### 3. Real-Time Multimodal Voice AI Integration
> *"I integrated Google Gemini's Realtime WebSocket API with GetStream's SFU media transport, creating a hands-free meeting assistant that transcribes speech continuously and responds contextually when triggered by the wake phrase 'Hey Assistant'."*

---

## 📝 License

This project is licensed under the MIT License.
