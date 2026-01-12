'use client'

import { useState } from 'react'

export default function TestRegisterPage() {
  const [email, setEmail] = useState('test@creerlio.com')
  const [password, setPassword] = useState('testpassword123')
  const [role, setRole] = useState('talent')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/register-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ Success! User created: ${data.user.email}. You can now sign in at /login`)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-slate-800 rounded-xl border border-white/10 p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Test User Registration</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white text-black border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white text-black border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white text-black border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="talent">Talent</option>
              <option value="business">Business</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Test User'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-500/20 border border-green-500/40 text-green-200' : 'bg-red-500/20 border border-red-500/40 text-red-200'}`}>
            {message}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-slate-400">
            After creating a user, go to{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
              /login
            </a>
            {' '}to sign in
          </p>
        </div>
      </div>
    </div>
  )
}
