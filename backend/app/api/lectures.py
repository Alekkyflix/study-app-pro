"""
Lectures API — CRUD, audio/document upload, transcription, summarisation, chat.
All routes require a valid Supabase JWT.  Lectures are scoped to the requesting user.
"""
import io
import logging
import os
import shutil
import uuid
from contextlib import contextmanager
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database.db import SessionLocal
from app.models.database import Lecture
from app.security import get_user_id

# Re-use the limiter singleton created in main.py
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy service loaders
# ---------------------------------------------------------------------------

def _get_transcription_service():
    try:
        from app.services.transcription_service import TranscriptionService
        return TranscriptionService()
    except ImportError:
        class _Mock:
            def transcribe(self, path, language="en"):
                return {"success": True, "text": "[Mock] faster-whisper not installed.", "duration": 0, "language": language}
        return _Mock()


def _get_summarization_service():
    try:
        from app.services.summarization_service import SummarizationService
        return SummarizationService()
    except ImportError:
        class _Mock:
            def summarize(self, text, summary_type="executive"):
                return {"success": True, "summary": "[Mock] google-generativeai not installed."}
        return _Mock()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

UPLOAD_DIR = "/tmp/study_pro_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_AUDIO_TYPES = {"audio/wav", "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4"}
ALLOWED_DOC_TYPES   = {"application/pdf", "text/plain"}
MAX_UPLOAD_BYTES    = 100 * 1024 * 1024  # 100 MB

# ---------------------------------------------------------------------------
# Supabase Storage helpers (2.1 — durable file storage)
# ---------------------------------------------------------------------------
_SUPABASE_URL  = os.getenv("SUPABASE_URL", "")
_SUPABASE_SKEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
AUDIO_BUCKET   = "lecture-audio"   # Create this bucket in Supabase Storage dashboard


def _storage_upload(local_path: str, object_name: str, mime: str) -> str | None:
    """
    Upload a local file to Supabase Storage.
    Returns the public URL, or None if storage is not configured (local-dev fallback).
    """
    if not _SUPABASE_URL or not _SUPABASE_SKEY:
        return None
    try:
        from supabase import create_client
        client = create_client(_SUPABASE_URL, _SUPABASE_SKEY)
        with open(local_path, "rb") as f:
            client.storage.from_(AUDIO_BUCKET).upload(
                object_name, f, {"content-type": mime, "upsert": "true"}
            )
        return client.storage.from_(AUDIO_BUCKET).get_public_url(object_name)
    except Exception as e:
        logger.warning("Supabase Storage upload failed (falling back to local): %s", e)
        return None


def _storage_download_to_local(url: str, dest_path: str) -> bool:
    """
    Download a file from a remote URL (Supabase Storage) to a local path.
    Returns True on success.
    """
    try:
        with httpx.stream("GET", url, follow_redirects=True, timeout=120) as r:
            r.raise_for_status()
            with open(dest_path, "wb") as f:
                for chunk in r.iter_bytes():
                    f.write(chunk)
        return True
    except Exception as e:
        logger.warning("Failed to download audio from storage: %s", e)
        return False


def _delete_local(path: str) -> None:
    """Silently remove a local temp file."""
    try:
        os.remove(path)
    except OSError:
        pass


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_lecture_or_404(db, lecture_id: str, user_id: str) -> Lecture:
    lecture = db.query(Lecture).filter(
        Lecture.id == lecture_id,
        Lecture.user_id == user_id,
    ).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api", tags=["lectures"])


# Pydantic models
class LectureUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    transcript: Optional[str] = None


class ChatQuery(BaseModel):
    query: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/lectures", response_model=dict)
async def create_lecture(
    title: str = Form(...),
    description: str = Form(None),
    user_id: str = Depends(get_user_id),
):
    try:
        with get_db() as db:
            lecture = Lecture(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=title,
                description=description,
                duration=0,
                audio_url="",
                created_at=datetime.utcnow(),
            )
            db.add(lecture)
            db.commit()
            db.refresh(lecture)
            return {"success": True, "lecture_id": lecture.id, "title": lecture.title}
    except HTTPException:
        raise
    except Exception:
        logger.exception("create_lecture failed")
        raise HTTPException(status_code=500, detail="Could not create lecture")


@router.get("/lectures", response_model=dict)
async def list_lectures(user_id: str = Depends(get_user_id)):
    try:
        with get_db() as db:
            lectures = db.query(Lecture).filter(Lecture.user_id == user_id).all()
            return {
                "success": True,
                "lectures": [
                    {
                        "id": l.id,
                        "title": l.title,
                        "description": l.description,
                        "duration": l.duration,
                        "has_summary": bool(l.summary),
                        "has_transcript": bool(l.transcript),
                        "created_at": l.created_at.isoformat() if l.created_at else None,
                    }
                    for l in lectures
                ],
            }
    except HTTPException:
        raise
    except Exception:
        logger.exception("list_lectures failed")
        raise HTTPException(status_code=500, detail="Could not fetch lectures")


