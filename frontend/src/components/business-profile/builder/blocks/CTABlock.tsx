'use client'

import type { CTABlock } from '../types'

interface CTABlockProps {
  block: CTABlock
  editMode?: boolean
  onUpdate?: (block: CTABlock) => void
}

export function CTABlockRenderer({ block, editMode = false }: CTABlockProps) {
  const { data } = block
  const isPrimary = data.variant === 'primary'

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto px-6 text-center text-white">
        {data.heading && (
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.heading}</h2>
        )}
        {data.text && (
          <p className="text-xl text-white/90 mb-8">{data.text}</p>
        )}
        <a
          href={data.buttonLink}
          className={`inline-block px-8 py-4 rounded-lg font-semibold transition-colors ${
            isPrimary
              ? 'bg-white text-blue-600 hover:bg-gray-100'
              : 'bg-transparent border-2 border-white text-white hover:bg-white/10'
          }`}
        >
          {data.buttonText}
        </a>
      </div>
    </section>
  )
}
