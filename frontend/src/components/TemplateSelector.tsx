/**
 * Template Selector Component
 * 
 * Allows talent to preview and select from the canonical 20 templates
 * Only shows templates that support the shared sections
 */

'use client'

import { useState } from 'react'
import { 
  CANONICAL_PORTFOLIO_TEMPLATES, 
  PortfolioTemplate, 
  TemplateId,
  getAllTemplateCategories,
  getTemplatesByCategory,
} from './portfolioTemplates'
import { ShareConfig } from './PortfolioShareConfig'

interface TemplateSelectorProps {
  shareConfig: ShareConfig | null
  currentTemplateId: TemplateId | null
  onSelect: (templateId: TemplateId) => void
  onClose: () => void
}

export default function TemplateSelector({
  shareConfig,
  currentTemplateId,
  onSelect,
  onClose,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<PortfolioTemplate | null>(null)

  // Get available sections based on share config
  // If no share config, show all sections (for preview/browse mode)
  const availableSections = shareConfig ? [
    shareConfig.share_intro && 'intro',
    shareConfig.share_social && 'social',
    shareConfig.share_skills && 'skills',
    shareConfig.share_experience && 'experience',
    shareConfig.share_education && 'education',
    shareConfig.share_referees && 'referees',
    shareConfig.share_projects && 'projects',
    shareConfig.share_attachments && 'attachments',
  ].filter(Boolean) as string[] : [
    'intro', 'social', 'skills', 'experience', 'education', 'referees', 'projects', 'attachments'
  ]

  // Filter templates that support available sections
  const getFilteredTemplates = () => {
    let templates = CANONICAL_PORTFOLIO_TEMPLATES

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = getTemplatesByCategory(selectedCategory as any)
    }

    // Filter by available sections (template must support at least one available section)
    // If no share config, show all templates
    if (shareConfig) {
      templates = templates.filter(template => 
        template.supported_sections.some(section => availableSections.includes(section))
      )
    }

    return templates
  }

  const filteredTemplates = getFilteredTemplates()
  const categories = ['all', ...getAllTemplateCategories()]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div
        className="w-full max-w-6xl bg-slate-950 border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold">Choose Portfolio Template</h2>
            <p className="text-sm text-gray-400 mt-1">
              {shareConfig 
                ? `Select a template based on your shared content (${availableSections.length} sections available)`
                : 'Browse all available portfolio templates'
              }
            </p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
                }`}
              >
                {category === 'all' 
                  ? `All (${filteredTemplates.length})` 
                  : `${category} (${getTemplatesByCategory(category as any).length})`
                }
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.template_id}
                className={`bg-slate-900/70 border rounded-xl p-6 hover:bg-slate-800/70 transition-colors cursor-pointer ${
                  currentTemplateId === template.template_id
                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                    : 'border-white/10'
                }`}
                onClick={() => {
                  setPreviewTemplate(template)
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        template.category === 'Creative' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
                        template.category === 'Technology' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                        template.category === 'Business' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                      }`}>
                        {template.category}
                      </span>
                      {template.featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-400 mb-2">Supported Sections:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.supported_sections.map(section => (
                      <span
                        key={section}
                        className={`text-xs px-2 py-0.5 rounded ${
                          availableSections.includes(section)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-gray-500/20 text-gray-500 border border-gray-500/50'
                        }`}
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Media: {template.media_support.avatar ? 'Avatar' : ''} 
                    {template.media_support.banner ? ' + Banner' : ''} 
                    {template.media_support.video ? ' + Video' : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(template.template_id)
                  }}
                  className="w-full px-4 py-2 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Use This Template
                </button>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No templates available for your shared sections</p>
              <p className="text-sm text-gray-500 mt-2">
                Enable more sections in Share Configuration to see more templates
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="w-full max-w-4xl bg-slate-950 border border-white/10 rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{previewTemplate.name}</h3>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                onClick={() => setPreviewTemplate(null)}
              >
                Close Preview
              </button>
            </div>
            <p className="text-gray-400 mb-4">{previewTemplate.description}</p>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-300">
                <div className="mb-2">This template supports:</div>
                <ul className="list-disc list-inside space-y-1">
                  {previewTemplate.supported_sections.map(section => (
                    <li key={section} className={availableSections.includes(section) ? 'text-green-400' : 'text-gray-500'}>
                      {section} {availableSections.includes(section) ? '✓' : '(not shared)'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(previewTemplate.template_id)
              }}
              className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
            >
              Use This Template
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
