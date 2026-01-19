'use client'

import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600">
              Clear answers about how PeopleSelect and Creerlio work.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-12">
            <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-black mb-4">Is PeopleSelect an AI matching platform?</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>No. We do not use algorithms to rank or match people.</strong>
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Creerlio is a discovery platform where talent explores businesses and businesses showcase their story. There is no algorithmic matching, no automated ranking, and no AI deciding who connects with whom. Talent chooses which businesses to explore. Businesses choose which portfolios to review. All connections are human-initiated and human-led.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Is PeopleSelect a recruitment agency?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                <strong>Yes — but not a traditional one.</strong>
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect is a recruitment agency. We manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We still do the full recruitment work. The difference is we use Creerlio's discovery platform instead of job boards and ATS systems. We work with portfolios instead of resumes. But we're still a real recruitment agency.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Do you use resumes?</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                <strong>No.</strong> We work with portfolios instead of resumes. Talent builds living portfolios on Creerlio that represent their careers completely. Businesses review portfolios instead of resumes. Portfolios provide better information than resumes — they show who people are, not just what they did.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Do you use ATS systems?</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                <strong>No.</strong> We don't use ATS systems. We don't filter by keywords. We don't rank or score candidates algorithmically. We review portfolios and manage recruitment through human judgment, not automated systems.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How is this different?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                <strong>Discovery first. Recruitment second.</strong>
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Traditional recruitment starts with job boards and resumes. We start with discovery and exploration. Talent builds portfolios and explores businesses. Businesses build their presence and attract interest. Genuine interest flows before recruitment begins. Then PeopleSelect manages the full recruitment process — interviews, vetting, consultation, placement. We still do all the recruitment work — we just start with discovery, not applications.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">What is Creerlio?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio is a discovery platform. It enables talent to build portfolios and explore businesses. It enables businesses to build their presence and tell their story. It enables human-led connections through discovery and exploration.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Creerlio is not a recruitment agency. Creerlio is not a job board. Creerlio is a discovery platform. PeopleSelect is the recruitment agency powered by Creerlio.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">What is PeopleSelect?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                PeopleSelect is a recruitment agency powered by Creerlio. We manage recruitment, run interviews, vet candidates, consult businesses, and place talent. We use Creerlio instead of resumes and ATS systems. But we still do the full recruitment work.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Many businesses use Creerlio directly. PeopleSelect is for businesses who want us to manage the full recruitment process. We review portfolios, interview candidates, vet backgrounds, consult on fit, and place talent. We're a real recruitment agency — we just don't start with job boards and resumes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How is this different from job boards?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Job boards post vacancies. People wait for roles to appear. Applications go into a system. Recruiters sort through responses.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio works differently. Talent builds portfolios and explores businesses proactively. Businesses build their presence and attract interest. Connections happen through discovery and exploration, not job applications.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect manages the recruitment process using portfolios instead of resumes. We still do all the recruitment work — we just start with discovery, not job boards.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How does matching work?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                There is no automated matching. Talent explores businesses and chooses who to connect with. Businesses review portfolios and choose who to engage with. All connections are human-initiated.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect manages the recruitment process — we review portfolios, interview candidates, vet backgrounds, consult on fit, and place talent. But we don't use algorithms to match or rank candidates. All decisions are human-led.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How does this work for talent?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You build a living portfolio on Creerlio that represents your career, skills, and goals. You explore businesses and choose who to connect with based on your interests and alignment.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You are not ranked. You are not filtered. You are not reduced to keywords. You explore businesses, see culture and values, and choose who to connect with. All decisions are human-led, not automated.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                If a business works with PeopleSelect, we manage the recruitment process — interviews, vetting, placement. But you're not ranked or scored by algorithms. You control your visibility and choose your connections.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">How does this work for businesses?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You build your business presence on Creerlio. You showcase your story, culture, values, and opportunities. Talent explores and discovers you. You receive genuine interest from people who choose you.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You don't sort through resume spam. You don't rely on ATS filters. You review portfolios instead of resumes. You see complete professional context, not just employment history.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect manages the full recruitment process — interviews, vetting, consultation, placement. We still do all the recruitment work. We just use portfolios instead of resumes, and discovery instead of job boards.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Do I need PeopleSelect, or can I use Creerlio directly?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                You can use Creerlio directly. Many businesses do. You build your presence, attract interest, review portfolios, and facilitate connections yourself.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                PeopleSelect is for businesses who want us to manage the full recruitment process. We review portfolios, interview candidates, vet backgrounds, consult on fit, and place talent. We're a recruitment agency — we manage recruitment when you want us to.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Is any part of this automated?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Creerlio is a platform that enables discovery and connection. It provides the infrastructure for portfolios, business profiles, and exploration.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                But there is no automated decision-making. No algorithmic matching. No automated ranking or recommendations. All connections, reviews, and decisions are human-led. Talent chooses. Businesses choose. PeopleSelect manages recruitment — we don't automate it.
              </p>
            </div>

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
