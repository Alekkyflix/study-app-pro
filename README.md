# Study Pro Unified - AI-Powered Study Intelligence Platform

A comprehensive platform combining the best of modern web technology with intelligent AI-powered lecture analysis. Capture, transcribe, summarize, and learn from lectures with an offline-first PWA and powerful backend.

## 🚀 Features

- **Intelligent Audio Capture** - Record lectures with real-time visualization
- **Hybrid Transcription** - Local Whisper or cloud Gemini with automatic fallback
- **Advanced Summarization** - Executive briefs, structured notes, exam questions, glossary
- **Conversational RAG** - Ask questions about your lectures with context-aware answers
- **Document Intelligence** - Import and analyze lecture slides (PDFs)
- **Professional Reports** - Generate comprehensive study PDFs
- **Offline-First PWA** - Full functionality without internet, auto-sync when online
- **Learning Analytics** - Track progress and estimate exam readiness
- **Collaboration** - Share summaries and study materials

## 🏗️ Project Structure

```
study-pro-unified/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── services/       # Business logic (transcription, summarization, RAG)
│   │   ├── models/         # Pydantic models & DB schemas
│   │   ├── database/       # Database setup & queries
│   │   └── utils/          # Helper functions
│   ├── tests/              # Unit & integration tests
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment template
│   └── main.py            # App entry point
│
├── frontend/               # React + TypeScript PWA
│   ├── src/
│   │   ├── pages/         # Page components (Record, Library, Chat, etc.)
│   │   ├── components/    # Reusable UI components
│   │   ├── services/      # API & external service integrations
│   │   ├── hooks/         # Custom React hooks
│   │   ├── stores/        # Zustand state management
│   │   ├── lib/           # Utilities (RAG, embeddings, prompts)
│   │   ├── utils/         # Helper functions
│   │   └── App.tsx        # Main app component
│   ├── public/            # Static assets, PWA manifest
│   ├── tests/             # Jest tests
│   ├── package.json       # Node dependencies
│   ├── vite.config.ts     # Build configuration
│   └── .env.example       # Environment template
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md    # System design
│   ├── API.md            # API documentation
│   └── DEVELOPMENT.md    # Dev guide
│
└── docker-compose.yml     # Local development with containers
```

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL + SQLAlchemy ORM
- **Transcription**: Whisper (local) + Gemini API (cloud)
- **LLM**: Gemini or Claude API
- **Vector DB**: Pinecone or local embeddings
- **Storage**: Supabase Storage (S3-compatible)
- **Auth**: JWT + Supabase Auth

### Frontend
- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Storage**: IndexedDB + Supabase
- **PWA**: Vite-Plugin-PWA + Workbox
- **UI**: Lucide Icons, Wavesurfer.js, Tone.js

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 13+
- API keys: Gemini, Supabase

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env       # Configure with your keys
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local # Configure with your keys
npm run dev
```

Visit `http://localhost:5173` (frontend) and `http://localhost:8000` (backend API)

## 📋 API Endpoints

### Lectures
- `POST /api/lectures` - Create lecture
- `GET /api/lectures` - List lectures
- `GET /api/lectures/{id}` - Get lecture details
- `PUT /api/lectures/{id}` - Update lecture
- `DELETE /api/lectures/{id}` - Delete lecture

### Transcription
- `POST /api/lectures/{id}/transcribe` - Transcribe audio
- `GET /api/lectures/{id}/transcript` - Get transcript

### Summarization
- `POST /api/lectures/{id}/summarize` - Generate summary
- `GET /api/lectures/{id}/summary` - Get summary

### RAG Chat
- `POST /api/lectures/{id}/chat` - Send chat message
- `GET /api/lectures/{id}/chat/history` - Get chat history

### Documents
- `POST /api/lectures/{id}/documents` - Upload document
- `GET /api/lectures/{id}/documents` - List documents

### Reports
- `POST /api/reports/generate` - Generate PDF report
- `GET /api/reports/{id}` - Download report

## 🔐 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/study_pro
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design & data flow
- [API Documentation](docs/API.md) - Detailed endpoint reference
- [Development Guide](docs/DEVELOPMENT.md) - Local setup & testing

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/
```

### Frontend
```bash
cd frontend
npm test
```

## 📦 Deployment

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for Docker, Vercel, and Railway deployment guides.

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

---

**Created**: April 2026
**Status**: Architecture Phase ✅ | Development Phase 🔄
