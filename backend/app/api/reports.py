"""
Reports API — generate, store, list, download, and delete study reports.
Reports are multi-section text documents built from SummarizationService.
All routes require a valid Supabase JWT.
"""
import logging
import uuid
from contextlib import contextmanager
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database.db import SessionLocal
from app.models.database import Lecture, Report
from app.security import get_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["reports"])
limiter = Limiter(key_func=get_remote_address)

VALID_REPORT_TYPES = {"transcript", "study_guide", "exam_prep", "executive"}


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_summarization_service():
    try:
        from app.services.summarization_service import SummarizationService
        return SummarizationService()
    except ImportError:
        class _Mock:
            def multi_summarize(self, text):
                return {"success": True, "summaries": {"executive": "[Mock] install google-generativeai"}}
            def summarize(self, text, summary_type="executive"):
                return {"success": True, "summary": "[Mock]"}
        return _Mock()


def _build_report_text(lecture: Lecture, report_type: str, svc) -> str:
    """
    Build report content as a formatted plain-text string.
    Run this inside run_in_threadpool since it calls Gemini.
    """
    transcript = lecture.transcript or ""
    header = (
        f"STUDYPRO REPORT\n"
        f"{'=' * 60}\n"
        f"Title      : {lecture.title}\n"
        f"Discipline : {lecture.discipline or 'N/A'}\n"
        f"Duration   : {lecture.duration or 0}s\n"
        f"Generated  : {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
        f"{'=' * 60}\n\n"
    )

    if report_type == "transcript":
        body = f"FULL TRANSCRIPT\n{'-' * 40}\n{transcript or '[No transcript available]'}\n"

    elif report_type == "executive":
        result = svc.summarize(transcript, "executive")
        body = f"EXECUTIVE SUMMARY\n{'-' * 40}\n{result.get('summary', '[Summary failed]')}\n"

    elif report_type == "study_guide":
        sections = []
        for kind in ["executive", "detailed", "glossary"]:
            result = svc.summarize(transcript, kind)
            label = {"executive": "OVERVIEW", "detailed": "DETAILED NOTES", "glossary": "KEY TERMS"}[kind]
            sections.append(f"{label}\n{'-' * 40}\n{result.get('summary', '[Failed]')}\n")
        body = "\n".join(sections)

    elif report_type == "exam_prep":
        sections = []
        for kind in ["executive", "questions", "glossary"]:
            result = svc.summarize(transcript, kind)
            label = {"executive": "OVERVIEW", "questions": "PRACTICE QUESTIONS", "glossary": "KEY TERMS"}[kind]
            sections.append(f"{label}\n{'-' * 40}\n{result.get('summary', '[Failed]')}\n")
        body = "\n".join(sections)

    else:
        body = f"TRANSCRIPT\n{'-' * 40}\n{transcript}\n"

    return header + body


# ---------------------------------------------------------------------------
# POST /api/reports/generate
# ---------------------------------------------------------------------------
class GenerateReportRequest(BaseModel):
    lecture_id: str
    report_type: str = "study_guide"   # transcript | study_guide | exam_prep | executive


