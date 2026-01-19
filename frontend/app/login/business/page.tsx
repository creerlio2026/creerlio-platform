'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function BusinessLoginPage() {
  return (
    <Suspense fallback={null}>
      <BusinessLoginPageInner />
    </Suspense>
  )
}

function BusinessLoginPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirect') || '/dashboard/business'
  const initialMode = params.get('mode')

  // Initialize mode from URL params - default to signup if mode=signup is in URL
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Ensure mode matches URL parameter
    if (initialMode === 'signup') {
      setMode('signup')
    } else if (initialMode === 'signin') {
      setMode('signin')
    }
    // If no mode parameter, keep current state (or default to signin)
    try {
      localStorage.setItem('creerlio_active_role', 'business')
      localStorage.setItem('user_type', 'business')
    } catch {}

    supabase.auth.getSession().then(({ data }: any) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'L3',location:'frontend/app/login/business/page.tsx:mount',message:'business login mount',data:{mode:initialMode??null,redirectTo,hasSession:!!data.session?.user?.id},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (data.session?.user?.id) router.replace(redirectTo)
    }).catch(() => {})
  }, [router, redirectTo, initialMode])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (!email.trim() || !password) {
        setError('Business email and password are required.')
        return
      }
      
      // Capture localStorage state BEFORE we overwrite it (to check previous intent)
      let wasRegisteredAsTalent = false
      try {
        const previousRole = localStorage.getItem('creerlio_active_role')
        const previousUserType = localStorage.getItem('user_type')
        wasRegisteredAsTalent = previousRole === 'talent' || previousUserType === 'talent'
        localStorage.setItem('creerlio_active_role', 'business')
        localStorage.setItem('user_type', 'business')
      } catch {}

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'L4',location:'frontend/app/login/business/page.tsx:submit',message:'business login submit',data:{mode,redirectTo},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (mode === 'signin') {
        const { data: signInData, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (err) {
          setError(err.message)
          return
        }
        
        // VALIDATION: Check if user has a talent profile OR registered as talent
        // IMPORTANT: Check metadata BEFORE updating it, so we use the existing registration intent
        const userId = signInData.user?.id
        const userMetadata = signInData.user?.user_metadata || {}
        const registeredAsTalentFromMetadata = userMetadata.registration_type === 'talent' || userMetadata.registered_as === 'talent'
        if (userId) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/business/page.tsx:signin:validate',message:'Validating user profile type after business signin',data:{userId,email:email.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'LOGIN_VALIDATE'})}).catch(()=>{});
          // #endregion
          
          const [businessCheck, talentCheck] = await Promise.all([
            supabase.from('business_profiles').select('id, created_at').eq('user_id', userId).maybeSingle(),
            supabase.from('talent_profiles').select('id, created_at').eq('user_id', userId).maybeSingle()
          ])
          
          const hasBusinessProfile = !!businessCheck.data && !businessCheck.error
          const hasTalentProfile = !!talentCheck.data && !talentCheck.error
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/business/page.tsx:signin:validate_result',message:'Profile validation result',data:{userId,hasBusinessProfile,hasTalentProfile,wasRegisteredAsTalent,registeredAsTalentFromMetadata,businessCreatedAt:businessCheck.data?.created_at,talentCreatedAt:talentCheck.data?.created_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'LOGIN_VALIDATE'})}).catch(()=>{});
          // #endregion
          
          // CRITICAL RULE: Allow business login if user has a business profile
          // Only block if user ONLY has a talent profile (no business profile exists)
          // If user has both profiles, prioritize business profile - allow business login
          if (!hasBusinessProfile && hasTalentProfile) {
            setError('This email is registered as a Talent account. Please use the Talent login page.')
            // Sign out the user since they're on the wrong login page
            await supabase.auth.signOut()
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/business/page.tsx:signin:blocked',message:'Blocked - user only has talent profile',data:{userId,email:email.trim(),hasTalentProfile,hasBusinessProfile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'LOGIN_VALIDATE'})}).catch(()=>{});
            // #endregion
            return
          }
          
          // If user has business profile, allow login regardless of talent profile existence
        }
        
        // Only update metadata AFTER validation passes - this records that they successfully signed in as business
        if (signInData.user) {
          await supabase.auth.updateUser({
            data: {
              registration_type: 'business',
              registered_as: 'business'
            }
          })
        }
        
        router.replace(redirectTo)
        return
      }

      const { data: signUpData, error: err } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          data: {
            registration_type: 'business',
            registered_as: 'business'
          }
        }
      })
      if (err) {
        setError(err.message)
        return
      }
      
      // Also update user metadata if signup succeeded (for existing users)
      if (signUpData.user) {
        await supabase.auth.updateUser({
          data: {
            registration_type: 'business',
            registered_as: 'business'
          }
        })
      }
      
      router.replace(redirectTo)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Public Header */}
      <header className="sticky top-0 z-50 bg-black border-0">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-[#20C997] transition-colors">
              Creerlio
            </Link>

            <nav className="hidden lg:flex items-center gap-x-8 text-sm text-white">
              <Link href="/about" className="hover:text-[#20C997] transition-colors">About</Link>
              <Link href="/#talent" className="hover:text-[#20C997] transition-colors">Talent</Link>
              <Link href="/#business" className="hover:text-[#20C997] transition-colors">Business</Link>
              <Link href="/search" className="hover:text-[#20C997] transition-colors">Search</Link>
              <Link href="/jobs" className="hover:text-[#20C997] transition-colors">Jobs</Link>
            </nav>

            <div className="flex gap-3">
              <Link
                href="/login/talent?mode=signup&redirect=/dashboard/talent"
                className="px-4 py-2 rounded-lg bg-[#20C997] hover:bg-[#1DB886] font-semibold text-sm text-white transition-colors"
              >
                Create Talent Account
              </Link>
              <Link
                href="/login/business?mode=signup&redirect=/dashboard/business"
                className="px-4 py-2 rounded-lg bg-[#20C997] hover:bg-[#1DB886] font-semibold text-sm text-white transition-colors"
              >
                Create Business Account
              </Link>
              <Link
                href="/login/talent?mode=signin&redirect=/dashboard/talent"
                className="px-5 py-2 rounded-lg bg-[#20C997] hover:bg-[#1DB886] font-semibold text-sm text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Login Form Section */}
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
        <div className="w-full max-w-md dashboard-card rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white">{mode === 'signin' ? 'Business Sign In' : 'Create Business Account'}</h1>
            <Link href="/login/talent" className="text-slate-300 hover:text-blue-400 transition-colors text-sm">
              I'm Talent →
            </Link>
          </div>

        <h1 className="text-2xl font-bold text-white mb-2">{mode === 'signin' ? 'Business sign in' : 'Create Business account'}</h1>
        <p className="text-gray-400 text-sm mb-6">Business sign-in uses your business email.</p>

        {error && (
          <div className="mb-4 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-3 text-sm">{error}</div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'signin' ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'signup' ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Business email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              placeholder="name@company.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
          </div>
        </div>
      </div>
  )
}


