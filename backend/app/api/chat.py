"""
Chat API routes - Conversational RAG for Q&A on lectures
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database.db import SessionLocal
from app.models.lecture import Lecture, ChatMessage
from app.services.rag_service import get_rag_service

router = APIRouter(prefix="/api", tags=["chat"])


class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/lectures/{lecture_id}/chat", response_model=dict)
async def send_message(lecture_id: int, message_create: ChatMessageCreate):
    """Send message to RAG chat for a lecture"""
    try:
        db = SessionLocal()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()

        if not lecture:
            db.close()
            raise HTTPException(status_code=404, detail="Lecture not found")

        if not lecture.transcript:
            db.close()
            raise HTTPException(status_code=400, detail="No transcript available for this lecture")

        # Get chat history
        chat_history = (
            db.query(ChatMessage)
            .filter(ChatMessage.lecture_id == lecture_id)
            .order_by(ChatMessage.created_at)
            .all()
        )

        # Get RAG service and answer question
        rag_service = get_rag_service()
        answer_result = rag_service.answer_question(
            question=message_create.message,
            context_text=lecture.transcript,
            chat_history=[
                {"role": msg.role, "text": msg.content} for msg in chat_history[-5:]
            ],
        )

        if not answer_result["success"]:
            db.close()
            return {"success": False, "error": answer_result.get("error")}

        # Save user message
        user_msg = ChatMessage(
            lecture_id=lecture_id,
            role="user",
            content=message_create.message,
            created_at=datetime.now(),
        )
        db.add(user_msg)

        # Save assistant message
        assistant_msg = ChatMessage(
            lecture_id=lecture_id,
            role="assistant",
            content=answer_result["answer"],
            created_at=datetime.now(),
        )
        db.add(assistant_msg)

        db.commit()
        db.close()

        return {
            "success": True,
            "message": message_create.message,
            "answer": answer_result["answer"],
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/lectures/{lecture_id}/chat/history", response_model=dict)
async def get_chat_history(lecture_id: int):
    """Get chat history for a lecture"""
    try:
        db = SessionLocal()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()

        if not lecture:
            db.close()
            raise HTTPException(status_code=404, detail="Lecture not found")

        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.lecture_id == lecture_id)
            .order_by(ChatMessage.created_at)
            .all()
        )

        db.close()

        return {
            "success": True,
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                }
                for msg in messages
            ],
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.delete("/lectures/{lecture_id}/chat/history", response_model=dict)
async def clear_chat_history(lecture_id: int):
    """Clear chat history for a lecture"""
    try:
        db = SessionLocal()
        db.query(ChatMessage).filter(ChatMessage.lecture_id == lecture_id).delete()
        db.commit()
        db.close()

        return {"success": True, "message": "Chat history cleared"}
    except Exception as e:
        return {"success": False, "error": str(e)}
