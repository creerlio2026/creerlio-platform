#!/usr/bin/env python3
"""
Startup script for Railway deployment
Handles errors gracefully and ensures app starts
MANDATORY: Binds to 0.0.0.0 and uses PORT from environment
"""
import os
import sys
import signal
import atexit

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ==================== CRASH DETECTION ====================
def handle_unhandled_exception(exc_type, exc_value, exc_traceback):
    """Handle unhandled exceptions"""
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    print("\n" + "=" * 60)
    print("❌ UNHANDLED EXCEPTION - Application will exit")
    print("=" * 60)
    import traceback
    traceback.print_exception(exc_type, exc_value, exc_traceback)
    sys.exit(1)

sys.excepthook = handle_unhandled_exception

# Handle unhandled async exceptions
import asyncio
def handle_async_exception(loop, context):
    """Handle unhandled async exceptions"""
    exception = context.get('exception')
    if exception:
        print(f"\n❌ UNHANDLED ASYNC EXCEPTION: {exception}")
        import traceback
        traceback.print_exception(type(exception), exception, exception.__traceback__)
    else:
        print(f"\n❌ ASYNC ERROR: {context.get('message', 'Unknown error')}")

# ==================== STARTUP LOGS ====================
print("=" * 60)
print("🚀 Creerlio Platform - Backend Startup")
print("=" * 60)
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"Python path: {sys.path[0]}")

# ==================== ENVIRONMENT VARIABLES ====================
print("\n[ENV] Checking environment variables...")
PORT = os.getenv("PORT")
if not PORT:
    print("⚠️  WARNING: PORT environment variable not set, using default 8000")
    print("   On Railway, PORT should be set automatically")
    PORT = "8000"

try:
    PORT = int(PORT)
except ValueError:
    print(f"❌ ERROR: PORT must be a number, got: {PORT}")
    sys.exit(1)

HOST = os.getenv("HOST", "0.0.0.0")
print(f"✓ HOST: {HOST}")
print(f"✓ PORT: {PORT}")

# Check critical env vars (warn but don't fail)
critical_vars = {
    "SUPABASE_URL": os.getenv("SUPABASE_URL"),
    "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY"),
    "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    "DATABASE_URL": os.getenv("DATABASE_URL"),
}

missing_vars = [k for k, v in critical_vars.items() if not v]
if missing_vars:
    print(f"⚠️  WARNING: Missing environment variables: {', '.join(missing_vars)}")
    print("   App will start but some features may not work")
else:
    print("✓ All critical environment variables present")

# ==================== APP BOOTING ====================
print("\n" + "=" * 60)
print("📦 App booting...")
print("=" * 60)

try:
    print("\n[1/4] Importing FastAPI and uvicorn...")
    import uvicorn
    from fastapi import FastAPI
    print("✓ FastAPI and uvicorn imported successfully")
    
    print("\n[2/4] Attempting to import main application module...")
    try:
        from main import app
        print("✓ Main application imported successfully")
        app_source = "main"
    except Exception as main_error:
        print(f"⚠ Main application import failed: {main_error}")
        import traceback
        traceback.print_exc()
        print("\n   Falling back to minimal app...")
        try:
            from minimal_app import app
            print("✓ Minimal app imported successfully")
            app_source = "minimal"
        except Exception as minimal_error:
            print(f"❌ Minimal app also failed: {minimal_error}")
            import traceback
            traceback.print_exc()
            raise
    
    print(f"\n[3/4] Using app from: {app_source}")
    print("\n[4/4] Starting server...")
    
    # MANDATORY: Bind to 0.0.0.0 (not localhost) for Railway
    if HOST != "0.0.0.0":
        print(f"⚠️  WARNING: HOST is {HOST}, should be 0.0.0.0 for Railway")
        HOST = "0.0.0.0"
        print(f"   Overriding to 0.0.0.0")
    
    print(f"✓ Server will bind to: {HOST}:{PORT}")
    print("=" * 60)
    print("🚀 Server starting...")
    print("=" * 60)
    
    # Start server - this blocks
    uvicorn.run(
        app,
        host=HOST,  # MANDATORY: 0.0.0.0
        port=PORT,  # MANDATORY: From environment
        log_level="info",
        access_log=True
    )
    
except ImportError as e:
    print(f"\n❌ FATAL ERROR: Import failed: {e}")
    print("\nMissing dependencies. Check requirements.txt")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except KeyboardInterrupt:
    print("\n\n⚠️  Server stopped by user")
    sys.exit(0)
except Exception as e:
    print(f"\n❌ FATAL ERROR: Failed to start application: {e}")
    print("\nFull error details:")
    import traceback
    traceback.print_exc()
    sys.exit(1)
