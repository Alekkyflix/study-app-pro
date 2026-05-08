"""
Analytics endpoints — real metrics derived from lecture and analytics DB rows.
All routes require a valid Supabase JWT.
"""
import logging
from contextlib import contextmanager
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database.db import SessionLocal
from app.models.database import Analytics, Lecture
from app.security import get_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analytics"])
limiter = Limiter(key_func=get_remote_address)


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# GET /api/analytics/overview
# ---------------------------------------------------------------------------
@router.get("/analytics/overview")
@limiter.limit("30/minute")
async def get_analytics_overview(
    request: Request,
    user_id: str = Depends(get_user_id),
):
    """
    High-level dashboard stats for the authenticated user:
    total lectures, total study time, average completion rate,
    average exam readiness, and lectures recorded this week.
    """
    try:
        with get_db() as db:
            lectures = (
                db.query(Lecture)
                .filter(Lecture.user_id == user_id)
                .all()
            )

            lecture_ids = [l.id for l in lectures]
            analytics_rows = (
                db.query(Analytics)
                .filter(Analytics.lecture_id.in_(lecture_ids))
                .all()
            ) if lecture_ids else []

            total_lectures   = len(lectures)
            total_duration   = sum(l.duration or 0 for l in lectures)
            transcribed      = sum(1 for l in lectures if l.transcript)
            summarized       = sum(1 for l in lectures if l.summary)

            week_ago = datetime.utcnow() - timedelta(days=7)
            this_week = sum(1 for l in lectures if l.created_at and l.created_at >= week_ago)

            avg_completion  = 0.0
            avg_readiness   = 0.0
            avg_retention   = 0.0
            total_study_time = 0

            if analytics_rows:
                avg_completion  = round(sum(a.completion_rate  or 0 for a in analytics_rows) / len(analytics_rows), 2)
                avg_readiness   = round(sum(a.exam_readiness   or 0 for a in analytics_rows) / len(analytics_rows), 2)
                avg_retention   = round(sum(a.retention_score  or 0 for a in analytics_rows) / len(analytics_rows), 2)
                total_study_time = sum(a.study_time or 0 for a in analytics_rows)

        return {
            "success": True,
            "total_lectures":     total_lectures,
            "transcribed":        transcribed,
            "summarized":         summarized,
            "lectures_this_week": this_week,
            "total_duration_s":   total_duration,
            "total_study_time_s": total_study_time,
            "avg_completion":     avg_completion,
            "avg_exam_readiness": avg_readiness,
            "avg_retention":      avg_retention,
        }
    except Exception:
        logger.exception("get_analytics_overview failed")
        raise HTTPException(status_code=500, detail="Could not fetch analytics overview")


# ---------------------------------------------------------------------------
# GET /api/analytics/lectures
# ---------------------------------------------------------------------------
@router.get("/analytics/lectures")
@limiter.limit("30/minute")
async def get_lecture_analytics(
    request: Request,
    user_id: str = Depends(get_user_id),
):
    """Per-lecture stats: completion rate, retention score, exam readiness."""
    try:
        with get_db() as db:
            lectures = (
                db.query(Lecture)
                .filter(Lecture.user_id == user_id)
                .order_by(Lecture.created_at.desc())
                .all()
            )
            lecture_ids = [l.id for l in lectures]
            analytics_map: dict = {}
            if lecture_ids:
                for row in db.query(Analytics).filter(Analytics.lecture_id.in_(lecture_ids)).all():
                    analytics_map[row.lecture_id] = row

            result = []
            for l in lectures:
                a = analytics_map.get(l.id)
                result.append({
                    "lecture_id":        l.id,
                    "title":             l.title,
                    "discipline":        l.discipline,
                    "duration_s":        l.duration,
                    "has_transcript":    bool(l.transcript),
                    "has_summary":       bool(l.summary),
                    "created_at":        l.created_at.isoformat() if l.created_at else None,
                    "completion_rate":   round(a.completion_rate  or 0, 2) if a else 0,
                    "retention_score":   round(a.retention_score  or 0, 2) if a else 0,
                    "exam_readiness":    round(a.exam_readiness   or 0, 2) if a else 0,
                    "study_time_s":      a.study_time or 0 if a else 0,
                    "questions_answered": a.questions_answered or 0 if a else 0,
                })

        return {"success": True, "lectures": result}
    except Exception:
        logger.exception("get_lecture_analytics failed")
        raise HTTPException(status_code=500, detail="Could not fetch lecture analytics")


