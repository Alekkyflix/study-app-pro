"""SQLAlchemy ORM models for database"""
from sqlalchemy import Column, String, Text, DateTime, Integer, Float, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    lectures = relationship("Lecture", back_populates="user")


class Lecture(Base):
    __tablename__ = "lectures"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, index=True)
    discipline = Column(String)
    description = Column(Text, nullable=True)
    duration = Column(Integer)  # seconds
    audio_url = Column(String)
    transcript = Column(Text, nullable=True)
    transcript_method = Column(String, nullable=True)  # 'whisper' or 'gemini'
    summary = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="lectures")
    documents = relationship("Document", back_populates="lecture")
    chat_sessions = relationship("ChatSession", back_populates="lecture")
    embeddings = relationship("Embedding", back_populates="lecture")


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    lecture_id = Column(String, ForeignKey("lectures.id"))
    filename = Column(String)
    file_url = Column(String)
    extracted_text = Column(Text)
    page_count = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    lecture = relationship("Lecture", back_populates="documents")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True)
    lecture_id = Column(String, ForeignKey("lectures.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    lecture = relationship("Lecture", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    citations = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("ChatSession", back_populates="messages")


class Embedding(Base):
    __tablename__ = "embeddings"
    
    id = Column(String, primary_key=True)
    lecture_id = Column(String, ForeignKey("lectures.id"))
    chunk_index = Column(Integer)
    text_chunk = Column(Text)
    embedding = Column(JSON)  # Vector stored as JSON (migrate to pgvector later)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lecture = relationship("Lecture", back_populates="embeddings")


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    lecture_ids = Column(JSON)  # List of lecture IDs
    report_type = Column(String)  # 'transcript', 'study_guide', etc.
    file_url = Column(String)
    status = Column(String)  # 'pending', 'generating', 'ready', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(String, primary_key=True)
    lecture_id = Column(String, ForeignKey("lectures.id"))
    completion_rate = Column(Float)  # 0-1
    retention_score = Column(Float)  # 0-1
    exam_readiness = Column(Float)  # 0-1
    study_time = Column(Integer)  # seconds
    questions_answered = Column(Integer)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
