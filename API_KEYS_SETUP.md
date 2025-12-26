# 🔑 API Keys Setup Guide

## ✅ Mapbox API Key - CONFIGURED

Your Mapbox API key has been added to the `.env` file:
```
MAPBOX_API_KEY=pk.eyJ1IjoiY3JlZXJsaW8iLCJhIjoiY21pY3IxZHljMXFwNTJzb2FydzR4b3F1YSJ9.Is8-GyfEdqwKKEo2cGO65g
```

## 📋 Other API Keys (Optional)

### OpenAI API Key (for AI Resume Parsing)
To enable AI-powered resume parsing:

- If you're using the **Python backend**, add to root `.env`
- If you're using the **Next.js frontend-only** flow (Python disabled), add to `frontend/.env.local`

Root `.env` (Python backend):
```
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```
Get your key at: https://platform.openai.com/api-keys

Frontend `frontend/.env.local` (Next.js route handler `/api/resume/parse`):
```
OPENAI_API_KEY=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
OPENAI_MODEL=gpt-4o-mini
```
Then restart the frontend (`npm run dev`) so Next.js picks up the env vars.

### Google Maps API Key (for Mapping Features)
For advanced mapping features, add to `.env`:
```
GOOGLE_MAPS_API_KEY=your-google-maps-key-here
```
Get your key at: https://console.cloud.google.com/google/maps-apis

## 🔄 Restart Servers After Adding Keys

After adding API keys to `.env`:

1. **Stop the servers** (Ctrl+C in both windows)
2. **Restart them** to load the new environment variables

Or the servers will pick up changes on next restart.

## 📝 Current .env Location

The `.env` file is located at:
```
C:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform\.env
```

## 🔒 Security Note

- ✅ `.env` is in `.gitignore` (won't be committed to Git)
- ✅ Never share your API keys publicly
- ✅ Keep your `.env` file secure

---

**Your Mapbox key is configured and ready to use!**


