# Architecture Documentation

## System Overview

Study Pro Unified is a full-stack AI-powered learning platform with offline-first capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (PWA)                      │
│  (Modern UI, real-time, mobile-first, offline-capable)      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   [IndexedDB]  [Local Cache]  [Service Worker]
   (Offline)    (Indexing)     (Sync Engine)
        │            │            │
        └────────────┼────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           UNIFIED BACKEND API (FastAPI)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Audio Processing (Whisper + Gemini)               │  │
│  │ • Transcription Orchestration                       │  │
│  │ • RAG Engine (chunking, search, semantic analysis)  │  │
│  │ • Summary Generation (multi-format)                 │  │
│  │ • PDF Report Generation                             │  │
│  │ • Cloud Sync & Auth                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
   [PostgreSQL]  [Supabase]  [S3/Cloud]    [Vector DB]
   (Structured)  (Auth, Blob) (Backups)   (Embeddings)
```

## Component Architecture

### Frontend (React)

- **Pages**: Route-based components (Home, Library, Chat, Reports, Analytics)
- **Components**: Reusable UI atoms (ChatBubble, Waveform, LectureCard)
- **Services**: API clients, Audio capture, IndexedDB storage
- **Hooks**: Custom React hooks (useRAG, useRecording, useLectures)
- **Stores**: Zustand for global state (currentLecture, transcribing status)
- **Lib**: Utilities (RAG search, embeddings, prompts)

### Backend (FastAPI)

- **API Routes**: Organized by feature (lectures, transcription, summarization, chat)
- **Services**: Business logic (TranscriptionService, SummarizationService, RAGService)
- **Models**: Pydantic schemas and SQLAlchemy ORM models
- **Database**: PostgreSQL with ORM
- **Utils**: Auth, storage, external API integrations

## Data Flow

### Recording → Summarization Workflow
```
1. User records via:
   - Browser mic → WebAudio API
   - File upload
   
2. Audio saved to:
   - IndexedDB (offline)
   - Supabase Storage (cloud)

3. Transcription:
   - Auto method selects fastest available
   - Local: Whisper (no API calls)
   - Cloud: Gemini native audio (more accurate)

4. Summarization generates:
   - Executive brief (5 bullets)
   - Structured notes
   - Exam questions & answers
   - Key concepts/glossary
   - Action items

5. Storage:
   - Transcript: PostgreSQL + IndexedDB
   - Summary: PostgreSQL (JSON) + local cache
```

### RAG Chat Workflow
```
1. User query on /chat/:id page

2. Local Processing:
   - Chunk transcript into ~500 char segments
   - Calculate similarity scores (TF-IDF-like)
   - Select top-3 most relevant chunks

3. Server Processing:
   - Combine chunks with RAG prompt
   - Send to Gemini/Claude
   - Add citations (timestamps)

4. Response:
   - Display with inline citations
   - Save to chat history
   - Allow follow-ups
```

## Database Schema

### Core Tables

**users**
- id (UUID, PK)
- email (unique, indexed)
- name
- created_at, updated_at

**lectures**
- id (UUID, PK)
- user_id (FK)
- title (indexed)
- discipline
- duration
- audio_url
- transcript (text)
- transcript_method (whisper|gemini)
- summary (JSONB)
- created_at (indexed)

**documents**
- id (UUID, PK)
- lecture_id (FK)
- filename
- file_url
- extracted_text
- page_count
- uploaded_at

**chat_sessions**
- id (UUID, PK)
- lecture_id (FK)
- created_at

**chat_messages**
- id (UUID, PK)
- session_id (FK)
- role (user|assistant)
- content (text)
- citations (JSONB)
- created_at

**embeddings** (for RAG)
- id (UUID, PK)
- lecture_id (FK)
- chunk_index
- text_chunk
- embedding (JSONB or pgvector)

**reports**
- id (UUID, PK)
- user_id (FK)
- lecture_ids (JSONB)
- report_type
- file_url
- status (pending|generating|ready|failed)

**analytics**
- id (UUID, PK)
- lecture_id (FK)
- completion_rate (0-1)
- retention_score (0-1)
- exam_readiness (0-1)
- study_time (seconds)
- questions_answered

## API Response Format

All API responses follow this pattern:

```json
{
  "success": true,
  "data": { },
  "error": null,
  "timestamp": "2024-01-15T12:34:56Z"
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "Failed to transcribe audio",
    "details": {}
  },
  "timestamp": "2024-01-15T12:34:56Z"
}
```

## Authentication

- JWT tokens with 30-day expiration
- Stored in httpOnly cookies
- Validated on each protected route
- Refresh token mechanism

## Caching Strategy

### Frontend (IndexedDB)
- All lectures and summaries cached locally
- Sync on background when online
- Automatic conflict resolution (server always wins)

### Backend (Redis - optional)
- Transcription results (5 hour TTL)
- Generated summaries (1 day TTL)
- User sessions (1 month TTL)

## Offline-First Strategy

1. **Service Worker** caches:
   - HTML/CSS/JS bundles
   - API responses (CacheFirst for static, NetworkFirst for dynamic)
   - Google Fonts

2. **IndexedDB** stores:
   - Lecture metadata
   - Transcripts
   - Summaries
   - Chat histories

3. **Sync Engine**:
   - Queues offline operations
   - Syncs when online
   - Resolves conflicts (timestamp-based)

## Performance Optimization

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP with fallbacks
- **Compression**: Gzip on all responses
- **CDN**: Supabase Storage for audio/documents
- **Caching Headers**: Immutable for versioned assets
