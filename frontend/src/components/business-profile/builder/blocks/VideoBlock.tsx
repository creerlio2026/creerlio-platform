'use client'

import type { VideoBlock } from '../types'

interface VideoBlockProps {
  block: VideoBlock
  editMode?: boolean
  onUpdate?: (block: VideoBlock) => void
}

export function VideoBlockRenderer({ block, editMode = false }: VideoBlockProps) {
  const { data } = block

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-black">
          <video
            src={data.videoUrl}
            className="w-full"
            controls
            preload="metadata"
            poster={data.thumbnailUrl}
            autoPlay={data.autoplay}
          />
        </div>
        {data.caption && (
          <p className="text-center text-gray-600 mt-4">{data.caption}</p>
        )}
      </div>
    </section>
  )
}
