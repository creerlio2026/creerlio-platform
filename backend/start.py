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

# ==================== CRASH-PROOF STARTUP (NO SILENT FAILURES) ====================
# At the very top - before anything else
print("🚀 Boot sequence starting")
print(f"ENV PORT: {os.getenv('PORT', 'NOT SET')}")

def handle_unhandled_exception(exc_type, exc_value, exc_traceback):
    """Handle unhandled exceptions - Railway kills silent processes"""
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    print("\n" + "=" * 60)
    print("❌ Uncaught Exception:", exc_value)
    print("=" * 60)
    import traceback
    traceback.print_exception(exc_type, exc_value, exc_traceback)
    sys.exit(1)

sys.excepthook = handle_unhandled_exception

# Handle unhandled async exceptions (unhandled rejections)
import asyncio
def handle_async_exception(loop, context):
    """Handle unhandled async exceptions - Railway kills silent processes"""
    exception = context.get('exception')
    if exception:
        print(f"\n❌ Unhandled Rejection: {exception}")
        import traceback
        traceback.print_exception(type(exception), exception, exception.__traceback__)
    else:
        print(f"\n❌ Unhandled Rejection: {context.get('message', 'Unknown error')}")

# Additional startup info
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"Python path: {sys.path[0]}")

# ==================== HARD ENFORCE RAILWAY PORT & HOST ====================
# Delete all hardcoded ports - use only process.env.PORT
PORT = os.getenv("PORT")
if not PORT:
    print("⚠️  WARNING: PORT environment variable not set, using default 8000")
    print("   On Railway, PORT should be set automatically")
    PORT = "8000"

try:
    PORT = int(PORT)  # Number(process.env.PORT) equivalent
except ValueError:
    print(f"❌ ERROR: PORT must be a number, got: {PORT}")
    sys.exit(1)

# MANDATORY: Always 0.0.0.0 (never localhost)
HOST = "0.0.0.0"
print(f"✓ HOST: {HOST} (hard-enforced for Railway)")
print(f"✓ PORT: {PORT}")

# ==================== ENV VAR SAFETY (NO HARD CRASHES) ====================
# Convert all required env vars to soft-fail with warnings
def warn_missing_env(name: str):
    """Warn but don't crash on missing env vars"""
    if not os.getenv(name):
        print(f"⚠️ Missing env: {name}")

warn_missing_env("DATABASE_URL")
warn_missing_env("SUPABASE_URL")
warn_missing_env("SUPABASE_ANON_KEY")
warn_missing_env("SUPABASE_SERVICE_ROLE_KEY")

# The app must still boot even if envs are missing

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
    
    # SINGLE SOURCE OF TRUTH - Only one server listen call
    # MANDATORY: Bind to 0.0.0.0 and use PORT from environment
    print(f"✅ Server listening on {PORT}")
    uvicorn.run(
        app,
        host=HOST,  # MANDATORY: 0.0.0.0 (not localhost)
        port=PORT,  # MANDATORY: From process.env.PORT
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
