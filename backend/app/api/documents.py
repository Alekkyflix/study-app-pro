"""
Documents API — manage per-lecture uploaded documents (PDFs / text files).
These complement the upload-document route in lectures.py by providing full
CRUD on the Document model and treating each upload as a distinct record.
All routes require a valid Supabase JWT.
"""
import logging
import os
import shutil
import uuid
from contextlib import contextmanager
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database.db import SessionLocal
from app.models.database import Document, Lecture
from app.security import get_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["documents"])
limiter = Limiter(key_func=get_remote_address)

UPLOAD_DIR       = "/tmp/study_pro_audio"   # shared temp dir
ALLOWED_DOC_TYPES = {"application/pdf", "text/plain"}
MAX_DOC_BYTES     = 50 * 1024 * 1024        # 50 MB


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_lecture_or_404(db, lecture_id: str, user_id: str) -> Lecture:
    lecture = (
        db.query(Lecture)
        .filter(Lecture.id == lecture_id, Lecture.user_id == user_id)
        .first()
    )
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


def _delete_local(path: str) -> None:
    try:
        os.remove(path)
    except OSError:
        pass


# ---------------------------------------------------------------------------
# POST /api/lectures/{lecture_id}/documents  — upload a document
# ---------------------------------------------------------------------------
@router.post("/lectures/{lecture_id}/documents")
@limiter.limit("20/minute")
async def upload_document(
    request: Request,
    lecture_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id),
):
    """
    Upload a PDF or text document for a lecture.
    Extracts text and stores it as a Document record linked to the lecture.
    Also updates the lecture transcript if it has none.
    """
    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {file.content_type}")

    safe_name  = f"doc_{uuid.uuid4().hex}.tmp"
    local_path = os.path.join(UPLOAD_DIR, safe_name)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    try:
        with get_db() as db:
            _get_lecture_or_404(db, lecture_id, user_id)

        # Stream to disk
        with open(local_path, "wb") as disk_file:
            shutil.copyfileobj(file.file, disk_file)

        if os.path.getsize(local_path) > MAX_DOC_BYTES:
            _delete_local(local_path)
            raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

        # Parse in thread — PyPDF2 is blocking
        content_type = file.content_type

        def _parse() -> tuple[str, int]:
            if content_type == "application/pdf":
                import PyPDF2
                with open(local_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    pages  = len(reader.pages)
                    text   = "\n".join(
                        page.extract_text() for page in reader.pages if page.extract_text()
                    )
                return text, pages
            with open(local_path, "r", encoding="utf-8", errors="replace") as f:
                text = f.read()
            return text, 1

        extracted_text, page_count = await run_in_threadpool(_parse)
        _delete_local(local_path)

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from document")

        doc_id    = str(uuid.uuid4())
        filename  = file.filename or safe_name

        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)

            doc = Document(
                id=doc_id,
                lecture_id=lecture_id,
                filename=filename,
                file_url="",          # no remote storage for documents yet
                extracted_text=extracted_text,
                page_count=page_count,
            )
            db.add(doc)

            # Populate transcript if lecture has none
            if not lecture.transcript:
                lecture.transcript = extracted_text

            db.commit()

        return {
            "success":    True,
            "document_id": doc_id,
            "lecture_id":  lecture_id,
            "filename":    filename,
            "page_count":  page_count,
            "preview":     extracted_text[:200] + "...",
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("upload_document (documents router) failed")
        _delete_local(local_path)
        raise HTTPException(status_code=500, detail="Could not process document")


# ---------------------------------------------------------------------------
# GET /api/lectures/{lecture_id}/documents  — list documents
# ---------------------------------------------------------------------------
@router.get("/lectures/{lecture_id}/documents")
@limiter.limit("60/minute")
async def list_documents(
    request: Request,
    lecture_id: str,
    user_id: str = Depends(get_user_id),
):
    """List all documents uploaded for a lecture."""
    try:
        with get_db() as db:
            _get_lecture_or_404(db, lecture_id, user_id)
            docs = (
                db.query(Document)
                .filter(Document.lecture_id == lecture_id)
                .order_by(Document.uploaded_at.desc())
                .all()
            )
        return {
            "success": True,
            "documents": [
                {
                    "id":          d.id,
                    "filename":    d.filename,
                    "page_count":  d.page_count,
                    "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
                    "preview":     (d.extracted_text or "")[:150] + "..." if d.extracted_text else "",
                }
                for d in docs
            ],
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("list_documents failed")
        raise HTTPException(status_code=500, detail="Could not list documents")


# ---------------------------------------------------------------------------
# GET /api/lectures/{lecture_id}/documents/{doc_id}  — get document detail
# ---------------------------------------------------------------------------
@router.get("/lectures/{lecture_id}/documents/{doc_id}")
@limiter.limit("60/minute")
async def get_document(
    request: Request,
    lecture_id: str,
    doc_id: str,
    user_id: str = Depends(get_user_id),
):
    """Get a document's metadata and full extracted text."""
    try:
        with get_db() as db:
            _get_lecture_or_404(db, lecture_id, user_id)
            doc = (
                db.query(Document)
                .filter(Document.id == doc_id, Document.lecture_id == lecture_id)
                .first()
            )
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        return {
            "success":        True,
            "id":             doc.id,
            "lecture_id":     doc.lecture_id,
            "filename":       doc.filename,
            "page_count":     doc.page_count,
            "uploaded_at":    doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            "extracted_text": doc.extracted_text,
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_document failed")
        raise HTTPException(status_code=500, detail="Could not fetch document")


# ---------------------------------------------------------------------------
# DELETE /api/lectures/{lecture_id}/documents/{doc_id}
# ---------------------------------------------------------------------------
@router.delete("/lectures/{lecture_id}/documents/{doc_id}")
@limiter.limit("20/minute")
async def delete_document(
    request: Request,
    lecture_id: str,
    doc_id: str,
    user_id: str = Depends(get_user_id),
):
    """Delete a document record."""
    try:
        with get_db() as db:
            _get_lecture_or_404(db, lecture_id, user_id)
            doc = (
                db.query(Document)
                .filter(Document.id == doc_id, Document.lecture_id == lecture_id)
                .first()
            )
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found")
            db.delete(doc)
            db.commit()

        return {"success": True, "message": "Document deleted"}
    except HTTPException:
        raise
    except Exception:
        logger.exception("delete_document failed")
        raise HTTPException(status_code=500, detail="Could not delete document")


# ---------------------------------------------------------------------------
# POST /api/lectures/{lecture_id}/documents/{doc_id}/link
# ---------------------------------------------------------------------------
@router.post("/lectures/{lecture_id}/documents/{doc_id}/link")
@limiter.limit("10/minute")
async def link_document_to_transcript(
    request: Request,
    lecture_id: str,
    doc_id: str,
    user_id: str = Depends(get_user_id),
):
    """
    Merge a document's extracted text into the lecture's transcript.
    Useful when a student uploads slides after the fact but wants them
    included in the transcript context for AI summarisation.
    """
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            doc     = (
                db.query(Document)
                .filter(Document.id == doc_id, Document.lecture_id == lecture_id)
                .first()
            )
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found")

            separator = f"\n\n--- DOCUMENT: {doc.filename} ---\n\n"
            existing = lecture.transcript or ""

            # Avoid duplicate appending
            if doc.extracted_text and doc.extracted_text not in existing:
                lecture.transcript = existing + separator + doc.extracted_text
                db.commit()

        return {
            "success":    True,
            "message":    f"Document '{doc.filename}' merged into transcript",
            "lecture_id": lecture_id,
            "doc_id":     doc_id,
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("link_document_to_transcript failed")
        raise HTTPException(status_code=500, detail="Could not link document")
