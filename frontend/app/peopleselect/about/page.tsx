'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">About PeopleSelect</h1>
            <p className="text-xl text-gray-600">
              A recruitment agency powered by Creerlio. Discovery first. Recruitment second. Human-led always.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                PeopleSelect is a recruitment agency powered by Creerlio — a discovery platform that enables talent to explore businesses and businesses to showcase their story.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe recruitment should be built on discovery and exploration, not job boards and resumes. Talent should choose connections. Businesses should attract interest through presence. All decisions should be human-led, not automated.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Our Philosophy</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                This is not a job board. This is not AI matching. This is discovery and exploration. Talent builds portfolios and explores businesses. Businesses build their presence and attract interest. All connections are human-initiated and choice-driven.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                PeopleSelect is a recruitment agency. We manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We use Creerlio instead of resumes and ATS systems. But we still do the full recruitment work.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our philosophy is simple: discovery first, recruitment second, human-led always. No algorithms. No automated matching. No resumes. Portfolios. Discovery. Human-led recruitment.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">The Problem with Job Boards and Resumes</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Traditional recruitment relies on job boards, resumes, and ATS systems. Job boards are reactive and transactional. Resumes are static and incomplete. ATS systems filter by keywords, not context. All fail talent and businesses.
              </p>

              <div className="space-y-6">
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-3">Job Boards Are Reactive</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Job boards post vacancies and wait. Businesses wait for applications. Talent waits for roles to appear. Everyone waits. This reactive model means delays, uncertainty, and missed connections. The best talent doesn't browse job boards.
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-3">Resumes Are Static and Incomplete</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Resumes are snapshots from months ago. They show employment history but don't reflect current skills, motivations, or career goals. Decisions based on outdated documents lead to mismatches and poor outcomes.
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-3">ATS Systems Filter by Keywords</h3>
                  <p className="text-gray-700 leading-relaxed">
                    ATS systems filter resumes by keywords, not context. They rank and score candidates algorithmically. They miss great people who don't match keyword patterns. They reduce professionals to search terms.
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-black mb-3">No Discovery, No Exploration</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Job boards and resumes don't enable discovery. Talent doesn't explore businesses. Businesses don't attract interest through presence. Connections happen through applications and keywords, not exploration and choice.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Why Creerlio and PeopleSelect Exist</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                We built Creerlio because job boards and resumes fail everyone. Job boards are reactive and transactional. Resumes are static and incomplete. ATS systems filter by keywords, not context. Neither enables discovery, exploration, or authentic connections.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio enables discovery and exploration. Talent builds portfolios and explores businesses. Businesses build their presence and attract interest. All connections are human-initiated and choice-driven. No algorithms. No automated matching. Human exploration, human choice.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect is a recruitment agency powered by Creerlio. We manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We use Creerlio instead of resumes and ATS systems. But we still do the full recruitment work.
              </p>
            </div>

            <div className="bg-gray-900 text-white p-10 rounded-lg">
              <h2 className="text-3xl font-bold mb-6">Creerlio: The Discovery Platform</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Creerlio is a discovery platform that enables talent to build portfolios and explore businesses. It enables businesses to build their presence and attract interest. It enables human-led connections through discovery and exploration.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Creerlio is not a job board. It's not AI matching. It's not a recruitment agency. It's a discovery platform. Talent explores. Businesses attract. Connections happen through human choice, not automated systems.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Many businesses use Creerlio directly. They build their presence, attract interest, review portfolios, and facilitate connections themselves. PeopleSelect is a recruitment agency powered by Creerlio — for businesses who want us to manage the full recruitment process.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Creerlio is not a recruitment agency. PeopleSelect is. We're powered by Creerlio's discovery platform, but we still manage the full recruitment process.
              </p>
            </div>

            <div className="bg-blue-50 p-10 rounded-lg border-l-4 border-blue-600">
              <h2 className="text-3xl font-bold text-black mb-6">PeopleSelect: The Recruitment Agency</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                PeopleSelect is a recruitment agency. We manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We still do the full recruitment work.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The difference is we use Creerlio instead of job boards and ATS systems. We work with portfolios instead of resumes. We start with discovery instead of applications. But we still manage the full recruitment process.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We review portfolios instead of resumes. We interview candidates. We vet backgrounds. We consult with businesses to understand needs and assess fit. We facilitate conversations and guide decisions. We place candidates. We still do everything a recruitment agency does.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="text-center bg-gray-50 p-12 rounded-lg">
            <h2 className="text-3xl font-bold text-black mb-4">Ready to Experience Recruitment Rebuilt?</h2>
            <p className="text-lg text-gray-600 mb-4">
              Discovery first. Recruitment second. Human-led always. Powered by Creerlio, managed by PeopleSelect.
            </p>
            <p className="text-base text-gray-500 mb-8">
              Not a job board. Not resumes. Not ATS systems. Discovery and exploration. Portfolios, not resumes. Human-led recruitment, not algorithms.
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
