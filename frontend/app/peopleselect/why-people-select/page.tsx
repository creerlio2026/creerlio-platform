'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function WhyPeopleSelectPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">Why PeopleSelect</h1>
            <p className="text-xl text-gray-600">
              A comparison of traditional recruitment versus our relationship-based approach.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-6 font-bold text-black text-lg"></th>
                  <th className="text-left py-4 px-6 font-bold text-red-600 text-lg">Traditional Recruitment</th>
                  <th className="text-left py-4 px-6 font-bold text-blue-600 text-lg">PeopleSelect</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-6 px-6 font-semibold text-black">Approach</td>
                  <td className="py-6 px-6 text-gray-600">Reactive — post job ads and wait for responses</td>
                  <td className="py-6 px-6 text-gray-600">Proactive — maintain live talent relationships</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-6 px-6 font-semibold text-black">Talent Source</td>
                  <td className="py-6 px-6 text-gray-600">CVs — static snapshots from months ago</td>
                  <td className="py-6 px-6 text-gray-600">Living profiles — real-time updates and rich context</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-6 px-6 font-semibold text-black">Engagement</td>
                  <td className="py-6 px-6 text-gray-600">Job ads — candidates respond to public postings</td>
                  <td className="py-6 px-6 text-gray-600">Direct engagement — we reach out from our network</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-6 px-6 font-semibold text-black">Relationship</td>
                  <td className="py-6 px-6 text-gray-600">One-off placements — transactional interactions</td>
                  <td className="py-6 px-6 text-gray-600">Long-term strategy — ongoing talent pipeline</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-6 px-6 font-semibold text-black">Time to Hire</td>
                  <td className="py-6 px-6 text-gray-600">Weeks — waiting for job ad responses</td>
                  <td className="py-6 px-6 text-gray-600">Days — activate existing network immediately</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-6 px-6 font-semibold text-black">Talent Quality</td>
                  <td className="py-6 px-6 text-gray-600">Mixed — high volume, variable quality</td>
                  <td className="py-6 px-6 text-gray-600">High — pre-vetted, relationship-based matching</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-6 px-6 font-semibold text-black">Cultural Fit</td>
                  <td className="py-6 px-6 text-gray-600">Uncertain — limited relationship context</td>
                  <td className="py-6 px-6 text-gray-600">Assessed — deep understanding of both sides</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-6 px-6 font-semibold text-black">Passive Talent</td>
                  <td className="py-6 px-6 text-gray-600">Limited access — only active job seekers</td>
                  <td className="py-6 px-6 text-gray-600">Full access — ongoing relationships with passive talent</td>
                </tr>
                <tr>
                  <td className="py-6 px-6 font-semibold text-black">Long-Term Value</td>
                  <td className="py-6 px-6 text-gray-600">Single placement — start from scratch each time</td>
                  <td className="py-6 px-6 text-gray-600">Compounding advantage — network grows with each placement</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Key Differences */}
          <div className="mt-20 space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Reactive vs Proactive</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-4">Traditional: Reactive</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Traditional recruiters wait for roles to open, then post job ads and hope suitable candidates respond. This reactive model means delays, uncertainty, and reliance on active job seekers.
                  </p>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-black mb-4">PeopleSelect: Proactive</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We maintain ongoing relationships with professionals before roles exist. When you need to hire, we activate our network immediately — no waiting, no hoping, no delays.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">CVs vs Living Profiles</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-4">Traditional: Static CVs</h3>
                  <p className="text-gray-700 leading-relaxed">
                    CVs are snapshots from months ago. They show employment history but don't reflect current skills, motivations, or career goals. Decisions based on outdated information lead to mismatches.
                  </p>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-black mb-4">PeopleSelect: Living Portfolios</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Living talent portfolios update in real time with new skills, achievements, and career movements. They include work samples, project outcomes, and career narratives — rich context for better matching.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Job Ads vs Direct Engagement</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-4">Traditional: Job Ads</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Job ads only reach people actively looking. The best candidates are often passive — they're not browsing job boards. By the time they see your ad, they may have already moved on.
                  </p>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-black mb-4">PeopleSelect: Direct Engagement</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We engage professionals directly from our network, including passive talent who aren't actively job searching. Because we maintain relationships, we know who's ready to move before they update their LinkedIn.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">One-Off Placements vs Long-Term Strategy</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-4">Traditional: Transactional</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Each placement is a separate transaction. You start from scratch each time, with no cumulative advantage. The relationship ends when the role is filled.
                  </p>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-black mb-4">PeopleSelect: Strategic</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Each placement strengthens our understanding of your business and expands your network access. We're building your long-term talent pipeline, creating compounding value over time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center bg-gray-900 text-white p-12 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience the Difference?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Book a discovery call to learn how our relationship-based approach can deliver better hires for your business.
            </p>
            <Link
              href="/peopleselect/contact"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Book a Discovery Call
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
