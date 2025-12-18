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

from app.models import BusinessProfile, TalentProfile, ResumeData, User, Job
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
    """Register a new user (passwordless)"""
    body = await request.json()
    try:
        # Create UserRegister model, ensuring password is None if not provided
        user_data = UserRegister(
            email=body.get("email"),
            username=body.get("username"),
            password=body.get("password"),  # Will be None if not provided
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
    """Login and get access token with user info (passwordless - email only)"""
    # Create UserLogin model from request body (password optional - never required)
    # Only include password in model if it's actually provided
    login_data = {"email": body.get("email")}
    if "password" in body and body.get("password") is not None:
        login_data["password"] = body.get("password")
    
    try:
        credentials = UserLogin(**login_data)
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

