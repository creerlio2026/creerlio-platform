'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TalentLoginPage() {
  const UI_VERSION = 'talent-login-2025-12-24a'
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirect') || '/dashboard/talent'
  const initialMode = params.get('mode')

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [enable2FA, setEnable2FA] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  useEffect(() => {
    if (initialMode === 'signup') setMode('signup')
    if (initialMode === 'signin') setMode('signin')
    try {
      localStorage.setItem('creerlio_active_role', 'talent')
      localStorage.setItem('user_type', 'talent')
    } catch {}

    // #region agent log (client-only; avoid SSR hydration mismatches)
    try {
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'post-fix',
          hypothesisId: 'L0',
          location: 'frontend/app/login/talent/page.tsx:useEffect(render-log)',
          message: 'talent login render (client)',
          data: { uiVersion: UI_VERSION, path: window.location.pathname + window.location.search },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
    } catch {}
    // #endregion

    supabase.auth.getSession().then(({ data }: any) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'L1',location:'frontend/app/login/talent/page.tsx:mount',message:'talent login mount',data:{uiVersion:UI_VERSION,mode:initialMode??null,redirectTo,hasSession:!!data.session?.user?.id},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (data.session?.user?.id) router.replace(redirectTo)
    }).catch(() => {})
  }, [router, redirectTo, initialMode])

  async function oauth(provider: 'google' | 'apple') {
    setBusy(true)
    setError(null)
    try {
      try {
        localStorage.setItem('creerlio_active_role', 'talent')
        localStorage.setItem('user_type', 'talent')
      } catch {}
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({sessionId:'debug-session',runId:'oauth',hypothesisId:'O1',location:'frontend/app/login/talent/page.tsx:oauth',message:'OAuth click',data:{uiVersion:UI_VERSION,provider,redirectTo},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      // Avoid auto-navigation so we can show errors in-app (and keep logs).
      const { data, error } = await (supabase.auth.signInWithOAuth as any)({
        provider,
        options: { redirectTo: origin ? `${origin}${redirectTo}` : undefined, skipBrowserRedirect: true },
      })
      if (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({sessionId:'debug-session',runId:'oauth',hypothesisId:'O1',location:'frontend/app/login/talent/page.tsx:oauth',message:'OAuth error',data:{uiVersion:UI_VERSION,provider,message:String((error as any)?.message??''),name:String((error as any)?.name??''),status:(error as any)?.status??null,code:(error as any)?.code??null,errorCode:(error as any)?.error_code??null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        const msg = String((error as any)?.message ?? '')
        const errorCode = String((error as any)?.error_code ?? (error as any)?.code ?? '')
        // Check for provider not enabled errors (multiple possible formats)
        if (/Unsupported provider/i.test(msg) || /provider is not enabled/i.test(msg) || errorCode === 'validation_failed') {
          setError(
            `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not enabled in your Supabase project.\n\n` +
              'To enable: Go to Supabase Dashboard → Authentication → Providers → enable the provider, then save.\n\n' +
              'For now, please use email + password to sign in.'
          )
        } else {
          setError(msg || 'Authentication failed. Please try again or use email + password.')
        }
        return
      }

      const url = (data as any)?.url ?? null
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({sessionId:'debug-session',runId:'oauth',hypothesisId:'O2',location:'frontend/app/login/talent/page.tsx:oauth',message:'OAuth url received',data:{uiVersion:UI_VERSION,provider,hasUrl:!!url},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (url) window.location.assign(String(url))
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (!resetEmail.trim()) {
        setError('Please enter your email address.')
        return
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/login/talent?mode=signin`,
      })
      if (resetError) {
        setError(resetError.message)
        return
      }
      setError(null)
      alert('Password reset email sent! Please check your inbox.')
      setShowForgotPassword(false)
      setResetEmail('')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signup') {
        // Validate signup fields
        if (!email.trim() || !password || !confirmPassword) {
          setError('Email, password, and confirm password are required.')
          return
        }
        if (!firstName.trim() || !lastName.trim()) {
          setError('First name and last name are required.')
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters long.')
          return
        }
        if (enable2FA && !mobile.trim()) {
          setError('Mobile number is required when enabling two-factor authentication.')
          return
        }
      } else {
        // Validate signin fields
        if (!email.trim() || !password) {
          setError('Email and password are required.')
          return
        }
      }
      
      // Check localStorage BEFORE we set it, to detect if user previously registered as business
      const previousRole = typeof window !== 'undefined' ? localStorage.getItem('creerlio_active_role') : null
      const previousUserType = typeof window !== 'undefined' ? localStorage.getItem('user_type') : null
      const wasRegisteredAsBusiness = previousRole === 'business' || previousUserType === 'business'
      
      try {
        localStorage.setItem('creerlio_active_role', 'talent')
        localStorage.setItem('user_type', 'talent')
      } catch {}

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'L2',location:'frontend/app/login/talent/page.tsx:submit',message:'talent login submit',data:{mode,redirectTo,previousRole,previousUserType,wasRegisteredAsBusiness},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (mode === 'signin') {
        const { data: signInData, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (err) {
          setError(err.message)
          return
        }
        
        // VALIDATION: Check user metadata and profiles to determine if they should use business login
        // IMPORTANT: Refresh user session to get latest metadata (metadata might have been updated in a previous business login)
        const { data: { user: refreshedUser } } = await supabase.auth.getUser()
        const userId = refreshedUser?.id || signInData.user?.id
        const userMetadata = refreshedUser?.user_metadata || signInData.user?.user_metadata || {}
        const registeredAsBusinessFromMetadata = userMetadata.registration_type === 'business' || userMetadata.registered_as === 'business'
        
        if (userId) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/talent/page.tsx:signin:validate',message:'Validating user profile type after talent signin',data:{userId,email:email.trim(),wasRegisteredAsBusiness,registeredAsBusinessFromMetadata,userMetadata:userMetadata,userMetadataKeys:Object.keys(userMetadata),registration_type:userMetadata.registration_type,registered_as:userMetadata.registered_as,refreshedUser:!!refreshedUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'LOGIN_VALIDATE'})}).catch(()=>{});
          // #endregion
          
          const [businessCheck, talentCheck] = await Promise.all([
            supabase.from('business_profiles').select('id, created_at').eq('user_id', userId).maybeSingle(),
            supabase.from('talent_profiles').select('id, created_at').eq('user_id', userId).maybeSingle()
          ])
          
          const hasBusinessProfile = !!businessCheck.data && !businessCheck.error
          const hasTalentProfile = !!talentCheck.data && !talentCheck.error
          
          // Check both localStorage AND user metadata for registration intent
          const registeredAsBusiness = wasRegisteredAsBusiness || registeredAsBusinessFromMetadata
          
          // If user has BOTH profiles, check creation timestamps to determine most recent registration
          let businessCreatedAfterTalent = false
          if (hasBusinessProfile && hasTalentProfile && businessCheck.data?.created_at && talentCheck.data?.created_at) {
            businessCreatedAfterTalent = new Date(businessCheck.data.created_at) > new Date(talentCheck.data.created_at)
          }
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/talent/page.tsx:signin:validate_result',message:'Profile validation result',data:{userId,hasBusinessProfile,hasTalentProfile,wasRegisteredAsBusiness,registeredAsBusinessFromMetadata,registeredAsBusiness,businessCreatedAfterTalent,willBlock:registeredAsBusiness || (hasBusinessProfile && !hasTalentProfile) || (businessCreatedAfterTalent && hasBusinessProfile && hasTalentProfile)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'LOGIN_VALIDATE'})}).catch(()=>{});
          // #endregion
          
          // CRITICAL RULE: Block talent login if:
          // 1. User has business profile but no talent profile, OR
          // 2. User registered as business (from metadata or localStorage) - even if they have both profiles, OR
          // 3. User has both profiles but business profile was created AFTER talent profile (most recent registration was as business)
          if ((hasBusinessProfile && !hasTalentProfile) || registeredAsBusiness || (businessCreatedAfterTalent && hasBusinessProfile && hasTalentProfile)) {
            setError('This email is registered as a Business account. Please use the Business login page.')
            await supabase.auth.signOut()
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/talent/page.tsx:signin:blocked',message:'Blocked - user registered as business or has business profile only',data:{userId,email:email.trim(),hasBusinessProfile,hasTalentProfile,registeredAsBusiness,registeredAsBusinessFromMetadata,wasRegisteredAsBusiness},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'LOGIN_VALIDATE'})}).catch(()=>{});
            // #endregion
            return
          }
        }
        
        // Only update metadata AFTER validation passes - this records that they successfully signed in as talent
        if (refreshedUser || signInData.user) {
          await supabase.auth.updateUser({
            data: {
              registration_type: 'talent',
              registered_as: 'talent'
            }
          })
        }
        
        router.replace(redirectTo)
        return
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      
      const { data: signUpData, error: err } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          data: {
            registration_type: 'talent',
            registered_as: 'talent',
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            phone: phone.trim() || null,
            mobile: mobile.trim() || null,
            enable_2fa: enable2FA
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
            registration_type: 'talent',
            registered_as: 'talent',
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            phone: phone.trim() || null,
            mobile: mobile.trim() || null,
            enable_2fa: enable2FA
          }
        })
      }
      
      router.replace(redirectTo)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md dashboard-card rounded-xl p-8 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-white text-xl font-bold hover:text-blue-400 transition-colors">
            Creerlio
          </Link>
          <Link href="/login/business" className="text-slate-300 hover:text-green-400 transition-colors text-sm">
            I’m a Business →
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{mode === 'signin' ? 'Talent sign in' : 'Create Talent account'}</h1>
        <p className="text-gray-400 text-sm mb-6">Talent can sign in with email/password or supported providers.</p>
        <p className="text-[11px] text-gray-500 mb-4">UI: {UI_VERSION}</p>

        {error && (
          <div className="mb-4 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-3 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => oauth('google')}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-sm font-semibold disabled:opacity-60"
          >
            Continue with Google
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => oauth('apple')}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-sm font-semibold disabled:opacity-60"
          >
            Continue with Apple
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setShowForgotPassword(false)
              setError(null)
            }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'signin' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setShowForgotPassword(false)
              setError(null)
            }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'signup' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'
            }`}
          >
            Create account
          </button>
        </div>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmail('')
                setError(null)
              }}
              className="w-full px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                      placeholder="John"
                      autoComplete="given-name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                      placeholder="Doe"
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                    placeholder="+1 234 567 8900"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={enable2FA}
                      onChange={(e) => setEnable2FA(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    />
                    <span className="text-sm font-medium text-gray-300">Enable Two-Factor Authentication</span>
                  </label>
                  {enable2FA && (
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 mt-2"
                      style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                      placeholder="Mobile number for 2FA"
                      autoComplete="tel"
                      required
                    />
                  )}
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                placeholder={mode === 'signin' ? '••••••••' : 'At least 8 characters'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}
            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}


