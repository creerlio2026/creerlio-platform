"""
Creerlio Platform - Main Backend Entry Point
FastAPI application with AI resume parsing, business profiles, and mapping features
"""

import json
import time
import os
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request, Body, Query
from pydantic import ValidationError  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional
from dotenv import load_dotenv



from app.models import (
    BusinessProfile,
    TalentProfile,
    ResumeData,
    User,
    Job,
    Application,
    TalentBankItem,
    TalentBankItemCreate,
    TalentBankItemResponse,
)
from app.ai_service import AIService
try:
    from app.pdf_generator import PDFGenerator
    PDF_GENERATOR_AVAILABLE = True
except ImportError:
    PDF_GENERATOR_AVAILABLE = False
    PDFGenerator = None
from app.mapping_service import MappingService
from app.database import get_db, init_db
from app.supabase_client import get_supabase, get_supabase_client
from app.auth import (
    UserRegister, UserLogin, UserResponse, Token,
    create_user, authenticate_user, create_access_token,
    get_user_by_email, ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta, datetime
import uuid

# Load environment variables
load_dotenv()

# ==================== CRASH PREVENTION ====================
# Log critical environment variables (don't crash if missing)
print("🚀 Boot sequence starting")
print(f"ENV PORT: {os.getenv('PORT', 'NOT SET')}")

# Soft-fail env var warnings (NO HARD CRASHES)
def warn_missing_env(name: str):
    if not os.getenv(name):
        print(f"⚠️ Missing env: {name}")

warn_missing_env("DATABASE_URL")
warn_missing_env("SUPABASE_URL")
warn_missing_env("SUPABASE_ANON_KEY")
warn_missing_env("SUPABASE_SERVICE_ROLE_KEY")

# Initialize services with error handling


# Initialize services with error handling
ai_service = None
if AIService:
    try:
        ai_service = AIService()
        print("✓ AIService initialized")
    except Exception as e:
        print(f"⚠ Warning: AIService initialization failed: {e}")
        ai_service = None
else:
    print("⚠ AIService not available (import failed)")

pdf_generator = None
if PDF_GENERATOR_AVAILABLE and PDFGenerator:
    try:
        pdf_generator = PDFGenerator()
        print("✓ PDFGenerator initialized")
    except Exception as e:
        print(f"⚠ Warning: PDFGenerator initialization failed: {e}")
        pdf_generator = None
else:
    print("⚠ PDFGenerator not available")

mapping_service = None
if MappingService:
    try:
        mapping_service = MappingService()
        print("✓ MappingService initialized")
    except Exception as e:
        print(f"⚠ Warning: MappingService initialization failed: {e}")
        mapping_service = None
else:
    print("⚠ MappingService not available (import failed)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup on startup/shutdown - completely non-blocking"""
    print("=" * 50)
    print("Starting Creerlio Platform API")
    print("=" * 50)
    
    # Initialize database (non-blocking - won't crash app if it fails)
    try:
        init_db()
        print("✓ Database initialization completed")
    except Exception as e:
        print(f"⚠ Warning: Database initialization failed (app will continue): {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 50)
    print("Application startup complete - ready to accept requests")
    print("=" * 50)
    yield
    
    print("Application shutdown")


app = FastAPI(
    title="Creerlio Platform API",
    description="Multi-component platform for business, talent, and mapping solutions",
    version="1.0.0",
    lifespan=lifespan
)


# CORS middleware - MUST be registered BEFORE routes
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    # Handle preflight OPTIONS requests
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Max-Age": "3600",
            }
        )
    
    # For all other requests
    try:
        response = await call_next(request)
        # Only add headers if response supports it
        if hasattr(response, 'headers') and response.headers is not None:
            try:
                response.headers["Access-Control-Allow-Origin"] = "*"
                response.headers["Access-Control-Allow-Methods"] = "*"
                response.headers["Access-Control-Allow-Headers"] = "*"
            except (AttributeError, TypeError):
                # Headers can't be modified, that's okay - continue
                pass
        return response
    except Exception as e:
        # Return error with CORS headers
        from fastapi.responses import JSONResponse
        import traceback
        print(f"Error in request handler: {e}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )

# Health Check - MUST work without any dependencies
@app.get("/")
async def root():
    """Root endpoint - no dependencies"""
    return {"message": "Creerlio Platform API", "status": "healthy"}


@app.get("/health")
async def health_check():
    """Health check endpoint - completely independent, no database or services required"""
    return {
        "status": "healthy",
        "service": "creerlio-platform",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/auth/register")
async def register(request: Request, db=Depends(get_db) if get_db else None):
    """Register a new user - Password completely removed during construction"""
    
    try:
        body = await request.json()
        
    except Exception as e:
        
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    
    # Password field completely removed - create clean dict without password
    # Explicitly build dict to ensure no password field exists
    clean_body = {}
    if "email" in body:
        clean_body["email"] = body["email"]
    if "username" in body:
        clean_body["username"] = body["username"]
    if "full_name" in body and body["full_name"]:
        clean_body["full_name"] = body["full_name"]
    if "user_type" in body:
        clean_body["user_type"] = body["user_type"]
    else:
        clean_body["user_type"] = "talent"
    
    body = clean_body
    
    try:
        # Password field completely removed - create UserRegister without password
        
        try:
            # Password field completely removed - create UserRegister with only required fields
            # Build dict explicitly to avoid any password field issues
            user_data_dict = {
                "email": body.get("email"),
                "username": body.get("username"),
                "user_type": body.get("user_type", "talent")
            }
            # Only add full_name if it exists
            full_name = body.get("full_name")
            if full_name:
                user_data_dict["full_name"] = full_name
            
            # Create UserRegister - password field does not exist in model
            
            user_data = UserRegister(**user_data_dict)
            
        except ValidationError as ve:
            
            # Format Pydantic validation errors
            error_messages = []
            for error in ve.errors():
                field = ".".join(str(loc) for loc in error.get("loc", []))
                msg = error.get("msg", "Validation error")
                error_messages.append(f"{field}: {msg}")
            raise HTTPException(status_code=422, detail=", ".join(error_messages))
        
        user = create_user(db, user_data)
        # Return dict manually to avoid validation issues
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "user_type": user.user_type,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/api/auth/login")
async def login(request: Request, db=Depends(get_db)):
    """Login and get access token with email and password - BYPASS MODE: Password optional"""
    body = await request.json()
    # Password field completely removed - ignore if present
    body.pop("password", None)
    
    
    # Password field completely removed - create UserLogin without password
    
    try:
        # Password field completely removed
        credentials = UserLogin(
            email=body.get("email")
        )
    except ValidationError as ve:
        
        # Format Pydantic validation errors
        error_messages = []
        for error in ve.errors():
            field = ".".join(str(loc) for loc in error.get("loc", []))
            msg = error.get("msg", "Validation error")
            error_messages.append(f"{field}: {msg}")
        raise HTTPException(status_code=422, detail=", ".join(error_messages))
    except Exception as e:
        
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    
    user = authenticate_user(db, credentials.email)
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


@app.get("/api/auth/me")
async def get_current_user(email: Optional[str] = None, db=Depends(get_db)):
    """Get current user information - Authentication removed for manual profile building"""
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return dict manually to avoid validation issues
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "user_type": user.user_type,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


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


@app.post("/api/resume/parse")
async def parse_resume_file(
    file: UploadFile = File(...),
    user_id: Optional[str] = Query(None, description="Optional user ID for Supabase operations")
):
    """
    Parse a resume file and extract job experiences using AI.
    Returns structured data including experiences that can be selected for portfolio.
    """
    if not ai_service:
        print("[RESUME PARSE] ERROR: AI service is not available. Check OPENAI_API_KEY environment variable.")
        raise HTTPException(status_code=503, detail="AI service is not available. Please check server configuration.")
    
    try:
        # Check if file is a resume format
        filename = file.filename or "file"
        extension = os.path.splitext(filename)[1].lower()
        if extension not in [".pdf", ".doc", ".docx", ".txt", ".rtf"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {extension}. Please upload a PDF, DOC, DOCX, TXT, or RTF file."
            )
        
        print(f"[RESUME PARSE] Starting parse for {filename} (extension: {extension})")
        
        # Read file content
        file_content = await file.read()
        
        if not file_content:
            raise HTTPException(status_code=400, detail="File is empty")
        
        print(f"[RESUME PARSE] File size: {len(file_content)} bytes")
        
        # Parse resume with AI
        print(f"[RESUME PARSE] Calling AI service to parse resume...")
        parsed_data = await ai_service.parse_resume(file_content, filename)
        
        print(f"[RESUME PARSE] AI parsing completed. Keys in response: {list(parsed_data.keys())}")
        
        # Extract experiences from parsed data
        experiences = parsed_data.get("experience", [])
        
        # Log for debugging
        print(f"[RESUME PARSE] Found {len(experiences)} experiences from {filename}")
        if len(experiences) == 0:
            print(f"[RESUME PARSE] WARNING: No experiences found!")
            print(f"[RESUME PARSE] Full parsed data keys: {list(parsed_data.keys())}")
            # Log a sample of the parsed data to see what we got
            sample_data = {k: str(v)[:200] if not isinstance(v, (dict, list)) else type(v).__name__ for k, v in list(parsed_data.items())[:10]}
            print(f"[RESUME PARSE] Sample parsed data: {json.dumps(sample_data, indent=2)}")
            # Check if there's raw text we can inspect
            if "raw_data" in parsed_data and isinstance(parsed_data["raw_data"], dict):
                raw_text = parsed_data["raw_data"].get("original_text", "")
                if raw_text:
                    print(f"[RESUME PARSE] Extracted text length: {len(raw_text)} characters")
                    print(f"[RESUME PARSE] First 500 chars of extracted text: {raw_text[:500]}")
        
        # Format experiences for frontend selection
        formatted_experiences = []
        for i, exp in enumerate(experiences):
            formatted_exp = {
                "company": exp.get("company", ""),
                "title": exp.get("title", ""),
                "start_date": exp.get("start_date", ""),
                "end_date": exp.get("end_date", ""),
                "description": exp.get("description", ""),
                "achievements": exp.get("achievements", [])
            }
            formatted_experiences.append(formatted_exp)
            print(f"[RESUME PARSE] Experience {i+1}: {formatted_exp.get('title')} at {formatted_exp.get('company')}")
        
        return {
            "success": True,
            "filename": filename,
            "experiences": formatted_experiences,
            "full_data": parsed_data  # Include all parsed data for potential future use
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[RESUME PARSE] ERROR: {str(e)}")
        print(f"[RESUME PARSE] Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")


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


# ==================== AI Text Polishing ====================

@app.post("/api/ai/polish-text")
async def polish_text(request: Request):
    """Polish and format text using AI to improve grammar, spelling, and style"""
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service is not available")
    
    try:
        body = await request.json()
        text = body.get("text", "")
        
        if not text or not isinstance(text, str):
            raise HTTPException(status_code=400, detail="Text is required and must be a string")
        
        polished_text = await ai_service.polish_text(text)
        
        return {
            "success": True,
            "polished_text": polished_text
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


# IMPORTANT: /api/business/me routes must come BEFORE /api/business/{business_id} routes
# to prevent FastAPI from matching "me" as a business_id parameter
# Route order verification: This route MUST be registered before any /api/business/{business_id} routes

@app.get("/api/business/profile/me", name="get_my_business_profile")
async def get_my_business_profile(
    email: str = Query(..., description="User email address"),
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


@app.put("/api/business/profile/me", name="update_my_business_profile")
async def update_my_business_profile(
    request: Request,
    email: str = Query(..., description="User email address"),
    db=Depends(get_db)
):
    """Update current user's business profile"""
    
    # Parse request body
    try:
        profile_data = await request.json()
        
    except Exception as e:
        
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    
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


# NOTE: /api/business/{business_id} routes removed to prevent conflict with /api/business/me
# If needed, use /api/business/search or /api/business/me instead


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


@app.post("/api/init-profiles")
async def init_profiles_endpoint(db=Depends(get_db)):
    """Initialize 1 Talent and 1 Business profile for manual development"""
    try:
        from app.models import TalentProfile, BusinessProfile
        from app.auth import create_user, get_user_by_email
        from app.auth import UserRegister
        
        results = {"talent": None, "business": None}
        
        # Create Talent User
        talent_email = "talent@creerlio.local"
        talent_user = get_user_by_email(db, talent_email)
        if not talent_user:
            talent_user_data = UserRegister(
                email=talent_email,
                username="talent_user",
                full_name="John Talent",
                user_type="talent"
            )
            talent_user = create_user(db, talent_user_data)
            results["talent"] = {"user_created": True, "email": talent_email}
        else:
            results["talent"] = {"user_created": False, "email": talent_email, "message": "User already exists"}
        
        # Create Talent Profile
        talent_profile = db.query(TalentProfile).filter(TalentProfile.email == talent_email).first()
        if not talent_profile:
            talent_profile = TalentProfile(
                name="John Talent",
                email=talent_email,
                title="Software Developer",
                bio="Experienced software developer looking for opportunities",
                skills=["Python", "JavaScript", "React", "Node.js"],
                experience_years=5,
                city="Sydney",
                country="Australia",
                is_active=True
            )
            db.add(talent_profile)
            db.commit()
            db.refresh(talent_profile)
            
            # Link talent profile to user
            talent_user.talent_profile_id = talent_profile.id
            db.commit()
            results["talent"]["profile_created"] = True
            results["talent"]["profile_id"] = talent_profile.id
        else:
            results["talent"]["profile_created"] = False
            results["talent"]["profile_id"] = talent_profile.id
            results["talent"]["message"] = "Profile already exists"
        
        # Create Business User
        business_email = "business@creerlio.local"
        business_user = get_user_by_email(db, business_email)
        if not business_user:
            business_user_data = UserRegister(
                email=business_email,
                username="business_user",
                full_name="Acme Corporation",
                user_type="business"
            )
            business_user = create_user(db, business_user_data)
            results["business"] = {"user_created": True, "email": business_email}
        else:
            results["business"] = {"user_created": False, "email": business_email, "message": "User already exists"}
        
        # Create Business Profile
        business_profile = db.query(BusinessProfile).filter(BusinessProfile.email == business_email).first()
        if not business_profile:
            business_profile = BusinessProfile(
                name="Acme Corporation",
                email=business_email,
                industry="Technology",
                description="Leading technology company looking for top talent",
                website="https://acme.example.com",
                city="Sydney",
                country="Australia",
                is_active=True
            )
            db.add(business_profile)
            db.commit()
            db.refresh(business_profile)
            
            # Link business profile to user
            business_user.business_profile_id = business_profile.id
            db.commit()
            results["business"]["profile_created"] = True
            results["business"]["profile_id"] = business_profile.id
        else:
            results["business"]["profile_created"] = False
            results["business"]["profile_id"] = business_profile.id
            results["business"]["message"] = "Profile already exists"
        
        return {"success": True, "message": "Profiles initialized", "results": results}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error initializing profiles: {str(e)}")


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: int, db=Depends(get_db)):
    """Get job by ID"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ==================== Applications ====================

@app.post("/api/applications")
async def create_application(
    application_data: dict,
    email: str = Query(..., description="User email address"),
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
    email: str = Query(..., description="User email address"),
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
    email: str = Query(..., description="User email address"),
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
    email: str = Query(..., description="User email address"),
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
    email: str = Query(..., description="User email address"),
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


# ==================== Talent Bank ====================

@app.get("/api/talent-bank/items")
async def list_talent_bank_items(
    email: str = Query(..., description="User email address"),
    item_type: Optional[str] = Query(
        None, description="Optional item type filter (e.g. document, experience, education)"
    ),
    db=Depends(get_db),
):
    """
    List talent bank items for the current user.

    NOTE: Authentication is simplified for Phase 1 - user is resolved by email.
    In Supabase, RLS additionally enforces that users only see their own items.
    """
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = db.query(TalentBankItem).filter(
        TalentBankItem.user_id == user.id,
        TalentBankItem.is_active == True,  # noqa: E712
    )

    if item_type:
        query = query.filter(TalentBankItem.item_type == item_type)

    items = query.order_by(TalentBankItem.created_at.desc()).all()
    return {
        "items": [
            TalentBankItemResponse(
                id=item.id,
                user_id=item.user_id,
                item_type=item.item_type,
                title=item.title,
                description=item.description,
                file_url=item.file_url,
                file_path=item.file_path,
                file_type=item.file_type,
                file_size=item.file_size,
                metadata=getattr(item, "extra_metadata", None),
                is_active=item.is_active,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
            for item in items
        ],
        "count": len(items),
    }


@app.post("/api/talent-bank/items")
async def create_talent_bank_item(
    payload: TalentBankItemCreate,
    email: str = Query(..., description="User email address"),
    db=Depends(get_db),
):
    """
    Create a structured (non-file) talent bank item.

    Use this for Experience, Education, Credentials, and other metadata-only records.
    """
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        item = TalentBankItem(
            user_id=user.id,
            item_type=payload.item_type,
            title=payload.title,
            description=payload.description,
            extra_metadata=payload.metadata or {},
            is_active=True,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return TalentBankItemResponse(
            id=item.id,
            user_id=item.user_id,
            item_type=item.item_type,
            title=item.title,
            description=item.description,
            file_url=item.file_url,
            file_path=item.file_path,
            file_type=item.file_type,
            file_size=item.file_size,
            metadata=getattr(item, "extra_metadata", None),
            is_active=item.is_active,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create talent bank item: {str(e)}")


@app.post("/api/talent-bank/upload")
async def upload_talent_bank_files(
    email: str = Query(..., description="User email address"),
    files: List[UploadFile] = File(...),
    db=Depends(get_db),
):
    """
    Upload one or more files into the Talent Bank.

    Files are stored in Supabase Storage bucket:
      talent-bank/{user_id}/<timestamp>_<filename>

    Each uploaded file creates a corresponding TalentBankItem record.
    """
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    supabase = get_supabase()
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.",
        )

    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    created_items: List[TalentBankItemResponse] = []
    bucket_name = "talent-bank"

    for file in files:
        try:
            content = await file.read()
            if not content:
                continue

            # Basic type detection
            content_type = file.content_type or "application/octet-stream"
            filename = file.filename or "file"
            extension = os.path.splitext(filename)[1].lower()

            if content_type.startswith("image/"):
                item_type = "image"
            elif content_type.startswith("video/"):
                item_type = "video"
            elif extension in [".pdf", ".doc", ".docx", ".txt", ".rtf"]:
                item_type = "document"
            else:
                item_type = "file"

            # Storage path: talent-bank/{user_id}/<ts>_<filename>
            timestamp = int(time.time() * 1000)
            path = f"{user.id}/{timestamp}_{filename}"

            # Upload to Supabase Storage
            storage = supabase.storage.from_(bucket_name)
            upload_res = storage.upload(path, content)
            if getattr(upload_res, "error", None):
                raise Exception(str(upload_res.error))

            # Public URL (if bucket is public) – adjust as needed
            public_url = storage.get_public_url(path)

            item = TalentBankItem(
                user_id=user.id,
                item_type=item_type,
                title=filename,
                description=None,
                file_url=public_url,
                file_path=path,
                file_type=content_type,
                file_size=len(content),
                extra_metadata={"originalName": filename},
                is_active=True,
            )
            db.add(item)
            db.commit()
            db.refresh(item)
            created_items.append(
                TalentBankItemResponse(
                    id=item.id,
                    user_id=item.user_id,
                    item_type=item.item_type,
                    title=item.title,
                    description=item.description,
                    file_url=item.file_url,
                    file_path=item.file_path,
                    file_type=item.file_type,
                    file_size=item.file_size,
                    metadata=getattr(item, "extra_metadata", None),
                    is_active=item.is_active,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                )
            )
        except Exception as e:
            db.rollback()
            
            raise HTTPException(status_code=500, detail=f"Failed to upload file '{file.filename}': {str(e)}")

    return {"items": created_items, "count": len(created_items)}


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


# ==================== Account Deletion ====================

@app.delete("/api/auth/delete-account")
async def delete_account(request: Request):
    """
    Delete user account - removes auth user and all associated data from Supabase
    Requires authenticated session with user ID in request
    """
    try:
        # Get user ID from request body
        body = await request.json()
        user_id = body.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        # Get Supabase admin client (requires SERVICE_ROLE_KEY)
        supabase_admin = get_supabase_client(use_service_key=True)
        if not supabase_admin:
            raise HTTPException(status_code=503, detail="Admin service not available. SUPABASE_SERVICE_ROLE_KEY may not be configured.")
        
        # Delete all related data from Supabase tables using admin client (bypasses RLS)
        deletion_errors = []
        
        # Get profile IDs first (needed for conversations and other relationships)
        talent_profile_id = None
        business_profile_id = None
        
        try:
            table = supabase_admin.table('talent_profiles')
            talent_profile_res = table.select('id').eq('user_id', user_id).maybe_single().execute()
            if talent_profile_res.data:
                talent_profile_id = talent_profile_res.data['id']
        except Exception as e:
            deletion_errors.append(f"Error fetching talent profile ID: {str(e)}")
        
        try:
            table = supabase_admin.table('business_profiles')
            business_profile_res = table.select('id').eq('user_id', user_id).maybe_single().execute()
            if business_profile_res.data:
                business_profile_id = business_profile_res.data['id']
        except Exception as e:
            deletion_errors.append(f"Error fetching business profile ID: {str(e)}")
        
        try:
            # Delete talent_bank_items
            supabase_admin.table('talent_bank_items').delete().eq('user_id', user_id).execute()
        except Exception as e:
            deletion_errors.append(f"talent_bank_items: {str(e)}")
        
        try:
            # Delete talent_connection_requests (using profile ID if available, otherwise user_id)
            table = supabase_admin.table('talent_connection_requests')
            if talent_profile_id:
                table.delete().eq('talent_id', talent_profile_id).execute()
            else:
                # Fallback to user_id if profile doesn't exist
                table.delete().eq('talent_id', user_id).execute()
        except Exception as e:
            deletion_errors.append(f"talent_connection_requests: {str(e)}")
        
        try:
            # Delete talent_export_consent_requests (using profile ID if available, otherwise user_id)
            table = supabase_admin.table('talent_export_consent_requests')
            if talent_profile_id:
                table.delete().eq('talent_id', talent_profile_id).execute()
            else:
                # Fallback to user_id if profile doesn't exist
                table.delete().eq('talent_id', user_id).execute()
        except Exception as e:
            deletion_errors.append(f"talent_export_consent_requests: {str(e)}")
        
        try:
            # Delete conversations (using profile IDs)
            conv_table = supabase_admin.table('conversations')
            if talent_profile_id:
                conv_table.delete().eq('talent_id', talent_profile_id).execute()
            if business_profile_id:
                conv_table.delete().eq('business_id', business_profile_id).execute()
        except Exception as e:
            deletion_errors.append(f"conversations: {str(e)}")
        
        try:
            # Delete messages sent by user
            supabase_admin.table('messages').delete().eq('sender_user_id', user_id).execute()
        except Exception as e:
            deletion_errors.append(f"messages: {str(e)}")
        
        try:
            # Delete business_profile_pages (using business profile ID)
            if business_profile_id:
                supabase_admin.table('business_profile_pages').delete().eq('business_id', business_profile_id).execute()
        except Exception as e:
            deletion_errors.append(f"business_profile_pages: {str(e)}")
        
        try:
            # Delete talent profile
            supabase_admin.table('talent_profiles').delete().eq('user_id', user_id).execute()
        except Exception as e:
            deletion_errors.append(f"talent_profiles: {str(e)}")
        
        try:
            # Delete business profile
            supabase_admin.table('business_profiles').delete().eq('user_id', user_id).execute()
        except Exception as e:
            deletion_errors.append(f"business_profiles: {str(e)}")
        
        # Finally, delete user from Supabase Auth using Admin API
        auth_deleted = False
        try:
            # Python Supabase client uses auth.admin.delete_user(user_id)
            response = supabase_admin.auth.admin.delete_user(user_id)
            # Check if there's an error in the response
            if hasattr(response, 'error') and response.error:
                raise Exception(f"Supabase error: {response.error}")
            auth_deleted = True
            
            # Verify deletion by attempting to get the user (should fail if deleted)
            try:
                verify_response = supabase_admin.auth.admin.get_user_by_id(user_id)
                if verify_response and hasattr(verify_response, 'user') and verify_response.user:
                    # User still exists - deletion may have failed
                    raise Exception("User still exists after deletion attempt")
            except Exception as verify_error:
                error_msg = str(verify_error).lower()
                # If error is "user not found" or similar, deletion was successful
                if "not found" in error_msg or "does not exist" in error_msg:
                    auth_deleted = True
                else:
                    # Other errors might indicate deletion failed
                    print(f"Warning: Could not verify user deletion: {verify_error}")
                    # Don't fail - assume deletion succeeded if no error was raised
            
        except Exception as auth_error:
            error_msg = str(auth_error)
            print(f"Error deleting auth user {user_id}: {error_msg}")
            deletion_errors.append(f"auth user: {error_msg}")
            # Re-raise if it's a critical error
            if "not available" in error_msg.lower() or "service" in error_msg.lower():
                raise HTTPException(status_code=503, detail=f"Auth deletion service error: {error_msg}")
        
        # Return success even if some deletions failed (as long as auth user was deleted)
        if auth_deleted:
            return {
                "success": True,
                "message": "Account deleted successfully. User cannot log in again.",
                "warnings": deletion_errors if deletion_errors else None
            }
        else:
            raise HTTPException(status_code=500, detail=f"Failed to delete auth user. The account still exists and can be logged into. Errors: {', '.join(deletion_errors)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")


# NOTE: This block is for local development only
# Railway uses start.py as the entry point (single source of truth)
# DO NOT use this in production - Railway will use start.py
if __name__ == "__main__":
    # Local dev only - Railway uses start.py
    PORT = int(os.getenv("PORT", "8000"))
    HOST = "0.0.0.0"
    print(f"⚠️  Local dev mode - Railway uses start.py")
    print(f"✅ Server listening on {PORT}")
    uvicorn.run(app, host=HOST, port=PORT, reload=False)


# ==================== Admin Panel API ====================

def check_admin_access(user_id: str) -> bool:
    """
    Check if user has admin access
    Admin users are identified by email domain or explicit admin flag in metadata
    """
    if not user_id:
        return False
    
    supabase = get_supabase_client(use_service_key=True)
    if not supabase:
        return False
    
    try:
        # Get user from auth
        user_res = supabase.auth.admin.get_user_by_id(user_id)
        if not user_res or not hasattr(user_res, 'user') or not user_res.user:
            return False
        
        user = user_res.user
        user_metadata = user.user_metadata or {}
        
        # Check for admin flag in metadata
        if user_metadata.get('is_admin') is True or user_metadata.get('admin') is True:
            return True
        
        # Check for admin email domain (configurable via env)
        admin_domains = os.getenv("ADMIN_EMAIL_DOMAINS", "").split(",")
        admin_domains = [d.strip().lower() for d in admin_domains if d.strip()]
        
        if user.email:
            email_domain = user.email.split("@")[-1].lower()
            if email_domain in admin_domains:
                return True
        
        # Check for specific admin emails
        admin_emails = os.getenv("ADMIN_EMAILS", "").split(",")
        admin_emails = [e.strip().lower() for e in admin_emails if e.strip()]
        if user.email and user.email.lower() in admin_emails:
            return True
        
        return False
    except Exception as e:
        print(f"Error checking admin access: {e}")
        return False


@app.post("/api/admin/stats")
async def get_admin_stats(request: Request):
    """Get platform statistics for admin dashboard"""
    try:
        body = await request.json()
        user_id = body.get("user_id") or request.headers.get("X-User-Id")
        
        if not user_id or not check_admin_access(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        supabase_admin = get_supabase_client(use_service_key=True)
        if not supabase_admin:
            raise HTTPException(status_code=503, detail="Admin service not available")
        
        # Get counts
        talent_count = supabase_admin.table('talent_profiles').select('id', count='exact').execute()
        business_count = supabase_admin.table('business_profiles').select('id', count='exact').execute()
        
        # Get auth users count
        try:
            # Note: Supabase Python client doesn't have direct user count, so we'll estimate
            # by counting profiles
            total_users = (talent_count.count or 0) + (business_count.count or 0)
        except:
            total_users = 0
        
        # Get recent registrations (last 7 days)
        from datetime import datetime, timedelta
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        
        recent_talent = supabase_admin.table('talent_profiles').select('id', count='exact').gte('created_at', week_ago).execute()
        recent_business = supabase_admin.table('business_profiles').select('id', count='exact').gte('created_at', week_ago).execute()
        
        return {
            "total_talent": talent_count.count or 0,
            "total_business": business_count.count or 0,
            "total_users": total_users,
            "recent_talent_7d": recent_talent.count or 0,
            "recent_business_7d": recent_business.count or 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.post("/api/admin/talent")
async def get_admin_talent(request: Request):
    """Get all talent registrations (admin only)"""
    try:
        body = await request.json()
        user_id = body.get("user_id") or request.headers.get("X-User-Id")
        skip = body.get("skip", 0)
        limit = body.get("limit", 50)
        search = body.get("search")
        if not user_id or not check_admin_access(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        supabase_admin = get_supabase_client(use_service_key=True)
        if not supabase_admin:
            raise HTTPException(status_code=503, detail="Admin service not available")
        
        # Get all talent profiles first
        all_result = supabase_admin.table('talent_profiles').select('*').execute()
        
        # Filter by search if provided
        filtered_data = all_result.data or []
        if search:
            search_lower = search.lower()
            filtered_data = [
                item for item in filtered_data
                if (str(item.get('name', '')).lower().find(search_lower) >= 0 or
                    str(item.get('email', '')).lower().find(search_lower) >= 0)
            ]
        
        # Sort by created_at descending (newest first)
        try:
            filtered_data.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        except:
            pass
        
        # Apply pagination
        total_count = len(filtered_data)
        paginated_data = filtered_data[skip:skip + limit]
        
        return {
            "data": paginated_data,
            "count": total_count,
            "skip": skip,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_admin_talent: {error_details}")
        raise HTTPException(status_code=500, detail=f"Failed to get talent: {str(e)}")


@app.post("/api/admin/business")
async def get_admin_business(request: Request):
    """Get all business registrations (admin only)"""
    try:
        body = await request.json()
        user_id = body.get("user_id") or request.headers.get("X-User-Id")
        skip = body.get("skip", 0)
        limit = body.get("limit", 50)
        search = body.get("search")
        if not user_id or not check_admin_access(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        supabase_admin = get_supabase_client(use_service_key=True)
        if not supabase_admin:
            raise HTTPException(status_code=503, detail="Admin service not available")
        
        # Get all business profiles first
        all_result = supabase_admin.table('business_profiles').select('*').execute()
        
        # Filter by search if provided
        filtered_data = all_result.data or []
        if search:
            search_lower = search.lower()
            filtered_data = [
                item for item in filtered_data
                if (str(item.get('name', '')).lower().find(search_lower) >= 0 or
                    str(item.get('email', '')).lower().find(search_lower) >= 0)
            ]
        
        # Sort by created_at descending (newest first)
        try:
            filtered_data.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        except:
            pass
        
        # Apply pagination
        total_count = len(filtered_data)
        paginated_data = filtered_data[skip:skip + limit]
        
        return {
            "data": paginated_data,
            "count": total_count,
            "skip": skip,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_admin_business: {error_details}")
        raise HTTPException(status_code=500, detail=f"Failed to get business: {str(e)}")


@app.post("/api/admin/users")
async def get_admin_users(request: Request):
    """Get all users (admin only)"""
    try:
        body = await request.json()
        user_id = body.get("user_id") or request.headers.get("X-User-Id")
        skip = body.get("skip", 0)
        limit = body.get("limit", 50)
        search = body.get("search")
        if not user_id or not check_admin_access(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        supabase_admin = get_supabase_client(use_service_key=True)
        if not supabase_admin:
            raise HTTPException(status_code=503, detail="Admin service not available")
        
        # Get users from profiles (aggregate from talent and business profiles)
        try:
            talent_profiles = supabase_admin.table('talent_profiles').select('user_id, name, email, created_at, is_active').execute()
        except Exception as e:
            print(f"Error fetching talent profiles: {e}")
            talent_profiles = type('obj', (object,), {'data': []})()
        
        try:
            business_profiles = supabase_admin.table('business_profiles').select('user_id, name, email, created_at, is_active').execute()
        except Exception as e:
            print(f"Error fetching business profiles: {e}")
            business_profiles = type('obj', (object,), {'data': []})()
        
        users = []
        seen_user_ids = set()
        
        for tp in (talent_profiles.data or []):
            if tp.get('user_id') and tp['user_id'] not in seen_user_ids:
                users.append({
                    "user_id": tp['user_id'],
                    "name": tp.get('name'),
                    "email": tp.get('email'),
                    "type": "talent",
                    "created_at": tp.get('created_at'),
                    "is_active": tp.get('is_active', True)
                })
                seen_user_ids.add(tp['user_id'])
        
        for bp in (business_profiles.data or []):
            if bp.get('user_id') and bp['user_id'] not in seen_user_ids:
                users.append({
                    "user_id": bp['user_id'],
                    "name": bp.get('name'),
                    "email": bp.get('email'),
                    "type": "business",
                    "created_at": bp.get('created_at'),
                    "is_active": bp.get('is_active', True)
                })
                seen_user_ids.add(bp['user_id'])
        
        # Sort by created_at descending
        try:
            users.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        except:
            pass
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            users = [
                u for u in users
                if (str(u.get('name', '')).lower().find(search_lower) >= 0 or
                    str(u.get('email', '')).lower().find(search_lower) >= 0)
            ]
        
        # Apply pagination
        total_count = len(users)
        paginated_users = users[skip:skip + limit]
        
        return {
            "data": paginated_users,
            "count": total_count,
            "skip": skip,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_admin_users: {error_details}")
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")


@app.post("/api/admin/talent/{talent_id}/activate")
async def activate_talent(talent_id: str, request: Request):
    """Activate/deactivate talent profile (admin only)"""
    try:
        user_id = request.headers.get("X-User-Id") or (await request.json()).get("user_id")
        if not user_id or not check_admin_access(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        supabase_admin = get_supabase_client(use_service_key=True)
        if not supabase_admin:
            raise HTTPException(status_code=503, detail="Admin service not available")
        
        body = await request.json()
        is_active = body.get("is_active", True)
        
        result = supabase_admin.table('talent_profiles').update({"is_active": is_active}).eq('id', talent_id).execute()
        
        return {"success": True, "data": result.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update talent: {str(e)}")


@app.post("/api/admin/business/{business_id}/activate")
async def activate_business(business_id: str, request: Request):
    """Activate/deactivate business profile (admin only)"""
    try:
        user_id = request.headers.get("X-User-Id") or (await request.json()).get("user_id")
        if not user_id or not check_admin_access(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        supabase_admin = get_supabase_client(use_service_key=True)
        if not supabase_admin:
            raise HTTPException(status_code=503, detail="Admin service not available")
        
        body = await request.json()
        is_active = body.get("is_active", True)
        
        result = supabase_admin.table('business_profiles').update({"is_active": is_active}).eq('id', business_id).execute()
        
        return {"success": True, "data": result.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update business: {str(e)}")


@app.delete("/api/admin/user/{user_id}")
async def delete_user_admin(user_id: str, request: Request):
    """Delete user account (admin only)"""
    try:
        admin_user_id = request.headers.get("X-User-Id") or (await request.json()).get("admin_user_id")
        if not admin_user_id or not check_admin_access(admin_user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Reuse the existing delete_account logic
        from fastapi import Request as Req
        fake_request = Req({"type": "http"})
        fake_request._json = {"user_id": user_id}
        
        # Call the existing delete endpoint logic
        supabase_admin = get_supabase_client(use_service_key=True)
        if not supabase_admin:
            raise HTTPException(status_code=503, detail="Admin service not available")
        
        # Get profile IDs
        talent_profile_id = None
        business_profile_id = None
        
        try:
            talent_profile_res = supabase_admin.table('talent_profiles').select('id').eq('user_id', user_id).maybe_single().execute()
            if talent_profile_res.data:
                talent_profile_id = talent_profile_res.data['id']
        except:
            pass
        
        try:
            business_profile_res = supabase_admin.table('business_profiles').select('id').eq('user_id', user_id).maybe_single().execute()
            if business_profile_res.data:
                business_profile_id = business_profile_res.data['id']
        except:
            pass
        
        # Delete related data
        deletion_errors = []
        tables_to_clear = ["talent_bank_items", "messages"]
        for table_name in tables_to_clear:
            try:
                supabase_admin.table(table_name).delete().eq('user_id', user_id).execute()
            except Exception as e:
                deletion_errors.append(f"Error deleting from {table_name}: {str(e)}")
        
        if talent_profile_id:
            try:
                supabase_admin.table('talent_connection_requests').delete().eq('talent_id', talent_profile_id).execute()
            except:
                pass
        
        if business_profile_id:
            try:
                supabase_admin.table('business_profile_pages').delete().eq('business_id', business_profile_id).execute()
            except:
                pass
        
        # Delete profiles
        try:
            supabase_admin.table('talent_profiles').delete().eq('user_id', user_id).execute()
        except Exception as e:
            deletion_errors.append(f"talent_profiles: {str(e)}")
        
        try:
            supabase_admin.table('business_profiles').delete().eq('user_id', user_id).execute()
        except Exception as e:
            deletion_errors.append(f"business_profiles: {str(e)}")
        
        # Delete auth user
        try:
            supabase_admin.auth.admin.delete_user(user_id)
        except Exception as e:
            deletion_errors.append(f"auth user: {str(e)}")
        
        return {
            "success": True,
            "message": "User deleted successfully",
            "warnings": deletion_errors if deletion_errors else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


# ==================== Video Chat System ====================

@app.post("/api/video-chat/initiate")
async def initiate_video_chat(
    connection_request_id: str = Query(..., description="Connection request ID"),
    initiated_by: str = Query(..., description="'talent' or 'business'"),
    email: str = Query(..., description="User email address"),
    recording_enabled: bool = Query(False, description="Enable recording")
):
    """Initiate a video chat session between connected talent and business"""
    try:
        supabase = get_supabase()
        
        # Get user info
        user = get_user_by_email(None, email)  # db not needed for this check
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = str(user.id) if hasattr(user, 'id') else email
        
        # Verify connection request exists and is accepted
        conn_res = supabase.table('talent_connection_requests').select('*').eq('id', connection_request_id).eq('status', 'accepted').single().execute()
        
        if not conn_res.data:
            raise HTTPException(status_code=404, detail="Connection request not found or not accepted")
        
        conn_data = conn_res.data
        talent_id = conn_data['talent_id']
        business_id = conn_data['business_id']
        
        # Verify user has permission (must be part of this connection)
        talent_check = supabase.table('talent_profiles').select('user_id').eq('id', talent_id).single().execute()
        business_check = supabase.table('business_profiles').select('user_id').eq('id', business_id).single().execute()
        
        talent_user_id = talent_check.data.get('user_id') if talent_check.data else None
        business_user_id = business_check.data.get('user_id') if business_check.data else None
        
        # For now, we'll use email as user_id check (adjust based on your auth system)
        if initiated_by == 'talent' and talent_user_id != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to initiate this video chat")
        if initiated_by == 'business' and business_user_id != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to initiate this video chat")
        
        # Generate room ID and token (for now, simple UUID - replace with Agora/Twilio token generation)
        room_id = str(uuid.uuid4())
        room_token = str(uuid.uuid4())  # Replace with actual WebRTC service token
        
        # Create video chat session
        session_data = {
            'talent_id': talent_id,
            'business_id': business_id,
            'connection_request_id': connection_request_id,
            'status': 'pending',
            'initiated_by': initiated_by,
            'initiated_by_user_id': user_id,
            'recording_enabled': recording_enabled,
            'room_id': room_id,
            'room_token': room_token,
            'started_at': None,
            'ended_at': None
        }
        
        session_res = supabase.table('video_chat_sessions').insert(session_data).select().single().execute()
        
        if session_res.error:
            raise HTTPException(status_code=500, detail=f"Failed to create video chat session: {session_res.error}")
        
        return {
            "success": True,
            "session_id": session_res.data['id'],
            "room_id": room_id,
            "room_token": room_token,
            "session": session_res.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to initiate video chat: {str(e)}")


@app.post("/api/video-chat/{session_id}/start")
async def start_video_chat_session(
    session_id: str,
    email: str = Query(..., description="User email address")
):
    """Start an active video chat session"""
    try:
        supabase = get_supabase()
        
        # Get session
        session_res = supabase.table('video_chat_sessions').select('*').eq('id', session_id).single().execute()
        
        if not session_res.data:
            raise HTTPException(status_code=404, detail="Video chat session not found")
        
        session = session_res.data
        
        # Update session to active
        update_res = supabase.table('video_chat_sessions').update({
            'status': 'active',
            'started_at': datetime.utcnow().isoformat()
        }).eq('id', session_id).select().single().execute()
        
        if update_res.error:
            raise HTTPException(status_code=500, detail=f"Failed to start session: {update_res.error}")
        
        return {
            "success": True,
            "session": update_res.data,
            "room_id": session['room_id'],
            "room_token": session['room_token']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start video chat: {str(e)}")


@app.post("/api/video-chat/{session_id}/end")
async def end_video_chat_session(
    session_id: str,
    email: str = Query(..., description="User email address"),
    duration_seconds: Optional[int] = Query(None, description="Call duration in seconds")
):
    """End a video chat session"""
    try:
        supabase = get_supabase()
        
        # Get session
        session_res = supabase.table('video_chat_sessions').select('*').eq('id', session_id).single().execute()
        
        if not session_res.data:
            raise HTTPException(status_code=404, detail="Video chat session not found")
        
        session = session_res.data
        
        # Calculate duration if not provided
        if duration_seconds is None and session.get('started_at'):
            started = datetime.fromisoformat(session['started_at'].replace('Z', '+00:00'))
            duration_seconds = int((datetime.utcnow() - started.replace(tzinfo=None)).total_seconds())
        
        # Update session to ended
        update_data = {
            'status': 'ended',
            'ended_at': datetime.utcnow().isoformat(),
            'duration_seconds': duration_seconds or 0
        }
        
        update_res = supabase.table('video_chat_sessions').update(update_data).eq('id', session_id).select().single().execute()
        
        if update_res.error:
            raise HTTPException(status_code=500, detail=f"Failed to end session: {update_res.error}")
        
        return {
            "success": True,
            "session": update_res.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end video chat: {str(e)}")


@app.post("/api/video-chat/{session_id}/recording/start")
async def start_recording(
    session_id: str,
    email: str = Query(..., description="User email address")
):
    """Start recording a video chat session"""
    try:
        supabase = get_supabase()
        
        # Verify session exists and is active
        session_res = supabase.table('video_chat_sessions').select('*').eq('id', session_id).eq('status', 'active').single().execute()
        
        if not session_res.data:
            raise HTTPException(status_code=404, detail="Active video chat session not found")
        
        session = session_res.data
        
        if not session.get('recording_enabled'):
            raise HTTPException(status_code=400, detail="Recording is not enabled for this session")
        
        # Update session with recording started
        update_res = supabase.table('video_chat_sessions').update({
            'recording_started_at': datetime.utcnow().isoformat()
        }).eq('id', session_id).select().single().execute()
        
        return {
            "success": True,
            "session": update_res.data,
            "message": "Recording started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start recording: {str(e)}")


@app.post("/api/video-chat/{session_id}/recording/stop")
async def stop_recording(
    session_id: str,
    storage_path: str = Query(..., description="Path to recording in storage"),
    transcription_text: Optional[str] = Query(None, description="Transcription text if available"),
    email: str = Query(..., description="User email address")
):
    """Stop recording and save recording metadata"""
    try:
        supabase = get_supabase()
        
        # Verify session exists
        session_res = supabase.table('video_chat_sessions').select('*').eq('id', session_id).single().execute()
        
        if not session_res.data:
            raise HTTPException(status_code=404, detail="Video chat session not found")
        
        session = session_res.data
        
        # Create recording record
        recording_data = {
            'session_id': session_id,
            'recording_type': 'full',
            'storage_path': storage_path,
            'transcription_text': transcription_text,
            'processing_status': 'pending' if transcription_text else 'processing'
        }
        
        recording_res = supabase.table('video_recordings').insert(recording_data).select().single().execute()
        
        if recording_res.error:
            raise HTTPException(status_code=500, detail=f"Failed to save recording: {recording_res.error}")
        
        # If transcription is available, generate summary automatically
        summary_id = None
        if transcription_text and ai_service:
            try:
                # Get context for summarization
                talent_id = session['talent_id']
                business_id = session['business_id']
                
                talent_res = supabase.table('talent_profiles').select('name').eq('id', talent_id).single().execute()
                business_res = supabase.table('business_profiles').select('business_name, name').eq('id', business_id).single().execute()
                
                context = {
                    'talent_name': talent_res.data.get('name') if talent_res.data else None,
                    'business_name': business_res.data.get('business_name') or business_res.data.get('name') if business_res.data else None
                }
                
                # Generate summary
                summary_result = await ai_service.summarize_conversation(transcription_text, context)
                
                # Save summary
                summary_data = {
                    'session_id': session_id,
                    'recording_id': recording_res.data['id'],
                    'summary_type': 'ai_generated',
                    'summary_text': summary_result['summary'],
                    'key_points': summary_result['key_points'],
                    'action_items': summary_result['action_items'],
                    'sentiment': summary_result['sentiment'],
                    'ai_model_used': summary_result.get('ai_model_used', 'gpt-4-turbo-preview'),
                    'processing_status': 'completed'
                }
                
                summary_res = supabase.table('conversation_summaries').insert(summary_data).select().single().execute()
                summary_id = summary_res.data['id'] if summary_res.data else None
                
            except Exception as summary_error:
                print(f"[VIDEO_CHAT] Error generating summary: {str(summary_error)}")
                # Continue without summary - it can be generated later
        
        return {
            "success": True,
            "recording": recording_res.data,
            "summary_id": summary_id,
            "message": "Recording stopped and saved"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to stop recording: {str(e)}")


@app.get("/api/video-chat/{session_id}/summary")
async def get_conversation_summary(
    session_id: str,
    email: str = Query(..., description="User email address")
):
    """Get conversation summary for a video chat session"""
    try:
        supabase = get_supabase()
        
        # Get summary
        summary_res = supabase.table('conversation_summaries').select('*').eq('session_id', session_id).order('created_at', desc=True).limit(1).single().execute()
        
        if not summary_res.data:
            raise HTTPException(status_code=404, detail="Conversation summary not found")
        
        return {
            "success": True,
            "summary": summary_res.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")


@app.post("/api/video-chat/{session_id}/generate-summary")
async def generate_conversation_summary(
    session_id: str,
    email: str = Query(..., description="User email address")
):
    """Generate AI summary for a video chat session (requires recording with transcription)"""
    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI service is not available")
        
        supabase = get_supabase()
        
        # Get session and recording
        session_res = supabase.table('video_chat_sessions').select('*').eq('id', session_id).single().execute()
        
        if not session_res.data:
            raise HTTPException(status_code=404, detail="Video chat session not found")
        
        session = session_res.data
        
        # Get recording with transcription
        recording_res = supabase.table('video_recordings').select('*').eq('session_id', session_id).eq('processing_status', 'completed').order('created_at', desc=True).limit(1).single().execute()
        
        if not recording_res.data or not recording_res.data.get('transcription_text'):
            raise HTTPException(status_code=404, detail="Recording with transcription not found")
        
        recording = recording_res.data
        transcription_text = recording['transcription_text']
        
        # Get context for summarization
        talent_id = session['talent_id']
        business_id = session['business_id']
        
        talent_res = supabase.table('talent_profiles').select('name').eq('id', talent_id).single().execute()
        business_res = supabase.table('business_profiles').select('business_name, name').eq('id', business_id).single().execute()
        
        context = {
            'talent_name': talent_res.data.get('name') if talent_res.data else None,
            'business_name': business_res.data.get('business_name') or business_res.data.get('name') if business_res.data else None
        }
        
        # Generate summary
        summary_result = await ai_service.summarize_conversation(transcription_text, context)
        
        # Save summary
        summary_data = {
            'session_id': session_id,
            'recording_id': recording['id'],
            'summary_type': 'ai_generated',
            'summary_text': summary_result['summary'],
            'key_points': summary_result['key_points'],
            'action_items': summary_result['action_items'],
            'sentiment': summary_result['sentiment'],
            'ai_model_used': summary_result.get('ai_model_used', 'gpt-4-turbo-preview'),
            'processing_status': 'completed',
            'processed_at': datetime.utcnow().isoformat()
        }
        
        summary_res = supabase.table('conversation_summaries').insert(summary_data).select().single().execute()
        
        if summary_res.error:
            raise HTTPException(status_code=500, detail=f"Failed to save summary: {summary_res.error}")
        
        return {
            "success": True,
            "summary": summary_res.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

