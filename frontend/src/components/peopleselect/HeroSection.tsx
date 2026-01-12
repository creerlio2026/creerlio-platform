'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// Copy variants configuration for A/B testing
const COPY_VARIANTS = {
  A: {
    headline: "Not matched. Chosen.",
    sub: "This is recruitment built on discovery, not algorithms. Talent explores businesses. Businesses showcase who they are. Human connections, not job boards.",
    ctaPrimary: "For Businesses",
    ctaSecondary: "For Talent",
    ctaPrimaryLink: "/peopleselect/for-employers",
    ctaSecondaryLink: "/peopleselect/for-candidates",
  },
  B: {
    headline: "Recruitment without the job board.",
    sub: "Talent builds portfolios and explores businesses. Businesses tell their story. PeopleSelect helps humans hire humans.",
    ctaPrimary: "Explore for Business",
    ctaSecondary: "Explore for Talent",
    ctaPrimaryLink: "/peopleselect/for-employers",
    ctaSecondaryLink: "/peopleselect/for-candidates",
  },
  C: {
    headline: "Human-led hiring, platform-powered.",
    sub: "Built on Creerlio — a discovery platform where talent explores businesses and businesses showcase their story. PeopleSelect provides the human support layer.",
    ctaPrimary: "For Businesses",
    ctaSecondary: "For Talent",
    ctaPrimaryLink: "/peopleselect/for-employers",
    ctaSecondaryLink: "/peopleselect/for-candidates",
  },
}

// Employer/Talent mode copy
const MODE_COPY = {
  employer: {
    sub: "Build your business presence. Showcase your story. Attract talent who chooses you — not algorithms that rank them.",
    cta: "For Businesses",
    ctaLink: "/peopleselect/for-employers",
    proof: ["No job ads needed", "Talent discovers you", "Human support available"],
  },
  talent: {
    sub: "Build your portfolio. Explore businesses. Connect with who you choose. No algorithms deciding for you.",
    cta: "For Talent",
    ctaLink: "/peopleselect/for-candidates",
    proof: ["You choose who to connect", "No automated matching", "Human relationships"],
  },
}

interface HeroSectionProps {
  variant?: 'A' | 'B' | 'C'
  onScrollProgress?: (progress: number) => void
}

export function HeroSection({ variant = 'A', onScrollProgress }: HeroSectionProps) {
  const [mode, setMode] = useState<'employer' | 'talent'>('employer')
  const heroRef = useRef<HTMLDivElement>(null)

  const copy = COPY_VARIANTS[variant]
  const modeCopy = MODE_COPY[mode]

  // Handle scroll for transition
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current || !onScrollProgress) return
      const rect = heroRef.current.getBoundingClientRect()
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.5)))
      onScrollProgress(scrollProgress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onScrollProgress])

  return (
    <section ref={heroRef} className="w-full bg-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto">
          {/* Headline */}
          <div className="text-center mb-12">
            <h1 className="text-6xl lg:text-7xl font-bold text-black mb-6 leading-tight">
              {copy.headline}
            </h1>
            
            {/* Sub-headline (changes with mode) */}
            <p className="text-2xl lg:text-3xl text-gray-700 mb-4 leading-relaxed max-w-4xl mx-auto">
              {modeCopy.sub}
            </p>
            
            {/* Support line */}
            <p className="text-lg text-gray-600 mb-12">
              This is different from job boards and AI matching. Built on Creerlio — a discovery platform. Supported by PeopleSelect — human recruitment assistance when you need it.
            </p>
          </div>

          {/* Employer/Talent Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setMode('employer')}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                  mode === 'employer'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Employers
              </button>
              <button
                type="button"
                onClick={() => setMode('talent')}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                  mode === 'talent'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Talent
              </button>
            </div>
          </div>
            
          {/* Primary CTA (changes with mode) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href={modeCopy.ctaLink}
              className="px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg"
            >
              {modeCopy.cta}
            </Link>
            <Link
              href={mode === 'employer' ? MODE_COPY.talent.ctaLink : MODE_COPY.employer.ctaLink}
              className="px-8 py-4 bg-white text-black border-2 border-gray-900 rounded-lg hover:bg-gray-50 hover:border-blue-600 transition-colors font-semibold text-lg"
            >
              {mode === 'employer' ? MODE_COPY.talent.cta : MODE_COPY.employer.cta}
            </Link>
          </div>

          {/* Mode-specific micro-proof */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            {modeCopy.proof.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Micro-Proof Strip */}
      <div className="w-full bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-gray-400 text-sm font-medium mb-2">Not a job board</div>
              <div className="text-black text-lg font-semibold">Discovery and exploration</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm font-medium mb-2">Not AI matching</div>
              <div className="text-black text-lg font-semibold">Human-led connections</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm font-medium mb-2">Not automated</div>
              <div className="text-black text-lg font-semibold">Choice-driven relationships</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
