// ============================================
// Business Profile Page Builder - Type Definitions
// ============================================

export type BlockType =
  | 'hero'
  | 'text-media'
  | 'rich-text'
  | 'image-gallery'
  | 'image-carousel'
  | 'video'
  | 'stats'
  | 'expandable-roles'
  | 'benefits-culture'
  | 'accordion'
  | 'cta'

export type TemplateId = 'employer-brand' | 'visual-culture' | 'simple-corporate'

export interface BaseBlock {
  id: string
  type: BlockType
  order: number
}

export interface HeroBlock extends BaseBlock {
  type: 'hero'
  data: {
    heading: string
    subheading?: string
    backgroundImage?: string
    backgroundVideo?: string
    ctaText?: string
    ctaLink?: string
    logoUrl?: string
  }
}

export interface TextMediaBlock extends BaseBlock {
  type: 'text-media'
  data: {
    text: string
    mediaUrl?: string
    mediaType?: 'image' | 'video'
    layout: 'text-left' | 'text-right'
    heading?: string
  }
}

export interface RichTextBlock extends BaseBlock {
  type: 'rich-text'
  data: {
    content: string
    heading?: string
  }
}

export interface ImageGalleryBlock extends BaseBlock {
  type: 'image-gallery'
  data: {
    images: Array<{
      url: string
      alt?: string
      caption?: string
    }>
    columns?: 2 | 3 | 4
  }
}

export interface VideoBlock extends BaseBlock {
  type: 'video'
  data: {
    videoUrl: string
    thumbnailUrl?: string
    autoplay?: boolean
    caption?: string
  }
}

export interface StatsBlock extends BaseBlock {
  type: 'stats'
  data: {
    stats: Array<{
      value: string
      label: string
      footnote?: string
    }>
  }
}

export interface ExpandableRolesBlock extends BaseBlock {
  type: 'expandable-roles'
  data: {
    categories: Array<{
      title: string
      description?: string
      roles?: string[]
    }>
  }
}

export interface BenefitsCultureBlock extends BaseBlock {
  type: 'benefits-culture'
  data: {
    items: Array<{
      title: string
      description?: string
      icon?: string
    }>
    title?: string
  }
}

export interface ImageCarouselBlock extends BaseBlock {
  type: 'image-carousel'
  data: {
    images: Array<{
      url: string
      alt?: string
      caption?: string
    }>
    autoplay?: boolean
  }
}

export interface AccordionBlock extends BaseBlock {
  type: 'accordion'
  data: {
    title?: string
    items: Array<{
      title: string
      content: string
      icon?: string
    }>
    allowMultiple?: boolean
  }
}

export interface CTABlock extends BaseBlock {
  type: 'cta'
  data: {
    heading?: string
    text?: string
    buttonText: string
    buttonLink: string
    variant?: 'primary' | 'secondary'
  }
}

export type PageBlock =
  | HeroBlock
  | TextMediaBlock
  | RichTextBlock
  | ImageGalleryBlock
  | ImageCarouselBlock
  | VideoBlock
  | StatsBlock
  | ExpandableRolesBlock
  | BenefitsCultureBlock
  | AccordionBlock
  | CTABlock

export interface BusinessProfilePage {
  id: string
  templateId: TemplateId
  blocks: PageBlock[]
  createdAt?: string
  updatedAt?: string
}

export interface BusinessProfileTemplate {
  id: TemplateId
  name: string
  description: string
  defaultBlocks: Omit<PageBlock, 'id' | 'order'>[]
  styles: {
    primaryColor?: string
    fontFamily?: string
    spacing?: 'compact' | 'standard' | 'spacious'
  }
}
