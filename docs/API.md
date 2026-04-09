# API Documentation

## Base URL
- Development: `http://localhost:8000`
- Production: `https://api.studypro.com`

## Authentication
All protected endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer {token}
```

---

## Lectures API

### List Lectures
```
GET /api/lectures
```
Query params:
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Results per page (default: 20)
- `discipline` (str): Filter by discipline
- `search` (str): Search title/description

Response:
```json
{
  "success": true,
  "data": {
    "lectures": [
      {
        "id": "uuid",
        "title": "Physics 101 - Chapter 5",
        "discipline": "Science",
        "duration": 3600,
        "created_at": "2024-01-15T10:00:00Z",
        "transcript": "full text...",
        "summary": { }
      }
    ],
    "total": 150,
    "page": 1
  }
}
```

### Get Lecture
```
GET /api/lectures/{lecture_id}
```

### Create Lecture
```
POST /api/lectures
Content-Type: application/json

{
  "title": "Physics 101 - Chapter 5",
  "discipline": "Science",
  "description": "Optional description",
  "audio_file": "<binary>"
}
```

### Update Lecture
```
PUT /api/lectures/{lecture_id}
Content-Type: application/json

{
  "title": "Updated Title",
  "discipline": "Science"
}
```

### Delete Lecture
```
DELETE /api/lectures/{lecture_id}
```

---

## Transcription API

### Start Transcription
```
POST /api/lectures/{lecture_id}/transcribe
Content-Type: application/json

{
  "method": "auto"  // "auto", "whisper", or "gemini"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "lecture_id": "uuid",
    "status": "processing",
    "estimated_time": 45
  }
}
```

### Get Transcript
```
GET /api/lectures/{lecture_id}/transcript
```

### Update Transcript
```
PUT /api/lectures/{lecture_id}/transcript
Content-Type: application/json

{
  "content": "Updated transcript text..."
}
```

### Get Transcription Status
```
GET /api/lectures/{lecture_id}/transcription-status
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "progress": 100,
    "method": "gemini",
    "accuracy": 0.98
  }
}
```

---

## Summarization API

### Generate Summary
```
POST /api/lectures/{lecture_id}/summarize
Content-Type: application/json

{
  "regenerate": false  // Force regenerate even if exists
}
```

Response:
```json
{
  "success": true,
  "data": {
    "brief": "• Point 1\n• Point 2...",
    "structured_notes": "## Topic 1...",
    "exam_questions": [
      {
        "question": "What is...?",
        "answer": "..."
      }
    ],
    "glossary": {
      "term1": "definition",
      "term2": "definition"
    },
    "action_items": [
      "Assignment due by..."
    ]
  }
}
```

### Get Summary
```
GET /api/lectures/{lecture_id}/summary
```

### Get Specific Summary Format
```
GET /api/lectures/{lecture_id}/summary/{format}
```
Formats: `brief`, `notes`, `questions`, `glossary`, `actions`

---

## Chat/RAG API

### Send Chat Message
```
POST /api/lectures/{lecture_id}/chat
Content-Type: application/json

{
  "query": "What is the main topic discussed?"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "response": "The main topic is...",
    "citations": [
      {
        "timestamp": "00:05:30",
        "text": "...relevant excerpt..."
      }
    ],
    "confidence": 0.95
  }
}
```

### WebSocket Chat (Real-time)
```
WS /api/lectures/{lecture_id}/chat/ws
```

### Get Chat History
```
GET /api/lectures/{lecture_id}/chat/history?limit=50
```

### Clear Chat
```
DELETE /api/lectures/{lecture_id}/chat/history
```

---

## Documents API

### Upload Document
```
POST /api/lectures/{lecture_id}/documents
Content-Type: multipart/form-data

file: <PDF file>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "slides.pdf",
    "pages": 25,
    "extracted_text": "Page 1 content...",
    "uploaded_at": "2024-01-15T10:00:00Z"
  }
}
```

### List Documents
```
GET /api/lectures/{lecture_id}/documents
```

### Get Document
```
GET /api/lectures/{lecture_id}/documents/{doc_id}
```

### Delete Document
```
DELETE /api/lectures/{lecture_id}/documents/{doc_id}
```

### Link Document to Transcript
```
POST /api/lectures/{lecture_id}/documents/{doc_id}/link
```

---

## Reports API

### Generate Report
```
POST /api/reports/generate
Content-Type: application/json

{
  "lecture_ids": ["uuid1", "uuid2"],
  "report_type": "study_guide",  // "transcript", "study_guide", "exam_prep", "compilation"
  "format": "pdf"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "generating",
    "estimated_time": 30
  }
}
```

### Get Report
```
GET /api/reports/{report_id}
```

### Download Report
```
GET /api/reports/{report_id}/download
```

### List Reports
```
GET /api/reports
```

### Delete Report
```
DELETE /api/reports/{report_id}
```

### Generate Share Link
```
POST /api/reports/{report_id}/share
```

Response:
```json
{
  "success": true,
  "data": {
    "url": "https://studypro.com/share/abc123",
    "expires_at": "2024-02-15T10:00:00Z"
  }
}
```

---

## Analytics API

### Get Analytics Overview
```
GET /api/analytics/overview
```

Response:
```json
{
  "success": true,
  "data": {
    "total_lectures": 45,
    "total_study_time": 12600,
    "avg_completion_rate": 0.92,
    "recent_activity": []
  }
}
```

### Get Lecture Analytics
```
GET /api/analytics/lectures?discipline=Science
```

### Get Study Timeline
```
GET /api/analytics/timeline?start_date=2024-01-01&end_date=2024-01-31
```

### Get Exam Predictions
```
GET /api/analytics/predictions?lecture_ids=uuid1,uuid2
```

### Get Discipline Analytics
```
GET /api/analytics/discipline/{discipline}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_AUTH | 401 | Invalid or expired token |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 422 | Invalid request data |
| TRANSCRIPTION_FAILED | 500 | Transcription service error |
| STORAGE_ERROR | 500 | File storage error |
| RATE_LIMIT | 429 | Too many requests |

---

## Rate Limiting

- 100 requests/minute per user
- 1000 requests/hour per user
- Headers returned:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
