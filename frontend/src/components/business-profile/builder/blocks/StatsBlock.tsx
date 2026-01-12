'use client'

import type { StatsBlock } from '../types'
import { AnimatedCounter } from './interactive/AnimatedCounter'

interface StatsBlockProps {
  block: StatsBlock
  editMode?: boolean
  onUpdate?: (block: StatsBlock) => void
}

export function StatsBlockRenderer({ block, editMode = false, onUpdate }: StatsBlockProps) {
  const { data } = block

  if (!data.stats || data.stats.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {data.stats.map((stat, idx) => (
            <div key={idx} className="text-center transform hover:scale-105 transition-transform">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                <AnimatedCounter value={stat.value} />
              </div>
              <div className="text-lg text-gray-700 font-medium">{stat.label}</div>
              {stat.footnote && (
                <div className="text-sm text-gray-500 mt-1">{stat.footnote}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
