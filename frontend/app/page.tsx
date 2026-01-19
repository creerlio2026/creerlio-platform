'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
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
                    className="px-4 py-2 rounded-lg bg-[#2B4EA2] hover:bg-[#243F86] font-semibold text-sm text-white transition-colors"
                  >
                    Create Talent Account
                  </Link>
                  <Link
                    href="/login/business?mode=signup&redirect=/dashboard/business"
                    className="px-4 py-2 rounded-lg bg-[#2B4EA2] hover:bg-[#243F86] font-semibold text-sm text-white transition-colors"
                  >
                    Create Business Account
                  </Link>
                  <Link
                    href="/login/talent?mode=signin&redirect=/dashboard/talent"
                    className="px-5 py-2 rounded-lg bg-[#2B4EA2] hover:bg-[#243F86] font-semibold text-sm text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard/talent"
                    className="px-5 py-2 rounded-lg bg-[#2B4EA2] hover:bg-[#243F86] font-semibold text-sm text-white transition-colors"
                  >
                    Talent Dashboard
                  </Link>
                  <Link
                    href="/dashboard/business"
                    className="px-5 py-2 rounded-lg bg-[#2B4EA2] hover:bg-[#243F86] font-semibold text-sm text-white transition-colors"
                  >
                    Business Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="bg-white text-gray-900">
        {/* Hero */}
        <section className="relative w-full min-h-screen overflow-hidden">
          <div
            className="absolute inset-0 bg-center bg-contain bg-no-repeat"
            style={{ backgroundImage: "url('/talent-portfolio.jpg')" }}
          />
          <div className="absolute inset-0 bg-transparent" />
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-24 lg:py-28" />
        </section>

        {/* Engagement and Relationships */}
        <section className="w-full bg-[#0e0e0e]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="max-w-3xl space-y-6">
              <h2 className="text-3xl font-bold text-white">Engagement and Relationships</h2>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#20C997]" aria-hidden="true" />
                  <span>
                    <span className="text-white font-semibold">Stronger Engagement:</span> Ongoing interactions build stronger connections between businesses and candidates.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#20C997]" aria-hidden="true" />
                  <span>
                    <span className="text-white font-semibold">Proactive Talent Management:</span> Continuous relationship-building allows for proactive workforce planning.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#20C997]" aria-hidden="true" />
                  <span>
                    <span className="text-white font-semibold">Trust and Loyalty:</span> Candidates are more likely to commit to a company they have a relationship with.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Who Is Creerlio For */}
        <section className="w-full bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Who Is Creerlio For?</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Talent',
                  body: 'Build private portfolios, control visibility, and connect with businesses on your terms.',
                },
                {
                  title: 'Business',
                  body: 'Let the right talent discover you and respond to intentional connection requests.',
                },
                {
                  title: 'Public',
                  body: 'Browse businesses and jobs without creating an account.',
                },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-gray-100 p-6 shadow-sm bg-white">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-gray-600">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Discovery Flow */}
        <section className="w-full bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Discover → Request → Connect</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: 'Discover', body: 'Explore businesses and jobs with no friction or noise.' },
                { title: 'Request', body: 'Talent initiates connection requests with intent and context.' },
                { title: 'Connect', body: 'Businesses respond to real interest, not cold outreach.' },
              ].map((step) => (
                <div key={step.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cost Efficiency */}
        <section className="w-full bg-[#0e0e0e]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="max-w-3xl space-y-6">
              <h2 className="text-3xl font-bold text-white">Cost Efficiency</h2>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#20C997]" aria-hidden="true" />
                  <span>Reduction in Recruitment Costs: Eliminates fees paid to external recruiters and agencies.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#20C997]" aria-hidden="true" />
                  <span>Lower Advertising Costs: Reduced need for extensive job advertisements due to direct relationships.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#20C997]" aria-hidden="true" />
                  <span>Reduced Time-to-Hire: Faster recruitment process as businesses already have access to a pool of potential candidates.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Private Talent Portfolios */}
        <section className="w-full bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="max-w-3xl space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">Private Talent Portfolios</h2>
              <p className="text-gray-600 text-lg">
                Private by default. Visibility is controlled by talent. No public broadcasting.
              </p>
            </div>
          </div>
        </section>

        {/* Business Profiles */}
        <section className="w-full bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="max-w-3xl space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Stop chasing candidates. Let them discover you.
              </h2>
              <p className="text-gray-600 text-lg">
                Publish your profile once. Let talent explore and request connections when it makes sense.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy & Information Control */}
        <section className="w-full bg-[#0e0e0e]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="max-w-3xl space-y-6">
              <h2 className="text-3xl font-bold text-white">Maintain Control of your Privacy and Information</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  <span className="text-orange-600 font-semibold">Privacy of Information:</span> No longer will you lose control of your information like you currently do when you apply for jobs or send your Resume and documents for employment consideration. You choose what Business see when they see it and how long they see it for!
                </p>
                <p>
                  <span className="text-orange-600 font-semibold">Avoiding Unsolicited Offers:</span> Controlling your information helps prevent your data from being sold or shared without your consent, leading to unsolicited job offers or marketing communications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Jobs */}
        <section className="w-full bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Jobs</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-6">
                <p className="text-gray-700 font-medium">Jobs are public</p>
                <p className="text-gray-600 mt-2">Open roles can be discovered without login.</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6">
                <p className="text-gray-700 font-medium">Applying requires a portfolio</p>
                <p className="text-gray-600 mt-2">Less noise, better fit, and clearer intent.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PeopleSelect */}
        <section className="w-full bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 flex flex-col gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Powered by Creerlio. Managed by PeopleSelect.
              </h2>
              <p className="text-gray-600">
                A trusted operating layer for curated opportunities and responsible connections.
              </p>
            </div>
          </div>
        </section>

        {/* Governance & Trust */}
        <section className="w-full bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Governance &amp; Trust</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: 'Permissioned connections', body: 'Connections happen by intent, not by default.' },
                { title: 'Privacy controls', body: 'Talent controls visibility across portfolio sections.' },
                { title: 'Australian platform', body: 'Built for local trust, clarity, and compliance.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 flex flex-col gap-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Start with intent</h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/search"
                  className="px-6 py-3 rounded-xl bg-[#2B4EA2] hover:bg-[#243F86] text-white font-semibold transition-colors"
                >
                  Search Businesses or Jobs
                </Link>
                <Link
                  href="/login/talent?mode=signup&redirect=/dashboard/talent"
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 font-semibold transition-colors"
                >
                  Create a Private Talent Portfolio
                </Link>
                <Link
                  href="/peopleselect/contact"
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 font-semibold transition-colors"
                >
                  Book a Call
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between text-sm text-gray-600">
          <span>© {new Date().getFullYear()} Creerlio</span>
          <Link href="/terms" className="hover:text-[#2B4EA2] transition-colors">
            Terms and Conditions
          </Link>
        </div>
      </footer>
    </div>
  )
}
