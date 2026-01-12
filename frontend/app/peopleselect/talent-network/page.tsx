'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function TalentNetworkPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">Our Talent Network</h1>
            <p className="text-xl text-gray-600">
              Professionals in our network aren't inventory. They're skilled individuals in ongoing dialogue with us, with profiles richer than CVs.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Not Inventory — Relationships</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Traditional recruitment treats candidates as inventory: names in a database, CVs in a folder, responses to job ads. We take a different approach.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Professionals in our network are individuals we know beyond their resume. We understand their career goals, current situation, skills development, and readiness to move. This relationship-based approach enables better matches and faster placements.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Professionals in Ongoing Dialogue</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                We maintain regular contact with professionals in our network. This isn't transactional — it's an ongoing dialogue about their career progression, interests, and opportunities.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                This means when a role opens, we don't start from scratch. We engage professionals we already understand, who already know us, and who trust our approach to recruitment.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                The result: faster placements, better cultural fit, and higher retention rates. Because we're matching based on deep understanding, not just skills alignment.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Profiles Richer Than CVs</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                A CV is a static snapshot from months ago. It tells you what someone did, not who they are today. Living talent portfolios in our network show real-time updates: new skills, achievements, career movements, and evolving motivations.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                These portfolios include work samples, project outcomes, testimonials, and career narratives. They paint a complete picture of the professional — not just their employment history.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                When we present talent to you, we're sharing a comprehensive view based on current information and ongoing relationships. This enables better hiring decisions.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Access to Ready-to-Move Talent</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Because we maintain ongoing relationships, we know who's ready to move before they update their LinkedIn or respond to job ads. This gives you access to passive talent — professionals who aren't actively job searching but are open to the right opportunity.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our internal talent relationship system tracks availability, career intent, and readiness indicators. When you need to hire, we can activate this intelligence immediately, connecting you with professionals ready to engage.
              </p>
            </div>

            <div className="bg-gray-900 text-white p-10 rounded-lg">
              <h2 className="text-3xl font-bold mb-6">Living Talent Portfolios</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                Each professional in our network maintains a living portfolio that evolves with their career. This isn't a static CV — it's a dynamic representation of skills, achievements, and career progression.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">Real-Time Updates</h3>
                  <p className="text-gray-300">
                    Portfolios update as professionals progress in their careers. New skills, projects, and achievements appear immediately, giving us current insight into their capabilities.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Rich Context</h3>
                  <p className="text-gray-300">
                    Beyond employment history, portfolios include work samples, project outcomes, career narratives, and professional interests. This context enables better matching.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Consent-Based Sharing</h3>
                  <p className="text-gray-300">
                    Professionals control who sees their portfolio and when. This ensures privacy while enabling meaningful connections with the right employers at the right time.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-10 rounded-lg">
              <h2 className="text-3xl font-bold text-black mb-6">Active Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We don't wait for applications. We engage professionals based on mutual understanding of their career goals and your business needs. This active relationship model creates better outcomes than reactive job ad responses.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our ongoing dialogue means we understand career motivations, preferences, and readiness to move. This enables us to present opportunities that align with both the professional's goals and your business needs.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">For Employers</h2>
            <p className="text-lg text-gray-600 mb-8">
              Learn how our talent network can deliver better hires for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/peopleselect/for-employers"
                className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Learn More for Employers
              </Link>
              <Link
                href="/peopleselect/contact"
                className="inline-block px-8 py-4 bg-white text-black border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors font-semibold"
              >
                Book a Call
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
