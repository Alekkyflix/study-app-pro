# Study Pro Unified - File Structure Overview

## Complete Directory Tree

```
study-pro-unified/
│
├── README.md                    # Main project documentation
├── .gitignore                   # Git ignore rules
├── docker-compose.yml          # Docker orchestration
│
├── backend/                     # FastAPI Backend
│   ├── main.py                 # App entry point
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example            # Environment template
│   ├── Dockerfile              # Container config
│   ├── .dockerignore           # Docker ignore rules
│   │
│   ├── app/                    # Application package
│   │   ├── __init__.py
│   │   │
│   │   ├── api/                # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── lectures.py     # Lecture CRUD endpoints
│   │   │   ├── transcription.py # Transcription endpoints
│   │   │   ├── summarization.py # Summary generation
│   │   │   ├── chat.py         # RAG chat endpoints
│   │   │   ├── documents.py    # Document handling
│   │   │   ├── reports.py      # Report generation
│   │   │   └── analytics.py    # Analytics endpoints
│   │   │
│   │   ├── services/           # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── transcription.py  # Whisper + Gemini
│   │   │   ├── summarization.py  # Multi-format summaries
│   │   │   ├── rag.py           # RAG engine
│   │   │   ├── documents.py     # PDF processing
│   │   │   ├── reports.py       # PDF report generation
│   │   │   └── analytics.py     # Metric calculation
│   │   │
│   │   ├── models/             # Data models
│   │   │   ├── __init__.py
│   │   │   ├── schemas.py      # Pydantic schemas
│   │   │   └── database.py     # SQLAlchemy ORM models
│   │   │
│   │   ├── database/           # Database layer
│   │   │   ├── __init__.py
│   │   │   └── db.py           # Session & initialization
│   │   │
│   │   └── utils/              # Utility modules
│   │       ├── __init__.py
│   │       ├── auth.py         # JWT & authentication
│   │       ├── storage.py      # Cloud storage (S3, Supabase)
│   │       └── external_apis.py # Gemini, Whisper wrappers
│   │
│   └── tests/                  # Test suite
│       ├── conftest.py         # Test fixtures
│       ├── test_health.py      # Health check tests
│       ├── test_lectures.py    # Lecture endpoints
│       ├── test_transcription.py
│       ├── test_chat.py        # RAG chat tests
│       └── test_reports.py
│
├── frontend/                    # React Frontend (PWA)
│   ├── index.html              # HTML entry point
│   ├── package.json            # NPM dependencies
│   ├── vite.config.ts          # Build configuration
│   ├── tsconfig.json           # TypeScript config
│   ├── tsconfig.node.json      # TS for Vite
│   ├── tailwind.config.js      # Tailwind CSS config
│   ├── eslint.config.js        # ESLint rules
│   ├── .env.example            # Environment template
│   ├── Dockerfile              # Container config
│   │
│   ├── public/                 # Static assets
│   │   ├── favicon.ico
│   │   ├── pwa-192x192.png
│   │   ├── pwa-512x512.png
│   │   ├── manifest.json       # PWA manifest
│   │   └── sw.js               # Service Worker
│   │
│   ├── src/                    # Source code
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Main app component
│   │   ├── index.css           # Global styles (Tailwind)
│   │   │
│   │   ├── pages/              # Route pages
│   │   │   ├── __init__.ts
│   │   │   ├── Home.tsx        # Record page
│   │   │   ├── Library.tsx     # Browse lectures
│   │   │   ├── LectureDetail.tsx # Single lecture view
│   │   │   ├── Chat.tsx        # RAG chat interface
│   │   │   ├── Reports.tsx     # Report generation
│   │   │   ├── Analytics.tsx   # Learning dashboard
│   │   │   └── Settings.tsx    # User settings
│   │   │
│   │   ├── components/         # Reusable UI components
│   │   │   ├── __init__.ts
│   │   │   ├── Dashboard.tsx   # Overview dashboard
│   │   │   ├── Header.tsx      # Top navigation
│   │   │   ├── BottomNav.tsx   # Mobile bottom nav
│   │   │   ├── RecordingInterface.tsx # Audio recorder
│   │   │   ├── Waveform.tsx    # Audio visualization
│   │   │   ├── ChatBubble.tsx  # Chat message UI
│   │   │   ├── LectureCard.tsx # Lecture card
│   │   │   ├── SummaryViewer.tsx # Summary display
│   │   │   └── TranscriptEditor.tsx # Edit transcript
│   │   │
│   │   ├── services/           # API & external services
│   │   │   ├── __init__.ts
│   │   │   ├── api.ts          # Backend API client
│   │   │   ├── audio.ts        # Web Audio API wrapper
│   │   │   └── storage.ts      # IndexedDB service
│   │   │
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── __init__.ts
│   │   │   ├── useRAG.ts       # Chat hook
│   │   │   ├── useRecording.ts # Recording hook
│   │   │   └── useLectures.ts  # Data fetching hook
│   │   │
│   │   ├── stores/             # Global state (Zustand)
│   │   │   ├── __init__.ts
│   │   │   └── appStore.ts     # App state store
│   │   │
│   │   ├── lib/                # Utility libraries
│   │   │   ├── __init__.ts
│   │   │   ├── rag.ts          # RAG algorithms
│   │   │   └── prompts.ts      # LLM prompts
│   │   │
│   │   └── utils/              # Helper functions
│   │       ├── __init__.ts
│   │       └── helpers.ts      # General utilities
│   │
│   └── tests/                  # Jest/Vitest tests
│       ├── rag.test.ts         # RAG utilities tests
│       ├── api.test.ts         # API client tests
│       └── components.test.tsx # Component tests
│
└── docs/                        # Documentation
    ├── ARCHITECTURE.md         # System design
    ├── API.md                  # API documentation
    └── DEVELOPMENT.md          # Development guide
```

