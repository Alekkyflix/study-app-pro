"""
Chat API — conversational RAG over lecture transcripts.
All routes require a valid Supabase JWT.
"""
import logging
import uuid
from contextlib import contextmanager
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database.db import SessionLocal
from app.models.database import ChatMessage, ChatSession, Lecture
from app.security import get_user_id
from app.services.rag_service import get_rag_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])
limiter = Limiter(key_func=get_remote_address)


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ChatMessageCreate(BaseModel):
    message: str


def _get_lecture_or_404(db, lecture_id: str, user_id: str) -> Lecture:
    lecture = db.query(Lecture).filter(
        Lecture.id == lecture_id,
        Lecture.user_id == user_id,
    ).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.post("/lectures/{lecture_id}/chat/session", response_model=dict)
@limiter.limit("15/minute")
async def send_message(
    request: Request,
    lecture_id: str,
    message_create: ChatMessageCreate,
    user_id: str = Depends(get_user_id),
):
    """Send a message to the RAG chat for a lecture and get an AI answer."""
    try:
        with get_db() as db:
            lecture = _get_lecture_or_404(db, lecture_id, user_id)
            if not lecture.transcript:
                raise HTTPException(status_code=400, detail="No transcript available for this lecture")

            # Get or create a chat session for this lecture
            session = db.query(ChatSession).filter(
                ChatSession.lecture_id == lecture_id
            ).first()
            if not session:
                session = ChatSession(
                    id=str(__import__("uuid").uuid4()),
                    lecture_id=lecture_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(session)
                db.commit()
                db.refresh(session)

            # Last 5 messages for context
            history = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == session.id)
                .order_by(ChatMessage.created_at)
                .all()
            )[-5:]

            transcript = lecture.transcript
            session_id = session.id

        rag = get_rag_service()
        result = rag.answer_question(
            question=message_create.message,
            context_text=transcript,
            chat_history=[{"role": m.role, "text": m.content} for m in history],
        )

        if not result.get("success"):
            if result.get("quota_exceeded"):
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API quota exceeded. Please wait a moment and try again.",
                )
            raise HTTPException(status_code=500, detail=result.get("error", "AI could not generate a response"))

        import uuid as _uuid
        now = datetime.utcnow()
        with get_db() as db:
            db.add(ChatMessage(
                id=str(_uuid.uuid4()),
                session_id=session_id,
                role="user",
                content=message_create.message,
                created_at=now,
            ))
            db.add(ChatMessage(
                id=str(_uuid.uuid4()),
                session_id=session_id,
                role="assistant",
                content=result["answer"],
                created_at=now,
            ))
            db.commit()

        return {"success": True, "message": message_create.message, "answer": result["answer"]}

    except HTTPException:
        raise
    except Exception:
        logger.exception("send_message failed")
        raise HTTPException(status_code=500, detail="Chat request failed")


@router.get("/lectures/{lecture_id}/chat/history", response_model=dict)
@limiter.limit("30/minute")
async def get_chat_history(
    request: Request,
    lecture_id: str,
    user_id: str = Depends(get_user_id),
):
    """Get full chat history for a lecture."""
    try:
        with get_db() as db:
            _get_lecture_or_404(db, lecture_id, user_id)

            session = db.query(ChatSession).filter(
                ChatSession.lecture_id == lecture_id
            ).first()
            if not session:
                return {"success": True, "messages": []}

            messages = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == session.id)
                .order_by(ChatMessage.created_at)
                .all()
            )
            return {
                "success": True,
                "messages": [
                    {
                        "id": m.id,
                        "role": m.role,
                        "content": m.content,
                        "created_at": m.created_at.isoformat() if m.created_at else None,
                    }
                    for m in messages
                ],
            }
    except HTTPException:
        raise
    except Exception:
        logger.exception("get_chat_history failed")
        raise HTTPException(status_code=500, detail="Could not fetch chat history")


@router.delete("/lectures/{lecture_id}/chat/history", response_model=dict)
@limiter.limit("10/minute")
async def clear_chat_history(
    request: Request,
    lecture_id: str,
    user_id: str = Depends(get_user_id),
):
    """Clear all chat messages for a lecture."""
    try:
        with get_db() as db:
            _get_lecture_or_404(db, lecture_id, user_id)

            session = db.query(ChatSession).filter(
                ChatSession.lecture_id == lecture_id
            ).first()
            if session:
                db.query(ChatMessage).filter(
                    ChatMessage.session_id == session.id
                ).delete()
                db.commit()

        return {"success": True, "message": "Chat history cleared"}
    except HTTPException:
        raise
    except Exception:
        logger.exception("clear_chat_history failed")
        raise HTTPException(status_code=500, detail="Could not clear history")