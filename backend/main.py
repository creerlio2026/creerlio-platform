"""
Creerlio Platform - Main Backend Entry Point
FastAPI application with AI resume parsing, business profiles, and mapping features
"""

import json
import time
import os
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional
from dotenv import load_dotenv

# #region agent log
try:
    with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
        f.write(json.dumps({"location":"main.py:20","message":"Module imports starting","data":{},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
except:
    pass
# #endregion

from app.models import BusinessProfile, TalentProfile, ResumeData, User, Job, Application
from app.ai_service import AIService
try:
    from app.pdf_generator import PDFGenerator
    PDF_GENERATOR_AVAILABLE = True
except ImportError:
    PDF_GENERATOR_AVAILABLE = False
    PDFGenerator = None
from app.mapping_service import MappingService
from app.database import get_db, init_db
from app.auth import (
    UserRegister, UserLogin, UserResponse, Token,
    create_user, authenticate_user, create_access_token,
    get_user_by_email, ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta

load_dotenv()

# Initialize services with error handling
# #region agent log
try:
    with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
        f.write(json.dumps({"location":"main.py:34","message":"Starting service initialization","data":{},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
except:
    pass
# #endregion

try:
    # #region agent log
    try:
        with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({"location":"main.py:40","message":"Initializing AIService","data":{},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    except:
        pass
    # #endregion
    ai_service = AIService()
    # #region agent log
    try:
        with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({"location":"main.py:45","message":"AIService initialized successfully","data":{},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    except:
        pass
    # #endregion
except Exception as e:
    # #region agent log
    try:
        with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({"location":"main.py:48","message":"AIService initialization failed","data":{"error":str(e),"type":type(e).__name__},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    except:
        pass
    # #endregion
    print(f"Warning: AIService initialization failed: {e}")
    ai_service = None

try:
    pdf_generator = PDFGenerator() if PDF_GENERATOR_AVAILABLE else None
except Exception as e:
    # #region agent log
    try:
        with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({"location":"main.py:56","message":"PDFGenerator initialization failed","data":{"error":str(e),"type":type(e).__name__},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    except:
        pass
    # #endregion
    pdf_generator = None

try:
    # #region agent log
    try:
        with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({"location":"main.py:62","message":"Initializing MappingService","data":{},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    except:
        pass
    # #endregion
    mapping_service = MappingService()
    # #region agent log
    try:
        with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({"location":"main.py:67","message":"MappingService initialized successfully","data":{},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    except:
        pass
    # #endregion
except Exception as e:
    # #region agent log
    try:
        with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({"location":"main.py:70","message":"MappingService initialization failed","data":{"error":str(e),"type":type(e).__name__},"timestamp":int(time.time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    except:
        pass
    # #endregion
    print(f"Warning: MappingService initialization failed: {e}")
    mapping_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup on startup/shutdown"""
    # Initialize database
    init_db()
    yield
    # Cleanup if needed
    pass


app = FastAPI(
    title="Creerlio Platform API",
    description="Multi-component platform for business, talent, and mapping solutions",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check
@app.get("/")
async def root():
    # #region agent log
    with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
        f.write(json.dumps({"location":"main.py:63","message":"Root endpoint accessed","data":{},"timestamp":int(__import__('time').time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    # #endregion
    return {"message": "Creerlio Platform API", "status": "healthy"}


@app.get("/health")
async def health_check():
    # #region agent log
    with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
        f.write(json.dumps({"location":"main.py:69","message":"Health check endpoint accessed","data":{},"timestamp":int(__import__('time').time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    # #endregion
    return {"status": "healthy", "service": "creerlio-platform"}


# ==================== Authentication & User Management ====================

@app.post("/api/auth/register", response_model=UserResponse)
async def register(request: Request, db=Depends(get_db)):
    """Register a new user with email and password"""
    body = await request.json()
    try:
        # Create UserRegister model with required password
        user_data = UserRegister(
            email=body.get("email"),
            username=body.get("username"),
            password=body.get("password"),  # Required
            full_name=body.get("full_name"),
            user_type=body.get("user_type", "talent")
        )
        user = create_user(db, user_data)
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            user_type=user.user_type,
            is_active=user.is_active,
            created_at=user.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/api/auth/login")
async def login(body: dict = Body(...), db=Depends(get_db)):
    """Login and get access token with email and password"""
    # Create UserLogin model from request body (password required)
    try:
        credentials = UserLogin(
            email=body.get("email"),
            password=body.get("password")  # Required
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            user_type=user.user_type,
            is_active=user.is_active,
            created_at=user.created_at
        )
    }


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user(email: Optional[str] = None, db=Depends(get_db)):
    """Get current user information"""
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        user_type=user.user_type,
        is_active=user.is_active,
        created_at=user.created_at
    )


# ==================== AI Resume Parsing ====================

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...), db=Depends(get_db)):
    """Upload and parse resume using AI"""
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service is not available")
    try:
        # Save uploaded file temporarily
        file_content = await file.read()
        
        # Parse resume with AI
        parsed_data = await ai_service.parse_resume(file_content, file.filename)
        
        # Store in database
        resume_data = ResumeData(**parsed_data)
        db.add(resume_data)
        db.commit()
        db.refresh(resume_data)
        
        return {
            "success": True,
            "resume_id": resume_data.id,
            "data": parsed_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resume/{resume_id}")
async def get_resume(resume_id: int, db=Depends(get_db)):
    """Get parsed resume data"""
    resume = db.query(ResumeData).filter(ResumeData.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@app.get("/api/resume")
async def list_resumes(skip: int = 0, limit: int = 100, db=Depends(get_db)):
    """List all parsed resumes"""
    resumes = db.query(ResumeData).offset(skip).limit(limit).all()
    return {"resumes": resumes, "count": len(resumes)}


# ==================== Business Profiles ====================

@app.post("/api/business")
async def create_business(business_data: dict, db=Depends(get_db)):
    """Create a new business profile"""
    try:
        business = BusinessProfile(**business_data)
        db.add(business)
        db.commit()
        db.refresh(business)
        return {"success": True, "business": business}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/business/{business_id}")
async def get_business(business_id: int, db=Depends(get_db)):
    """Get business profile by ID"""
    business = db.query(BusinessProfile).filter(BusinessProfile.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@app.put("/api/business/{business_id}")
async def update_business(business_id: int, business_data: dict, db=Depends(get_db)):
    """Update business profile"""
    business = db.query(BusinessProfile).filter(BusinessProfile.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    for key, value in business_data.items():
        setattr(business, key, value)
    
    db.commit()
    db.refresh(business)
    return {"success": True, "business": business}


@app.delete("/api/business/{business_id}")
async def delete_business(business_id: int, db=Depends(get_db)):
    """Delete business profile"""
    business = db.query(BusinessProfile).filter(BusinessProfile.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    db.delete(business)
    db.commit()
    return {"success": True, "message": "Business deleted"}


@app.get("/api/business/me")
async def get_my_business_profile(
    email: str,
    db=Depends(get_db)
):
    """Get current user's business profile"""
    # Get user by email
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.user_type != "business":
        raise HTTPException(status_code=403, detail="User is not a business")
    
    # Get business profile if exists
    if user.business_profile_id:
        business = db.query(BusinessProfile).filter(BusinessProfile.id == user.business_profile_id).first()
        if business:
            return business
    
    # Return null if no profile exists
    return None


@app.put("/api/business/me")
async def update_my_business_profile(
    profile_data: dict,
    email: str,
    db=Depends(get_db)
):
    """Update current user's business profile"""
    # Get user by email
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.user_type != "business":
        raise HTTPException(status_code=403, detail="Only business users can update business profiles")
    
    # Get or create business profile
    if user.business_profile_id:
        business = db.query(BusinessProfile).filter(BusinessProfile.id == user.business_profile_id).first()
        if not business:
            raise HTTPException(status_code=404, detail="Business profile not found")
    else:
        # Create new business profile
        business = BusinessProfile(
            name=profile_data.get("name", ""),
            email=user.email
        )
        db.add(business)
        db.flush()
        user.business_profile_id = business.id
    
    # Update allowed fields only
    allowed_fields = ["name", "description", "industry", "website", "address", "city", "state", "country", "location", "phone"]
    for field in allowed_fields:
        if field in profile_data:
            setattr(business, field, profile_data[field])
    
    db.commit()
    db.refresh(business)
    return {"success": True, "business": business}


@app.get("/api/business/search")
async def search_businesses(
    query: Optional[str] = None,
    location: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db)
):
    """Search businesses by name, description, or location"""
    businesses = db.query(BusinessProfile)
    
    if query:
        businesses = businesses.filter(
            (BusinessProfile.name.ilike(f"%{query}%")) |
            (BusinessProfile.description.ilike(f"%{query}%"))
        )
    
    if location:
        businesses = businesses.filter(BusinessProfile.location.ilike(f"%{location}%"))
    
    results = businesses.offset(skip).limit(limit).all()
    return {"businesses": results, "count": len(results)}


# ==================== Jobs ====================

@app.post("/api/jobs")
async def create_job(job_data: dict, db=Depends(get_db)):
    """Create a new job posting"""
    try:
        # Validate required fields
        if not job_data.get("title"):
            raise HTTPException(status_code=400, detail="Title is required")
        if not job_data.get("business_profile_id"):
            raise HTTPException(status_code=400, detail="business_profile_id is required")
        
        # Create job with defaults
        job = Job(
            business_profile_id=job_data["business_profile_id"],
            title=job_data["title"],
            description=job_data.get("description"),
            requirements=job_data.get("requirements"),
            responsibilities=job_data.get("responsibilities"),
            employment_type=job_data.get("employment_type"),
            salary_min=job_data.get("salary_min"),
            salary_max=job_data.get("salary_max"),
            salary_currency=job_data.get("salary_currency", "USD"),
            remote_allowed=job_data.get("remote_allowed", False),
            address=job_data.get("address"),
            city=job_data.get("city"),
            state=job_data.get("state"),
            country=job_data.get("country"),
            postal_code=job_data.get("postal_code"),
            latitude=job_data.get("latitude"),
            longitude=job_data.get("longitude"),
            location=job_data.get("location"),
            required_skills=job_data.get("required_skills", []),
            preferred_skills=job_data.get("preferred_skills", []),
            experience_level=job_data.get("experience_level"),
            education_level=job_data.get("education_level"),
            status=job_data.get("status", "draft"),
            is_active=job_data.get("is_active", True),
            application_url=job_data.get("application_url"),
            application_email=job_data.get("application_email"),
            application_deadline=job_data.get("application_deadline"),
            tags=job_data.get("tags", []),
            extra_metadata=job_data.get("extra_metadata")
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        return {"success": True, "job": job}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@app.get("/api/jobs")
async def get_jobs(
    business_user_id: Optional[int] = None,
    business_profile_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db)
):
    """Get jobs with optional filtering"""
    query = db.query(Job)
    
    # Filter by business user (get business_profile_id from user)
    if business_user_id:
        user = db.query(User).filter(User.id == business_user_id).first()
        if user and user.business_profile_id:
            query = query.filter(Job.business_profile_id == user.business_profile_id)
    
    # Filter by business profile
    if business_profile_id:
        query = query.filter(Job.business_profile_id == business_profile_id)
    
    # Filter by status
    if status:
        query = query.filter(Job.status == status)
    
    # Only show active jobs
    query = query.filter(Job.is_active == True)
    
    jobs = query.offset(skip).limit(limit).all()
    return {"jobs": jobs, "count": len(jobs)}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: int, db=Depends(get_db)):
    """Get job by ID"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/jobs/public")
async def get_public_jobs(
    location: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db)
):
    """Get published jobs (public endpoint)"""
    query = db.query(Job).filter(
        Job.status == "published",
        Job.is_active == True
    )
    
    if keyword:
        query = query.filter(
            (Job.title.ilike(f"%{keyword}%")) |
            (Job.description.ilike(f"%{keyword}%"))
        )
    
    if location:
        query = query.filter(
            (Job.location.ilike(f"%{location}%")) |
            (Job.city.ilike(f"%{location}%")) |
            (Job.country.ilike(f"%{location}%"))
        )
    
    jobs = query.offset(skip).limit(limit).all()
    return {"jobs": jobs, "count": len(jobs)}


# ==================== Applications ====================

@app.post("/api/applications")
async def create_application(
    application_data: dict,
    email: str,
    db=Depends(get_db)
):
    """Create a new job application (talent only)"""
    try:
        # Get user by email
        user = get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.user_type != "talent":
            raise HTTPException(status_code=403, detail="Only talent users can apply to jobs")
        
        # Get talent profile
        if not user.talent_profile_id:
            raise HTTPException(status_code=400, detail="Talent profile not found. Please complete your profile first.")
        
        talent_profile = db.query(TalentProfile).filter(TalentProfile.id == user.talent_profile_id).first()
        if not talent_profile:
            raise HTTPException(status_code=404, detail="Talent profile not found")
        
        # Get job
        job = db.query(Job).filter(Job.id == application_data.get("job_id")).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Validate job is published
        if job.status != "published":
            raise HTTPException(status_code=400, detail="Job is not published")
        
        if not job.is_active:
            raise HTTPException(status_code=400, detail="Job is not active")
        
        # Check if application already exists
        existing = db.query(Application).filter(
            Application.job_id == job.id,
            Application.talent_profile_id == talent_profile.id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="You have already applied to this job")
        
        # Create application
        application = Application(
            job_id=job.id,
            talent_profile_id=talent_profile.id,
            status="applied",
            cover_letter=application_data.get("cover_letter"),
            notes=application_data.get("notes"),
            extra_metadata=application_data.get("extra_metadata")
        )
        
        db.add(application)
        db.commit()
        db.refresh(application)
        
        return {
            "success": True,
            "application": {
                "id": application.id,
                "job_id": application.job_id,
                "talent_profile_id": application.talent_profile_id,
                "status": application.status,
                "created_at": application.created_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create application: {str(e)}")


@app.get("/api/applications/me")
async def get_my_applications(
    email: str,
    db=Depends(get_db)
):
    """Get current user's applications (talent only)"""
    # Get user by email
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.user_type != "talent":
        raise HTTPException(status_code=403, detail="Only talent users can view applications")
    
    # Get talent profile
    if not user.talent_profile_id:
        return {"applications": [], "count": 0}
    
    # Get applications
    applications = db.query(Application).filter(
        Application.talent_profile_id == user.talent_profile_id
    ).order_by(Application.created_at.desc()).all()
    
    # Include job details
    result = []
    for app in applications:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        result.append({
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else None,
            "job_location": job.location or job.city if job else None,
            "status": app.status,
            "created_at": app.created_at,
            "updated_at": app.updated_at
        })
    
    return {"applications": result, "count": len(result)}


@app.get("/api/applications/job/{job_id}")
async def get_job_applications(
    job_id: int,
    email: str,
    db=Depends(get_db)
):
    """Get applications for a specific job (business owner only)"""
    # Get user by email
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.user_type != "business":
        raise HTTPException(status_code=403, detail="Only business users can view job applications")
    
    # Get job
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify ownership
    if not user.business_profile_id or user.business_profile_id != job.business_profile_id:
        raise HTTPException(status_code=403, detail="You don't have permission to view applications for this job")
    
    # Get applications
    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).order_by(Application.created_at.desc()).all()
    
    # Include talent profile details
    result = []
    for app in applications:
        talent = db.query(TalentProfile).filter(TalentProfile.id == app.talent_profile_id).first()
        result.append({
            "id": app.id,
            "talent_profile_id": app.talent_profile_id,
            "talent_name": talent.name if talent else None,
            "talent_email": talent.email if talent else None,
            "talent_title": talent.title if talent else None,
            "status": app.status,
            "cover_letter": app.cover_letter,
            "created_at": app.created_at,
            "updated_at": app.updated_at
        })
    
    return {"applications": result, "count": len(result)}


# ==================== Talent Profiles ====================

@app.post("/api/talent")
async def create_talent(talent_data: dict, db=Depends(get_db)):
    """Create a new talent profile"""
    try:
        talent = TalentProfile(**talent_data)
        db.add(talent)
        db.commit()
        db.refresh(talent)
        return {"success": True, "talent": talent}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/talent/{talent_id}")
async def get_talent(talent_id: int, db=Depends(get_db)):
    """Get talent profile by ID"""
    talent = db.query(TalentProfile).filter(TalentProfile.id == talent_id).first()
    if not talent:
        raise HTTPException(status_code=404, detail="Talent not found")
    return talent


@app.get("/api/talent/me")
async def get_my_talent_profile(
    email: str,
    db=Depends(get_db)
):
    """Get current user's talent profile"""
    # Get user by email
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get talent profile if exists
    if user.talent_profile_id:
        talent = db.query(TalentProfile).filter(TalentProfile.id == user.talent_profile_id).first()
        if talent:
            return talent
    
    # Return null if no profile exists
    return None


@app.put("/api/talent/me")
async def update_my_talent_profile(
    profile_data: dict,
    email: str,
    db=Depends(get_db)
):
    """Update current user's talent profile"""
    # Get user by email
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.user_type != "talent":
        raise HTTPException(status_code=403, detail="Only talent users can update talent profiles")
    
    # Get or create talent profile
    if user.talent_profile_id:
        talent = db.query(TalentProfile).filter(TalentProfile.id == user.talent_profile_id).first()
        if not talent:
            raise HTTPException(status_code=404, detail="Talent profile not found")
    else:
        # Create new talent profile
        talent = TalentProfile(
            name=profile_data.get("name", user.full_name or user.username),
            email=user.email
        )
        db.add(talent)
        db.flush()
        user.talent_profile_id = talent.id
    
    # Update allowed fields only
    allowed_fields = ["name", "title", "bio", "skills", "location", "city", "state", "country", "phone"]
    for field in allowed_fields:
        if field in profile_data:
            setattr(talent, field, profile_data[field])
    
    db.commit()
    db.refresh(talent)
    return {"success": True, "talent": talent}


@app.get("/api/talent/search")
async def search_talent(
    query: Optional[str] = None,
    skills: Optional[str] = None,
    location: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db)
):
    """Search talent by skills, location, or keywords"""
    talents = db.query(TalentProfile)
    
    if query:
        talents = talents.filter(
            (TalentProfile.name.ilike(f"%{query}%")) |
            (TalentProfile.bio.ilike(f"%{query}%"))
        )
    
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        for skill in skill_list:
            talents = talents.filter(TalentProfile.skills.contains([skill]))
    
    if location:
        talents = talents.filter(TalentProfile.location.ilike(f"%{location}%"))
    
    results = talents.offset(skip).limit(limit).all()
    return {"talents": results, "count": len(results)}


# ==================== Mapping & Routes ====================

@app.post("/api/mapping/geocode")
async def geocode_address(request: dict):
    """Geocode an address to coordinates"""
    if not mapping_service:
        raise HTTPException(status_code=503, detail="Mapping service is not available")
    try:
        address = request.get("address", "")
        if not address:
            raise HTTPException(status_code=400, detail="Address is required")
        result = await mapping_service.geocode_address(address)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mapping/route")
async def calculate_route(request: dict):
    """Calculate route between two locations"""
    if not mapping_service:
        raise HTTPException(status_code=503, detail="Mapping service is not available")
    try:
        origin = request.get("origin", "")
        destination = request.get("destination", "")
        mode = request.get("mode", "driving")
        
        if not origin or not destination:
            raise HTTPException(status_code=400, detail="Origin and destination are required")
        
        result = await mapping_service.calculate_route(origin, destination, mode)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mapping/businesses")
async def get_businesses_on_map(
    lat: float,
    lng: float,
    radius: float = 5.0,
    db=Depends(get_db)
):
    """Get businesses within radius of coordinates"""
    if not mapping_service:
        raise HTTPException(status_code=503, detail="Mapping service is not available")
    try:
        businesses = await mapping_service.get_nearby_businesses(lat, lng, radius, db)
        return {"success": True, "businesses": businesses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PDF Generation ====================

@app.post("/api/pdf/resume/{resume_id}")
async def generate_resume_pdf(resume_id: int, db=Depends(get_db)):
    """Generate PDF from resume data"""
    if not PDF_GENERATOR_AVAILABLE or not pdf_generator:
        raise HTTPException(status_code=503, detail="PDF generation service is not available")
    resume = db.query(ResumeData).filter(ResumeData.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    try:
        pdf_bytes = await pdf_generator.generate_resume_pdf(resume)
        return JSONResponse(
            content={"success": True, "pdf_base64": pdf_bytes},
            media_type="application/json"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pdf/business/{business_id}")
async def generate_business_pdf(business_id: int, db=Depends(get_db)):
    """Generate PDF profile for business"""
    if not PDF_GENERATOR_AVAILABLE or not pdf_generator:
        raise HTTPException(status_code=503, detail="PDF generation service is not available")
    business = db.query(BusinessProfile).filter(BusinessProfile.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        pdf_bytes = await pdf_generator.generate_business_pdf(business)
        return JSONResponse(
            content={"success": True, "pdf_base64": pdf_bytes},
            media_type="application/json"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    # #region agent log
    with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
        f.write(json.dumps({"location":"main.py:407","message":"Server startup configuration","data":{"host":host,"port":port,"env_host":os.getenv("HOST"),"env_port":os.getenv("PORT")},"timestamp":int(__import__('time').time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"B"})+"\n")
    # #endregion
    # #region agent log
    with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
        f.write(json.dumps({"location":"main.py:411","message":"Starting uvicorn server","data":{"host":host,"port":port},"timestamp":int(__import__('time').time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
    # #endregion
    try:
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=True
        )
    except Exception as e:
        # #region agent log
        with open(r'c:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({"location":"main.py:420","message":"Server startup failed","data":{"error":str(e),"type":type(e).__name__},"timestamp":int(__import__('time').time()*1000),"sessionId":"debug-session","runId":"run1","hypothesisId":"A"})+"\n")
        # #endregion
        raise

