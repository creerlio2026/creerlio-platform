'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function AboutPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setIsAuthenticated(!!data.session?.user?.id)
      } catch {
        setIsAuthenticated(false)
      }
    }

    checkAuth().catch(() => {})
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkAuth().catch(() => {})
    })

    return () => {
      sub?.subscription?.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-0">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <span className="px-4 py-2 rounded-full bg-[#20C997] text-white text-base font-bold">
                CREERLIO
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-x-8 text-sm text-white">
              <Link href="/about" className="hover:text-[#20C997] transition-colors text-[#20C997]">About</Link>
              <Link href="/#talent" className="hover:text-[#20C997] transition-colors">Talent</Link>
              <Link href="/#business" className="hover:text-[#20C997] transition-colors">Business</Link>
              <Link href="/search" className="hover:text-[#20C997] transition-colors">Search</Link>
              <Link href="/jobs" className="hover:text-[#20C997] transition-colors">Jobs</Link>
              {isAuthenticated && (
                <>
                  <Link href="/dashboard/talent" className="hover:text-[#20C997] transition-colors">Dashboard</Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      router.refresh()
                    }}
                    className="hover:text-[#20C997] transition-colors text-left"
                  >
                    Sign out
                  </button>
                </>
              )}
            </nav>

            <div className="flex gap-3">
              {!isAuthenticated ? (
                <>
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
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard/talent"
                    className="px-5 py-2 rounded-lg bg-[#20C997] hover:bg-[#1DB886] font-semibold text-sm text-white transition-colors"
                  >
                    Talent Dashboard
                  </Link>
                  <Link
                    href="/dashboard/business"
                    className="px-5 py-2 rounded-lg bg-[#20C997] hover:bg-[#1DB886] font-semibold text-sm text-white transition-colors"
                  >
                    Business Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="relative w-full h-[calc(100vh-88px)] bg-white">
        <Image
          src="/about page creerlio image 2.jpg"
          alt="Creerlio About Page"
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </section>
    </div>
  )
}
