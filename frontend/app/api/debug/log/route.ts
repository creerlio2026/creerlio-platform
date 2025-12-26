import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// NOTE:
// This endpoint exists to prevent Next.js rewrites from proxying /api/debug/log to the legacy backend.
// In production you might store these logs in a table instead; here we simply accept the payload and return 200.

export async function POST(req: Request) {
  try {
    // Consume body to avoid hanging connections; ignore content.
    await req.json().catch(() => null)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}


