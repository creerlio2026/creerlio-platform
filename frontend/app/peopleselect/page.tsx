'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'
import { HeroSection } from '@/components/peopleselect/HeroSection'
import { HowItWorksSection } from '@/components/peopleselect/HowItWorksSection'

export default function PeopleSelectHomePage() {
  const [scrollProgress, setScrollProgress] = useState(0)
  
  // A/B Testing: Change variant here or use feature flag
  // Variants: 'A' | 'B' | 'C'
  const heroVariant: 'A' | 'B' | 'C' = 'A'

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Section with Animation and Toggle */}
        <HeroSection 
          variant={heroVariant}
          onScrollProgress={setScrollProgress}
        />

        {/* Three Core Business Drivers */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Driver 1 */}
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:border-blue-600 transition-colors">
                <h2 className="text-3xl font-bold text-black mb-4">See the full professional — not just a CV.</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-4">
                  Experience, projects, credentials, and context — all in one profile.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Businesses see the whole professional: detailed experience across roles, real work examples, education and qualifications, licences with documents, referee insight, supporting media, and consultant context. Not summaries. The full picture.
                </p>
              </div>

              {/* Driver 2 */}
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:border-blue-600 transition-colors">
                <h2 className="text-3xl font-bold text-black mb-4">Make better hiring decisions.</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-4">
                  Rich professional profiles and consultant insight replace CV guesswork.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  CVs force hiring managers to guess. Talent Portfolios replace guesswork with clarity. Fewer interviews needed. Stronger shortlists. Clearer alignment from the start. Consultant-backed recommendations based on full context, not employment history alone.
                </p>
              </div>

              {/* Driver 3 */}
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:border-blue-600 transition-colors">
                <h2 className="text-3xl font-bold text-black mb-4">Reduce failed hires.</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-4">
                  Because alignment is visible before interviews begin.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Failed hires usually result from missing context. Portfolios surface alignment early: intent, preferences, cultural fit, and capability depth. Businesses see motivation, availability, and career goals before interviews. Better alignment means better retention.
                </p>
              </div>
            </div>

            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-xl text-gray-700 font-medium">
                Recruitment built on better information — not better advertising.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section with Scroll Transition */}
        <HowItWorksSection scrollProgress={scrollProgress} />

        {/* Differentiation from Traditional Recruitment */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8 text-center">Not Job Boards. Not CV Stacks.</h2>
            
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-lg border-l-4 border-red-500">
                <h3 className="text-2xl font-bold text-black mb-4">What Traditional Recruitment Delivers</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Job board applications and recycled resumes</li>
                  <li>• CV stacks with limited context</li>
                  <li>• Reactive advertising and high-volume shortlisting</li>
                  <li>• Employment history without depth</li>
                  <li>• Decisions based on summaries, not evidence</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-2xl font-bold text-black mb-4">What People Select Delivers</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Businesses are not sent resumes. They are presented with curated Talent Portfolios — rich professional profiles that include:
                </p>
                <ul className="space-y-3 text-gray-600 mb-4">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Detailed experience</strong> across roles and industries, shown in context</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Projects and real work examples</strong> demonstrating capability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Education, qualifications, and licences</strong> with supporting documents</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Referee insight</strong> with contextual commentary</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Supporting media</strong> — images, videos, and attachments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Skills shown in context</strong>, not just listed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Availability, intent, and preferences</strong> — alignment indicators</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <span><strong className="text-black">Consultant insight</strong> layered on top, explaining fit and alignment</span>
                  </li>
                </ul>
                <p className="text-gray-600 leading-relaxed font-medium">
                  This provides more information than any traditional recruitment process. Businesses see evidence, not summaries. Context, not just credentials. Alignment, not just employment history.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">What We Do</h2>
            <p className="text-lg text-gray-600">
              PeopleSelect provides human recruitment assistance for businesses using Creerlio. We help with vetting, screening, hiring processes, and placement — when you want support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-black mb-4">Built on Creerlio</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Creerlio is a discovery platform where talent builds portfolios and explores businesses. Businesses build their presence and attract interest. All connections are human-initiated and choice-driven.
              </p>
              <Link href="/peopleselect/about" className="text-blue-600 hover:text-blue-700 font-semibold">
                Learn about Creerlio →
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-black mb-4">Supported by PeopleSelect</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                PeopleSelect is the human recruitment layer. We help businesses who want assistance with vetting, screening, hiring processes, and placement. We provide support — we don't automate decisions.
              </p>
              <Link href="/peopleselect/for-employers" className="text-blue-600 hover:text-blue-700 font-semibold">
                Learn about our support →
              </Link>
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-600 italic">
              Many businesses use Creerlio directly. PeopleSelect is optional — for businesses who want human support during the hiring process.
            </p>
          </div>
        </section>

        {/* How This Works */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-12 text-center">How This Works</h2>
            
            <div className="space-y-12">
              <div className="flex gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-3">Talent Builds Portfolios</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Professionals create rich portfolios that represent their career: experience, projects, credentials, documents, referees, and context. These portfolios contain significantly more information than CVs. Talent controls visibility and chooses connections.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-3">Businesses Review Portfolios, Not Resumes</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Businesses are not sent CVs. They are presented with curated Talent Portfolios — rich professional profiles with experience, evidence, context, and consultant insight. This provides more information than any traditional recruitment process.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-3">Better Information Leads to Better Decisions</h3>
                  <p className="text-gray-600 leading-relaxed">
                    With full professional context, businesses make better hiring decisions. Fewer interviews needed. Stronger shortlists. Clearer alignment from the start. Reduced failed hires because alignment is visible before interviews begin.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-3">People Select Manages the Process</h3>
                  <p className="text-gray-600 leading-relaxed">
                    People Select consultants do the work. We manage, assess, guide, and recommend. We stand behind the recommendation. We manage the process end-to-end. The system enables better insight, but People Select owns the outcome.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role of People Select */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-8 text-center">People Select Does the Work</h2>
            <p className="text-lg text-gray-600 text-center mb-12">
              We remain your recruitment partner. We manage, assess, guide, and recommend. The system enables better insight, but People Select owns the outcome.
            </p>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-2xl font-bold text-black mb-4">We Do the Work</h3>
                <p className="text-gray-600 leading-relaxed">
                  People Select consultants work with businesses to understand needs, review portfolios, assess fit, and guide decisions. We work with talent to build portfolios and understand career goals. We do the recruitment work — not systems, not algorithms.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-2xl font-bold text-black mb-4">We Stand Behind the Recommendation</h3>
                <p className="text-gray-600 leading-relaxed">
                  When People Select presents a Talent Portfolio, we stand behind that recommendation. We've assessed fit, verified context, and confirmed alignment. We own the outcome, not just the process. Every recommendation comes with consultant insight explaining why this professional fits this business.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border-l-4 border-blue-600">
                <h3 className="text-2xl font-bold text-black mb-4">We Manage the Process End-to-End</h3>
                <p className="text-gray-600 leading-relaxed">
                  We coordinate conversations, facilitate assessments, and guide decisions. We ensure both sides have the information they need. We manage the recruitment process from start to finish. The system enables better insight, but People Select manages the process.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href="/peopleselect/faq"
                className="text-blue-600 hover:text-blue-700 font-semibold text-lg"
              >
                Read our FAQ to learn more →
              </Link>
            </div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-black mb-4">Trusted by Growing Australian Businesses</h2>
            <p className="text-lg text-gray-600 mb-12">
              We work with SMEs, enterprise teams, and government agencies who value quality over speed and relationships over transactions.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              {/* Placeholder for client logos */}
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-900 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Explore a Different Way?</h2>
            <p className="text-xl text-gray-300 mb-10">
              Discover how Creerlio enables human-led recruitment. Learn how PeopleSelect provides support when you need it.
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
