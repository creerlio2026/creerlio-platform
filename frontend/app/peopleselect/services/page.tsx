'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">Our Services</h1>
            <p className="text-xl text-gray-600">
              Permanent and contract recruitment powered by live talent relationships, not reactive job ads.
            </p>
          </div>
        </section>

        {/* Permanent Recruitment */}
        <section id="permanent" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">Permanent Recruitment</h2>
            
            <div className="space-y-8 mb-12">
              <div className="bg-gray-50 p-8 rounded-lg border-l-4 border-red-500">
                <h3 className="text-2xl font-bold text-black mb-4">The Traditional Approach</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Most recruiters post job ads, wait for responses, then sort through CVs from candidates you've never met. This process is slow, reactive, and produces mixed results.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Job ads attract active job seekers only</li>
                  <li>CVs are static snapshots from months ago</li>
                  <li>No relationship context with candidates</li>
                  <li>High volume, low quality applications</li>
                  <li>Long time-to-hire while waiting for responses</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-2xl font-bold text-black mb-4">Why It Fails</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Job ads only reach people actively looking. The best candidates are often passive — they're not browsing job boards. By the time they see your ad, they may have already accepted another role.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Recycled CVs tell you what someone did months ago, not who they are today. Skills evolve, motivations change, and career goals shift. A CV from last year is outdated information.
                </p>
              </div>

              <div className="bg-gray-900 text-white p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">The PeopleSelect Approach</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  We maintain live, ongoing relationships with professionals across industries. When a permanent role opens, we engage talent who are already known to us — professionals we understand beyond their CV.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-lg mb-2">Live Talent Relationships</h4>
                    <p className="text-gray-300">
                      We stay in regular contact with professionals in our network. We know their current situation, career aspirations, and readiness to move before roles are advertised.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-2">Ongoing Engagement</h4>
                    <p className="text-gray-300">
                      Our relationships aren't transactional. We engage professionals throughout their careers, understanding their growth, skills development, and changing motivations.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-2">Talent Already Known Before Roles Open</h4>
                    <p className="text-gray-300">
                      When you need to hire, we don't start from scratch. We activate our network and engage professionals who are already in our system, reducing time-to-hire and improving fit.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/peopleselect/contact"
                className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Discuss Your Permanent Hiring Needs
              </Link>
            </div>
          </div>
        </section>

        {/* Contract & Project Recruitment */}
        <section id="contract" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">Contract & Project Recruitment</h2>
            
            <div className="space-y-8 mb-12">
              <div className="bg-gray-50 p-8 rounded-lg border-l-4 border-red-500">
                <h3 className="text-2xl font-bold text-black mb-4">The Traditional Approach</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Contract recruitment often follows the same reactive model: post the role, wait for applications, then hope someone suitable applies. For time-sensitive projects, this delay can be costly.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Job ads take days or weeks to yield results</li>
                  <li>No pre-vetted talent pool for immediate deployment</li>
                  <li>Uncertainty about candidate availability and commitment</li>
                  <li>Limited understanding of contract preferences</li>
                  <li>Project timelines suffer from slow hiring</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-2xl font-bold text-black mb-4">Why It Fails</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Project-based roles need speed. Traditional job ads create a bottleneck. By the time you find someone, the project timeline may have already been compromised.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Contract professionals value relationships and prefer working with recruiters who understand their availability, rate expectations, and project preferences. One-off job ad responses lack this context.
                </p>
              </div>

              <div className="bg-gray-900 text-white p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">The PeopleSelect Approach</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  For contract and project needs, we activate our talent network immediately. No waiting for job ad responses. We connect you with professionals ready to start and aligned with your project goals.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-lg mb-2">Immediate Network Activation</h4>
                    <p className="text-gray-300">
                      Our internal talent relationship system tracks contract professionals and their availability in real time. When a project opens, we know who's ready to start immediately.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-2">Pre-Understood Preferences</h4>
                    <p className="text-gray-300">
                      We know which professionals prefer contract work, their rate ranges, location preferences, and project type interests. This means faster, more accurate matches.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-2">Relationship-Based Placement</h4>
                    <p className="text-gray-300">
                      Contract professionals in our network trust us because we maintain ongoing relationships, not just transactional job placements. This leads to better commitment and project outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/peopleselect/contact"
                className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Discuss Your Contract Hiring Needs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
