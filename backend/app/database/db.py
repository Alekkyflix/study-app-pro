"""Database initialization and session management"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Use SQLite for local development if PostgreSQL is not available
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../", "studypro.db")
    DATABASE_URL = f"sqlite:///{db_path}"
    print(f"📁 Using local SQLite database: {db_path}")

# SQLite needs check_same_thread=False for async operations
# Render PostgreSQL URLs start with 'postgres://' but SQLAlchemy needs 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    try:
        from app.models.database import Base
        Base.metadata.create_all(bind=engine)
        print("✓ Database initialized successfully")
    except Exception as e:
        print(f"⚠ Database initialization failed (will retry on first request): {str(e)}")
        # Don't fail startup - database will be initialized on first request
