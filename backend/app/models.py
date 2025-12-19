"""
Data Models for Creerlio Platform
SQLAlchemy models for business profiles, talent profiles, and resume data
"""

from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict

Base = declarative_base()


# ==================== SQLAlchemy Models ====================

class User(Base):
    """User account model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    user_type = Column(String(50), default="talent")  # "talent" or "business"
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Profile connections
    talent_profile_id = Column(Integer, ForeignKey("talent_profiles.id"), nullable=True)
    business_profile_id = Column(Integer, ForeignKey("business_profiles.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    talent_profile = relationship("TalentProfile", foreign_keys=[talent_profile_id])
    business_profile = relationship("BusinessProfile", foreign_keys=[business_profile_id])


class BusinessProfile(Base):
    """Business profile model"""
    __tablename__ = "business_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    industry = Column(String(100))
    website = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    
    # Location data
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String(500))  # Full location string
    
    # Additional data
    tags = Column(JSON)  # List of tags/categories
    extra_metadata = Column(JSON)  # Additional flexible data (renamed from 'metadata' to avoid SQLAlchemy conflict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class TalentProfile(Base):
    """Talent profile model"""
    __tablename__ = "talent_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50))
    bio = Column(Text)
    
    # Professional data
    title = Column(String(255))
    skills = Column(JSON)  # List of skills
    experience_years = Column(Integer)
    education = Column(JSON)  # List of education entries
    certifications = Column(JSON)  # List of certifications
    
    # Location data
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String(500))
    
    # Portfolio data
    portfolio_url = Column(String(500))
    portfolio_data = Column(JSON)  # Structured portfolio content
    
    # Resume connection
    resume_id = Column(Integer, ForeignKey("resume_data.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    resume = relationship("ResumeData", back_populates="talent_profiles")


class ResumeData(Base):
    """Parsed resume data model"""
    __tablename__ = "resume_data"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Personal information
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(String(500))
    linkedin = Column(String(255))
    github = Column(String(255))
    website = Column(String(255))
    
    # Professional summary
    summary = Column(Text)
    objective = Column(Text)
    
    # Work experience
    experience = Column(JSON)  # List of work experience entries
    # Format: [{"company": "", "title": "", "start_date": "", "end_date": "", "description": "", "achievements": []}]
    
    # Education
    education = Column(JSON)  # List of education entries
    # Format: [{"institution": "", "degree": "", "field": "", "start_date": "", "end_date": "", "gpa": ""}]
    
    # Skills
    skills = Column(JSON)  # List of skills with categories
    # Format: {"technical": [], "soft": [], "languages": [], "tools": []}
    
    # Certifications
    certifications = Column(JSON)  # List of certifications
    
    # Projects
    projects = Column(JSON)  # List of projects
    
    # Languages
    languages = Column(JSON)  # List of languages with proficiency
    
    # Awards & Achievements
    awards = Column(JSON)  # List of awards
    
    # Raw parsed data
    raw_data = Column(JSON)  # Complete parsed structure
    
    # File metadata
    original_filename = Column(String(255))
    file_type = Column(String(50))
    file_size = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    talent_profiles = relationship("TalentProfile", back_populates="resume")


class Job(Base):
    """Job posting model"""
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    business_profile_id = Column(Integer, ForeignKey("business_profiles.id"), nullable=False, index=True)
    
    # Job details
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    requirements = Column(Text)
    responsibilities = Column(Text)
    
    # Employment details
    employment_type = Column(String(50))  # "full-time", "part-time", "contract", "internship"
    salary_min = Column(Float)
    salary_max = Column(Float)
    salary_currency = Column(String(10), default="USD")
    remote_allowed = Column(Boolean, default=False)
    
    # Location
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String(500))
    
    # Skills and requirements
    required_skills = Column(JSON)  # List of required skills
    preferred_skills = Column(JSON)  # List of preferred skills
    experience_level = Column(String(50))  # "entry", "mid", "senior", "executive"
    education_level = Column(String(50))  # "high-school", "bachelor", "master", "phd"
    
    # Status
    status = Column(String(50), default="draft")  # "draft", "published", "closed", "archived"
    is_active = Column(Boolean, default=True)
    
    # Application details
    application_url = Column(String(500))
    application_email = Column(String(255))
    application_deadline = Column(DateTime, nullable=True)
    
    # Metadata
    tags = Column(JSON)  # List of tags/categories
    extra_metadata = Column(JSON)  # Additional flexible data
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    
    # Relationships
    business_profile = relationship("BusinessProfile", backref="jobs")


class Application(Base):
    """Job application model"""
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    talent_profile_id = Column(Integer, ForeignKey("talent_profiles.id"), nullable=False, index=True)
    
    # Application status
    status = Column(String(50), default="applied")  # "applied", "shortlisted", "rejected", "hired"
    
    # Application details
    cover_letter = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Metadata
    extra_metadata = Column(JSON)  # Additional flexible data
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    job = relationship("Job", backref="applications")
    talent_profile = relationship("TalentProfile", backref="applications")
    
    # Unique constraint: one application per job per talent
    __table_args__ = (
        UniqueConstraint('job_id', 'talent_profile_id', name='_job_talent_uc'),
    )


class TalentBankItem(Base):
    """
    Canonical Talent Bank item model.
    
    Stores all talent-owned assets (documents, images, videos) and
    structured records (experience, education, credentials, links, etc.)
    in a single flexible table with type-based records and JSON metadata.
    """
    __tablename__ = "talent_bank_items"

    id = Column(Integer, primary_key=True, index=True)

    # Owner
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Core identity
    item_type = Column(String(50), nullable=False, index=True)  # e.g. document, image, video, experience, education, credential
    title = Column(String(255), nullable=False)
    description = Column(Text)

    # File-related data (for storage-backed assets)
    file_url = Column(String(1024))        # Public or signed URL to Supabase Storage
    file_path = Column(String(1024))       # Path within Supabase bucket talent-bank/{user_id}/...
    file_type = Column(String(100))        # MIME type
    file_size = Column(Integer)            # Bytes

    # Flexible structured metadata for different item types
    # Examples:
    # - experience: { "company": "", "title": "", "startDate": "", "endDate": "", "description": "" }
    # - education: { "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "" }
    # - credential: { "issuer": "", "name": "", "issuedDate": "", "expiryDate": "", "credentialId": "" }
    # - document: { "originalName": "", "tags": [], "notes": "" }
    metadata = Column(JSON)

    # Flags
    is_active = Column(Boolean, default=True, index=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)


# ==================== Pydantic Models (for API) ====================

class BusinessProfileCreate(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    tags: Optional[List[str]] = None
    extra_metadata: Optional[Dict] = None


class BusinessProfileResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    industry: Optional[str]
    website: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TalentProfileCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    bio: Optional[str] = None
    title: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    education: Optional[List[Dict]] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    portfolio_url: Optional[str] = None
    portfolio_data: Optional[Dict] = None


class TalentProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    bio: Optional[str]
    title: Optional[str]
    skills: Optional[List[str]]
    experience_years: Optional[int]
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    portfolio_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResumeDataResponse(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    summary: Optional[str]
    experience: Optional[List[Dict]]
    education: Optional[List[Dict]]
    skills: Optional[Dict]
    certifications: Optional[List[Dict]]
    projects: Optional[List[Dict]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    business_profile_id: int
    title: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = "USD"
    remote_allowed: Optional[bool] = False
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    education_level: Optional[str] = None
    application_url: Optional[str] = None
    application_email: Optional[str] = None
    application_deadline: Optional[datetime] = None
    tags: Optional[List[str]] = None
    extra_metadata: Optional[Dict] = None


class JobResponse(BaseModel):
    id: int
    business_profile_id: int
    title: str
    description: Optional[str]
    requirements: Optional[str]
    responsibilities: Optional[str]
    employment_type: Optional[str]
    salary_min: Optional[float]
    salary_max: Optional[float]
    salary_currency: Optional[str]
    remote_allowed: Optional[bool]
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    required_skills: Optional[List[str]]
    preferred_skills: Optional[List[str]]
    experience_level: Optional[str]
    education_level: Optional[str]
    status: str
    is_active: bool
    application_url: Optional[str]
    application_email: Optional[str]
    application_deadline: Optional[datetime]
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None
    notes: Optional[str] = None
    extra_metadata: Optional[Dict] = None


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    talent_profile_id: int
    status: str
    cover_letter: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TalentBankItemCreate(BaseModel):
    """
    Payload for creating a structured (non-file) talent bank item.

    File-backed items should be created via the dedicated upload endpoint,
    which will populate file_* fields automatically.
    """
    item_type: str
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict] = None


class TalentBankItemResponse(BaseModel):
    id: int
    user_id: int
    item_type: str
    title: str
    description: Optional[str]
    file_url: Optional[str]
    file_path: Optional[str]
    file_type: Optional[str]
    file_size: Optional[int]
    metadata: Optional[Dict]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


