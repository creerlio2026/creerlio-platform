'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
})

export default function AboutPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')
    const storedUserType = localStorage.getItem('user_type')
    
    setIsAuthenticated(!!token && !!email)
    if (storedUserType) {
      setUserType(storedUserType)
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: -33.8688, lng: 151.2093 })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {
        setLocation({ lat: -33.8688, lng: 151.2093 })
      }
    )
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
              <Link href="/about" className="hover:text-blue-400 transition-colors text-blue-400">About</Link>
              <Link href="/#talent" className="hover:text-blue-400 transition-colors">Talent</Link>
              <Link href="/#business" className="hover:text-blue-400 transition-colors">Business</Link>
              <Link href="/analytics" className="hover:text-blue-400 transition-colors">Analytics</Link>
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
              ) : (
                <>
                  <Link href="/login" className="hover:text-blue-400 transition-colors">Login</Link>
                  <Link href="/register" className="hover:text-blue-400 transition-colors">Register</Link>
                </>
              )}
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
                href="/register"
                className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
              >
                Free Trial
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
              About <span className="text-blue-400">Creerlio</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              AI-powered talent and business platform connecting opportunities with the right people
            </p>
          </div>

          {/* Mission Section */}
          <section className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Our Mission</h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                Creerlio revolutionizes talent acquisition and business hiring through intelligent AI-powered matching, 
                location-based insights, and rich multimedia portfolios. We bridge the gap between talented individuals 
                and forward-thinking businesses.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-6">
              <div className="relative h-[400px] rounded-xl overflow-hidden border border-blue-500/20 bg-slate-950">
                {location ? (
                  <MapboxMap center={location} zoom={10} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    Loading map...
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-center">What We Offer</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3 text-blue-400">For Talent</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Rich multimedia portfolios</li>
                  <li>• AI-powered job matching</li>
                  <li>• Location-based opportunities</li>
                  <li>• Career insights and analytics</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3 text-blue-400">For Business</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Intelligent talent discovery</li>
                  <li>• Workforce analytics</li>
                  <li>• Location intelligence</li>
                  <li>• Streamlined hiring process</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3 text-blue-400">Technology</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Advanced AI matching</li>
                  <li>• Real-time analytics</li>
                  <li>• Secure platform</li>
                  <li>• Scalable infrastructure</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-6 py-12">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg text-slate-300">
              Join thousands of talent and businesses already using Creerlio
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold"
              >
                Create Account
              </Link>
              <Link
                href="/jobs"
                className="px-6 py-3 rounded-xl border border-blue-400/60 text-blue-300 hover:bg-blue-500/10"
              >
                Browse Jobs
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
