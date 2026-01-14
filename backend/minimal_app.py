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
    # MANDATORY: Use PORT from environment, bind to 0.0.0.0
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting minimal app on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
