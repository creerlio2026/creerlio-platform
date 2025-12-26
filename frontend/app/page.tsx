'use client'

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'talent' | 'business'>('talent');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    // Set active tab based on URL hash
    const hash = window.location.hash;
    if (hash === '#business') {
      setActiveTab('business');
    } else if (hash === '#talent') {
      setActiveTab('talent');
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash;
      if (newHash === '#business') {
        setActiveTab('business');
      } else if (newHash === '#talent') {
        setActiveTab('talent');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Supabase auth status (source of truth)
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session?.user?.id);
        // Debug logging disabled
      } catch {
        setIsAuthenticated(false);
        // Debug logging disabled
      }
    };

    checkAuth().catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkAuth().catch(() => {});
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      sub?.subscription?.unsubscribe();
    };
  }, []);


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
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.refresh();
                  }}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Sign out
                </button>
              )}
            </nav>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/login/talent?mode=signup&redirect=/dashboard/talent"
                    className="px-4 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 font-semibold text-sm text-blue-100 transition-colors"
                  >
                    Create Talent Account
                  </Link>
                  <Link
                    href="/login/business?mode=signup&redirect=/dashboard/business"
                    className="px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 font-semibold text-sm text-green-100 transition-colors"
                  >
                    Create Business Account
                  </Link>
                  <Link
                    href="/login/talent?mode=signin&redirect=/dashboard/talent"
                    className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard/talent"
                    className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
                  >
                    Talent Dashboard
                  </Link>
                  <Link
                    href="/dashboard/business"
                    className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 font-semibold text-sm text-white transition-colors"
                  >
                    Business Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= TALENT CONTENT ================= */}
      {activeTab === 'talent' ? (
        <>
          {/* Hero Section with Map */}
          <section className="max-w-7xl mx-auto px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Hero Text - Left Side */}
              <div className="space-y-6 text-left">
                <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
                  Empower Yourself with a <span className="text-blue-400">CREERLIO Talent Portfolio</span>
                </h1>
                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold text-blue-400">See MORE</p>
                  <p className="text-xl text-slate-300">Far more than just a Resume!</p>
                </div>
                <p className="text-lg text-slate-300">
                  At <span className="text-green-400 font-semibold">NO COST</span> to You to Build, Maintain and Connect Your Private Portfolio
                </p>
              </div>

              {/* Map - Right Side */}
              <div className="flex justify-end">
                {isMapExpanded ? (
                  <div 
                    className="fixed inset-4 z-50 bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-blue-500/20 shadow-2xl p-6"
                    onClick={() => setIsMapExpanded(false)}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden border border-blue-500/20 bg-slate-950">
                      {location ? (
                        <MapboxMap center={location} zoom={12} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          Loading map...
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMapExpanded(false);
                      }}
                      className="absolute top-6 right-6 z-10 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 rounded-lg text-white font-semibold border border-white/20"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div 
                    className="relative w-[400px] h-[400px] rounded-2xl bg-slate-900/70 border border-blue-500/20 shadow-2xl p-4 cursor-pointer hover:border-blue-500/50 transition-all"
                    onClick={() => setIsMapExpanded(true)}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden border border-blue-500/20 bg-slate-950">
                      {location ? (
                        <MapboxMap center={location} zoom={10} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          Loading map...
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-white text-sm font-medium">
                      Click to expand
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Visibility and Opportunities */}
          <section className="max-w-7xl mx-auto px-8 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-8">
                <div className="h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <div className="text-6xl">📊</div>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-white">Visibility and Opportunities</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Showcase Skills and Achievements:</h3>
                    <p className="text-slate-300">Professional portfolios provide a platform to highlight talents comprehensively.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Increased Exposure:</h3>
                    <p className="text-slate-300">Continuous engagement with multiple businesses increases chances of finding the right job.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Career Development:</h3>
                    <p className="text-slate-300">Opportunities for feedback and mentorship from business interactions.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Take Initiative:</h3>
                    <p className="text-slate-300">Proactively reaching out to employers shows initiative and enthusiasm, setting you apart from other candidates who wait for job postings.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Maintain Control of Privacy */}
          <section className="max-w-7xl mx-auto px-8 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-8">
                <div className="h-64 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center relative">
                  <div className="text-6xl">🤝</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-500/80 rounded-full flex items-center justify-center border-4 border-white">
                      <div className="w-8 h-8 bg-white rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-white">Maintain Control of your Privacy and Information</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Privacy of Information:</h3>
                    <p className="text-slate-300">No longer will you lose control of your information like you currently do when you apply for Jobs or send your Resume and documents for employment consideration. You choose what Business see when they see it and how long they see it for!</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Avoiding Unsolicited Offers:</h3>
                    <p className="text-slate-300">Controlling your information helps prevent your data from being sold or shared without your consent, leading to unsolicited job offers or marketing communications.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Better Fit and Satisfaction */}
          <section className="max-w-7xl mx-auto px-8 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-8">
                <div className="h-64 bg-white rounded-xl flex items-center justify-center">
                  <div className="text-6xl">🧩</div>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-white">Better Fit and Satisfaction</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Cultural Alignment:</h3>
                    <p className="text-slate-300">Better chances of finding a company that aligns with personal values and career goals.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Long-Term Relationships:</h3>
                    <p className="text-slate-300">Building relationships with businesses leads to more stable and fulfilling careers.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Flexibility:</h3>
                    <p className="text-slate-300">A better fit often includes a company that supports a healthy work-life balance, offering flexible working hours, remote work options, and understanding personal commitments.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Positive Work Environment:</h3>
                    <p className="text-slate-300">A good fit often translates to a positive, supportive work environment that promotes mental and physical well-being.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Wasted Time in Job Search */}
          <section className="max-w-7xl mx-auto px-8 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-8">
                <div className="h-64 bg-red-500 rounded-xl flex items-center justify-center">
                  <div className="text-6xl text-white">👥</div>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-white">Wasted Time in the Job Search Process</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Tailoring Resumes and Cover Letters:</h3>
                    <p className="text-slate-300">Customizing your resume and cover letter for each job application takes considerable time.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Filling Out Online Forms:</h3>
                    <p className="text-slate-300">Many job applications require detailed online forms, which can be repetitive and time-consuming.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Scheduling and Attending Interviews:</h3>
                    <p className="text-slate-300">Coordinating schedules, traveling to the interview location, and attending multiple rounds of interviews can consume several hours or even days.</p>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-semibold text-lg mb-2">Researching Companies:</h3>
                    <p className="text-slate-300">Understanding the company's history, culture, and values requires thorough research.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Business Content - Keep existing */}
          <section className="max-w-7xl mx-auto px-8 py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8 text-left">
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
                  href="/dashboard/business"
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
            </div>

            {isMapExpanded ? (
              <div 
                className="fixed inset-4 z-50 bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-blue-500/20 shadow-2xl p-6"
                onClick={() => setIsMapExpanded(false)}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden border border-blue-500/20 bg-slate-950">
                  {location ? (
                    <MapboxMap center={location} zoom={12} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      Loading map...
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMapExpanded(false)
                  }}
                  className="absolute top-6 right-6 z-10 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 rounded-lg text-white font-semibold border border-white/20"
                >
                  Close
                </button>
              </div>
            ) : (
              <div 
                className="relative rounded-3xl bg-slate-900/70 border border-blue-500/20 shadow-2xl p-6 cursor-pointer hover:border-blue-500/50 transition-all"
                onClick={() => setIsMapExpanded(true)}
              >
                <div className="relative h-[500px] rounded-2xl overflow-hidden border border-blue-500/20 bg-slate-950">
                  {location ? (
                    <MapboxMap center={location} zoom={10} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      Loading map...
                    </div>
                  )}
                </div>
                <div className="absolute bottom-6 right-6 px-3 py-1 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-white text-sm font-medium">
                  Click to expand
                </div>
              </div>
            )}
          </section>

          <section className="max-w-7xl mx-auto px-8 py-28">
            <h2 className="text-4xl font-bold mb-14 text-left">For Business</h2>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
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
            </div>
          </section>
        </>
      )}

    </div>
  );
}
