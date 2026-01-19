# Fix: Railway Not Installing Dependencies

## Problem
Railway shows `ModuleNotFoundError: No module named 'dotenv'` - dependencies aren't being installed.

## Root Cause
Railway wasn't running the build command to install dependencies from `backend/requirements.txt`.

## Solutions Applied

### 1. ✅ Updated Root `requirements.txt`
- Now matches `backend/requirements.txt` with all dependencies
- Railway auto-detects and installs from root `requirements.txt`

### 2. ✅ Created `nixpacks.toml`
- Railway's native configuration format
- Explicitly tells Railway to:
  - Install Python 3.12
  - Run `pip install -r backend/requirements.txt`
  - Start with `cd backend && python -m uvicorn main:app`

### 3. ✅ Created `railway.json`
- Alternative Railway configuration
- Specifies build and start commands

## Files Created/Updated

1. **`requirements.txt`** (root) - Now has all dependencies ✅
2. **`nixpacks.toml`** - Railway build configuration (NEW) ✅
3. **`railway.json`** - Railway config (NEW) ✅
4. **`railpack.json`** - Updated build command ✅

## How Railway Detects Build

Railway uses this priority:
1. `nixpacks.toml` (highest priority) ✅ We have this now
2. `railway.json` ✅ We have this
3. `Procfile` ✅ We have this
4. Auto-detect from `requirements.txt` ✅ We have this

## Next Steps

1. **Railway will auto-redeploy** with the new configuration
2. **Check build logs** - Should see:
   ```
   Installing dependencies...
   pip install -r backend/requirements.txt
   Successfully installed dotenv...
   ```
3. **Verify startup** - Should see:
   ```
   Application startup complete
   ```

## If Still Failing

### Option 1: Set Build Command in Railway Dashboard
1. Go to Railway Dashboard → Your Service → **Settings**
2. Find **"Build Command"** section
3. Set to: `pip install -r backend/requirements.txt`
4. Save and redeploy

### Option 2: Check Root Directory
1. Go to **Settings** → **Root Directory**
2. Make sure it's set to `.` (project root) or `backend/`
3. If set to `backend/`, Railway will use `backend/requirements.txt` automatically

### Option 3: Verify Python Version
1. Check **Settings** → **Python Version**
2. Should be 3.12.7 (from `runtime.txt`)

## Expected Build Log Output

```
✓ Detected Python
✓ Using pip
✓ Installing dependencies from backend/requirements.txt
  Installing fastapi...
  Installing uvicorn...
  Installing python-dotenv...  ← This should appear now!
  ...
✓ Build complete
✓ Starting: cd backend && python -m uvicorn main:app
```

The fixes are committed and pushed. Railway should now install all dependencies correctly! 🚀
