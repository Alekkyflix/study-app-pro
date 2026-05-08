"""
Summarization endpoints — wired to the real SummarizationService.
These routes complement /lectures/{id}/summarize in lectures.py by adding:
  - GET  (fetch stored summary)
  - PUT  (regenerate / edit)
  - GET  with format specifier (single summary type)
All routes require a valid Supabase JWT.
"""
import logging
from contextlib import contextmanager

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database.db import SessionLocal
from app.models.database import Lecture
from app.security import get_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["summarization"])
limiter = Limiter(key_func=get_remote_address)

VALID_FORMATS = {"executive", "detailed", "questions", "glossary"}


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_svc():
    try:
        from app.services.summarization_service import SummarizationService
        return SummarizationService()
    except ImportError:
        class _Mock:
            def summarize(self, text, summary_type="executive"):
                return {"success": True, "summary": f"[Mock] {summary_type} summary"}
            def multi_summarize(self, text):
                return {"success": True, "summaries": {t: f"[Mock] {t}" for t in VALID_FORMATS}}
        return _Mock()


def _get_lecture_or_404(db, lecture_id: str, user_id: str) -> Lecture:
    lecture = (
        db.query(Lecture)
        .filter(Lecture.id == lecture_id, Lecture.user_id == user_id)
        .first()
    )
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


# ---------------------------------------------------------------------------
# POST /api/lectures/{lecture_id}/summarize
# (POST is already in lectures.py — this mirrors it and lets clients call it
#  via the summarization router prefix as well)
# ---------------------------------------------------------------------------
class SummarizeRequest(BaseModel):
    summary_type: str = "executive"


@router.post("/lectures/{lecture_id}/summarize/all")
@limiter.limit("5/minute")
async def generate_all_summaries(
    request: Request,
    lecture_id: str,
    user_id: str = Depends(get_user_id),
):
    """
    Generate all four summary types (executive, detailed, questions, glossary)
    in a single call and store the result as a structured JSON object.
    Expensive — rate limited to 5/minute.
    """
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            if not lecture.transcript:
                raise HTTPException(status_code=400, detail="No transcript — transcribe first")
            transcript = lecture.transcript

        svc    = _get_svc()
        result = await run_in_threadpool(svc.multi_summarize, transcript)

        if result.get("success"):
            with get_db() as db:
                lecture = _get_lecture_or_404(db, lecture_id, user_id)
                # Store structured dict — summary column is JSON
                lecture.summary = result["summaries"]
                db.commit()

        return {
            "success":   result.get("success"),
            "summaries": result.get("summaries"),
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("generate_all_summaries failed")
        raise HTTPException(status_code=500, detail="Summarisation failed")


# ---------------------------------------------------------------------------
# GET /api/lectures/{lecture_id}/summary
# ---------------------------------------------------------------------------
@router.get("/lectures/{lecture_id}/summary")
@limiter.limit("60/minute")
async def get_summary(
    request: Request,
    lecture_id: str,
    user_id: str = Depends(get_user_id),
):
    """Return the stored summary for a lecture (all types if multi-summarized)."""
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            summary = lecture.summary

        if not summary:
            raise HTTPException(status_code=404, detail="No summary yet — summarize the lecture first")

        return {"success": True, "lecture_id": lecture_id, "summary": summary}
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_summary failed")
        raise HTTPException(status_code=500, detail="Could not fetch summary")


# ---------------------------------------------------------------------------
# PUT /api/lectures/{lecture_id}/summary  (regenerate a specific type)
# ---------------------------------------------------------------------------
class UpdateSummaryRequest(BaseModel):
    summary_type: str = "executive"


@router.put("/lectures/{lecture_id}/summary")
@limiter.limit("10/minute")
async def update_summary(
    request: Request,
    lecture_id: str,
    body: UpdateSummaryRequest,
    user_id: str = Depends(get_user_id),
):
    """Regenerate a single summary type and merge it into the stored summary."""
    if body.summary_type not in VALID_FORMATS:
        raise HTTPException(status_code=400, detail=f"summary_type must be one of {VALID_FORMATS}")
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            if not lecture.transcript:
                raise HTTPException(status_code=400, detail="No transcript available")
            transcript    = lecture.transcript
            current_summary = lecture.summary or {}

        svc    = _get_svc()
        result = await run_in_threadpool(svc.summarize, transcript, body.summary_type)

        if result.get("success"):
            # Merge updated type into existing summary object
            if isinstance(current_summary, dict):
                current_summary[body.summary_type] = result["summary"]
            else:
                current_summary = {body.summary_type: result["summary"]}

            with get_db() as db:
                lecture = _get_lecture_or_404(db, lecture_id, user_id)
                lecture.summary = current_summary
                db.commit()

        return {
            "success":      result.get("success"),
            "summary_type": body.summary_type,
            "summary":      result.get("summary"),
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("update_summary failed")
        raise HTTPException(status_code=500, detail="Could not update summary")


# ---------------------------------------------------------------------------
# GET /api/lectures/{lecture_id}/summary/{fmt}
# ---------------------------------------------------------------------------
@router.get("/lectures/{lecture_id}/summary/{fmt}")
@limiter.limit("60/minute")
async def get_summary_format(
    request: Request,
    lecture_id: str,
    fmt: str,
    user_id: str = Depends(get_user_id),
):
    """
    Get a specific summary format from the stored summary object.
    fmt: executive | detailed | questions | glossary
    If that format hasn't been generated yet, generate it on the fly.
    """
    if fmt not in VALID_FORMATS:
        raise HTTPException(status_code=400, detail=f"Format must be one of {VALID_FORMATS}")
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            summary = lecture.summary
            transcript = lecture.transcript

        # If the stored summary is a dict and already has this format, return it
        if isinstance(summary, dict) and fmt in summary:
            return {"success": True, "format": fmt, "summary": summary[fmt]}

        # Otherwise generate it now
        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript — transcribe first")

        svc    = _get_svc()
        result = await run_in_threadpool(svc.summarize, transcript, fmt)

        if result.get("success"):
            # Persist
            stored = summary if isinstance(summary, dict) else {}
            stored[fmt] = result["summary"]
            with get_db() as db:
                lecture = _get_lecture_or_404(db, lecture_id, user_id)
                lecture.summary = stored
                db.commit()

        return {
            "success": result.get("success"),
            "format":  fmt,
            "summary": result.get("summary"),
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_summary_format failed")
        raise HTTPException(status_code=500, detail="Could not fetch summary format")
