"""
Database Configuration and Session Management
SQLAlchemy setup for Creerlio Platform
Supports both PostgreSQL (including Supabase) and SQLite
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from contextlib import contextmanager
from app.models import Base

# Database URL from environment
# For Supabase, use: postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
# Or use Supabase connection pooler: postgresql://postgres:[PASSWORD]@[PROJECT_REF].pooler.supabase.com:6543/postgres
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/creerlio_db"
)

# Supabase connection (optional - for direct Supabase client usage)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool if "sqlite" in DATABASE_URL else None,
    echo=os.getenv("DB_ECHO", "False").lower() == "true"
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()



