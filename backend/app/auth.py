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

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


# ==================== Pydantic Models ====================

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: Optional[str] = ""  # Password is optional (bypass mode)
    full_name: Optional[str] = None
    user_type: str = "talent"  # "talent" or "business"
    
    class Config:
        # Allow extra fields to be ignored and fields with defaults to be omitted
        extra = "ignore"


class UserLogin(BaseModel):
    email: str
    password: Optional[str] = ""  # Password is optional (bypass mode)
    
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
    """Verify a password against its hash
    
    Note: bcrypt has a 72-byte limit. Passwords longer than 72 bytes will be truncated.
    This ensures verification matches how the password was hashed.
    """
    if not plain_password:
        return False
    
    # Truncate password to 72 bytes to match how it was hashed
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        # Decode back to string, handling any incomplete UTF-8 sequences
        try:
            plain_password = password_bytes.decode('utf-8')
        except UnicodeDecodeError:
            # If decoding fails, remove the last byte and try again
            password_bytes = password_bytes[:71]
            plain_password = password_bytes.decode('utf-8', errors='ignore')
    
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password
    
    Note: bcrypt has a 72-byte limit. Passwords longer than 72 bytes will be truncated.
    This function ensures passwords are truncated to exactly 72 bytes before hashing.
    """
    if not password:
        return ""
    
    # Truncate password to 72 bytes to comply with bcrypt limit
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        # Decode back to string, handling any incomplete UTF-8 sequences
        try:
            password = password_bytes.decode('utf-8')
        except UnicodeDecodeError:
            # If decoding fails, remove the last byte and try again
            password_bytes = password_bytes[:71]
            password = password_bytes.decode('utf-8', errors='ignore')
    
    return pwd_context.hash(password)


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
    
    # Hash password (password truncation to 72 bytes is handled in get_password_hash)
    hashed_password = get_password_hash(user_data.password) if user_data.password else ""
    
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


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password (bypass mode: allows empty password)"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    if not user.is_active:
        return None
    
    # BYPASS MODE: If password is empty/None, allow login without verification
    if not password or password.strip() == "":
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        return user
    
    # If password provided, verify it (only if user has a hashed password)
    if user.hashed_password:
        if not verify_password(password, user.hashed_password):
            return None
    # If user has no hashed password but provided password, reject (security)
    elif password:
        return None
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user


