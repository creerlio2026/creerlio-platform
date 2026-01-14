"""
Minimal FastAPI app for testing Railway deployment
This app has NO dependencies and should always work
"""
from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="Creerlio Platform API - Minimal")

@app.get("/")
def root():
    return {"message": "Creerlio Platform API", "status": "healthy"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "creerlio-platform",
        "timestamp": datetime.now().isoformat(),
        "version": "minimal"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    # HARD ENFORCE RAILWAY PORT & HOST
    PORT = int(os.getenv("PORT", "8000"))  # Fallback only
    HOST = "0.0.0.0"  # MANDATORY: Never localhost
    print(f"✅ Server listening on {PORT}")
    # SINGLE SOURCE OF TRUTH - Only one server listen call
    uvicorn.run(app, host=HOST, port=PORT)
