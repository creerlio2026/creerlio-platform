'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectParam = params.get('redirect')
  const redirectToFromParam = redirectParam || '/dashboard/talent'
  const initialMode = params.get('mode')
  const roleParam = params.get('role')

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [role, setRole] = useState<'talent' | 'business'>('talent')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo =
    redirectParam ||
    (role === 'business' ? '/dashboard/business' : '/dashboard/talent')

  useEffect(() => {
    if (initialMode === 'signup') setMode('signup')
    if (initialMode === 'signin') setMode('signin')

    // Infer role from query params and/or redirect target (no guessing in dashboards)
    if (roleParam === 'business' || roleParam === 'talent') {
      setRole(roleParam)
    } else if (redirectToFromParam.includes('/dashboard/business')) {
      setRole('business')
    } else if (redirectToFromParam.includes('/dashboard/talent')) {
      setRole('talent')
    } else {
      try {
        const v = localStorage.getItem('creerlio_active_role')
        if (v === 'business' || v === 'talent') setRole(v)
      } catch {}
    }

    supabase.auth.getSession().then(({ data }) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-login',hypothesisId:'E',location:'frontend/app/login/page.tsx:mount',message:'login mount params/state',data:{mode:initialMode??null,roleParam:roleParam??null,redirectParam:redirectParam??null,computedRole:role,computedRedirect:redirectTo,hasSession:!!data.session?.user?.id},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (data.session?.user?.id) router.replace(redirectTo)
    }).catch(() => {})
  }, [router, redirectTo, initialMode, roleParam, redirectToFromParam, redirectParam])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (!email.trim() || !password) {
        setError('Email and password are required.')
        return
      }

      try {
        localStorage.setItem('creerlio_active_role', role)
        // Some pages still rely on this legacy key
        localStorage.setItem('user_type', role)
      } catch {}
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-login',hypothesisId:'F',location:'frontend/app/login/page.tsx:submit',message:'login submit',data:{mode,role,redirectTo},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (mode === 'signin') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (signInErr) {
          setError(signInErr.message)
          return
        }
        router.replace(redirectTo)
        return
      }

      const { error: signUpErr } = await supabase.auth.signUp({ email: email.trim(), password })
      if (signUpErr) {
        setError(signUpErr.message)
        return
      }
      // Some projects require email confirmation; still route to redirect.
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
          <Link href={redirectTo} className="text-slate-300 hover:text-blue-400 transition-colors text-sm">
            Continue →
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
        <p className="text-gray-400 text-sm mb-6">
          Messaging, Talent Bank, and dashboards require an authenticated session.
        </p>

        <div className="mb-5">
          <p className="text-xs text-gray-500 mb-2">Choose your role for this session</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('talent')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                role === 'talent' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'
              }`}
            >
              Talent
            </button>
            <button
              type="button"
              onClick={() => setRole('business')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                role === 'business' ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'
              }`}
            >
              Business
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You’ll be sent to the {role === 'business' ? 'Business' : 'Talent'} Dashboard after {mode === 'signin' ? 'sign in' : 'signup'}.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'signin'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'signup'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'
            }`}
          >
            Create account
          </button>
        </div>

        {error && (
          <div className="mb-4 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6">
          If your project requires email confirmation, you may need to confirm before full access.
        </p>
      </div>
    </div>
  )
}


