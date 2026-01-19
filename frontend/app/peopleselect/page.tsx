'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'
import { HeroSection } from '@/components/peopleselect/HeroSection'
import { HowItWorksSection } from '@/components/peopleselect/HowItWorksSection'
import { ImageBanner } from '@/components/peopleselect/ImageBanner'

export default function PeopleSelectHomePage() {
  const [scrollProgress, setScrollProgress] = useState(0)
  
  const heroVariant: 'A' | 'B' | 'C' = 'A'

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <HeroSection 
          variant={heroVariant}
          onScrollProgress={setScrollProgress}
        />

        {/* Core Model */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-black mb-4">A Recruitment Agency—Rebuilt</h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                PeopleSelect is a recruitment agency powered by Creerlio. We still manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We simply do it in a new way.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-10">
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                <h3 className="text-2xl font-bold text-black mb-4">What We Don't Use</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">×</span>
                    <span>Resumes and CVs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">×</span>
                    <span>ATS systems</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">×</span>
                    <span>Algorithmic matching</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">×</span>
                    <span>Job boards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">×</span>
                    <span>Automated ranking or scoring</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 p-8 rounded-lg border border-blue-200">
                <h3 className="text-2xl font-bold text-black mb-4">What We Do Use</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">✓</span>
                    <span>Creerlio's discovery platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">✓</span>
                    <span>Rich talent portfolios</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">✓</span>
                    <span>Business presence pages</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">✓</span>
                    <span>Genuine interest before recruitment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">✓</span>
                    <span>Full human-led recruitment process</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-xl text-gray-700 font-medium">
                Discovery first. Recruitment second. Human-led always.
              </p>
            </div>
          </div>
        </section>

        {/* Image Banner: Real Connections */}
        <ImageBanner
          src="/peopleselect-real-connections.jpg"
          alt="Real connections come from real choice - professional handshake representing human-led connections"
          heading="Real connections come from real choice."
          subheading="Talent chooses where to connect and engage."
          overlay="gradient"
        />

        <HowItWorksSection scrollProgress={scrollProgress} />

        {/* The Difference */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8 text-center">Not Job Boards. Not Resumes. Not ATS Systems.</h2>
            
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-lg border-l-4 border-red-500">
                <h3 className="text-2xl font-bold text-black mb-4">What Traditional Recruitment Uses</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Job board applications and resume stacks</li>
                  <li>• ATS systems filtering by keywords</li>
                  <li>• Reactive advertising and mass responses</li>
                  <li>• Static resumes from months ago</li>
                  <li>• Algorithmic matching and scoring</li>
                  <li>• Decisions based on limited information</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-2xl font-bold text-black mb-4">What PeopleSelect Uses</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Powered by Creerlio, we work with rich talent portfolios and business presence pages. Instead of resumes, businesses see complete portfolios with:
                </p>
                <ul className="space-y-3 text-gray-600 mb-4">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Real portfolios</strong> that evolve with careers, not static documents</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Discovery and exploration</strong> before recruitment begins</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Genuine interest</strong> from talent who choose to connect</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Full human-led process</strong> — we still interview, vet, consult, and place</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Business storytelling</strong> that attracts aligned people</span>
                  </li>
                </ul>
                <p className="text-gray-600 leading-relaxed font-medium">
                  This provides better information than resumes and ATS systems. Businesses see who people are, not just what they did. We still do the full recruitment work — we just start with discovery, not applications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Image Banner: People Before Resumes */}
        <ImageBanner
          src="/peopleselect-people-before-resumes.jpg"
          alt="People before resumes - professional conversation representing human-first recruitment"
          heading="People before resumes."
          subheading="Discovery first, hiring second."
          overlay="gradient"
        />

        {/* How PeopleSelect Works */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 bg-white">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-4xl font-bold text-black mb-4">How PeopleSelect Works</h2>
            <p className="text-lg text-gray-600">
              A recruitment agency powered by Creerlio's discovery platform. We still manage the full recruitment process — we just do it differently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-black mb-4">Powered by Creerlio</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Creerlio is a discovery platform. Talent builds portfolios and explores businesses. Businesses build their presence and attract interest. All connections are human-initiated and choice-driven.
              </p>
              <Link href="/peopleselect/about" className="text-blue-600 hover:text-blue-700 font-semibold">
                Learn about Creerlio →
              </Link>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-black mb-4">PeopleSelect: The Recruitment Agency</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We're a real recruitment agency. We manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We use Creerlio instead of resumes and ATS systems. But we still do the full recruitment work.
              </p>
              <Link href="/peopleselect/how-it-works" className="text-blue-600 hover:text-blue-700 font-semibold">
                See how we work →
              </Link>
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-600 italic">
              Creerlio is not a recruitment agency. PeopleSelect is. We're powered by Creerlio's discovery platform, but we still manage the full recruitment process.
            </p>
          </div>
        </section>

        {/* Image Banner: Human Yes */}
        <ImageBanner
          src="/peopleselect-human-yes.jpg"
          alt="Automated? No. Human? Yes. - smiling professional representing human-led recruitment"
          heading="Automated? No."
          subheading="Human? Yes."
          overlay="gradient"
        />

        {/* What We Do */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8 text-center">We Still Do the Full Recruitment Work</h2>
            
            <div className="space-y-8">
              <div className="flex gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-3">Discovery and Exploration</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Talent builds portfolios and explores businesses on Creerlio. Businesses build their presence and attract interest. This happens before recruitment begins. Genuine interest, not applications.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-3">PeopleSelect Manages Recruitment</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We review portfolios instead of resumes. We consult with businesses to understand needs. We interview and vet candidates. We facilitate connections and guide decisions. We still do all the recruitment work — just with portfolios, not resumes.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-3">Human-Led Placement</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We place candidates. We support onboarding. We manage the full recruitment process. We're a real recruitment agency — we just use Creerlio instead of resumes and ATS systems.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white p-8 rounded-lg border-l-4 border-blue-600">
              <h3 className="text-2xl font-bold text-black mb-4">The Key Difference</h3>
              <p className="text-gray-600 leading-relaxed">
                We start with discovery and exploration. Talent chooses businesses. Businesses attract aligned people. Then we manage the recruitment process — interviews, vetting, consultation, placement. We still do everything a recruitment agency does. We just don't start with job boards and resumes.
              </p>
            </div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-black mb-4">Trusted by Growing Australian Businesses</h2>
            <p className="text-lg text-gray-600 mb-8">
              We work with businesses who value quality over speed, relationships over transactions, and discovery over applications.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 bg-gray-900 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Experience Recruitment Rebuilt?</h2>
            <p className="text-xl text-gray-300 mb-10">
              Discovery first. Recruitment second. Human-led always. Powered by Creerlio, managed by PeopleSelect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/peopleselect/for-employers"
                className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                Build Your Business Presence
              </Link>
              <Link
                href="/peopleselect/for-candidates"
                className="inline-block px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
              >
                Explore Businesses
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
