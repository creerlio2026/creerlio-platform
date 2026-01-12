'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function ForCandidatesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">For Talent</h1>
            <p className="text-xl text-gray-600">
              Build your portfolio. Explore businesses. Choose your connections. No algorithms deciding for you.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Build Your Portfolio on Creerlio</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                On Creerlio, you build a living professional portfolio — not a static resume. Your portfolio includes your experience, skills, projects, credentials, and preferences. It evolves with your career. It represents who you are today, not just what you did months ago.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Your portfolio lives on Creerlio. It's your professional presence — not tied to a single job application, but a living profile that works for your entire career.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Explore Businesses and Choose Connections</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                On Creerlio, you explore businesses proactively. You see their story, culture, values, and opportunities. You discover who they are and what they offer. When you're interested, you choose to connect.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                No algorithms deciding for you. No automated matching. No systems ranking businesses or recommending connections. You explore. You choose. All decisions are human-led.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                You control your connections. You choose which businesses to explore. You choose which businesses to connect with. No automated systems. No algorithmic recommendations. Human exploration, human choice.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">You Control Your Visibility</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You control who sees your portfolio and when. You choose which businesses can view your profile. You control your visibility — not systems, not algorithms, not recruiters.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Your portfolio on Creerlio is private by default. You choose when to make it visible. You choose which businesses to connect with. You control your privacy and your connections.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                No mass distribution. No being "sent out" without your knowledge. No systems sharing your profile automatically. You choose your connections. You control your visibility.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-black mb-6">Not a Job Board. Not AI Matching.</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio is not a job board. You don't wait for job ads to appear. You don't submit applications into a void. You explore businesses proactively. You discover opportunities through exploration, not job postings.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio is not AI matching. No algorithms decide who you connect with. No automated ranking or recommendations. No systems scoring businesses or suggesting matches. You explore. You choose. Human-led connections.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                This is discovery and exploration. This is human-led connections. This is choice-driven relationships. Not job boards. Not AI matching. Discovery. Exploration. Choice.
              </p>
            </div>

            <div className="bg-blue-50 p-10 rounded-lg">
              <h2 className="text-3xl font-bold text-black mb-6">Your Living Portfolio</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your portfolio on Creerlio is a living profile that evolves with your career. It includes your experience, skills, projects, credentials, and preferences. It updates in real time. It represents who you are today.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Businesses see your complete portfolio when you choose to connect. They see your full profile, not just employment history. They see your skills, projects, and preferences. They see who you are, not just what you did.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Your portfolio enables discovery and exploration. Businesses discover you through your presence. You explore businesses through theirs. Connections happen through human exploration, not automated systems.
              </p>
            </div>

            <div className="bg-gray-900 text-white p-10 rounded-lg">
              <h2 className="text-3xl font-bold mb-6">How It Works for You</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">1. Build Your Portfolio on Creerlio</h3>
                  <p className="text-gray-300">
                    Create a living portfolio that represents your career, skills, and goals. Your portfolio evolves with your career. It's your professional presence on Creerlio.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">2. Explore Businesses</h3>
                  <p className="text-gray-300">
                    Discover businesses on Creerlio. See their story, culture, values, and opportunities. Explore proactively. No waiting for job ads. No applications into a void.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">3. Choose Your Connections</h3>
                  <p className="text-gray-300">
                    When you're interested, you choose to connect. No algorithms deciding. No automated matching. You explore. You choose. Human-led connections.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">4. Control Your Visibility</h3>
                  <p className="text-gray-300">
                    You control who sees your portfolio and when. You choose which businesses to connect with. You control your privacy and your connections. No automated systems. No mass distribution.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">Ready to Explore?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Build your portfolio on Creerlio. Explore businesses. Choose your connections. No algorithms deciding for you.
            </p>
            <Link
              href="/peopleselect/contact"
              className="inline-block px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg"
            >
              Get Started
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
