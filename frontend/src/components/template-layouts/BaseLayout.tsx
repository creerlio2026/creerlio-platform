/**
 * Base Layout Component
 * 
 * Shared utilities and common patterns for template layouts
 */

'use client'

import { TemplateViewPortfolioData, TemplateState } from '../TemplateView'

export interface BaseLayoutProps {
  portfolioData: TemplateViewPortfolioData
  templateState: TemplateState
  editMode: boolean
  onToggleSection: (section: string) => void
  onToggleItem: (section: string, index: number) => void
  avatarUrl: string | null
  bannerUrl: string | null
  introVideoUrl: string | null
  attachmentUrls: Record<number, string>
}

export function getVisibleItems<T>(
  items: T[],
  selectedIndices: number[],
  editMode: boolean
): { item: T; index: number; isSelected: boolean }[] {
  return items.map((item, idx) => ({
    item,
    index: idx,
    isSelected: selectedIndices.includes(idx),
  })).filter(({ isSelected }) => editMode || isSelected)
}

export function SectionToggle({
  section,
  isIncluded,
  editMode,
  onToggle,
  label,
}: {
  section: string
  isIncluded: boolean
  editMode: boolean
  onToggle: (section: string) => void
  label: string
}) {
  if (!editMode) return null
  return (
    <div className="mb-4 flex items-center justify-between">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isIncluded}
          onChange={() => onToggle(section)}
          className="w-5 h-5 rounded border-2 border-slate-300"
        />
        <span className="text-sm text-slate-600">Include Section</span>
      </label>
    </div>
  )
}
