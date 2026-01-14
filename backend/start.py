#!/usr/bin/env python3
"""
Startup script for Railway deployment
Handles errors gracefully and ensures app starts
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("Creerlio Platform - Backend Startup")
print("=" * 60)
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"Python path: {sys.path[0]}")

try:
    print("\n[1/3] Importing FastAPI and uvicorn...")
    import uvicorn
    from fastapi import FastAPI
    print("✓ FastAPI and uvicorn imported successfully")
    
    print("\n[2/3] Importing main application module...")
    from main import app
    print("✓ Main application imported successfully")
    
    print("\n[3/3] Starting server...")
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"✓ Server configuration: {host}:{port}")
    print("=" * 60)
    print("Server starting...")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )
except ImportError as e:
    print(f"\n❌ FATAL ERROR: Import failed: {e}")
    print("\nMissing dependencies. Check requirements.txt")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"\n❌ FATAL ERROR: Failed to start application: {e}")
    print("\nFull error details:")
    import traceback
    traceback.print_exc()
    sys.exit(1)
