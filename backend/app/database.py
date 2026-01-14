"""
Database Configuration and Session Management
SQLAlchemy setup for Creerlio Platform
Supports both PostgreSQL (including Supabase) and SQLite
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from contextlib import contextmanager
from app.models import Base

# Database URL from environment
# For Supabase, use: postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
# Or use Supabase connection pooler: postgresql://postgres:[PASSWORD]@[PROJECT_REF].pooler.supabase.com:6543/postgres
# Default to SQLite for local development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./creerlio.db"
)

# Supabase connection (optional - for direct Supabase client usage)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Create engine with connection pool settings
# For SQLite, use NullPool and enable check_same_thread=False
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        connect_args={"check_same_thread": False},
        echo=os.getenv("DB_ECHO", "False").lower() == "true"
    )
else:
    # PostgreSQL or other databases
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=os.getenv("DB_ECHO", "False").lower() == "true"
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        # Don't raise - allow app to start even if DB init fails
        pass


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        # Test connection (SQLAlchemy 2.0 syntax)
        db.execute(text("SELECT 1"))
        yield db
    except Exception as e:
        db.rollback()
        print(f"Database connection error: {e}")
        raise
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



