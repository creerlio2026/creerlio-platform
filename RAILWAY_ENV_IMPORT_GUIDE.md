# Railway Environment Variables Import Guide

## ✅ Yes! Railway Can Import Environment Variables

Railway supports importing environment variables from a file. Here's how:

## Method 1: Import from .env File (Recommended)

### Step 1: Create Your .env File

Create a `.env` file in your project root or `backend/` directory with your actual values:

```bash
# backend/.env (DO NOT COMMIT THIS FILE!)
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
OPENAI_API_KEY=your-actual-openai-key
# ... etc
```

**⚠️ Important**: Never commit `.env` files to Git! They contain secrets.

### Step 2: Import into Railway

1. **Go to Railway Dashboard**
   - Select your project
   - Go to **Variables** tab

2. **Click "Import from .env"** or **"Add Variables"** → **"Import from File"**

3. **Upload or Paste**
   - Upload your `.env` file, OR
   - Copy/paste the contents of your `.env` file

4. **Railway will parse and add all variables automatically**

## Method 2: Manual Entry (Alternative)

If you prefer to enter variables manually:

1. Go to **Variables** tab in Railway
2. Click **"New Variable"**
3. Enter each variable one by one:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - etc.

## Method 3: Railway CLI (Advanced)

If you have Railway CLI installed:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Import from .env file
railway variables --file backend/.env
```

## Required Environment Variables

Based on your backend code, here are the variables you need:

### 🔴 Required (Backend won't work without these):
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 🟡 Optional (Features may not work without these):
```
OPENAI_API_KEY=your-openai-key          # For AI resume parsing
GOOGLE_MAPS_API_KEY=your-google-key      # For mapping features
MAPBOX_API_KEY=your-mapbox-key          # For mapping features
```

### 🟢 Auto-Set by Railway:
```
PORT=8000                                # Railway sets this automatically
HOST=0.0.0.0                            # Default, usually not needed
```

### 🔵 Optional Configuration:
```
DATABASE_URL=postgresql://...           # If using direct PostgreSQL
SECRET_KEY=your-secret-key              # For JWT tokens (defaults to dev key)
ADMIN_EMAILS=admin@example.com          # For admin features
ADMIN_EMAIL_DOMAINS=example.com         # For admin features
DB_ECHO=false                           # SQL query logging
OPENAI_MODEL=gpt-4-turbo-preview        # OpenAI model to use
```

## Quick Import Steps

1. **Create `.env` file** (use `backend/.env.example` as template)
2. **Fill in your actual values** (get from Supabase dashboard)
3. **In Railway Dashboard:**
   - Go to **Variables** tab
   - Click **"Import from .env"** or **"Add Variables"** → **"Import"**
   - Upload or paste your `.env` file
4. **Verify** - All variables should appear in the list
5. **Redeploy** - Railway will use the new variables

## Getting Your Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

## Security Best Practices

✅ **DO:**
- Use Railway's environment variables (encrypted at rest)
- Use `.env.example` as a template (commit this)
- Keep `.env` files local only (never commit)
- Rotate keys regularly
- Use service role key only for admin operations

❌ **DON'T:**
- Commit `.env` files to Git
- Share environment variables in chat/email
- Use the same keys for dev and production
- Expose service role key in frontend code

## Verification

After importing, verify your variables:

1. **Check Railway Dashboard** → Variables tab
2. **Check deployment logs** - Should show "Supabase client configured"
3. **Test health endpoint:**
   ```bash
   curl https://your-app.railway.app/health
   ```

## Troubleshooting

### Variables not showing up?
- Check file format (should be `KEY=value`, one per line)
- No spaces around `=`
- No quotes needed (Railway handles them)
- Check for typos in variable names

### Backend still can't connect to Supabase?
- Verify all 3 Supabase variables are set
- Check variable names match exactly (case-sensitive)
- Ensure no extra spaces or newlines in values
- Check Railway logs for specific error messages

### Import failed?
- Ensure `.env` file format is correct
- Try manual entry for one variable to test
- Check Railway dashboard for error messages

## Example .env File Format

```bash
# Comments start with #
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
```

**Note**: Railway will automatically:
- Strip comments
- Handle quoted values
- Ignore empty lines
- Set variables for all environments (or you can specify)
