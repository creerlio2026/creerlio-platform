'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Page Intro */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-black mb-6">How It Works</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-4">
              Built on Creerlio — a discovery platform. Supported by PeopleSelect — human recruitment assistance when you need it.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              This is not a job board. This is not AI matching. Creerlio enables talent to build portfolios and explore businesses. Businesses build their presence and attract interest. All connections are human-initiated and choice-driven. PeopleSelect provides human support for businesses who want assistance with vetting, screening, and hiring processes.
            </p>
          </div>
        </section>

        {/* Section 1 - For Businesses */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">For Businesses: Build Your Presence</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              On Creerlio, businesses build their presence and tell their story. You showcase your culture, values, opportunities, and what makes you unique. Talent discovers and explores you. Interest flows both ways — human-initiated, not automated.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              You build a <strong className="text-black">business profile</strong> that represents who you are. This includes your story, culture, values, growth paths, and opportunities. This becomes your recruitment presence — not a one-off job ad, but a living profile that attracts aligned talent.
            </p>

            <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">Your Business Presence</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Talent explores businesses on Creerlio. They see your story, understand your culture, and discover opportunities. When they're interested, they choose to connect. No algorithms deciding. No automated matching. Human exploration, human choice.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You review portfolios instead of resumes. You choose which portfolios to engage with. You facilitate connections based on human judgment, not algorithmic recommendations.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold text-black mb-3">PeopleSelect Provides Support (Optional)</h3>
              <p className="text-gray-600 leading-relaxed">
                Many businesses use Creerlio directly. PeopleSelect is optional — for businesses who want human assistance with vetting, screening, hiring processes, and placement. We provide support and guidance. We don't automate decisions or replace human judgment.
              </p>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed">
              Your business profile on Creerlio is your recruitment presence. It enables discovery and exploration. Talent finds you. You review portfolios. All connections are human-led. PeopleSelect helps when you want support — but the core model is discovery-based, not job-board-based.
            </p>
          </div>
        </section>

        {/* Section 2 - For Talent */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">For Talent: Build Your Portfolio</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              On Creerlio, talent builds <strong className="text-black">professional portfolios</strong> — living profiles that represent careers accurately and completely. You explore businesses and choose who to connect with. No algorithms deciding for you.
            </p>

            <div className="space-y-6 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-black mb-3">Your Living Portfolio</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Your portfolio includes your experience, skills, work history, projects, credentials, and preferences. It evolves with your career. It lives beyond a single job application — it's your professional presence on Creerlio.
                </p>
              </div>

              <div className="bg-gray-900 text-white p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">You Control Your Choices</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>You explore businesses and choose who to connect with — no algorithms deciding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>You control your visibility — you choose which businesses can see your portfolio</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>No automated matching — all connections are human-initiated and choice-driven</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>No mass distribution — you choose your connections, not systems</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed">
              Your portfolio on Creerlio enables discovery and exploration. Businesses see your complete profile when you choose to connect. You control visibility. You choose connections. All decisions are human-led, not automated.
            </p>
          </div>
        </section>

        {/* Section 3 - How Connections Work */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">How Connections Work</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              This is fundamentally different from job boards and AI matching platforms.
            </p>

            <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">Not a Job Board</h3>
              <p className="text-gray-700 leading-relaxed">
                Job boards post vacancies and wait for applications. Creerlio enables discovery and exploration. Talent explores businesses proactively. Businesses build their presence and attract interest. All connections are human-initiated, not application-based.
              </p>
            </div>

            <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">Not AI Matching</h3>
              <p className="text-gray-700 leading-relaxed">
                There is no algorithmic matching. No automated ranking. No AI deciding who connects with whom. Talent chooses which businesses to explore. Businesses choose which portfolios to review. All decisions are human-led.
              </p>
            </div>

            <div className="bg-gray-900 text-white p-8 rounded-lg mb-8">
              <h3 className="text-2xl font-bold mb-4">Discovery and Exploration</h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                On Creerlio, talent explores businesses and chooses who to connect with. Businesses review portfolios and choose who to engage with. Connections happen through human discovery, not automated systems.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Businesses see complete portfolios when talent chooses to connect. They review profiles, assess fit, and make decisions based on human judgment. No algorithms. No automated recommendations. Human exploration, human choice.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-black mb-3">Why This Matters</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Human choice</strong> — talent and businesses choose connections based on exploration, not algorithms</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Complete information</strong> — portfolios provide full context, not just employment history</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Authentic connections</strong> — both sides explore and choose based on alignment, not automated scoring</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Control and privacy</strong> — talent controls visibility, businesses control engagement</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 - What Businesses Actually Receive */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">What Businesses Actually Receive</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg border-2 border-red-200">
                <h3 className="text-xl font-bold text-black mb-4">Not This</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• A stack of resumes</li>
                  <li>• Recycled applicants</li>
                  <li>• Job-board candidates</li>
                  <li>• Generic cover letters</li>
                  <li>• Limited context</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border-2 border-blue-600">
                <h3 className="text-xl font-bold text-black mb-4">This Instead</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Curated professional profiles</li>
                  <li>• Deeper insight into fit</li>
                  <li>• Consultant-backed recommendations</li>
                  <li>• Context, not just credentials</li>
                  <li>• Clear alignment rationale</li>
                </ul>
              </div>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed">
              Businesses receive information they can use to make better decisions. Not documents to sort through, but profiles to assess. This changes how hiring works.
            </p>
          </div>
        </section>

        {/* Section 5 - The Role of PeopleSelect */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">The Role of PeopleSelect</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Many businesses use Creerlio directly. They build their presence, attract interest, review portfolios, and facilitate connections themselves. PeopleSelect is optional — for businesses who want human support during the hiring process.
            </p>

            <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">Human Support Layer</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                PeopleSelect provides human assistance with vetting, screening, hiring processes, and placement. We help businesses who want guidance during discovery and connection. We provide support — we don't automate decisions or replace human judgment.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our consultants work with businesses to understand needs, review portfolios, facilitate conversations, and guide hiring decisions. But all connections remain human-initiated. All decisions remain human-led.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-black mb-3">What PeopleSelect Provides</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Human assistance with vetting and screening</li>
                  <li>• Support during hiring processes</li>
                  <li>• Guidance on portfolio review and assessment</li>
                  <li>• Facilitation of connections and conversations</li>
                  <li>• Placement support when needed</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-black mb-3">What PeopleSelect Does Not Do</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• We don't automate matching or recommendations</li>
                  <li>• We don't use algorithms to rank or score candidates</li>
                  <li>• We don't replace human judgment with systems</li>
                  <li>• We don't make decisions for businesses</li>
                  <li>• We provide support — we don't automate</li>
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* Closing Statement */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">This Is Different</h2>
            <p className="text-xl text-gray-300 mb-4 leading-relaxed">
              Not a job board. Not AI matching. Discovery and exploration. Human connections. Choice-driven relationships.
            </p>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Built on Creerlio — a discovery platform. Supported by PeopleSelect — human recruitment assistance when you need it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/peopleselect/for-employers"
                className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                For Businesses
              </Link>
              <Link
                href="/peopleselect/for-candidates"
                className="inline-block px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
              >
                For Talent
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
