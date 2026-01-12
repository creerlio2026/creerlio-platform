'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">About PeopleSelect</h1>
            <p className="text-xl text-gray-600">
              Recruitment built on relationships, not transactions.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                PeopleSelect provides human recruitment assistance for businesses using Creerlio — a discovery platform that enables talent to explore businesses and businesses to showcase their story.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe recruitment should be built on discovery and exploration, not job boards and algorithms. Talent should choose connections. Businesses should choose engagement. All decisions should be human-led, not automated.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Our Philosophy</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                This is not a job board. This is not AI matching. This is discovery and exploration. Talent builds portfolios and explores businesses. Businesses build their presence and attract interest. All connections are human-initiated and choice-driven.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Many businesses use Creerlio directly. PeopleSelect is optional — for businesses who want human support during the hiring process. We provide assistance with vetting, screening, and placement. We don't automate decisions or replace human judgment.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our philosophy is simple: enable discovery, support exploration, facilitate human connections. No algorithms. No automated matching. Human-led, choice-driven relationships.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">The Problem with Job Boards and AI Matching</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Traditional recruitment relies on job boards and, increasingly, AI matching. Job boards are reactive and transactional. AI matching removes human choice. Both fail talent and businesses.
              </p>

              <div className="space-y-6">
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-3">Job Boards Are Reactive</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Job boards post vacancies and wait. Businesses wait for applications. Talent waits for roles to appear. Everyone waits. This reactive model means delays, uncertainty, and missed connections. The best talent doesn't browse job boards.
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-3">AI Matching Removes Choice</h3>
                  <p className="text-gray-700 leading-relaxed">
                    AI matching platforms use algorithms to decide who connects with whom. Talent doesn't choose. Businesses don't choose. Systems decide. This removes human judgment, human exploration, and human choice. Algorithms can't understand culture, fit, or alignment.
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-3">Static Resumes Tell Part of the Story</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Resumes are snapshots from months ago. They show employment history but don't reflect current skills, motivations, or career goals. Decisions based on outdated documents lead to mismatches and poor outcomes.
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-3">No Discovery, No Exploration</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Job boards and AI matching don't enable discovery. Talent doesn't explore businesses. Businesses don't attract interest through presence. Connections happen through applications and algorithms, not exploration and choice.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Why Creerlio and PeopleSelect Exist</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                We built Creerlio because job boards and AI matching fail everyone. Job boards are reactive and transactional. AI matching removes human choice. Neither enables discovery, exploration, or authentic connections.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio enables discovery and exploration. Talent builds portfolios and explores businesses. Businesses build their presence and attract interest. All connections are human-initiated and choice-driven. No algorithms. No automated matching. Human exploration, human choice.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect provides human support for businesses who want assistance during the hiring process. We help with vetting, screening, and placement. We provide support — we don't automate decisions or replace human judgment.
              </p>
            </div>

            <div className="bg-gray-900 text-white p-10 rounded-lg">
              <h2 className="text-3xl font-bold mb-6">Creerlio: The Discovery Platform</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Creerlio is a discovery platform that enables talent to build portfolios and explore businesses. It enables businesses to build their presence and attract interest. It enables human-led connections through discovery and exploration.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Creerlio is not a job board. It's not AI matching. It's discovery and exploration. Talent explores. Businesses attract. Connections happen through human choice, not automated systems.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Many businesses use Creerlio directly. They build their presence, attract interest, review portfolios, and facilitate connections themselves. PeopleSelect is optional — for businesses who want human support during the hiring process.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We built Creerlio because it didn't exist. We built PeopleSelect to provide human support when businesses need it. Both enable discovery, exploration, and human-led connections — not job boards, not AI matching.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="text-center bg-gray-50 p-12 rounded-lg">
            <h2 className="text-3xl font-bold text-black mb-4">Ready to Explore a Different Way?</h2>
            <p className="text-lg text-gray-600 mb-4">
              Discover how Creerlio enables discovery and exploration. Learn how PeopleSelect provides human support when you need it.
            </p>
            <p className="text-base text-gray-500 mb-8">
              Not a job board. Not AI matching. Discovery and exploration. Human connections. Choice-driven relationships.
            </p>
            <Link
              href="/peopleselect/contact"
              className="inline-block px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg"
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