@router.post("/reports/generate")
@limiter.limit("5/minute")
async def generate_report(
    request: Request,
    body: GenerateReportRequest,
    user_id: str = Depends(get_user_id),
):
    """Generate a multi-section text report for a lecture and store it."""
    if body.report_type not in VALID_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"report_type must be one of: {VALID_REPORT_TYPES}"
        )

    try:
        with get_db() as db:
            lecture = (
                db.query(Lecture)
                .filter(Lecture.id == body.lecture_id, Lecture.user_id == user_id)
                .first()
            )
            if not lecture:
                raise HTTPException(status_code=404, detail="Lecture not found")
            if not lecture.transcript:
                raise HTTPException(status_code=400, detail="No transcript — transcribe the lecture first")

        # Create a pending Report row immediately so the client gets an ID
        report_id = str(uuid.uuid4())
        with get_db() as db:
            report = Report(
                id=report_id,
                user_id=user_id,
                lecture_ids=[body.lecture_id],
                report_type=body.report_type,
                file_url="",          # filled in after generation
                status="generating",
            )
            db.add(report)
            db.commit()

        # Build report text in a thread (Gemini is blocking I/O)
        svc  = _get_summarization_service()
        text = await run_in_threadpool(
            _build_report_text, lecture, body.report_type, svc
        )

        # Store text inline as file_url = "inline:<content>" — no external storage needed
        # for text reports. Swap for Supabase Storage upload if PDF is ever added.
        with get_db() as db:
            report = db.query(Report).filter(Report.id == report_id).first()
            if report:
                report.file_url = text
                report.status   = "ready"
                db.commit()

        return {
            "success":     True,
            "report_id":   report_id,
            "report_type": body.report_type,
            "status":      "ready",
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("generate_report failed")
        # Mark the report as failed if it was already created
        try:
            with get_db() as db:
                r = db.query(Report).filter(Report.id == report_id).first()
                if r:
                    r.status = "failed"
                    db.commit()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Report generation failed")


# ---------------------------------------------------------------------------
# GET /api/reports
# ---------------------------------------------------------------------------
@router.get("/reports")
@limiter.limit("30/minute")
async def list_reports(
    request: Request,
    user_id: str = Depends(get_user_id),
):
    """List all generated reports for the authenticated user."""
    try:
        with get_db() as db:
            reports = (
                db.query(Report)
                .filter(Report.user_id == user_id)
                .order_by(Report.created_at.desc())
                .all()
            )
        return {
            "success": True,
            "reports": [
                {
                    "id":           r.id,
                    "lecture_ids":  r.lecture_ids,
                    "report_type":  r.report_type,
                    "status":       r.status,
                    "created_at":   r.created_at.isoformat() if r.created_at else None,
                }
                for r in reports
            ],
        }
    except Exception:
        logger.exception("list_reports failed")
        raise HTTPException(status_code=500, detail="Could not list reports")


# ---------------------------------------------------------------------------
# GET /api/reports/{report_id}  — download as plain text
# ---------------------------------------------------------------------------
@router.get("/reports/{report_id}")
@limiter.limit("30/minute")
async def download_report(
    request: Request,
    report_id: str,
    user_id: str = Depends(get_user_id),
):
    """Download a generated report as plain text."""
    try:
        with get_db() as db:
            report = (
                db.query(Report)
                .filter(Report.id == report_id, Report.user_id == user_id)
                .first()
            )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if report.status != "ready":
            raise HTTPException(
                status_code=400,
                detail=f"Report is not ready yet — status: {report.status}"
            )

        filename = f"studypro_report_{report.report_type}_{report_id[:8]}.txt"
        return PlainTextResponse(
            content=report.file_url,   # file_url stores the report text inline
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "text/plain; charset=utf-8",
            },
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("download_report failed")
        raise HTTPException(status_code=500, detail="Could not download report")


# ---------------------------------------------------------------------------
# DELETE /api/reports/{report_id}
# ---------------------------------------------------------------------------
@router.delete("/reports/{report_id}")
@limiter.limit("20/minute")
async def delete_report(
    request: Request,
    report_id: str,
    user_id: str = Depends(get_user_id),
):
    """Delete a report record."""
    try:
        with get_db() as db:
            report = (
                db.query(Report)
                .filter(Report.id == report_id, Report.user_id == user_id)
                .first()
            )
            if not report:
                raise HTTPException(status_code=404, detail="Report not found")
            db.delete(report)
            db.commit()
        return {"success": True, "message": "Report deleted"}
    except HTTPException:
        raise
    except Exception:
        logger.exception("delete_report failed")
        raise HTTPException(status_code=500, detail="Could not delete report")


# ---------------------------------------------------------------------------
# POST /api/reports/{report_id}/share
# ---------------------------------------------------------------------------
@router.post("/reports/{report_id}/share")
@limiter.limit("10/minute")
async def generate_share_link(
    request: Request,
    report_id: str,
    user_id: str = Depends(get_user_id),
):
    """
    Returns a deep-link URL to the report download endpoint.
    Full shareable public links require signed URLs from object storage —
    documented as a future enhancement when PDF generation is added.
    """
    try:
        with get_db() as db:
            report = (
                db.query(Report)
                .filter(Report.id == report_id, Report.user_id == user_id)
                .first()
            )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        # For now return a deep link to the download endpoint.
        # This requires the caller to be authenticated.
        download_url = f"/api/reports/{report_id}"
        return {
            "success":      True,
            "report_id":    report_id,
            "download_url": download_url,
            "note":         "This link requires authentication. Public sharing via signed URL is a planned feature.",
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("generate_share_link failed")
        raise HTTPException(status_code=500, detail="Could not generate share link")
