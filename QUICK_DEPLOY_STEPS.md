# Quick Backend Deployment Steps

## ✅ Files Ready
- `Procfile` - Start command for Railpack
- `railpack.json` - Railpack configuration
- `backend/railpack.json` - Alternative config
- All files committed and ready

## 🚀 Deploy to Railpack

### 1. In Railpack Dashboard:

**Set Root Directory:**
- Option A: Project root (recommended) - Uses `Procfile`
- Option B: `backend/` - Uses `backend/railpack.json`

**Add Environment Variables:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Deploy:**
- Click "Deploy" or push to connected branch
- Watch logs for "Application startup complete"

### 2. Get Your Backend URL:
- Railpack will provide a URL like: `https://your-app.railway.app`
- Use this in your frontend: `NEXT_PUBLIC_BACKEND_URL`

### 3. Test:
```bash
curl https://your-app.railway.app/health
```

## 📝 Full Guide
See `DEPLOY_BACKEND_GUIDE.md` for detailed instructions.
