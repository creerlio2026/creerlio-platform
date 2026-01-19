'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function TalentPage() {
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
              <Link href="/about" className="hover:text-[#20C997] transition-colors">About</Link>
              <Link href="/talent" className="hover:text-[#20C997] transition-colors text-[#20C997]">Talent</Link>
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

      {/* Hero Section */}
      <section className="w-full">
        <div className="relative w-full h-[600px] lg:h-[700px]">
          <Image
            src="/hero-person-ipad.jpg"
            alt="Person holding iPad showing Creerlio Talent Portfolio"
            fill
            className="object-cover object-top w-full h-full"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'block'
            }}
          />
          <div className="hidden absolute inset-0 bg-gradient-to-br from-gray-50 to-white">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400">Hero Image Placeholder</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
            <div className="w-14 h-14 bg-[#20C997]/10 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-[#20C997]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#20C997] mb-5">Visibility and Opportunities</h3>
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Showcase Skills and Achievements:</p>
                <p>• Highlight talents to unlock new opportunities.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Increased Exposure:</p>
                <p>• Engage with multiple businesses for the right job.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Career Development:</p>
                <p>• Gain feedback and mentorship from business interactions.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Better Fit and Satisfaction:</p>
                <p>• Cultural Alignment: Find companies that align with your values.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Long-Term Relationships:</p>
                <p>• Build stable, fulfilling careers.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
            <div className="w-14 h-14 bg-[#20C997]/10 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-[#20C997]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#20C997] mb-5">Maintain Control of your Privacy and Information</h3>
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Privacy of Information:</p>
                <p>You control what businesses see and for how long.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Avoiding Unsolicited Offers:</p>
                <p>Prevent data from being sold or e shared without your consent.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
            <div className="w-14 h-14 bg-[#20C997]/10 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-[#20C997]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#20C997] mb-5">Wasted Time in the Job Search Process</h3>
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Tailoring Resumes and Cover Letters:</p>
                <p>• Avoid repetitive resume customization.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Filling Out Online Forms:</p>
                <p>• Skip time-consuming online forms.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="text-center">
          <Link
            href="/login/talent?mode=signup&redirect=/dashboard/talent"
            className="inline-block px-12 py-4 rounded-lg bg-[#20C997] hover:bg-[#1DB886] text-white font-semibold text-lg transition-colors shadow-md"
          >
            GET STARTED – IT&apos;S FREE
          </Link>
        </div>
      </section>

      {/* Chat Button */}
      <Link
        href="/peopleselect/contact"
        className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-[#20C997] hover:bg-[#1DB886] text-white font-semibold text-sm shadow-lg transition-colors"
      >
        CHAT WITH US
      </Link>
    </div>
  )
}
