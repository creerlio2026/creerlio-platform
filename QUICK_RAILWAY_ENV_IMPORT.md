# Quick Guide: Import Environment Variables to Railway

## ✅ Yes! Railway Can Import from .env File

## Quick Steps:

### 1. Create Your .env File
Create a file called `.env` (or use `backend/env.template` as a starting point) with your actual values:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Import to Railway

**Option A: Via Dashboard (Easiest)**
1. Go to Railway Dashboard → Your Project → **Variables** tab
2. Click **"Add Variables"** → **"Import from .env"** or **"Import from File"**
3. Upload your `.env` file or paste its contents
4. Railway will automatically add all variables

**Option B: Manual Entry**
1. Go to **Variables** tab
2. Click **"New Variable"**
3. Enter each variable one by one

**Option C: Railway CLI**
```bash
railway variables --file backend/.env
```

## Required Variables (Minimum):

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Get Your Supabase Keys:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. **Settings** → **API**
4. Copy the three values

## After Importing:

1. ✅ Verify variables appear in Railway dashboard
2. ✅ Redeploy your service
3. ✅ Check logs for "Supabase client configured"
4. ✅ Test: `curl https://your-app.railway.app/health`

## ⚠️ Security Note:

- Never commit `.env` files to Git (already in `.gitignore`)
- Use `env.template` as a reference (this is safe to commit)
- Railway encrypts environment variables at rest

## Full Guide:

See `RAILWAY_ENV_IMPORT_GUIDE.md` for detailed instructions.
