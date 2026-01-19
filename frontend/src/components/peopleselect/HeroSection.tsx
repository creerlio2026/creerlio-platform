'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface HeroSectionProps {
  variant?: 'A' | 'B' | 'C'
  onScrollProgress?: (progress: number) => void
}

export function HeroSection({ variant = 'A', onScrollProgress }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

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

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section ref={heroRef} className="w-full bg-white relative">
      {/* Hero Image Background */}
      <div className="relative w-full min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/peopleselect-hero-banner.jpg"
            alt="Better recruitment starts with better connections - PeopleSelect office setting with modern chairs"
            fill
            priority
            className={`object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="100vw"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/75 lg:bg-gradient-to-r lg:from-white/90 lg:via-white/80 lg:to-white/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-5xl mx-auto">
            <div className={`text-center mb-12 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h1 className="text-5xl lg:text-7xl font-bold text-black mb-6 leading-tight">
                This is recruitment—rebuilt.
              </h1>
              
              {/* Sub-headline */}
              <h2 className="text-2xl lg:text-3xl text-gray-700 mb-6 leading-relaxed max-w-4xl mx-auto font-semibold">
                Powered by Creerlio, PeopleSelect replaces resumes and ATS systems with real portfolios, real discovery, and full human-led hiring.
              </h2>
              
              {/* Supporting Microcopy */}
              <p className="text-sm lg:text-base text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
                No algorithms. No rankings. No gatekeeping. Just people, portfolios, and genuine interest.
              </p>
            </div>
              
            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-6 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Link
                href="/peopleselect/for-employers"
                className="px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg text-center shadow-lg"
              >
                Build Your Business Presence
              </Link>
              <Link
                href="/peopleselect/for-candidates"
                className="px-8 py-4 bg-white text-black border-2 border-gray-900 rounded-lg hover:bg-gray-50 hover:border-blue-600 transition-colors font-semibold text-lg text-center shadow-lg"
              >
                Explore Businesses
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Micro-Proof Strip */}
      <div className="w-full bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
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
