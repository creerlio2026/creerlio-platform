'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600">
              Clear answers about how PeopleSelect and Creerlio work.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="max-w-4xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-12">
            {/* Critical FAQ - AI Matching */}
            <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-black mb-4">Are you an AI matching platform?</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>No. We are not an AI matching platform.</strong>
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Creerlio is a discovery platform where talent explores businesses and businesses showcase their story. There is no algorithmic matching, no automated ranking, and no AI deciding who connects with whom. Talent chooses which businesses to explore. Businesses choose which portfolios to review. All connections are human-initiated and human-led.
              </p>
            </div>

            {/* What is Creerlio */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">What is Creerlio?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio is a discovery platform built for relationship-first recruitment. It enables talent to build living portfolios and explore businesses. It enables businesses to build their presence and tell their story.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Creerlio is the infrastructure. PeopleSelect is the human recruitment layer that provides support, guidance, and assistance when businesses need help with hiring.
              </p>
            </div>

            {/* What is PeopleSelect */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">What is PeopleSelect?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                PeopleSelect is a human-powered recruitment service. We help businesses who use Creerlio when they want assistance with vetting, screening, hiring processes, and placement.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect consultants work with businesses to understand needs, review portfolios, facilitate connections, and guide hiring decisions. We provide human support — we don't replace human judgment with algorithms.
              </p>
            </div>

            {/* How is this different from job boards */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How is this different from job boards?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Job boards post vacancies. People wait for roles to appear. Applications go into a system. Recruiters sort through responses.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio works differently. Talent builds portfolios and explores businesses proactively. Businesses build their presence and attract interest. Connections happen through discovery and exploration, not job applications.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect helps businesses who want human support during this process. But the core model is discovery-based, not job-board-based.
              </p>
            </div>

            {/* How does matching work */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How does matching work?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                There is no automated matching. Talent explores businesses and chooses who to connect with. Businesses review portfolios and choose who to engage with. All connections are human-initiated.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect consultants can help with vetting, screening, and facilitating connections. But we don't use algorithms to match or rank candidates. All decisions are human-led.
              </p>
            </div>

            {/* For Talent */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How does this work for talent?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You build a living portfolio that represents your career, skills, and goals. You explore businesses on Creerlio. You choose which businesses to connect with based on your interests and alignment.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                No algorithms decide for you. No automated ranking. You control your visibility and choose your connections. If a business works with PeopleSelect, our consultants can help facilitate conversations, but you remain in control.
              </p>
            </div>

            {/* For Businesses */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How does this work for businesses?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You build your business presence on Creerlio. You showcase your story, culture, values, and opportunities. Talent explores and discovers you. You receive interest from people who choose you.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You review portfolios instead of resumes. You choose who to engage with. If you work with PeopleSelect, our consultants help with vetting, screening, and facilitating connections. But all decisions are yours.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect is optional. Many businesses use Creerlio directly. We're here for businesses who want human support during the hiring process.
              </p>
            </div>

            {/* Do I need PeopleSelect */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Do I need PeopleSelect, or can I use Creerlio directly?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You can use Creerlio directly. Many businesses do. You build your presence, attract interest, review portfolios, and facilitate connections yourself.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect is for businesses who want human assistance with vetting, screening, hiring processes, and placement. We provide support — we don't replace your ability to use Creerlio directly.
              </p>
            </div>

            {/* Is this automated */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Is any part of this automated?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio is a platform that enables discovery and connection. It provides the infrastructure for portfolios, business profiles, and exploration.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                But there is no automated decision-making. No algorithmic matching. No automated ranking or recommendations. All connections, reviews, and decisions are human-led. Talent chooses. Businesses choose. PeopleSelect consultants assist — they don't automate.
              </p>
            </div>

            {/* Privacy */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How is privacy handled?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Talent controls visibility. You choose which businesses can see your portfolio. You control when and how you're presented. No mass distribution. No sharing without consent.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Businesses control their presence. You choose what to showcase. You choose which portfolios to review. All engagement is consent-based and human-led.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">Still have questions?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Get in touch and we'll answer your questions directly.
            </p>
            <Link
              href="/peopleselect/contact"
              className="inline-block px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
