# LetsMeet — Next.js 16 Web Frontend

The client web application for **LetsMeet**, built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, **GetStream Video SDK**, and **MongoDB**.

---

## ✨ Features

- **Dynamic Room Routing**: Create instant UUID meeting rooms (`/meeting/room-xxxx`) or enter custom codes.
- **Real-Time Video Conference**: Integrated `@stream-io/video-react-sdk` with grid view, speaker layout, and media controls.
- **AI Transcript Console**: Real-time closed captioning stream with auto-scrolling log UI.
- **Interactive Action Items Manager**: Toggle task status between `Pending` and `Completed` synced to MongoDB.
- **Meeting Notes Export**: Export key discussion points and action items as `.md` Markdown files.
- **Meeting Intelligence Dashboard (`/dashboard`)**: Search, filter, and inspect past meeting logs and AI summaries.
- **Health Check Probe (`/api/health`)**: Endpoint for container orchestrators (Kubernetes/AWS ECS) to verify database latency and API health.

---

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup (`.env`)
```env
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
NEXT_PUBLIC_CALL_ID=demo-meeting-room
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/letsmeet?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3001](http://localhost:3001).

---

## 🚀 Production Deployment

### Vercel Deployment (Recommended)
1. Import repository into Vercel.
2. Set Environment Variables in Vercel settings.
3. Deploy.

### Docker Deployment
```bash
docker build -t letsmeet-frontend .
docker run -p 3000:3000 --env-file .env letsmeet-frontend
```