# ---------------------------------------------------------------------------
# GET /api/analytics/timeline
# ---------------------------------------------------------------------------
@router.get("/analytics/timeline")
@limiter.limit("30/minute")
async def get_study_timeline(
    request: Request,
    user_id: str = Depends(get_user_id),
):
    """
    Study activity over the last 30 days — lectures created per day
    and cumulative study time per day.
    """
    try:
        with get_db() as db:
            cutoff = datetime.utcnow() - timedelta(days=30)
            lectures = (
                db.query(Lecture)
                .filter(Lecture.user_id == user_id, Lecture.created_at >= cutoff)
                .order_by(Lecture.created_at)
                .all()
            )

        # bucket by date string
        day_buckets: dict[str, dict] = {}
        for l in lectures:
            day = l.created_at.date().isoformat() if l.created_at else "unknown"
            if day not in day_buckets:
                day_buckets[day] = {"date": day, "lectures_recorded": 0, "duration_s": 0}
            day_buckets[day]["lectures_recorded"] += 1
            day_buckets[day]["duration_s"] += l.duration or 0

        timeline = sorted(day_buckets.values(), key=lambda x: x["date"])
        return {"success": True, "timeline": timeline, "days": 30}
    except Exception:
        logger.exception("get_study_timeline failed")
        raise HTTPException(status_code=500, detail="Could not fetch timeline")


# ---------------------------------------------------------------------------
# GET /api/analytics/predictions
# ---------------------------------------------------------------------------
@router.get("/analytics/predictions")
@limiter.limit("20/minute")
async def get_exam_predictions(
    request: Request,
    user_id: str = Depends(get_user_id),
):
    """
    Heuristic exam readiness predictions per lecture.
    Score is derived from: has_transcript (30%) + has_summary (30%)
    + analytics.exam_readiness (40%) when available.
    """
    try:
        with get_db() as db:
            lectures = (
                db.query(Lecture)
                .filter(Lecture.user_id == user_id)
                .order_by(Lecture.created_at.desc())
                .all()
            )
            lecture_ids = [l.id for l in lectures]
            analytics_map: dict = {}
            if lecture_ids:
                for row in db.query(Analytics).filter(Analytics.lecture_id.in_(lecture_ids)).all():
                    analytics_map[row.lecture_id] = row

        predictions = []
        for l in lectures:
            a = analytics_map.get(l.id)
            base_score = 0.0
            if l.transcript:
                base_score += 0.30
            if l.summary:
                base_score += 0.30
            if a and a.exam_readiness:
                base_score += 0.40 * a.exam_readiness
            else:
                # no analytics yet — slightly more optimistic default
                base_score += 0.10

            predictions.append({
                "lecture_id":     l.id,
                "title":          l.title,
                "readiness_score": round(min(base_score, 1.0), 2),
                "readiness_pct":  round(min(base_score, 1.0) * 100),
                "has_transcript": bool(l.transcript),
                "has_summary":    bool(l.summary),
                "recommendation": (
                    "Well prepared" if base_score >= 0.7 else
                    "Review recommended" if base_score >= 0.4 else
                    "Needs more study"
                ),
            })

        return {"success": True, "predictions": predictions}
    except Exception:
        logger.exception("get_exam_predictions failed")
        raise HTTPException(status_code=500, detail="Could not generate predictions")


# ---------------------------------------------------------------------------
# GET /api/analytics/discipline/{discipline}
# ---------------------------------------------------------------------------
@router.get("/analytics/discipline/{discipline}")
@limiter.limit("30/minute")
async def get_discipline_analytics(
    request: Request,
    discipline: str,
    user_id: str = Depends(get_user_id),
):
    """Aggregated analytics for all lectures in a specific discipline."""
    try:
        with get_db() as db:
            lectures = (
                db.query(Lecture)
                .filter(
                    Lecture.user_id    == user_id,
                    Lecture.discipline == discipline,
                )
                .all()
            )

            if not lectures:
                return {
                    "success":    True,
                    "discipline": discipline,
                    "count":      0,
                    "message":    "No lectures found for this discipline",
                }

            lecture_ids  = [l.id for l in lectures]
            analytics_rows = (
                db.query(Analytics)
                .filter(Analytics.lecture_id.in_(lecture_ids))
                .all()
            )

        total_duration = sum(l.duration or 0 for l in lectures)
        avg_readiness  = (
            round(sum(a.exam_readiness or 0 for a in analytics_rows) / len(analytics_rows), 2)
            if analytics_rows else 0.0
        )

        return {
            "success":          True,
            "discipline":       discipline,
            "count":            len(lectures),
            "total_duration_s": total_duration,
            "avg_exam_readiness": avg_readiness,
            "lectures": [
                {"id": l.id, "title": l.title, "duration_s": l.duration, "created_at": l.created_at.isoformat() if l.created_at else None}
                for l in lectures
            ],
        }
    except Exception:
        logger.exception("get_discipline_analytics failed")
        raise HTTPException(status_code=500, detail="Could not fetch discipline analytics")
