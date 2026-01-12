'use client'

import { useState } from 'react'
import type { ImageGalleryBlock } from '../types'
import { ImageLightbox } from './interactive/ImageLightbox'

interface ImageGalleryBlockProps {
  block: ImageGalleryBlock
  editMode?: boolean
  onUpdate?: (block: ImageGalleryBlock) => void
}

export function ImageGalleryBlockRenderer({ block, editMode = false }: ImageGalleryBlockProps) {
  const { data } = block
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const columns = data.columns || 3
  const gridCols = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'

  if (!data.images || data.images.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-300 rounded-lg">
            No images added yet
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
            {data.images.map((image, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden shadow-md group cursor-pointer"
                onClick={() => setLightboxIndex(idx)}
              >
                <img
                  src={image.url}
                  alt={image.alt || `Gallery image ${idx + 1}`}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 text-sm">
                    {image.caption}
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to expand
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={data.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
