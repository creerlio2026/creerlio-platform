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

  // Opacity and transform based on scroll progress
  const bridgeOpacity = Math.min(1, scrollProgress * 2)
  const contentOpacity = Math.max(0, (scrollProgress - 0.5) * 2)
  const bridgeTranslateY = Math.max(0, (1 - scrollProgress) * 50)

  return (
    <section ref={sectionRef} className="w-full bg-white relative">
      {/* Bridge Line */}
      <div 
        className="max-w-4xl mx-auto px-6 lg:px-8 py-16 text-center transition-opacity duration-300"
        style={{ 
          opacity: bridgeOpacity,
          transform: `translateY(${bridgeTranslateY}px)`
        }}
      >
        <p className="text-xl lg:text-2xl text-gray-600 italic">
          This is how recruitment works when CVs are no longer the centre.
        </p>
      </div>

      {/* How It Works Content */}
      <div 
        className="max-w-7xl mx-auto px-6 lg:px-8 pb-20 transition-opacity duration-500"
        style={{ opacity: isVisible ? 1 : contentOpacity }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-black mb-8 text-center">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed text-center mb-16">
            Built on Creerlio — a discovery platform. Supported by PeopleSelect — human recruitment assistance when you need it.
          </p>

          {/* Quick Summary Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-black mb-3">For Businesses</h3>
              <p className="text-gray-600">
                Build your presence. Showcase your story. Attract talent who discovers you. PeopleSelect provides human support when needed.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-black mb-3">For Talent</h3>
              <p className="text-gray-600">
                Build your portfolio. Explore businesses. Choose who to connect with. No algorithms deciding for you.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-black mb-3">The Difference</h3>
              <p className="text-gray-600">
                Discovery and exploration, not job boards. Human connections, not AI matching. Choice-driven, not automated.
              </p>
            </div>
          </div>

          {/* CTA */}
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
