// ============================================
// Data Migration Utility
// Converts existing business_profiles fields to page blocks
// ============================================

import type { PageBlock, BusinessProfilePage } from './types'

interface LegacyBusinessProfile {
  business_name?: string
  name?: string
  description?: string
  logo_url?: string
  hero_image_url?: string
  tagline?: string
  value_prop_headline?: string
  value_prop_body?: string
  impact_stats?: Array<{ label: string; value: string; footnote_optional?: string }>
  culture_values?: string[]
  benefits?: Array<{ title: string; description: string }>
  business_areas?: Array<{ title: string; description?: string }>
}

export function migrateLegacyDataToBlocks(
  legacyData: LegacyBusinessProfile,
  templateId: string = 'employer-brand'
): BusinessProfilePage {
  const blocks: PageBlock[] = []
  let order = 0

  // Generate unique ID helper
  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // 1. Hero Block (ALWAYS create - even with minimal data)
  const businessName = legacyData.business_name || legacyData.name || 'Your Business'
  blocks.push({
    id: generateId(),
    type: 'hero',
    order: order++,
    data: {
      heading: businessName,
      subheading: legacyData.tagline || 'Join our team and make an impact',
      backgroundImage: legacyData.hero_image_url || undefined,
      logoUrl: legacyData.logo_url || undefined,
      ctaText: 'View Opportunities',
      ctaLink: '/jobs',
    },
  })

  // 2. Text+Media or Rich Text Block (ALWAYS create - use available data or defaults)
  if (legacyData.value_prop_headline || legacyData.value_prop_body || legacyData.description) {
    blocks.push({
      id: generateId(),
      type: 'text-media',
      order: order++,
      data: {
        heading: legacyData.value_prop_headline || 'Why Work With Us',
        text: legacyData.value_prop_body || legacyData.description || 'We are building a great team and looking for talented individuals to join us.',
        layout: 'text-left',
      },
    })
  } else {
    // Default content block - always create something
    blocks.push({
      id: generateId(),
      type: 'rich-text',
      order: order++,
      data: {
        heading: 'About Us',
        content: 'We are a growing company looking for passionate team members. Join us and be part of something great.',
      },
    })
  }

  // 3. Stats Block (from impact_stats)
  if (legacyData.impact_stats && legacyData.impact_stats.length > 0) {
    blocks.push({
      id: generateId(),
      type: 'stats',
      order: order++,
      data: {
        stats: legacyData.impact_stats.map((stat) => ({
          value: stat.value,
          label: stat.label,
          footnote: stat.footnote_optional,
        })),
      },
    })
  }

  // 4. Benefits/Culture Block (from benefits or culture_values)
  if (legacyData.benefits && legacyData.benefits.length > 0) {
    blocks.push({
      id: generateId(),
      type: 'benefits-culture',
      order: order++,
      data: {
        title: 'Benefits & Culture',
        items: legacyData.benefits.map((benefit) => ({
          title: benefit.title,
          description: benefit.description,
        })),
      },
    })
  } else if (legacyData.culture_values && legacyData.culture_values.length > 0) {
    blocks.push({
      id: generateId(),
      type: 'benefits-culture',
      order: order++,
      data: {
        title: 'Our Values',
        items: legacyData.culture_values.map((value) => ({
          title: value,
        })),
      },
    })
  }

  // 5. Expandable Roles Block (from business_areas)
  if (legacyData.business_areas && legacyData.business_areas.length > 0) {
    blocks.push({
      id: generateId(),
      type: 'expandable-roles',
      order: order++,
      data: {
        categories: legacyData.business_areas.map((area) => ({
          title: area.title,
          description: area.description || undefined,
        })),
      },
    })
  }

  // 6. CTA Block (always add at the end)
  blocks.push({
    id: generateId(),
    type: 'cta',
    order: order++,
    data: {
      heading: 'Ready to Join Us?',
      text: 'Explore our open positions and start your journey with us.',
      buttonText: 'View Open Roles',
      buttonLink: '/jobs',
      variant: 'primary',
    },
  })

  return {
    id: 'overview',
    templateId: templateId as any,
    blocks,
  }
}
