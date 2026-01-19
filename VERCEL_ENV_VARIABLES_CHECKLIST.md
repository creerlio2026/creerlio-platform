# Vercel Environment Variables Verification Checklist

## ✅ Critical Variables (Required for Build)

These variables **MUST** be set in Vercel or the build will fail:

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Location**: Vercel Dashboard → Project → Settings → Environment Variables
- **Required**: ✅ YES (build will fail without it)
- **Format**: Should be a valid Supabase project URL
- **Example**: `https://xxxxxxxxxxxxx.supabase.co`
- **Verification**:
  - ✅ Starts with `https://`
  - ✅ Contains `.supabase.co`
  - ✅ No trailing slash
  - ✅ Matches your Supabase project's API URL

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Location**: Vercel Dashboard → Project → Settings → Environment Variables
- **Required**: ✅ YES (build will fail without it)
- **Format**: Should be a valid Supabase anon/public key (JWT-like string)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...`
- **Verification**:
  - ✅ Starts with `eyJ` (base64 encoded JWT header)
  - ✅ Long string (typically 200+ characters)
  - ✅ Matches your Supabase project's "anon" or "public" key
  - ✅ NOT the service_role key (that's secret, server-side only)

## 📋 Optional Variables (Have Fallbacks)

These are optional but recommended:

### 3. `NEXT_PUBLIC_MAPBOX_TOKEN` (Optional)
- **Required**: ❌ NO (has fallback token in code)
- **Note**: If not set, uses a demo token. Set your own for production.

### 4. `NEXT_PUBLIC_BACKEND_URL` (Optional)
- **Required**: ❌ NO (defaults to `http://localhost:8000`)
- **Note**: Only needed if you have a separate backend API

### 5. `NEXT_PUBLIC_ADMIN_EMAILS` (Optional)
- **Required**: ❌ NO (admin features won't work without it)
- **Format**: Comma-separated email addresses
- **Example**: `admin@example.com,admin2@example.com`

## 🔍 How to Verify in Vercel

### Step 1: Navigate to Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **creerlio-platform**
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### Step 2: Check Each Variable

For each variable, verify:
- ✅ **Name** matches exactly (case-sensitive):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ **Value** is set (not empty)
- ✅ **Environment** includes:
  - ✅ Production
  - ✅ Preview (recommended)
  - ✅ Development (optional)

### Step 3: Verify Format

**For `NEXT_PUBLIC_SUPABASE_URL`:**
- Should look like: `https://xxxxxxxxxxxxx.supabase.co`
- Should NOT have trailing slash
- Should match your Supabase project URL

**For `NEXT_PUBLIC_SUPABASE_ANON_KEY`:**
- Should be a long string starting with `eyJ`
- Should be the "anon" or "public" key from Supabase
- Should NOT be the service_role key

### Step 4: Get Values from Supabase

If you need to find these values:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🚨 Common Issues

### Issue 1: Build Fails with "Cannot read property of undefined"
- **Cause**: Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Fix**: Add both variables in Vercel

### Issue 2: Build Succeeds but App Shows Auth Errors
- **Cause**: Wrong values (e.g., using service_role key instead of anon key)
- **Fix**: Verify you're using the "anon public" key, not "service_role"

### Issue 3: Variables Set but Not Applied
- **Cause**: Variables added after deployment, or wrong environment selected
- **Fix**: 
  1. Ensure variables are set for "Production" environment
  2. Redeploy the project after adding variables

## ✅ Verification Checklist

Before deploying, confirm:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Vercel
- [ ] Both variables are enabled for "Production" environment
- [ ] Both variables are enabled for "Preview" environment (recommended)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` starts with `https://` and ends with `.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` starts with `eyJ` and is a long string
- [ ] Values match your Supabase project's API settings
- [ ] You've clicked "Save" after adding/editing variables
- [ ] You've redeployed after adding variables (if they were added after initial deployment)

## 🔄 After Adding Variables

1. **Save** the variables in Vercel
2. **Redeploy** your project:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **Redeploy**
   - Select **Production** environment
   - Click **Redeploy**

## 📝 Notes

- Environment variables with `NEXT_PUBLIC_` prefix are exposed to the browser
- Never commit `.env` files with real keys to Git
- The `anon` key is safe to expose (it's public by design)
- The `service_role` key should NEVER be in `NEXT_PUBLIC_*` variables
