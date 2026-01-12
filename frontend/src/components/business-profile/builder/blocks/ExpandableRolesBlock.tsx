'use client'

import { useState } from 'react'
import type { ExpandableRolesBlock } from '../types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableRolesBlockProps {
  block: ExpandableRolesBlock
  editMode?: boolean
  onUpdate?: (block: ExpandableRolesBlock) => void
}

export function ExpandableRolesBlockRenderer({ block, editMode = false }: ExpandableRolesBlockProps) {
  const { data } = block
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  if (!data.categories || data.categories.length === 0) {
    return null
  }

  const toggleCategory = (idx: number) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Career Opportunities</h2>
        <div className="space-y-4">
          {data.categories.map((category, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                type="button"
                onClick={() => toggleCategory(idx)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{category.title}</h3>
                  {category.description && !expanded[idx] && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  )}
                </div>
                {expanded[idx] ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expanded[idx] && (
                <div className="px-6 py-4 bg-white">
                  {category.description && (
                    <p className="text-gray-700 mb-4">{category.description}</p>
                  )}
                  {category.roles && category.roles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Available Roles:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {category.roles.map((role, roleIdx) => (
                          <li key={roleIdx} className="text-gray-600">{role}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
