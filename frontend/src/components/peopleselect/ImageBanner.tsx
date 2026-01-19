'use client'

import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'

interface ImageBannerProps {
  src: string
  alt: string
  heading?: string
  subheading?: string
  overlay?: 'light' | 'dark' | 'gradient'
  className?: string
  priority?: boolean
}

export function ImageBanner({ 
  src, 
  alt, 
  heading, 
  subheading, 
  overlay = 'gradient',
  className = '',
  priority = false
}: ImageBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  const overlayClasses = {
    light: 'bg-white/80',
    dark: 'bg-black/60',
    gradient: 'bg-gradient-to-r from-white/90 via-white/70 to-transparent'
  }

  return (
    <div ref={ref} className={`relative w-full min-h-[400px] lg:min-h-[500px] flex items-center overflow-hidden ${className}`}>
      <div className="absolute inset-0 z-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className={`object-cover transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          sizes="100vw"
        />
        <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
      </div>

      {(heading || subheading) && (
        <div className={`relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {heading && (
            <h2 className="text-4xl lg:text-5xl font-bold text-black mb-3 max-w-3xl">
              {heading}
            </h2>
          )}
          {subheading && (
            <p className="text-xl lg:text-2xl text-gray-700 max-w-2xl">
              {subheading}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
