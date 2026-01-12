'use client'

import { useState } from 'react'
import type { PageBlock } from './types'

interface BlockEditorProps {
  block: PageBlock
  onSave: (block: PageBlock) => void
  onCancel: () => void
}

export function BlockEditor({ block, onSave, onCancel }: BlockEditorProps) {
  const [editedBlock, setEditedBlock] = useState<PageBlock>(JSON.parse(JSON.stringify(block)))

  const handleSave = () => {
    onSave(editedBlock)
  }

  // Simple inline editor - can be expanded later
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-bold mb-4">Edit Block: {block.type}</h3>
        
        <div className="space-y-4">
          {/* Generic editor for all block types */}
          {Object.entries(editedBlock.data).map(([key, value]) => {
            if (Array.isArray(value)) {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <textarea
                    value={JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        setEditedBlock({
                          ...editedBlock,
                          data: { ...editedBlock.data, [key]: parsed },
                        })
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 font-mono text-sm"
                    rows={6}
                  />
                </div>
              )
            } else if (typeof value === 'object' && value !== null) {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <textarea
                    value={JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        setEditedBlock({
                          ...editedBlock,
                          data: { ...editedBlock.data, [key]: parsed },
                        })
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 font-mono text-sm"
                    rows={4}
                  />
                </div>
              )
            } else {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={String(value || '')}
                    onChange={(e) =>
                      setEditedBlock({
                        ...editedBlock,
                        data: { ...editedBlock.data, [key]: e.target.value },
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              )
            }
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
