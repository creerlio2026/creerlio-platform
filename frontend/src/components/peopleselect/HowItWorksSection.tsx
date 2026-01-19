'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface HowItWorksSectionProps {
  scrollProgress: number
}

export function HowItWorksSection({ scrollProgress }: HowItWorksSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const bridgeOpacity = Math.min(1, scrollProgress * 2)
  const contentOpacity = Math.max(0, (scrollProgress - 0.5) * 2)
  const bridgeTranslateY = Math.max(0, (1 - scrollProgress) * 50)

  return (
    <section ref={sectionRef} className="w-full bg-white relative">
      <div 
        className="max-w-4xl mx-auto px-6 lg:px-8 py-10 text-center transition-opacity duration-300"
        style={{ 
          opacity: bridgeOpacity,
          transform: `translateY(${bridgeTranslateY}px)`
        }}
      >
        <p className="text-xl lg:text-2xl text-gray-600 italic">
          This is how recruitment works when discovery comes first.
        </p>
      </div>

      <div 
        className="max-w-7xl mx-auto px-6 lg:px-8 pb-12 transition-opacity duration-500"
        style={{ opacity: isVisible ? 1 : contentOpacity }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-black mb-6 text-center">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed text-center mb-10">
            Powered by Creerlio — a discovery platform. Managed by PeopleSelect — a recruitment agency that still does the full work.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-black mb-3">For Businesses</h3>
              <p className="text-gray-600">
                Build your presence on Creerlio. Showcase your story. Attract aligned talent who discovers you. PeopleSelect manages the recruitment process — interviews, vetting, placement.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-black mb-3">For Talent</h3>
              <p className="text-gray-600">
                Build your portfolio on Creerlio. Explore businesses. Choose who to connect with. No algorithms. No rankings. Just discovery and genuine interest.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-black mb-3">The Difference</h3>
              <p className="text-gray-600">
                Discovery and exploration, not job boards. Portfolios, not resumes. Human-led recruitment, not ATS systems. Still full recruitment — just done differently.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/peopleselect/how-it-works"
              className="inline-block px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg"
            >
              Learn More About How It Works
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
