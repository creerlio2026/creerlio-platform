"""Data models for the resume builder."""
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class PersonalInfo(BaseModel):
    """Personal information model."""
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    summary: Optional[str] = None


class Experience(BaseModel):
    """Work experience model."""
    company: str
    position: str
    start_date: str
    end_date: Optional[str] = None
    current: bool = False
    description: str
    achievements: Optional[List[str]] = []


class Education(BaseModel):
    """Education model."""
    institution: str
    degree: str
    field: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None


class Resume(BaseModel):
    """Complete resume model."""
    personal_info: PersonalInfo
    experiences: List[Experience] = []
    education: List[Education] = []
    skills: List[str] = []


class EnhancementRequest(BaseModel):
    """Request model for AI enhancement."""
    text: str
    context: Optional[str] = None
