'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')
    const storedUserType = localStorage.getItem('user_type')
    
    setIsAuthenticated(!!token && !!email)
    if (storedUserType) {
      setUserType(storedUserType)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              Creerlio
            </Link>

            <nav className="hidden lg:flex items-center gap-x-8 text-sm text-slate-300">
              <Link href="/about" className="hover:text-blue-400 transition-colors">About</Link>
              <Link href="/#talent" className="hover:text-blue-400 transition-colors">Talent</Link>
              <Link href="/#business" className="hover:text-blue-400 transition-colors">Business</Link>
              <Link href="/analytics" className="hover:text-blue-400 transition-colors text-blue-400">Analytics</Link>
              <Link href="/search" className="hover:text-blue-400 transition-colors">Search</Link>
              <Link href="/jobs" className="hover:text-blue-400 transition-colors">Jobs</Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    href={userType === 'business' ? '/dashboard/business' : '/dashboard/talent'} 
                    className="hover:text-blue-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem('access_token')
                      localStorage.removeItem('user_email')
                      localStorage.removeItem('user_type')
                      setIsAuthenticated(false)
                      setUserType(null)
                      router.push('/')
                    }}
                    className="hover:text-blue-400 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : null}
            </nav>

            {isAuthenticated ? (
              <Link
                href={userType === 'business' ? '/dashboard/business' : '/dashboard/talent'}
                className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/dashboard/business"
                className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
              >
                Business Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
              Analytics & <span className="text-blue-400">Insights</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Data-driven insights for talent and business success
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-8">
              <div className="text-4xl font-bold text-green-400 mb-2">84.38%</div>
              <div className="text-slate-400">Match Accuracy</div>
            </div>
            <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-8">
              <div className="text-4xl font-bold text-blue-400 mb-2">655K+</div>
              <div className="text-slate-400">Active Talent</div>
            </div>
            <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-8">
              <div className="text-4xl font-bold text-purple-400 mb-2">12K+</div>
              <div className="text-slate-400">Businesses</div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="text-center space-y-6 py-12">
            <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-12">
              <h2 className="text-3xl font-bold mb-4">Advanced Analytics Coming Soon</h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
                We're building comprehensive analytics dashboards with real-time insights, 
                performance metrics, and predictive analytics for both talent and businesses.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-blue-400">For Talent</h3>
                  <ul className="space-y-1 text-slate-300">
                    <li>• Application success rates</li>
                    <li>• Skill demand trends</li>
                    <li>• Salary insights</li>
                    <li>• Career growth metrics</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-blue-400">For Business</h3>
                  <ul className="space-y-1 text-slate-300">
                    <li>• Hiring pipeline analytics</li>
                    <li>• Talent pool insights</li>
                    <li>• Time-to-hire metrics</li>
                    <li>• ROI tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-6 py-8">
            <Link
              href={isAuthenticated ? (userType === 'business' ? '/dashboard/business' : '/dashboard/talent') : '/dashboard/business'}
              className="inline-block px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
