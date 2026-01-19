'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'
import { ImageBanner } from '@/components/peopleselect/ImageBanner'

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Image Banner */}
        <ImageBanner
          src="/peopleselect-attract-people.jpg"
          alt="Attract people, don't sort through resumes - professional reviewing portfolios on tablet representing portfolio-based recruitment"
          heading="Attract people, don't sort through resumes."
          subheading="Showcase who you are and draw in real interest."
          overlay="gradient"
          priority={true}
        />

        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Build Your Business Presence on Creerlio</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                On Creerlio, businesses build their presence and tell their story. You showcase your culture, values, opportunities, and what makes you unique. Talent discovers and explores you. Interest flows both ways — human-initiated, not automated.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                You build a <strong className="text-black">business presence</strong> that represents who you are. This includes your story, culture, values, growth paths, and opportunities. This becomes your recruitment presence — not a one-off job ad, but a living profile that attracts aligned talent.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">You Attract Aligned People</h3>
                <p className="text-gray-600 leading-relaxed">
                  Talent explores businesses on Creerlio. They see your story, understand your culture, and discover opportunities. When they're interested, they choose to connect. You receive genuine interest from people who chose you.
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">You Don't Sort Through Resume Spam</h3>
                <p className="text-gray-600 leading-relaxed">
                  You review portfolios instead of resumes. You see complete professional context, not just employment history. You choose which portfolios to engage with. No ATS filters. No keyword matching. Human judgment, not automated systems.
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">You Receive Genuine Interest</h3>
                <p className="text-gray-600 leading-relaxed">
                  Talent explores businesses and chooses who to connect with. You receive interest from people who discovered you and chose you. Genuine interest, not applications into a void.
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">You Don't Rely on ATS Filters</h3>
                <p className="text-gray-600 leading-relaxed">
                  We don't use ATS systems. We don't filter by keywords. We don't rank or score candidates algorithmically. You review portfolios and make decisions based on human judgment, not automated systems.
                </p>
              </div>
            </div>

            {/* Mid-Page Image Banner */}
            <ImageBanner
              src="/peopleselect-real-connections.jpg"
              alt="Real connections come from real choice - professional handshake representing human-led business connections"
              heading="Real connections come from real choice."
              subheading="Talent chooses where to connect and engage."
              overlay="gradient"
            />

            <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
              <h3 className="text-2xl font-bold text-black mb-4">PeopleSelect Manages Recruitment</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Many businesses use Creerlio directly. PeopleSelect is a recruitment agency that works with businesses who want us to manage the full recruitment process.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We review portfolios instead of resumes. We interview candidates. We vet backgrounds. We consult with businesses to understand needs and assess fit. We facilitate conversations and guide decisions. We place candidates. We still do everything a recruitment agency does.
              </p>
              <p className="text-gray-700 leading-relaxed">
                The difference is we use Creerlio's discovery platform instead of job boards and ATS systems. We work with portfolios instead of resumes. But we still manage the full recruitment process.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">How It Works for Businesses</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-black mb-3">1. Build Your Presence on Creerlio</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Create your business presence on Creerlio. Showcase your story, culture, values, and opportunities. This becomes your recruitment presence — a living profile that attracts aligned talent.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-black mb-3">2. Attract Interest</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Talent explores businesses on Creerlio. They discover you, understand your culture, and choose to connect. You receive genuine interest from people who chose you.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-black mb-3">3. Review Portfolios</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You review portfolios instead of resumes. You see complete professional context, not just employment history. You choose which portfolios to engage with. Human judgment, not ATS filters.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-black mb-3">4. PeopleSelect Manages Recruitment</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We review portfolios, interview candidates, vet backgrounds, consult on fit, and place talent. We manage the full recruitment process. We still do all the work — we just use portfolios instead of resumes.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-black mb-3">5. You Get Human Support</h3>
                  <p className="text-gray-600 leading-relaxed">
                    PeopleSelect provides human support throughout the recruitment process. We consult, guide, and facilitate. We manage recruitment — we don't automate it. You get human recruitment support when you need it.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 text-white p-10 rounded-lg">
              <h2 className="text-3xl font-bold mb-6">Not Job Boards. Not Resumes. Not ATS Systems.</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We don't use job boards. We don't use resumes. We don't use ATS systems. We use Creerlio's discovery platform and portfolios. But we still manage the full recruitment process.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Discovery first. Recruitment second. Human-led always. Powered by Creerlio, managed by PeopleSelect.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">Ready to Build Your Presence?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Build your business presence on Creerlio. Attract aligned talent. Let PeopleSelect manage the full recruitment process.
            </p>
            <Link
              href="/peopleselect/contact"
              className="inline-block px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg"
            >
              Build Your Business Presence
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
