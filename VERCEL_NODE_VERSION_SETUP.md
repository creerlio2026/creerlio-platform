# How to Set Node.js Version to 24.x in Vercel

## Method 1: Vercel Dashboard (Recommended)

### Step-by-Step Instructions

1. **Go to Your Project Settings**
   - Navigate to: https://vercel.com/creerlios-projects/creerlio-platform
   - Click on **"Settings"** tab (in the navigation bar at the top)

2. **Find General Settings**
   - In the left sidebar, click on **"General"**
   - Scroll down to find the **"Node.js Version"** section

3. **Set Node.js Version**
   - You'll see a dropdown or input field for "Node.js Version"
   - Select or enter: **`24.x`** (or `24` or `24.0.0`)
   - Click **"Save"** at the bottom of the page

### Visual Guide

```
Vercel Dashboard
├── Your Project (creerlio-platform)
│   ├── Overview
│   ├── Deployments
│   ├── Analytics
│   └── Settings ← Click here
│       ├── General ← Click here
│       │   ├── Project Name
│       │   ├── Framework Preset
│       │   ├── Root Directory
│       │   ├── Build & Development Settings
│       │   └── Node.js Version ← Set to 24.x here
│       ├── Environment Variables
│       └── ...
```

## Method 2: Verify package.json (Already Done ✅)

Your `frontend/package.json` already has:
```json
{
  "engines": {
    "node": "24.x"
  }
}
```

Vercel should automatically detect this, but explicitly setting it in the dashboard ensures it's used.

## Method 3: Check Current Deployment

### View Build Logs

1. Go to **"Deployments"** tab
2. Click on any deployment (even failed ones)
3. Click on **"Build Logs"** or **"Function Logs"**
4. Look for a line like:
   ```
   Installing Node.js 18.x...
   ```
   or
   ```
   Installing Node.js 24.x...
   ```

If you see `18.x`, that's the problem - you need to set it to `24.x` in Settings.

## Method 4: Force via vercel.json (Already Added ✅)

The `vercel.json` file now includes:
```json
{
  "functions": {
    "frontend/app/**/*.ts": {
      "runtime": "nodejs24.x"
    },
    "frontend/app/**/*.tsx": {
      "runtime": "nodejs24.x"
    }
  }
}
```

This explicitly tells Vercel to use Node.js 24.x for all TypeScript/TSX files.

## Quick Fix Steps

1. **Go to Settings → General**
   - URL: `https://vercel.com/creerlios-projects/creerlio-platform/settings/general`

2. **Find "Node.js Version" field**
   - It might be under "Build & Development Settings" section
   - Or in a "Node.js" section

3. **Set to `24.x`**
   - Enter: `24.x` or select from dropdown if available
   - Save changes

4. **Redeploy**
   - Go back to Deployments
   - Click the three dots (⋯) on the latest deployment
   - Select **"Redeploy"**
   - Or push a new commit to trigger a new deployment

## Troubleshooting

### If you can't find the Node.js Version setting:

1. **Check if you're on the right plan**
   - Some settings are only available on Pro/Enterprise plans
   - Node.js version should be available on all plans

2. **Try the API method** (Advanced)
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Link project
   vercel link
   
   # Set Node version
   vercel env add NODE_VERSION production
   # Enter: 24.x
   ```

3. **Check project.json** (if exists)
   - Some projects have a `.vercel/project.json`
   - This might override settings

### Verify It's Working

After setting to 24.x and redeploying:

1. Check the build logs
2. Look for: `Installing Node.js 24.x...` or `Using Node.js v24.x.x`
3. The deployment should succeed (if Node version was the only issue)

## Direct Link

Go directly to your project's general settings:
**https://vercel.com/creerlios-projects/creerlio-platform/settings/general**

Then scroll down to find "Node.js Version" and set it to `24.x`.

---

**Note:** After changing the Node.js version, you must redeploy for the change to take effect. The next deployment will use Node.js 24.x.