@router.get("/lectures/{lecture_id}", response_model=dict)
async def get_lecture(lecture_id: str, user_id: str = Depends(get_user_id)):
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            return {
                "success": True,
                "lecture": {
                    "id": lecture.id,
                    "title": lecture.title,
                    "description": lecture.description,
                    "transcript": lecture.transcript,
                    "summary": lecture.summary,
                    "duration": lecture.duration,
                    "created_at": lecture.created_at.isoformat() if lecture.created_at else None,
                },
            }
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_lecture failed")
        raise HTTPException(status_code=500, detail="Could not fetch lecture")


@router.post("/lectures/{lecture_id}/upload-audio", response_model=dict)
@limiter.limit("20/minute")
async def upload_audio(
    request: Request,
    lecture_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id),
):
    # --- validate MIME type before touching the body ---
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {file.content_type}")

    # Safe filename — never trust the client-supplied name
    ext          = (file.filename or "").rsplit(".", 1)[-1] or "webm"
    safe_name    = f"lecture_{lecture_id}_{uuid.uuid4().hex}.{ext}"
    local_path   = os.path.join(UPLOAD_DIR, safe_name)
    object_name  = f"{user_id}/{safe_name}"

    try:
        with get_db() as db:
            _get_lecture_or_404(db, lecture_id, user_id)

        # --- FIX 2.2: stream to disk in chunks (no full read into RAM) ---
        with open(local_path, "wb") as disk_file:
            shutil.copyfileobj(file.file, disk_file)

        # --- check size on disk, not in memory ---
        if os.path.getsize(local_path) > MAX_UPLOAD_BYTES:
            _delete_local(local_path)
            raise HTTPException(status_code=413, detail="File too large (max 100 MB)")

        # --- FIX 2.1: persist to Supabase Storage ---
        audio_url = _storage_upload(local_path, object_name, file.content_type or "audio/webm")

        # Store the remote URL (or empty string for local-dev) in the DB
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            lecture.audio_url = audio_url or ""
            db.commit()

        # FIX 2.4: if upload to storage succeeded, local copy is disposable
        if audio_url:
            _delete_local(local_path)

        return {"success": True, "message": "Audio uploaded", "lecture_id": lecture_id,
                "stored_remotely": bool(audio_url)}
    except HTTPException:
        raise
    except Exception:
        logger.exception("upload_audio failed")
        _delete_local(local_path)
        raise HTTPException(status_code=500, detail="Could not save audio file")


