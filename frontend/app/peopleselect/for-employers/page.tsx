'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">For Businesses</h1>
            <p className="text-xl text-gray-600">
              Build your presence. Showcase your story. Attract talent who discovers you. PeopleSelect provides human support when you need it.
            </p>
          </div>
        </section>

        {/* Who We Work With */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Build Your Presence on Creerlio</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                On Creerlio, businesses build their presence and tell their story. You showcase your culture, values, opportunities, and what makes you unique. Talent discovers and explores you. Interest flows both ways — human-initiated, not automated.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                You build a business profile that represents who you are. This becomes your recruitment presence — not a one-off job ad, but a living profile that attracts aligned talent. Many businesses use Creerlio directly. PeopleSelect is optional — for businesses who want human support during the hiring process.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">Small to Medium Enterprises</h3>
                <p className="text-gray-600 leading-relaxed">
                  Growing businesses need hires who fit culturally and contribute immediately. Our relationship-based approach ensures you get professionals who understand your business and align with your values.
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">Enterprise Teams</h3>
                <p className="text-gray-600 leading-relaxed">
                  Large organisations need consistent, high-quality talent across teams. Our network and relationship model scale to deliver placements that meet enterprise standards while maintaining personal attention.
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">Government Agencies</h3>
                <p className="text-gray-600 leading-relaxed">
                  Public sector recruitment requires thorough assessment and cultural alignment. Our approach ensures placements meet compliance requirements while delivering professionals committed to public service.
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">Project-Based Teams</h3>
                <p className="text-gray-600 leading-relaxed">
                  Contract and project teams need professionals ready to start immediately. Our network activation model delivers qualified talent quickly, without compromising on quality or cultural fit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ideal Clients */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div>
            <h2 className="text-4xl font-bold text-black mb-6">Ideal Clients</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Our approach works best for businesses that meet certain criteria. We're upfront about fit because we want successful, long-term partnerships.
            </p>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-xl font-bold text-black mb-3">Value Quality Over Speed</h3>
                <p className="text-gray-600 leading-relaxed">
                  If you need someone in the role tomorrow, traditional job ads might be faster. But if you value quality, cultural fit, and long-term success, our relationship-based approach delivers better outcomes.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-xl font-bold text-black mb-3">Understand the Investment</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our approach requires time upfront to understand your business and build relationships. This investment pays off in better matches, faster future placements, and a stronger talent pipeline.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-xl font-bold text-black mb-3">Think Long-Term</h3>
                <p className="text-gray-600 leading-relaxed">
                  We're building your long-term talent strategy, not just filling immediate roles. Ideal clients see the value in ongoing relationships and compounding network advantages.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-xl font-bold text-black mb-3">Hire Regularly</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our model works best when you hire multiple roles over time. The network we build becomes more valuable with each placement, creating compounding returns on the initial relationship investment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* When PeopleSelect Is Right */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div>
            <h2 className="text-4xl font-bold text-black mb-6">When PeopleSelect Is the Right Fit</h2>
            
            <div className="space-y-6 mb-12">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full mt-1"></div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">You Need Quality Hires</h3>
                  <p className="text-gray-600 leading-relaxed">
                    When cultural fit and long-term success matter more than filling a role quickly, our relationship-based approach delivers better matches.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full mt-1"></div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">You Hire Multiple Roles</h3>
                  <p className="text-gray-600 leading-relaxed">
                    If you're building a team or hiring regularly, our network model creates compounding value. Each placement strengthens future hiring.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full mt-1"></div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">You Value Relationships</h3>
                  <p className="text-gray-600 leading-relaxed">
                    When you want a recruitment partner who understands your business and maintains ongoing relationships, our approach aligns with your values.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full mt-1"></div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">You Want Access to Passive Talent</h3>
                  <p className="text-gray-600 leading-relaxed">
                    If you need professionals who aren't actively job searching, our network and relationship model gives you access to passive talent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* When It's Not */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div>
            <h2 className="text-4xl font-bold text-black mb-6">When It's Not</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              We're honest about when our approach isn't the right fit. Better to say no upfront than deliver a poor experience.
            </p>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-l-4 border-gray-400">
                <h3 className="text-xl font-bold text-black mb-3">One-Off, Urgent Hires</h3>
                <p className="text-gray-600 leading-relaxed">
                  If you need someone in a role immediately and this is a one-time hire, traditional job ads might be faster. Our approach requires relationship building that pays off over multiple placements.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border-l-4 border-gray-400">
                <h3 className="text-xl font-bold text-black mb-3">Very Low-Volume Hiring</h3>
                <p className="text-gray-600 leading-relaxed">
                  If you rarely hire, the network investment doesn't compound. Our model works best when you hire regularly and can leverage the ongoing relationships we build.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border-l-4 border-gray-400">
                <h3 className="text-xl font-bold text-black mb-3">Commodity Roles</h3>
                <p className="text-gray-600 leading-relaxed">
                  For highly standardised roles where skills matching is straightforward and cultural fit is less critical, traditional recruitment may be more cost-effective.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="bg-gray-900 text-white p-12 rounded-lg text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Explore a Different Way?</h2>
            <p className="text-xl text-gray-300 mb-4">
              Discover how Creerlio enables discovery and exploration. Learn how PeopleSelect provides human support when you need it.
            </p>
            <p className="text-lg text-gray-400 mb-8">
              Not a job board. Not AI matching. Discovery and exploration. Human connections. Choice-driven relationships.
            </p>
            <Link
              href="/peopleselect/contact"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Get in Touch
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
