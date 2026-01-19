'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-black mb-6">How It Works</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-4">
              PeopleSelect is a recruitment agency powered by Creerlio. We still manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We simply do it in a new way.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Powered by Creerlio — a discovery platform. Managed by PeopleSelect — a recruitment agency that still does the full work. We use portfolios instead of resumes. We use discovery instead of job boards. But we still do the full recruitment process.
            </p>
          </div>
        </section>

        {/* For Businesses */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">For Businesses: Build Your Presence</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              On Creerlio, businesses build their presence and tell their story. You showcase your culture, values, opportunities, and what makes you unique. Talent discovers and explores you. Interest flows both ways — human-initiated, not automated.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              You build a <strong className="text-black">business presence</strong> that represents who you are. This includes your story, culture, values, growth paths, and opportunities. This becomes your recruitment presence — not a one-off job ad, but a living profile that attracts aligned talent.
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
              <h3 className="text-xl font-bold text-black mb-3">PeopleSelect Manages Recruitment</h3>
              <p className="text-gray-600 leading-relaxed">
                Many businesses use Creerlio directly. PeopleSelect is a recruitment agency that works with businesses who want us to manage the full recruitment process. We review portfolios, interview candidates, vet backgrounds, consult on fit, and place talent. We still do all the recruitment work — we just use portfolios instead of resumes.
              </p>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed">
              Your business presence on Creerlio enables discovery and exploration. Talent finds you. You receive genuine interest. PeopleSelect manages the recruitment process from there — interviews, vetting, consultation, placement. We're a real recruitment agency — we just don't start with job boards and resumes.
            </p>
          </div>
        </section>

        {/* For Talent */}
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
                    <span>No rankings or scoring — you're not reduced to keywords or algorithms</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed">
              Your portfolio on Creerlio enables discovery and exploration. Businesses see your complete profile when you choose to connect. You control visibility. You choose connections. All decisions are human-led, not automated. If a business works with PeopleSelect, we manage the recruitment process — interviews, vetting, placement. But you're not ranked or filtered by algorithms.
            </p>
          </div>
        </section>

        {/* How Connections Work */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">How Connections Work</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              This is fundamentally different from job boards and ATS systems.
            </p>

            <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">Not a Job Board</h3>
              <p className="text-gray-700 leading-relaxed">
                Job boards post vacancies and wait for applications. Creerlio enables discovery and exploration. Talent explores businesses proactively. Businesses build their presence and attract interest. All connections are human-initiated, not application-based.
              </p>
            </div>

            <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">Not Resumes and ATS Systems</h3>
              <p className="text-gray-700 leading-relaxed">
                We don't use resumes. We don't use ATS systems. We work with portfolios that provide complete context. Businesses review portfolios, not resumes. PeopleSelect manages the recruitment process using portfolios, not resume stacks.
              </p>
            </div>

            <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">Discovery and Exploration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                On Creerlio, talent explores businesses and chooses who to connect with. Businesses review portfolios and choose who to engage with. Connections happen through human discovery, not automated systems.
              </p>
              <p className="text-gray-700 leading-relaxed">
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
                    <span><strong className="text-black">Genuine interest</strong> — connections happen because people choose, not because systems match</span>
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

        {/* What Businesses Actually Receive */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">What Businesses Actually Receive</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg border-2 border-red-200">
                <h3 className="text-xl font-bold text-black mb-4">Not This</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• A stack of resumes</li>
                  <li>• ATS-filtered candidates</li>
                  <li>• Job-board applicants</li>
                  <li>• Keyword-matched profiles</li>
                  <li>• Limited context</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border-2 border-blue-600">
                <h3 className="text-xl font-bold text-black mb-4">This Instead</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Curated portfolio presentations</li>
                  <li>• Complete professional context</li>
                  <li>• People who chose to connect</li>
                  <li>• Full human-led recruitment process</li>
                  <li>• Genuine interest from the start</li>
                </ul>
              </div>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed">
              Businesses receive information they can use to make better decisions. Not documents to sort through, but portfolios to assess. PeopleSelect manages the full recruitment process — interviews, vetting, consultation, placement. We still do all the work — we just don't start with resumes.
            </p>
          </div>
        </section>

        {/* The Role of PeopleSelect */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8">The Role of PeopleSelect</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              PeopleSelect is a recruitment agency. We manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We use Creerlio instead of resumes and ATS systems. But we still do the full recruitment work.
            </p>

            <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">We Manage the Full Recruitment Process</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We review portfolios instead of resumes. We interview candidates. We vet backgrounds. We consult with businesses to understand needs and assess fit. We facilitate conversations and guide decisions. We place candidates. We still do everything a recruitment agency does.
              </p>
              <p className="text-gray-700 leading-relaxed">
                The difference is we use Creerlio's discovery platform instead of job boards and ATS systems. We work with portfolios instead of resumes. But we still manage the full recruitment process.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-black mb-3">What PeopleSelect Does</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Reviews portfolios instead of resumes</li>
                  <li>• Interviews and vets candidates</li>
                  <li>• Consults with businesses on fit and needs</li>
                  <li>• Facilitates connections and conversations</li>
                  <li>• Places candidates and supports onboarding</li>
                  <li>• Manages the full recruitment process</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-black mb-3">What PeopleSelect Does Not Do</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• We don't use resumes or ATS systems</li>
                  <li>• We don't use algorithmic matching</li>
                  <li>• We don't use job boards</li>
                  <li>• We don't automate decision-making</li>
                  <li>• We don't rank or score candidates</li>
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
              Not a job board. Not resumes. Not ATS systems. Discovery and exploration. Portfolios, not resumes. Human-led recruitment, not algorithms.
            </p>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Powered by Creerlio — a discovery platform. Managed by PeopleSelect — a recruitment agency that still does the full work.
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
