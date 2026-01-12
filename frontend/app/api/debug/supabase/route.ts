import { NextRequest, NextResponse } from 'next/server'
import { supabaseAnonServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAnonServer()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''

    // Extract supabase_ref from URL (e.g., https://xxx.supabase.co -> xxx)
    const supabase_ref = url.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || null

    // Try to get current user from auth header/cookie (optional - don't fail if not present)
    let user = null
    let userError = null
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data, error } = await supabase.auth.getUser(token)
        if (!error && data?.user) {
          user = data.user
        } else {
          userError = error
        }
      }
    } catch (e) {
      // Ignore auth errors - this is a debug endpoint
    }

    // Test database connection with a simple query (use a table that should exist)
    let databaseConnected = false
    let dbError = null
    try {
      // Try querying users table first (should exist after migrations)
      const { error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (!testError) {
        databaseConnected = true
      } else {
        dbError = testError.message
        // Try business_profiles as fallback
        const { error: testError2 } = await supabase
          .from('business_profiles')
          .select('id')
          .limit(1)
        if (!testError2) {
          databaseConnected = true
          dbError = null
        }
      }
    } catch (e: any) {
      dbError = e.message
    }

    return NextResponse.json(
      {
        connected: true,
        supabase_ref,
        user: user
          ? {
              id: user.id,
              email: user.email,
              role: user.role,
            }
          : null,
        userError: userError?.message || null,
        databaseConnected,
        dbError,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Debug Supabase error:', err)
    return NextResponse.json(
      {
        connected: false,
        error: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
