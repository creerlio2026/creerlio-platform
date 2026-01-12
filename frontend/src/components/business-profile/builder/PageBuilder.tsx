'use client'

import { useState, useEffect } from 'react'
import { Plus, GripVertical, Trash2, Edit2 } from 'lucide-react'
import type { PageBlock, BlockType, BusinessProfilePage } from './types'
import { BlockRenderer } from './blocks'
import { BlockEditor } from './BlockEditor'
import { getAllTemplates } from './templates'

interface PageBuilderProps {
  initialPage?: BusinessProfilePage
  onSave: (page: BusinessProfilePage) => Promise<void>
  onCancel?: () => void
}

const BLOCK_TYPES: { id: BlockType; label: string; description: string }[] = [
  { id: 'hero', label: 'Hero', description: 'Large header with image/video background' },
  { id: 'text-media', label: 'Text + Media', description: 'Text content with image or video' },
  { id: 'rich-text', label: 'Rich Text', description: 'Multi-paragraph text content' },
  { id: 'image-gallery', label: 'Image Gallery', description: 'Grid of images with lightbox' },
  { id: 'image-carousel', label: 'Image Carousel', description: 'Swipeable image carousel' },
  { id: 'video', label: 'Video', description: 'Video player' },
  { id: 'stats', label: 'Stats', description: 'Animated numbers and metrics' },
  { id: 'expandable-roles', label: 'Expandable Roles', description: 'Collapsible role categories' },
  { id: 'benefits-culture', label: 'Benefits & Culture', description: 'List of benefits or values' },
  { id: 'accordion', label: 'Accordion', description: 'Expandable sections' },
  { id: 'cta', label: 'Call to Action', description: 'Button with heading' },
]

function createDefaultBlock(type: BlockType, order: number): PageBlock {
  const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  switch (type) {
    case 'hero':
      return {
        id,
        type: 'hero',
        order,
        data: { heading: 'Welcome', subheading: 'Join our team' },
      }
    case 'text-media':
      return {
        id,
        type: 'text-media',
        order,
        data: { text: 'Add your content here', layout: 'text-left' },
      }
    case 'rich-text':
      return {
        id,
        type: 'rich-text',
        order,
        data: { content: 'Add your content here' },
      }
    case 'image-gallery':
      return {
        id,
        type: 'image-gallery',
        order,
        data: { images: [], columns: 3 },
      }
    case 'image-carousel':
      return {
        id,
        type: 'image-carousel',
        order,
        data: { images: [], autoplay: false },
      }
    case 'video':
      return {
        id,
        type: 'video',
        order,
        data: { videoUrl: '' },
      }
    case 'stats':
      return {
        id,
        type: 'stats',
        order,
        data: { stats: [{ value: '0', label: 'Stat' }] },
      }
    case 'expandable-roles':
      return {
        id,
        type: 'expandable-roles',
        order,
        data: { categories: [{ title: 'Category' }] },
      }
    case 'benefits-culture':
      return {
        id,
        type: 'benefits-culture',
        order,
        data: { items: [{ title: 'Benefit' }] },
      }
    case 'accordion':
      return {
        id,
        type: 'accordion',
        order,
        data: { items: [{ title: 'Section', content: 'Content here' }], allowMultiple: false },
      }
    case 'cta':
      return {
        id,
        type: 'cta',
        order,
        data: { buttonText: 'Click Here', buttonLink: '#' },
      }
  }
}

export function PageBuilder({ initialPage, onSave, onCancel }: PageBuilderProps) {
  const [page, setPage] = useState<BusinessProfilePage>(
    initialPage || {
      id: 'overview',
      templateId: 'employer-brand',
      blocks: [],
    }
  )
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const sortedBlocks = [...page.blocks].sort((a, b) => a.order - b.order)

  const handleAddBlock = (type: BlockType) => {
    const newOrder = page.blocks.length > 0 ? Math.max(...page.blocks.map((b) => b.order)) + 1 : 0
    const newBlock = createDefaultBlock(type, newOrder)
    setPage({
      ...page,
      blocks: [...page.blocks, newBlock],
    })
    setShowAddMenu(false)
    setEditingBlockId(newBlock.id)
  }

  const handleDeleteBlock = (blockId: string) => {
    setPage({
      ...page,
      blocks: page.blocks.filter((b) => b.id !== blockId),
    })
    if (editingBlockId === blockId) {
      setEditingBlockId(null)
    }
  }

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const blocks = [...page.blocks]
    const index = blocks.findIndex((b) => b.id === blockId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= blocks.length) return

    // Swap orders
    const temp = blocks[index].order
    blocks[index].order = blocks[newIndex].order
    blocks[newIndex].order = temp

    setPage({ ...page, blocks })
  }

  const handleUpdateBlock = (updatedBlock: PageBlock) => {
    setPage({
      ...page,
      blocks: page.blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
    })
    setEditingBlockId(null)
  }

  const handleEditBlock = (blockId: string) => {
    setEditingBlockId(blockId)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(page)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Page Builder</h1>
          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Page'}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Block Management */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                >
                  <Plus className="w-5 h-5" />
                  Add Block
                </button>
                {showAddMenu && (
                  <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-96 overflow-y-auto">
                    {BLOCK_TYPES.map((blockType) => (
                      <button
                        key={blockType.id}
                        type="button"
                        onClick={() => handleAddBlock(blockType.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{blockType.label}</div>
                        <div className="text-sm text-gray-500">{blockType.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-3">Blocks ({sortedBlocks.length})</div>
                {sortedBlocks.map((block, idx) => (
                  <div
                    key={block.id}
                    className={`p-3 rounded-lg border ${
                      editingBlockId === block.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {BLOCK_TYPES.find((t) => t.id === block.type)?.label || block.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditBlock(block.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(block.id, 'up')}
                        disabled={idx === 0}
                        className="text-xs px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(block.id, 'down')}
                        disabled={idx === sortedBlocks.length - 1}
                        className="text-xs px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
                {sortedBlocks.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8">
                    No blocks yet. Click "Add Block" to get started.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Live Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {sortedBlocks.length === 0 ? (
                <div className="p-16 text-center text-gray-500">
                  <p className="text-lg mb-2">Your page is empty</p>
                  <p className="text-sm">Add blocks to start building your profile page</p>
                </div>
              ) : (
                <div>
                  {sortedBlocks.map((block) => (
                    <div key={block.id} className="relative group">
                      {editingBlockId === block.id && (
                        <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium">
                          Editing
                        </div>
                      )}
                      <BlockRenderer block={block} editMode={editingBlockId === block.id} onUpdate={handleUpdateBlock} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Block Editor Modal */}
      {editingBlockId && (
        <BlockEditor
          block={page.blocks.find((b) => b.id === editingBlockId)!}
          onSave={handleUpdateBlock}
          onCancel={() => setEditingBlockId(null)}
        />
      )}
    </div>
  )
}
