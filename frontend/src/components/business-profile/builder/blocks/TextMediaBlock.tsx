'use client'

import type { TextMediaBlock } from '../types'

interface TextMediaBlockProps {
  block: TextMediaBlock
  editMode?: boolean
  onUpdate?: (block: TextMediaBlock) => void
}

export function TextMediaBlockRenderer({ block, editMode = false }: TextMediaBlockProps) {
  const { data } = block
  const isTextLeft = data.layout === 'text-left'

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${isTextLeft ? '' : 'flex-row-reverse'}`}>
          {/* Text Content */}
          <div className={isTextLeft ? 'order-1' : 'order-2'}>
            {data.heading && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{data.heading}</h2>
            )}
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{data.text}</p>
          </div>

          {/* Media */}
          {data.mediaUrl && (
            <div className={isTextLeft ? 'order-2' : 'order-1'}>
              {data.mediaType === 'video' ? (
                <video
                  src={data.mediaUrl}
                  className="w-full rounded-2xl shadow-lg"
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  src={data.mediaUrl}
                  alt={data.heading || 'Media'}
                  className="w-full rounded-2xl shadow-lg object-cover"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