## File Count Summary

```
Backend:
├── Python Files: 20+
├── Test Files: 5+
├── Config Files: 5
└── Total: ~30 files

Frontend:
├── TypeScript/React: 30+
├── CSS/Config: 5
├── Test Files: 3+
└── Total: ~40 files

Docs:
├── Markdown: 3
├── Docker: 2
└── Total: ~5 files

Grand Total: ~75 files
```

## Key Directories Explained

### Backend (`/backend`)
- **app/api**: All HTTP endpoints grouped by feature
- **app/services**: Business logic, completely decoupled from routes
- **app/models**: Schemas (validation) + ORM models (database)
- **app/database**: DB connection and session management
- **app/utils**: Helpers for auth, storage, external APIs

### Frontend (`/frontend/src`)
- **pages**: Top-level route components
- **components**: Reusable UI pieces
- **services**: API clients and browser APIs (Audio, IndexedDB)
- **hooks**: Stateful logic
- **stores**: Global state with Zustand
- **lib**: Algorithms and constants
- **utils**: General helper functions

## Configuration Files

### Backend
```
requirements.txt      → Python dependencies
.env.example         → Environment variables template
Dockerfile           → Docker image config
docker-compose.yml   → Multi-container orchestration
```

### Frontend
```
package.json         → NPM dependencies & scripts
vite.config.ts      → Vite build configuration
tsconfig.json       → TypeScript configuration
.env.example        → Frontend env variables
tailwind.config.js  → Tailwind CSS setup
eslint.config.js    → Code linting rules
Dockerfile          → Frontend container
```

## Entry Points

### Backend
```
backend/main.py → FastAPI app creation → app.main:app
```

### Frontend
```
frontend/src/main.tsx → React root
    ↓
frontend/src/App.tsx → BrowserRouter → Pages
```

## Technology Stack Placement

| Tech | Location | Purpose |
|------|----------|---------|
| PostgreSQL | backend/app/database | Persistent data |
| FastAPI | backend/main.py + api/ | Backend server |
| React | frontend/src | UI framework |
| Tailwind | frontend/src/index.css | Styling |
| Zustand | frontend/src/stores | State management |
| Whisper | backend/app/services | Local transcription |
| Gemini API | backend/app/utils/external_apis.py | Cloud AI |
| IndexedDB | frontend/src/services/storage.ts | Offline storage |
| Service Worker | frontend/public/sw.js | PWA caching |

## Next Steps for Development

1. Install dependencies
   ```bash
   cd backend && pip install -r requirements.txt
   cd frontend && npm install
   ```

2. Configure environment
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. Start development
   ```bash
   # Terminal 1: Backend
   cd backend && uvicorn app.main:app --reload
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

4. Begin building!
