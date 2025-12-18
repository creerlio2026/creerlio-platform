"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios';

const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
});

export default function Home() {
  const router = useRouter()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'talent' | 'business'>('talent');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    // Set active tab based on URL hash
    const hash = window.location.hash
    if (hash === '#business') {
      setActiveTab('business')
    } else if (hash === '#talent') {
      setActiveTab('talent')
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash
      if (newHash === '#business') {
        setActiveTab('business')
      } else if (newHash === '#talent') {
        setActiveTab('talent')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    
    // Check auth status
    const checkAuth = () => {
      const token = localStorage.getItem('access_token')
      const email = localStorage.getItem('user_email')
      const storedUserType = localStorage.getItem('user_type')
      
      setIsAuthenticated(!!token && !!email)
      if (storedUserType) {
        setUserType(storedUserType)
      }
      
      // Try to get user type if authenticated but not stored
      if (token && email && !storedUserType) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        axios.get(`${apiUrl}/api/auth/me`, {
          params: { email },
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          const userType = response.data.user_type
          setUserType(userType)
          localStorage.setItem('user_type', userType)
        }).catch(() => {
          // If auth fails, clear auth state
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_email')
          localStorage.removeItem('user_type')
          setIsAuthenticated(false)
        })
      }
    }
    
    checkAuth()
    // Listen for storage changes (logout from other tabs)
    window.addEventListener('storage', checkAuth)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('storage', checkAuth)
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: -33.8688, lng: 151.2093 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocation({ lat: -33.8688, lng: 151.2093 });
      }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              Creerlio
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-x-8 text-sm text-slate-300">
              <Link href="/about" className="hover:text-blue-400 transition-colors">About</Link>
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

            {/* CTA Button */}
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

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10">
            <button
              onClick={() => {
                setActiveTab('talent')
                window.location.hash = '#talent'
              }}
              className={`px-6 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'talent'
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Talent
              {activeTab === 'talent' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('business')
                window.location.hash = '#business'
              }}
              className={`px-6 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'business'
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Business
              {activeTab === 'business' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-8 py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* LEFT COPY - Hero text aligned left */}
        <div className="space-y-8 text-left">
          {activeTab === 'talent' ? (
            <>
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
                Find Your Next<br />
                <span className="text-blue-400 drop-shadow-[0_0_30px_rgba(96,165,250,0.9)]">
                  Opportunity
                </span>
              </h1>
              <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                Showcase your skills with rich multimedia portfolios, connect with top employers,
                and leverage AI-powered matching to find the perfect role.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold"
                >
                  Create Profile
                </Link>
                <Link
                  href="/dashboard/talent"
                  className="px-6 py-3 rounded-xl border border-blue-400/60 text-blue-300 hover:bg-blue-500/10"
                >
                  Talent Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
                Hire Smarter with<br />
                <span className="text-blue-400 drop-shadow-[0_0_30px_rgba(96,165,250,0.9)]">
                  AI-Powered Matching
                </span>
              </h1>
              <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                Access deep talent insights, location intelligence, and proactive workforce strategy.
                Find the right candidates faster with AI-powered matching.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold"
                >
                  Get Started
                </Link>
                <Link
                  href="/dashboard/business"
                  className="px-6 py-3 rounded-xl border border-blue-400/60 text-blue-300 hover:bg-blue-500/10"
                >
                  Business Dashboard
                </Link>
              </div>
            </>
          )}
        </div>

        {/* RIGHT VISUAL - Stats and Map aligned right */}
        <div className="relative rounded-3xl bg-slate-900/70 border border-blue-500/20 shadow-2xl p-6">

          {/* STATS - Aligned right */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl bg-slate-800/70 p-5 text-right">
              <div className="text-green-400 text-3xl font-bold">84.38%</div>
              <div className="text-slate-400 text-sm">Match Accuracy</div>
            </div>
            <div className="rounded-xl bg-slate-800/70 p-5 text-right">
              <div className="text-blue-400 text-3xl font-bold">655K</div>
              <div className="text-slate-400 text-sm">Active Talent</div>
            </div>
          </div>

          {/* MAP - Centered on user location */}
          <div className="relative h-[420px] rounded-2xl overflow-hidden border border-blue-500/20 bg-slate-950">
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

      {/* ================= FEATURES ================= */}
      <section className="max-w-7xl mx-auto px-8 py-28">
        <h2 className="text-4xl font-bold mb-14 text-left">
          {activeTab === 'talent' ? 'For Talent' : 'For Business'}
        </h2>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {activeTab === 'talent' ? (
            <>
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3">Rich Multimedia Portfolios</h3>
                <p className="text-slate-400">
                  Go beyond CVs with video, images, credentials, and interactive
                  talent profiles designed for modern hiring.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3">AI-Powered Matching</h3>
                <p className="text-slate-400">
                  Get matched with opportunities that align with your skills,
                  experience, and career goals.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3">Location Insights</h3>
                <p className="text-slate-400">
                  Discover opportunities based on location preferences,
                  commute zones, and relocation feasibility.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3">Business Intelligence</h3>
                <p className="text-slate-400">
                  Workforce analytics, AI matching, and proactive hiring insights
                  built for scale.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3">Talent Discovery</h3>
                <p className="text-slate-400">
                  Access deep talent pools with rich profiles, skills matching,
                  and location-based search capabilities.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-8">
                <h3 className="text-xl font-semibold mb-3">Location Intelligence</h3>
                <p className="text-slate-400">
                  Map-based insights into talent density, relocation feasibility,
                  commute zones, and opportunity distribution.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
