# Vercel Deployment Fix - Critical Steps

## ✅ Fixed Issues

1. **Simplified `vercel.json`** - Removed redundant config, let Vercel auto-detect Next.js
2. **Root Directory** - Already set to `frontend` ✓

## 🔴 CRITICAL: Required Environment Variables

Your build is failing because these **REQUIRED** environment variables are missing in Vercel:

### Must Set in Vercel → Settings → Environment Variables:

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Your Supabase anonymous/public key
   - Get from: Supabase Dashboard → Settings → API → anon/public key

### Optional (but recommended):

3. **`NEXT_PUBLIC_MAPBOX_TOKEN`**
   - Your Mapbox access token
   - Has fallback in code, but set it for production

4. **`NEXT_PUBLIC_DEBUG_LOG_ENABLED`**
   - Set to `"false"` for production

## 📋 Steps to Fix

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add these variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key-here`
   - `NEXT_PUBLIC_MAPBOX_TOKEN` = `your-mapbox-token` (optional)

3. **Set for all environments:** Production, Preview, Development

4. **Verify Node.js Version:**
   - Settings → General → Node.js Version
   - Should be: **24.x** (matches your `package.json`)

5. **Redeploy:**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - OR push a new commit to trigger auto-deploy

## 🔍 How to Get Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ⚠️ Important Notes

- **DO NOT** use the `service_role` key - that's secret and should never be in frontend code
- Only use `anon` or `public` keys for `NEXT_PUBLIC_*` variables
- All `NEXT_PUBLIC_*` variables are exposed to the browser (by design)

## 🧪 After Setting Variables

1. Wait for the deployment to complete
2. Check the Build Logs in Vercel (not browser console)
3. Look for any red error messages
4. If build succeeds, your site will be live!

## 📝 Current Configuration

- **Root Directory:** `frontend` ✓
- **Framework:** Next.js (auto-detected)
- **Node.js:** 24.x (from package.json)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
