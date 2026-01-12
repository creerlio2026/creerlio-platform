'use client'

import { useState } from 'react'
import { Play, Pause } from 'lucide-react'
import type { HeroBlock } from '../types'

interface HeroBlockProps {
  block: HeroBlock
  editMode?: boolean
  onUpdate?: (block: HeroBlock) => void
}

export function HeroBlockRenderer({ block, editMode = false, onUpdate }: HeroBlockProps) {
  const { data } = block
  const [isPlaying, setIsPlaying] = useState(true)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)

  const togglePlay = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause()
      } else {
        videoRef.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      {data.backgroundVideo ? (
        <div className="absolute inset-0">
          <video
            ref={setVideoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            src={data.backgroundVideo}
          />
          {/* Video Control Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={togglePlay}
              className="bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all backdrop-blur-sm"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>
      ) : data.backgroundImage ? (
        <img
          src={data.backgroundImage}
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
      )}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
        {data.logoUrl && (
          <div className="mb-8 flex justify-center animate-fade-in">
            <img src={data.logoUrl} alt="Logo" className="h-20 w-auto drop-shadow-2xl" />
          </div>
        )}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg animate-slide-up">
          {data.heading}
        </h1>
        {data.subheading && (
          <p className="text-2xl md:text-3xl text-white/90 mb-8 drop-shadow-md animate-slide-up-delay">
            {data.subheading}
          </p>
        )}
        {data.ctaText && data.ctaLink && (
          <a
            href={data.ctaLink}
            className="inline-block px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            {data.ctaText}
          </a>
        )}
      </div>
    </section>
  )
}
