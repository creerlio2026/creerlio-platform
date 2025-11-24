"""Main FastAPI application for the resume builder."""
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from models import Resume, EnhancementRequest
from ai_service import AIService
from pdf_generator import PDFGenerator
import json
import os

app = FastAPI(
    title="Creerlio Resume Builder",
    description="AI-powered resume building platform",
    version="1.0.0"
)

# Configure CORS
# TODO: In production, replace ["*"] with specific trusted domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_service = AIService()
pdf_generator = PDFGenerator()

# In-memory storage (in production, use a database)
resumes_storage = {}
resume_counter = 0


@app.get("/")
async def root():
    """Root endpoint - redirects to the resume builder interface."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/static/index.html")


@app.post("/api/resumes")
async def create_resume(resume: Resume):
    """
    Create a new resume.
    
    Args:
        resume: Resume data
    
    Returns:
        Created resume with ID
    """
    global resume_counter
    resume_counter += 1
    resume_id = f"resume_{resume_counter}"
    
    resumes_storage[resume_id] = resume.model_dump()
    
    return {
        "id": resume_id,
        "resume": resume,
        "message": "Resume created successfully"
    }


@app.get("/api/resumes/{resume_id}")
async def get_resume(resume_id: str):
    """
    Get a resume by ID.
    
    Args:
        resume_id: Resume identifier
    
    Returns:
        Resume data
    """
    if resume_id not in resumes_storage:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {
        "id": resume_id,
        "resume": resumes_storage[resume_id]
    }


@app.get("/api/resumes/{resume_id}/export")
async def export_resume_pdf(resume_id: str):
    """
    Export a resume as PDF.
    
    Args:
        resume_id: Resume identifier
    
    Returns:
        PDF file
    """
    if resume_id not in resumes_storage:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    resume_data = resumes_storage[resume_id]
    resume = Resume(**resume_data)
    
    try:
        pdf_bytes = pdf_generator.generate_resume_pdf(resume)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={resume_id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")


@app.post("/api/enhance")
async def enhance_text(request: EnhancementRequest):
    """
    Enhance text using AI.
    
    Args:
        request: Text to enhance with optional context
    
    Returns:
        Enhanced text
    """
    try:
        enhanced = ai_service.enhance_description(request.text, request.context or "")
        return {
            "original": request.text,
            "enhanced": enhanced
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing text: {str(e)}")


@app.post("/api/suggest-skills")
async def suggest_skills(resume: Resume):
    """
    Suggest skills based on experience and education.
    
    Args:
        resume: Resume data with experiences and education
    
    Returns:
        List of suggested skills
    """
    try:
        experiences = [exp.model_dump() for exp in resume.experiences]
        education = [edu.model_dump() for edu in resume.education]
        
        suggested_skills = ai_service.suggest_skills(experiences, education)
        return {
            "suggested_skills": suggested_skills
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error suggesting skills: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Mount static files for frontend
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
