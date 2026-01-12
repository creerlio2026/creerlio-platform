'use client'

import type { BenefitsCultureBlock } from '../types'

interface BenefitsCultureBlockProps {
  block: BenefitsCultureBlock
  editMode?: boolean
  onUpdate?: (block: BenefitsCultureBlock) => void
}

export function BenefitsCultureBlockRenderer({ block, editMode = false }: BenefitsCultureBlockProps) {
  const { data } = block

  if (!data.items || data.items.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {data.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            {data.title}
          </h2>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {item.icon && (
                <div className="text-3xl mb-4">{item.icon}</div>
              )}
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              {item.description && (
                <p className="text-gray-600 text-sm">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
