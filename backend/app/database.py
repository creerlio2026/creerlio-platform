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
from fastapi import HTTPException
from app.models import Base

# Database URL from environment
# For Supabase, use: postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
# Or use Supabase connection pooler: postgresql://postgres:[PASSWORD]@[PROJECT_REF].pooler.supabase.com:6543/postgres
# Default to SQLite for local development
# On Railway, if DATABASE_URL is not set, we'll skip database initialization
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Supabase connection (optional - for direct Supabase client usage)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Create engine with connection pool settings
# For SQLite, use NullPool and enable check_same_thread=False
# On Railway, we should use Supabase PostgreSQL, not SQLite
engine = None
if DATABASE_URL:
    try:
        if "sqlite" in DATABASE_URL.lower():
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
        print(f"Database engine created successfully")
    except Exception as e:
        print(f"Warning: Failed to create database engine: {e}")
        import traceback
        print(traceback.format_exc())
        engine = None
else:
    print("Warning: DATABASE_URL not set, database features will be disabled")

# Session factory (only if engine exists)
if engine:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    # Dummy sessionmaker that won't crash
    SessionLocal = None


def init_db():
    """Initialize database tables"""
    if not engine:
        print("Warning: Database engine not available, skipping table creation")
        return
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        # Don't raise - allow app to start even if DB init fails
        pass


def get_db():
    """Dependency for getting database session"""
    if not SessionLocal:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        db = SessionLocal()
        try:
            # Test connection (SQLAlchemy 2.0 syntax)
            db.execute(text("SELECT 1"))
            yield db
        except Exception as e:
            db.rollback()
            print(f"Database connection error: {e}")
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")
        finally:
            db.close()
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")


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



