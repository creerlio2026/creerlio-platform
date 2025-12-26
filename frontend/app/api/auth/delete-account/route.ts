import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getEnv(name: string) {
  const v = process.env[name]
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export async function DELETE(req: Request) {
  try {
    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') ?? getEnv('SUPABASE_URL')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Admin delete is not configured. Set SUPABASE_SERVICE_ROLE_KEY (server-side) and NEXT_PUBLIC_SUPABASE_URL.',
        },
        { status: 503 }
      )
    }

    const authz = req.headers.get('authorization') || ''
    const token = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7).trim() : ''
    if (!token) {
      return NextResponse.json({ success: false, message: 'Missing Authorization bearer token.' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const user_id = (body?.user_id as string | undefined) ?? ''
    if (!user_id) {
      return NextResponse.json({ success: false, message: 'Missing user_id.' }, { status: 400 })
    }

    // Admin client for verification + deletion.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Verify the caller token maps to the same user_id to prevent arbitrary deletions.
    const who = await admin.auth.getUser(token)
    const authedUserId = who.data?.user?.id ?? null
    if (!authedUserId) {
      return NextResponse.json({ success: false, message: 'Invalid session.' }, { status: 401 })
    }
    if (authedUserId !== user_id) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
    }

    const del = await admin.auth.admin.deleteUser(user_id)
    if (del.error) {
      return NextResponse.json(
        { success: false, message: del.error.message ?? 'Failed to delete user.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Account deleted.' })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message ?? 'Delete failed.' }, { status: 500 })
  }
}


