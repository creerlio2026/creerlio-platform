## OpenAI setup (Frontend / Next.js)

The Creerlio frontend uses **Next.js route handlers** (server-side) for AI resume parsing:

- `POST /api/resume/parse` (implemented in `frontend/app/api/resume/parse/route.ts`)

### 1) Rotate your key (important)

If you ever pasted your key into chat/logs, **rotate it in OpenAI** and use the new key locally.

### 2) Create `frontend/.env.local`

Create a file named `frontend/.env.local` with:

```bash
OPENAI_API_KEY=sk-...your-key...
OPENAI_MODEL=gpt-4o-mini
```

Notes:
- **Do not** use `NEXT_PUBLIC_` for OpenAI. It must remain server-side only.
- Restart the Next dev server after editing `.env.local`.

### 3) Restart Next.js

Stop `npm run dev` and start it again.

### 4) Verify

Trigger resume parsing again; the server route will prefer OpenAI when `OPENAI_API_KEY` is present, and fall back to heuristic parsing if not.


