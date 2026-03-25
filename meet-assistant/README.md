# LetsMeet — AI Meeting Assistant

![LetsMeet Logo](https://img.shields.io/badge/LetsMeet-AI%20Meeting%20Assistant-00f5ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5LjUgMTJDOS41IDE4IDguOSAxNy4xIDggMTZWMTRDOCA0LjkgOC45IDQgMTIgNFoiIGZpbGw9IiMwMGY1ZmYiLz4KPHBhdGggZD0iTTEyIDIwQzE1LjMgMjAgMTggMTcuMyAxOCA5QzE4IDQuNyAxNS4zIDIgMTIgMloiIGZpbGw9IiMwMGY1ZmYiLz4KPC9zdmc+)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.8.0-47a248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Stream.io](https://img.shields.io/badge/Stream.io-Video%20%26%20Chat-0055ff?style=flat-square)](https://getstream.io/)

A cutting-edge meeting platform powered by AI, featuring real-time transcription, intelligent summaries, action item extraction, and seamless video collaboration. Built with modern web technologies for optimal performance and user experience.

## ✨ Features

### 🎥 Core Meeting Features
- **HD Video Calling** - Crystal-clear video with Stream.io's enterprise-grade infrastructure
- **Real-time Chat** - Integrated messaging during meetings
- **Screen Sharing** - Share your screen or specific applications
- **Meeting Recording** - Record meetings for later review (planned)

### 🤖 AI-Powered Intelligence
- **Live Transcription** - Real-time speech-to-text with high accuracy
- **AI Summaries** - Automatically generated meeting summaries
- **Action Items** - Intelligent extraction of tasks and follow-ups
- **Smart Insights** - Meeting analytics and participant engagement metrics

### 🚀 Performance & UX
- **PWA Ready** - Install as a native app on mobile and desktop
- **Offline Support** - Core functionality works offline
- **Progressive Loading** - Optimized loading states and animations
- **Responsive Design** - Perfect experience on all devices

### 🔧 Technical Excellence
- **Next.js 16** - Latest App Router with server-side rendering
- **React 19** - Concurrent features and optimized rendering
- **MongoDB** - Scalable data persistence
- **Tailwind CSS v4** - Cyberpunk-themed modern styling
- **Service Worker** - Background sync and caching

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Real-time**: Stream.io (Video, Chat, Transcription)
- **AI**: Google Generative AI, Custom Python agents
- **3D Graphics**: Three.js with React Three Fiber
- **Deployment**: Vercel/Netlify ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB Atlas account (or local MongoDB)
- Stream.io account
- Google AI API key (for summaries)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/letsmeet.git
   cd letsmeet/meet-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your actual credentials:
   ```env
   NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key_here
   STREAM_SECRET_KEY=your_stream_secret_key_here
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/letsmeet?retryWrites=true&w=majority
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   NEXT_PUBLIC_APP_URL=https://letsmeet.ai
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Open the app in your browser
2. Click the install icon in the address bar
3. Follow the installation prompts

### Mobile (iOS/Android)
1. Open the app in Safari/Chrome
2. Tap "Share" → "Add to Home Screen"
3. Follow the installation prompts

## 🏗️ Project Structure

```
meet-assistant/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── token/               # Stream authentication
│   ├── components/              # React components
│   │   ├── error-boundary.jsx   # Error handling
│   │   ├── stream-provider.jsx  # Stream.io provider
│   │   └── ...
│   ├── hooks/                   # Custom React hooks
│   ├── meeting/[id]/            # Dynamic meeting routes
│   ├── globals.css              # Global styles
│   ├── layout.js                # Root layout
│   ├── loading.js               # Loading UI
│   ├── not-found.js             # 404 page
│   └── page.js                  # Homepage
├── models/                      # MongoDB schemas
│   ├── Meeting.js
│   ├── Transcript.js
│   ├── AISummary.js
│   └── ActionItem.js
├── public/                      # Static assets
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   ├── robots.txt               # SEO
│   ├── sitemap.xml              # SEO
│   └── ...
├── backend/                     # Python AI backend
│   └── main.py                  # AI agent
├── .env.example                 # Environment template
├── next.config.mjs              # Next.js config
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🔧 Configuration

### Stream.io Setup
1. Create account at [getstream.io](https://getstream.io)
2. Get your API key and secret from dashboard
3. Configure video and chat products

### MongoDB Setup
1. Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Whitelist your IP addresses
3. Create database user and get connection string

### Google AI Setup
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Enable Generative AI API

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify
1. Build command: `npm run build`
2. Publish directory: `.next`
3. Add environment variables
4. Deploy

### Manual Deployment
```bash
npm run build
npm start
```

## 📊 Performance

- **Bundle Splitting**: Automatic code splitting for optimal loading
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Service worker with intelligent caching strategies
- **Compression**: Gzip/Brotli compression enabled
- **CDN**: Global CDN distribution

## 🔒 Security

- **API Route Protection**: Secure token generation
- **Environment Variables**: Sensitive data properly secured
- **CORS**: Configured for production domains
- **Rate Limiting**: Built-in API rate limiting (planned)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stream.io](https://getstream.io) for video and chat infrastructure
- [Google AI](https://ai.google.dev) for AI capabilities
- [Next.js](https://nextjs.org) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com) for styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/letsmeet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/letsmeet/discussions)
- **Email**: support@letsmeet.ai

---

**Made with ❤️ for better meetings everywhere**
