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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
