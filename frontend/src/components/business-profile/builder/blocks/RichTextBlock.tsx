'use client'

import type { RichTextBlock } from '../types'

interface RichTextBlockProps {
  block: RichTextBlock
  editMode?: boolean
  onUpdate?: (block: RichTextBlock) => void
}

export function RichTextBlockRenderer({ block, editMode = false }: RichTextBlockProps) {
  const { data } = block

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {data.heading && (
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{data.heading}</h2>
        )}
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{data.content}</p>
        </div>
      </div>
    </section>
  )
}
