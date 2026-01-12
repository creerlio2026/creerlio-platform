// ============================================
// Block Renderer - Routes blocks to correct component
// ============================================

import type { PageBlock } from '../types'
import { HeroBlockRenderer } from './HeroBlock'
import { TextMediaBlockRenderer } from './TextMediaBlock'
import { RichTextBlockRenderer } from './RichTextBlock'
import { ImageGalleryBlockRenderer } from './ImageGalleryBlock'
import { VideoBlockRenderer } from './VideoBlock'
import { StatsBlockRenderer } from './StatsBlock'
import { ExpandableRolesBlockRenderer } from './ExpandableRolesBlock'
import { BenefitsCultureBlockRenderer } from './BenefitsCultureBlock'
import { AccordionBlockRenderer } from './AccordionBlock'
import { CTABlockRenderer } from './CTABlock'
import { ImageCarousel } from './interactive/ImageCarousel'

interface BlockRendererProps {
  block: PageBlock
  editMode?: boolean
  onUpdate?: (block: PageBlock) => void
}

export function BlockRenderer({ block, editMode = false, onUpdate }: BlockRendererProps) {
  switch (block.type) {
    case 'hero':
      return <HeroBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'text-media':
      return <TextMediaBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'rich-text':
      return <RichTextBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'image-gallery':
      return <ImageGalleryBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'image-carousel':
      return (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <ImageCarousel
              images={(block as any).data.images || []}
              autoplay={(block as any).data.autoplay}
            />
          </div>
        </section>
      )
    case 'video':
      return <VideoBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'stats':
      return <StatsBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'expandable-roles':
      return <ExpandableRolesBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'benefits-culture':
      return <BenefitsCultureBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'accordion':
      return <AccordionBlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    case 'cta':
      return <CTABlockRenderer block={block} editMode={editMode} onUpdate={onUpdate} />
    default:
      return (
        <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded">
          Unknown block type: {(block as any).type}
        </div>
      )
  }
}
