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
from app.models.database import Lecture, User
from app.security import get_user_id

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

_ALLOWED_AUDIO_PREFIXES = ("audio/", "video/webm")
_ALLOWED_DOC_PREFIXES   = ("application/pdf", "text/plain")
MAX_UPLOAD_BYTES        = 50 * 1024 * 1024  # 50 MB


def _is_allowed_audio(content_type: str | None) -> bool:
    if not content_type:
        return True
    ct = content_type.lower().split(";")[0].strip()
    return any(ct.startswith(p) for p in _ALLOWED_AUDIO_PREFIXES)


def _is_allowed_doc(content_type: str | None) -> bool:
    if not content_type:
        return True
    ct = content_type.lower().split(";")[0].strip()
    return any(ct.startswith(p) for p in _ALLOWED_DOC_PREFIXES)


# ---------------------------------------------------------------------------
# Supabase Storage helpers
# ---------------------------------------------------------------------------
_SUPABASE_URL  = os.getenv("SUPABASE_URL", "")
_SUPABASE_SKEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
AUDIO_BUCKET   = "lecture-audio"


def _storage_upload(local_path: str, object_name: str, mime: str) -> str | None:
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
            existing_user = db.query(User).filter(User.id == user_id).first()
            if not existing_user:
                db.add(User(id=user_id, created_at=datetime.utcnow()))
                db.commit()

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
                    "audio_url": lecture.audio_url or "",
                    "created_at": lecture.created_at.isoformat() if lecture.created_at else None,
                },
            }
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_lecture failed")
        raise HTTPException(status_code=500, detail="Could not fetch lecture")


@router.get("/lectures/{lecture_id}/download-audio", response_model=dict)
@limiter.limit("20/minute")
async def get_audio_download_url(
    request: Request,
    lecture_id: str,
    user_id: str = Depends(get_user_id),
):
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            audio_url = lecture.audio_url or ""

        if not audio_url:
            raise HTTPException(status_code=404, detail="No audio file found for this lecture.")

        if audio_url.startswith("http") and _SUPABASE_URL and _SUPABASE_SKEY:
            try:
                marker = f"/object/public/{AUDIO_BUCKET}/"
                if marker in audio_url:
                    object_path = audio_url.split(marker, 1)[1].split("?")[0]
                    from supabase import create_client as _sc
                    _client = _sc(_SUPABASE_URL, _SUPABASE_SKEY)
                    signed = _client.storage.from_(AUDIO_BUCKET).create_signed_url(
                        object_path, expires_in=3600
                    )
                    signed_url = signed.get("signedURL") or signed.get("signedUrl") or audio_url
                    return {"success": True, "url": signed_url, "expires_in": 3600}
            except Exception as e:
                logger.warning("Could not generate signed URL, returning public URL: %s", e)

        return {"success": True, "url": audio_url, "expires_in": None}

    except HTTPException:
        raise
    except Exception:
        logger.exception("get_audio_download_url failed")
        raise HTTPException(status_code=500, detail="Could not retrieve audio download URL")


@router.post("/lectures/{lecture_id}/upload-audio", response_model=dict)
@limiter.limit("20/minute")
async def upload_audio(
    request: Request,
    lecture_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id),
):
    if not _is_allowed_audio(file.content_type):
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {file.content_type}.")

    ext         = (file.filename or "").rsplit(".", 1)[-1] or "webm"
    safe_name   = f"lecture_{lecture_id}_{uuid.uuid4().hex}.{ext}"
    local_path  = os.path.join(UPLOAD_DIR, safe_name)
    object_name = f"{user_id}/{safe_name}"

    try:
        with get_db() as db:
            _get_lecture_or_404(db, lecture_id, user_id)

        with open(local_path, "wb") as disk_file:
            shutil.copyfileobj(file.file, disk_file)

        if os.path.getsize(local_path) > MAX_UPLOAD_BYTES:
            _delete_local(local_path)
            raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

        audio_url = _storage_upload(local_path, object_name, file.content_type or "audio/webm")

        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            lecture.audio_url = audio_url or ""
            db.commit()

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
    if not _is_allowed_doc(file.content_type):
        raise HTTPException(status_code=400, detail=f"Unsupported document type: {file.content_type}.")

    safe_name  = f"doc_{uuid.uuid4().hex}.tmp"
    local_path = os.path.join(UPLOAD_DIR, safe_name)

    try:
        with open(local_path, "wb") as disk_file:
            shutil.copyfileobj(file.file, disk_file)

        if os.path.getsize(local_path) > MAX_UPLOAD_BYTES:
            _delete_local(local_path)
            raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

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
        _delete_local(local_path)

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
async def transcribe_lecture(
    request: Request,
    lecture_id: str,
    model: str = "balanced",   # fast | balanced | accurate
    user_id: str = Depends(get_user_id),
):
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            audio_url = lecture.audio_url or ""

        tmp_path_to_clean: str | None = None

        if audio_url.startswith("http"):
            tmp_name   = f"tmp_tx_{lecture_id}_{uuid.uuid4().hex}.webm"
            local_path = os.path.join(UPLOAD_DIR, tmp_name)
            ok = await run_in_threadpool(_storage_download_to_local, audio_url, local_path)
            if not ok:
                raise HTTPException(status_code=500, detail="Could not retrieve audio from storage")
            tmp_path_to_clean = local_path
        else:
            matching = [
                f for f in os.listdir(UPLOAD_DIR)
                if f.startswith(f"lecture_{lecture_id}_")
            ]
            if not matching:
                raise HTTPException(status_code=400, detail="No audio file found — please upload audio first")
            local_path = os.path.join(UPLOAD_DIR, matching[-1])

        # fast/balanced → Groq if GROQ_API_KEY set, falls back to local on failure
        # accurate → always local Whisper (no API limits)
        _model_map   = {"fast": "tiny", "balanced": "base", "accurate": "medium"}
        _whisper_size = _model_map.get(model, "base")
        _force_local  = (model == "accurate")

        def _make_service():
            try:
                from app.services.transcription_service import TranscriptionService
                return TranscriptionService(model_size=_whisper_size, force_local=_force_local)
            except ImportError:
                return _get_transcription_service()

        result = await run_in_threadpool(_make_service().transcribe, local_path)

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