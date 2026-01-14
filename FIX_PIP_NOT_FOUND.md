# Fix: pip: command not found

## Problem
Nixpacks build failed with: `pip: command not found`

## Root Cause
When using Nixpacks with Python from Nix, `pip` might not be directly in PATH. Need to use `python -m pip` instead.

## Fix Applied

### Updated `nixpacks.toml`
**Before:**
```toml
[phases.install]
cmds = [
  "pip install -r backend/requirements.txt"  # ❌ pip not in PATH
]
```

**After:**
```toml
[phases.install]
cmds = [
  "python -m pip install -r backend/requirements.txt"  # ✅ Uses Python's pip module
]
```

## Why This Works

- `python -m pip` uses Python's built-in pip module
- Works even if `pip` command isn't in PATH
- More reliable across different Python installations
- Same approach we use for uvicorn: `python -m uvicorn`

## Files Updated

1. **`nixpacks.toml`** - Changed `pip` to `python -m pip` ✅

## Next Steps

1. **Railway will auto-redeploy** with the fix
2. **Check build logs** - Should see:
   ```
   ✓ Installing Python 3.12
   ✓ Running: python -m pip install -r backend/requirements.txt
   ✓ Installing fastapi...
   ✓ Installing uvicorn...
   ✓ Installing python-dotenv...  ← Should work now!
   ...
   ✓ Build complete
   ```

## Expected Build Output

```
Using Nixpacks
setup      │ python312
install    │ python -m pip install -r backend/requirements.txt
start      │ cd backend && python -m uvicorn main:app
✓ Dependencies installed successfully
✓ Build complete
✓ Application startup complete
```

The fix is committed and pushed. Railway should now build successfully! 🚀
