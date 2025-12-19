"""
Authentication and User Management
Handles user registration, login, and JWT token generation
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.models import User

# Password hashing - Using Argon2id (no password length limit)
# Explicitly set to argon2 only, no fallback schemes
pwd_context = CryptContext(schemes=["argon2"])

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


# ==================== Pydantic Models ====================

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    # password: REMOVED during construction
    full_name: Optional[str] = None
    user_type: str = "talent"  # "talent" or "business"
    
    class Config:
        # Allow extra fields to be ignored and fields with defaults to be omitted
        extra = "ignore"


class UserLogin(BaseModel):
    email: str
    # password: REMOVED during construction
    
    class Config:
        # Allow extra fields to be ignored and fields with defaults to be omitted
        extra = "ignore"


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    user_type: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# ==================== Password Hashing ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using Argon2id
    
    BYPASS MODE: During construction, always return True to skip password verification.
    Argon2id has no password length limit, so no truncation is needed.
    """
    # BYPASS: Skip password verification during construction
    return True


def get_password_hash(password: str) -> str:
    """Hash a password using Argon2id
    
    BYPASS MODE: During construction, skip password hashing entirely.
    Argon2id has no password length limit, so passwords of any length can be hashed.
    """
    # BYPASS: Skip password hashing during construction
    return ""


# ==================== JWT Token ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ==================== User Operations ====================

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user_data: UserRegister) -> User:
    """Create a new user with password authentication"""
    # Check if user already exists
    if get_user_by_email(db, user_data.email):
        raise ValueError("Email already registered")
    
    if get_user_by_username(db, user_data.username):
        raise ValueError("Username already taken")
    
    # BYPASS MODE: Skip password hashing during construction
    hashed_password = ""
    
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        user_type=user_data.user_type
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str) -> Optional[User]:
    """Authenticate a user with email only - password completely removed during construction"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    if not user.is_active:
        return None
    
    # Password completely removed - allow login with email only
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user


