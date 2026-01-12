'use client'

import { useState } from 'react'

export type BusinessTemplateType = 'classic' | 'visual' | 'compact'

interface BusinessTemplateSelectorProps {
  selectedTemplate: BusinessTemplateType
  onTemplateChange: (template: BusinessTemplateType) => void
}

export function BusinessTemplateSelector({
  selectedTemplate,
  onTemplateChange,
}: BusinessTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const templates: { id: BusinessTemplateType; label: string }[] = [
    { id: 'classic', label: 'Classic' },
    { id: 'visual', label: 'Visual' },
    { id: 'compact', label: 'Compact' },
  ]

  const currentLabel = templates.find((t) => t.id === selectedTemplate)?.label || 'Classic'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <span>Template: {currentLabel}</span>
        <span className="text-gray-500">▾</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onTemplateChange(template.id)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                  selectedTemplate === template.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {template.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
