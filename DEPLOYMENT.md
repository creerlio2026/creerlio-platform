# 🚀 Creerlio Platform - Deployment Guide

Complete guide for deploying the Creerlio Platform to Vercel with GitHub integration.

## 📋 Prerequisites

- GitHub account with repository access
- Vercel account (free tier works)
- Supabase project with API keys
- Mapbox API token (optional, has fallback)

## 🔧 Step 1: GitHub Repository Setup

### Verify Repository Connection

```bash
# Check current remote
git remote -v

# Should show:
# origin  https://github.com/creerlio2026/creerlio-platform.git (fetch)
# origin  https://github.com/creerlio2026/creerlio-platform.git (push)
```

### Commit and Push Current Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Prepare for Vercel deployment

- Add Vercel configuration
- Update deployment documentation
- Fix environment variable setup"

# Push to GitHub
git push origin main
```

If you encounter authentication issues:

```bash
# Use Personal Access Token (not password)
# Generate at: https://github.com/settings/tokens
git remote set-url origin https://YOUR_TOKEN@github.com/creerlio2026/creerlio-platform.git
```

## 🔗 Step 2: Vercel Integration

### Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select **"GitHub"** and authorize if needed
5. Find and select `creerlio2026/creerlio-platform`
6. Click **"Import"**

### Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `frontend`

**Build Command:** `npm run build` (auto-detected)

**Output Directory:** `.next` (auto-detected)

**Install Command:** `npm install` (auto-detected)

**Node.js Version:** 24.x (specified in `package.json` engines field)

**⚠️ Important:** If Vercel shows Node.js 18.x, go to **Settings** → **General** → **Node.js Version** and select **24.x**, or it will automatically use the version from `package.json` engines field.

### Environment Variables

Add the following environment variables in Vercel:

#### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Optional Variables

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_DEBUG_LOG_ENABLED=false
```

**How to Add:**

1. In Vercel project settings, go to **Settings** → **Environment Variables**
2. Add each variable for:
   - **Production**
   - **Preview** (for PR previews)
   - **Development** (optional)
3. Click **"Save"**

**⚠️ Security Notes:**
- Never commit `.env` files to Git
- Use Vercel's environment variables for all secrets
- Service role keys should NEVER be in frontend code
- Only use `NEXT_PUBLIC_*` variables in frontend

### Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Your site will be live at: `https://creerlio-platform.vercel.app` (or custom domain)

## 🔄 Step 3: Auto-Deploy Setup

### Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to `main` branch
- **Preview:** Every pull request
- **Branch:** Every push to other branches

### Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `creerlio.com`)
3. Follow DNS configuration instructions
4. Vercel will handle SSL certificates automatically

## 🧪 Step 4: Preview URLs for Testing

### Sharing Preview URLs

1. **For Pull Requests:**
   - Create a PR on GitHub
   - Vercel automatically creates a preview URL
   - Share the preview URL with testers

2. **For Branch Deployments:**
   - Push to any branch
   - Vercel creates a preview URL
   - Find it in Vercel Dashboard → **Deployments**

3. **For Production:**
   - Production URL is always available
   - Share: `https://creerlio-platform.vercel.app`

### Preview Mode Banner (Optional)

The site can show a banner indicating it's a preview:

```typescript
// Add to your layout or root component
{process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' && (
  <div className="bg-yellow-500 text-black text-center py-2">
    🧪 Preview Environment - Testing Only
  </div>
)}
```

## 🔐 Step 5: Environment Variables Reference

### Local Development

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_DEBUG_LOG_ENABLED=true
```

### Production/Staging

Set in Vercel Dashboard → Settings → Environment Variables

### Supabase Keys

**Where to Find:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ NEVER use:**
- Service Role Key (has admin access)
- Service Role Key should only be in backend/server-side code

## 🐛 Step 6: Troubleshooting

### Build Failures

**Error: Module not found**
```bash
# Ensure all dependencies are in package.json
cd frontend
npm install
npm run build
```

**Error: Environment variable missing**
- Check Vercel Dashboard → Settings → Environment Variables
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding variables

**Error: TypeScript errors**
- Build is configured to ignore TypeScript errors (see `next.config.js`)
- Fix errors locally before deploying

### Deployment Issues

**Site shows "404 Not Found"**
- Check Root Directory is set to `frontend`
- Verify `next.config.js` exists
- Check build logs in Vercel Dashboard

**Environment variables not working**
- Variables must start with `NEXT_PUBLIC_` to be available in browser
- Redeploy after adding/changing variables
- Clear browser cache

**Supabase connection errors**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is active
- Verify RLS policies allow public access where needed

### GitHub Integration Issues

**Vercel can't access repository**
1. Go to Vercel Dashboard → Settings → Git
2. Click **"Disconnect"** then **"Connect Git Provider"**
3. Re-authorize GitHub access
4. Select repository again

**Deployments not triggering**
- Check GitHub webhook is active
- Verify branch name matches (usually `main`)
- Check Vercel Dashboard → Settings → Git → Connected Repositories

## 📊 Step 7: Monitoring & Logs

### View Deployment Logs

1. Go to Vercel Dashboard
2. Click on a deployment
3. View **"Build Logs"** and **"Function Logs"**

### Monitor Performance

- Vercel Analytics (optional, requires upgrade)
- Check deployment status in dashboard
- Monitor function execution times

## ✅ Step 8: Verification Checklist

Before sharing with testers:

- [ ] Site loads without errors
- [ ] Supabase connection works (can sign in/up)
- [ ] Mapbox maps load (if using mapping features)
- [ ] No console errors in browser
- [ ] Environment variables are set correctly
- [ ] Production URL is accessible
- [ ] Preview URLs work for PRs
- [ ] No localhost dependencies remain
- [ ] Build completes successfully
- [ ] Auto-deploy is working (push to GitHub triggers deploy)

## 🔄 Step 9: Ongoing Deployment

### Making Changes

1. Make changes locally
2. Test locally: `cd frontend && npm run dev`
3. Commit changes: `git add . && git commit -m "Description"`
4. Push to GitHub: `git push origin main`
5. Vercel automatically deploys (check dashboard)

### Rollback

If a deployment fails:

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click **"..."** → **"Promote to Production"**

## 📝 Step 10: Adding Testers

### Option 1: Share Preview URL

1. Create a PR or push to a branch
2. Get preview URL from Vercel Dashboard
3. Share URL with testers
4. No authentication needed (unless you add access control)

### Option 2: Access Control (Optional)

Add simple password protection:

1. Install: `npm install next-auth`
2. Create `/api/auth/[...nextauth].ts`
3. Configure basic authentication
4. Or use Vercel's password protection (Pro plan)

### Option 3: Invite-Only Mode

1. Use Supabase RLS policies
2. Only allow specific email domains
3. Or use Supabase Auth with invite links

## 🎯 Quick Reference

### Important URLs

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repository:** https://github.com/creerlio2026/creerlio-platform
- **Supabase Dashboard:** https://app.supabase.com

### Key Commands

```bash
# Local development
cd frontend
npm install
npm run dev

# Build locally
npm run build

# Deploy (automatic via GitHub push)
git add .
git commit -m "Your message"
git push origin main
```

### Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)

---

**🎉 Your Creerlio Platform is now deployed and ready for testing!**

Share your production URL or preview URLs with testers to get feedback.
