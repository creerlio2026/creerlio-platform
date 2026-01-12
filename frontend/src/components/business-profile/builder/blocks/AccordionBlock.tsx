'use client'

import type { AccordionBlock } from '../types'
import { Accordion } from './interactive/Accordion'

interface AccordionBlockProps {
  block: AccordionBlock
  editMode?: boolean
  onUpdate?: (block: AccordionBlock) => void
}

export function AccordionBlockRenderer({ block, editMode = false }: AccordionBlockProps) {
  const { data } = block

  if (!data.items || data.items.length === 0) {
    return null
  }

  const accordionItems = data.items.map((item) => ({
    title: item.title,
    content: item.content || '',
    icon: item.icon,
  }))

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {data.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{data.title}</h2>
        )}
        <Accordion items={accordionItems} allowMultiple={data.allowMultiple} />
      </div>
    </section>
  )
}