@router.post("/lectures/{lecture_id}/upload-document", response_model=dict)
@limiter.limit("20/minute")
async def upload_document(
    request: Request,
    lecture_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id),
):
    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported document type: {file.content_type}")

    # --- FIX 2.2: stream to disk, then read back — avoids holding 100 MB in RAM ---
    safe_name  = f"doc_{uuid.uuid4().hex}.tmp"
    local_path = os.path.join(UPLOAD_DIR, safe_name)

    try:
        with open(local_path, "wb") as disk_file:
            shutil.copyfileobj(file.file, disk_file)

        if os.path.getsize(local_path) > MAX_UPLOAD_BYTES:
            _delete_local(local_path)
            raise HTTPException(status_code=413, detail="File too large (max 100 MB)")

        # --- FIX 2.3: parse PDF in a thread so the event loop is not blocked ---
        def _parse_doc() -> str:
            if file.content_type == "application/pdf":
                import PyPDF2
                with open(local_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    return "\n".join(
                        page.extract_text() for page in reader.pages if page.extract_text()
                    )
            with open(local_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()

        extracted_text = await run_in_threadpool(_parse_doc)
        _delete_local(local_path)   # FIX 2.4: discard temp doc file immediately

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from document")

        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            lecture.transcript = extracted_text
            db.commit()

        return {
            "success": True,
            "message": "Document uploaded and parsed",
            "lecture_id": lecture_id,
            "preview": extracted_text[:200] + "...",
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("upload_document failed")
        _delete_local(local_path)
        raise HTTPException(status_code=500, detail="Could not process document")


@router.post("/lectures/{lecture_id}/transcribe", response_model=dict)
@limiter.limit("5/minute")
async def transcribe_lecture(request: Request, lecture_id: str, user_id: str = Depends(get_user_id)):
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            audio_url  = lecture.audio_url or ""

        # --- FIX 2.1: resolve the audio file — prefer Supabase Storage URL ---
        tmp_path_to_clean: str | None = None

        if audio_url.startswith("http"):
            # Download from remote storage to a throw-away local file
            tmp_name   = f"tmp_tx_{lecture_id}_{uuid.uuid4().hex}.webm"
            local_path = os.path.join(UPLOAD_DIR, tmp_name)
            ok = await run_in_threadpool(_storage_download_to_local, audio_url, local_path)
            if not ok:
                raise HTTPException(status_code=500, detail="Could not retrieve audio from storage")
            tmp_path_to_clean = local_path
        else:
            # Local dev fallback: find by lecture_id prefix
            matching = [
                f for f in os.listdir(UPLOAD_DIR)
                if f.startswith(f"lecture_{lecture_id}_")
            ]
            if not matching:
                raise HTTPException(status_code=400, detail="No audio file found — please upload audio first")
            local_path = os.path.join(UPLOAD_DIR, matching[-1])

        # --- FIX 2.3: run Whisper in a thread — it is CPU-bound and blocks for minutes ---
        result = await run_in_threadpool(_get_transcription_service().transcribe, local_path)

        # --- FIX 2.4: delete temp file immediately after transcription ---
        if tmp_path_to_clean:
            _delete_local(tmp_path_to_clean)

        if result.get("success"):
            with get_db() as db:
                lecture = _get_lecture_or_404(db, lecture_id, user_id)
                lecture.transcript = result["text"]
                lecture.duration   = int(result.get("duration", 0))
                db.commit()

        return {
            "success":    result.get("success"),
            "transcript": result.get("text"),
            "duration":   result.get("duration"),
            "language":   result.get("language"),
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("transcribe_lecture failed")
        raise HTTPException(status_code=500, detail="Transcription failed")


@router.post("/lectures/{lecture_id}/summarize", response_model=dict)
@limiter.limit("10/minute")
async def summarize_lecture(
    request: Request,
    lecture_id: str,
    summary_type: str = "executive",
    user_id: str = Depends(get_user_id),
):
    valid_types = {"executive", "detailed", "questions", "glossary"}
    if summary_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"summary_type must be one of: {valid_types}")

    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            if not lecture.transcript:
                raise HTTPException(status_code=400, detail="No transcript available — transcribe first")
            transcript = lecture.transcript

        # --- FIX 2.3: Gemini SDK call is blocking I/O — run in thread ---
        svc    = _get_summarization_service()
        result = await run_in_threadpool(svc.summarize, transcript, summary_type)

        if result.get("success"):
            with get_db() as db:
                lecture = _get_lecture_or_404(db, lecture_id, user_id)
                lecture.summary = result["summary"]
                db.commit()

        return {
            "success":      result.get("success"),
            "summary":      result.get("summary"),
            "summary_type": summary_type,
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("summarize_lecture failed")
        raise HTTPException(status_code=500, detail="Summarisation failed")


@router.post("/lectures/{lecture_id}/chat", response_model=dict)
@limiter.limit("15/minute")
async def chat_lecture(
    request: Request,
    lecture_id: str,
    chat_query: ChatQuery,
    user_id: str = Depends(get_user_id),
):
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            if not lecture.transcript:
                raise HTTPException(status_code=400, detail="No transcript available")
            transcript = lecture.transcript

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"success": True, "response": "[Demo] AI not configured — set GEMINI_API_KEY."}

        # --- FIX 2.3: Gemini generate_content is a blocking network call — run in thread ---
        def _call_gemini() -> str:
            import google.generativeai as genai
            from app.prompts import STUDY_PRO_SYSTEM_MESSAGE
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=STUDY_PRO_SYSTEM_MESSAGE,
            )
            prompt = (
                f"User Question:\n{chat_query.query}\n\n"
                f"Transcript:\n{transcript}\n\n"
                "Answer strictly based on the transcript above."
            )
            return model.generate_content(prompt).text

        answer = await run_in_threadpool(_call_gemini)
        return {"success": True, "response": answer}

    except HTTPException:
        raise
    except Exception:
        logger.exception("chat_lecture failed")
        raise HTTPException(status_code=500, detail="Chat request failed")


@router.put("/lectures/{lecture_id}", response_model=dict)
async def update_lecture(
    lecture_id: str,
    lecture_update: LectureUpdate,
    user_id: str = Depends(get_user_id),
):
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            if lecture_update.title is not None:
                lecture.title = lecture_update.title
            if lecture_update.description is not None:
                lecture.description = lecture_update.description
            if lecture_update.transcript is not None:
                lecture.transcript = lecture_update.transcript
            db.commit()
            return {"success": True, "lecture_id": lecture.id}
    except HTTPException:
        raise
    except Exception:
        logger.exception("update_lecture failed")
        raise HTTPException(status_code=500, detail="Could not update lecture")


@router.delete("/lectures/{lecture_id}", response_model=dict)
async def delete_lecture(lecture_id: str, user_id: str = Depends(get_user_id)):
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            db.delete(lecture)
            db.commit()

        # Clean up audio files for this lecture
        for f in os.listdir(UPLOAD_DIR):
            if f.startswith(f"lecture_{lecture_id}_"):
                try:
                    os.remove(os.path.join(UPLOAD_DIR, f))
                except OSError:
                    pass

        return {"success": True, "message": "Lecture deleted"}
    except HTTPException:
        raise
    except Exception:
        logger.exception("delete_lecture failed")
        raise HTTPException(status_code=500, detail="Could not delete lecture")