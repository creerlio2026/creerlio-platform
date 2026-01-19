'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function WhyPeopleSelectPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">Why PeopleSelect</h1>
            <p className="text-xl text-gray-600">
              A recruitment agency powered by Creerlio. Discovery first. Recruitment second. Human-led always.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-black mb-8 text-center">The Difference</h2>
            <p className="text-xl text-gray-600 leading-relaxed text-center">
              PeopleSelect is a recruitment agency powered by Creerlio. We still manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We simply do it in a new way.
            </p>
          </div>

          <div className="overflow-x-auto mb-20">
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
                  <td className="py-6 px-6 text-gray-600">Discovery-first — talent explores businesses proactively</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-6 px-6 font-semibold text-black">Talent Source</td>
                  <td className="py-6 px-6 text-gray-600">Resumes — static snapshots from months ago</td>
                  <td className="py-6 px-6 text-gray-600">Portfolios — living profiles that evolve with careers</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-6 px-6 font-semibold text-black">Engagement</td>
                  <td className="py-6 px-6 text-gray-600">Job ads — candidates respond to public postings</td>
                  <td className="py-6 px-6 text-gray-600">Discovery — talent explores businesses and chooses connections</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-6 px-6 font-semibold text-black">Matching</td>
                  <td className="py-6 px-6 text-gray-600">ATS systems — keyword filtering and algorithmic ranking</td>
                  <td className="py-6 px-6 text-gray-600">Human-led — portfolios reviewed by people, not algorithms</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-6 px-6 font-semibold text-black">Connection</td>
                  <td className="py-6 px-6 text-gray-600">Applications — resumes submitted into a void</td>
                  <td className="py-6 px-6 text-gray-600">Choice-driven — talent chooses who to connect with</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-6 px-6 font-semibold text-black">Information</td>
                  <td className="py-6 px-6 text-gray-600">Limited — resumes show employment history only</td>
                  <td className="py-6 px-6 text-gray-600">Complete — portfolios show full professional context</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-6 px-6 font-semibold text-black">Interest</td>
                  <td className="py-6 px-6 text-gray-600">Application-based — responses to job ads</td>
                  <td className="py-6 px-6 text-gray-600">Genuine — interest from people who chose to connect</td>
                </tr>
                <tr>
                  <td className="py-6 px-6 font-semibold text-black">Recruitment Process</td>
                  <td className="py-6 px-6 text-gray-600">Full recruitment — interviews, vetting, placement</td>
                  <td className="py-6 px-6 text-gray-600">Full recruitment — interviews, vetting, placement (using portfolios, not resumes)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Discovery First vs Job Boards First</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-4">Traditional: Job Boards First</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Traditional recruitment starts with job boards. Businesses post vacancies and wait for applications. Talent waits for roles to appear. Everyone waits. This reactive model means delays, uncertainty, and missed connections.
                  </p>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-black mb-4">PeopleSelect: Discovery First</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We start with discovery. Talent builds portfolios and explores businesses proactively. Businesses build their presence and attract interest. Genuine interest flows before recruitment begins. Then PeopleSelect manages the full recruitment process.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Portfolios vs Resumes</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-4">Traditional: Static Resumes</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Resumes are snapshots from months ago. They show employment history but don't reflect current skills, motivations, or career goals. Decisions based on outdated documents lead to mismatches and poor outcomes.
                  </p>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-black mb-4">PeopleSelect: Living Portfolios</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Portfolios are living profiles that evolve with careers. They include experience, skills, projects, credentials, and preferences. They represent who people are today, not just what they did months ago. Businesses see complete context, not just employment history.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Human-Led vs ATS Systems</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-4">Traditional: ATS Systems</h3>
                  <p className="text-gray-700 leading-relaxed">
                    ATS systems filter resumes by keywords. They rank and score candidates algorithmically. They miss great people who don't match keyword patterns. They reduce professionals to search terms.
                  </p>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-black mb-4">PeopleSelect: Human-Led</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We review portfolios by human judgment, not algorithms. We don't filter by keywords. We don't rank or score candidates algorithmically. We assess fit based on complete context, not search terms. All decisions are human-led.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Genuine Interest vs Applications</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-4">Traditional: Applications</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Applications go into a void. Businesses receive responses to job ads, not genuine interest. Talent submits applications hoping for responses. Connections happen through applications, not exploration.
                  </p>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-black mb-4">PeopleSelect: Genuine Interest</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Talent explores businesses and chooses who to connect with. Businesses receive genuine interest from people who chose them. Connections happen through discovery and exploration, not applications. Interest flows before recruitment begins.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 text-center bg-gray-900 text-white p-12 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience the Difference?</h2>
            <p className="text-xl text-gray-300 mb-4">
              Discovery first. Recruitment second. Human-led always. Powered by Creerlio, managed by PeopleSelect.
            </p>
            <p className="text-lg text-gray-400 mb-8">
              Not a job board. Not resumes. Not ATS systems. Discovery and exploration. Portfolios, not resumes. Human-led recruitment, not algorithms.
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
