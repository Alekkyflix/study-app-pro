# Development Guide

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 13+
- Docker & Docker Compose (optional)

### Backend Setup

1. **Clone and navigate:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your secrets
```

5. **Initialize database:**
```bash
# Run migrations (using Alembic)
alembic upgrade head
```

6. **Start server:**
```bash
uvicorn app.main:app --reload
```

Server runs on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your API endpoints
```

4. **Start dev server:**
```bash
npm run dev
```

App runs on `http://localhost:5173`

### Using Docker Compose

```bash
# From project root
docker-compose up -d

# Backend: http://localhost:8000
# Frontend: http://localhost:5173
# Database: localhost:5432
```

---

## Project Structure

```
backend/
├── app/
│   ├── api/                 # Route handlers
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── database/            # Database setup
│   └── utils/               # Helpers
├── tests/                   # Test suite
├── main.py                  # Entry point
└── requirements.txt

frontend/
├── src/
│   ├── pages/              # Route pages
│   ├── components/         # React components
│   ├── services/           # API clients
│   ├── hooks/              # Custom hooks
│   ├── stores/             # State (Zustand)
│   ├── lib/                # Utilities
│   └── utils/              # Helpers
├── public/                 # Static assets
├── index.html
├── vite.config.ts
└── package.json
```

---

## Development Workflow

### Adding a New Feature

1. **Backend - Create API endpoint:**
```python
# app/api/feature.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/feature")
async def create_feature(data: FeatureSchema):
    # Implement
    pass
```

2. **Backend - Add service logic:**
```python
# app/services/feature.py
class FeatureService:
    async def do_something(self, data):
        pass
```

3. **Backend - Add database model:**
```python
# app/models/database.py
class Feature(Base):
    __tablename__ = "features"
    # Define fields
```

4. **Frontend - Add page or component:**
```tsx
// src/pages/Feature.tsx
export function Feature() {
  return <div>Feature Page</div>;
}
```

5. **Frontend - Add API service:**
```ts
// In src/services/api.ts
async featureCreate(data) {
  return fetch(`${API_URL}/api/feature`, {
    method: "POST",
    body: JSON.stringify(data)
  }).then(r => r.json());
}
```

6. **Frontend - Connect UI to API:**
```tsx
// Use in component
const { featureCreate } = apiClient;
const handleClick = () => featureCreate(data);
```

---

## Testing

### Backend Tests
```bash
cd backend
pytest tests/
pytest tests/test_transcription.py -v
pytest --cov=app tests/  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:ui  # With UI
```

---

## Database Migrations

### Create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "description of change"
```

### Apply migrations:
```bash
alembic upgrade head
```

### Rollback:
```bash
alembic downgrade -1
```

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/study_pro
JWT_SECRET=your-secret-key
GEMINI_API_KEY=key
SUPABASE_URL=url
SUPABASE_KEY=key
DEBUG=True
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=key
VITE_SUPABASE_URL=url
VITE_SUPABASE_ANON_KEY=key
```

---

## Common Commands

### Backend
```bash
# Run server with hot reload
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black app/
isort app/

# Type checking
mypy app/
```

### Frontend
```bash
# Dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Format
npx prettier --write .
```

---

## Deployment

### Backend (Railway, Render, Heroku)

1. **Set environment variables** in platform dashboard

2. **Deploy:**
```bash
git push origin main
```

3. **Run migrations on deployed db:**
```bash
alembic upgrade head
```

### Frontend (Vercel, Netlify, Railway)

1. **Connect GitHub repo**

2. **Set build command:**
```
npm run build
```

3. **Set output directory:**
```
dist
```

4. **Set environment variables:**
```
VITE_API_URL=https://api.studypro.com
VITE_GEMINI_API_KEY=...
```

---

## Troubleshooting

### Port already in use
```bash
# Find process on port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

### Database connection issues
```bash
# Check PostgreSQL is running
psql -U user -d study_pro -c "SELECT 1"
```

### Frontend not connecting to API
- Check VITE_API_URL in .env.local
- Check backend is running on 8000
- Check CORS settings in backend

### npm install fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Performance Tips

1. **Frontend:**
   - Enable production build: `npm run build`
   - Use React DevTools Profiler
   - Analyze bundle: `npm run build -- --analyze`

2. **Backend:**
   - Monitor with: `pip install django-silk`
   - Use async functions for I/O
   - Cache frequent queries with Redis

3. **Database:**
   - Add indexes on frequently queried columns
   - Use EXPLAIN ANALYZE for slow queries
   - Monitor with: `SELECT * FROM pg_stat_statements;`

---

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Zustand](https://github.com/pmndrs/zustand)
