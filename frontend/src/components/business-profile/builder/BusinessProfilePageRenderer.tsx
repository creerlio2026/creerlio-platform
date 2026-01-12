'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { BusinessProfilePageData } from '../types'
import type { BusinessProfilePage } from './types'
import { BlockRenderer } from './blocks'
import { migrateLegacyDataToBlocks } from './dataMigration'

interface BusinessProfilePageRendererProps {
  profileData: BusinessProfilePageData
}

export function BusinessProfilePageRenderer({ profileData }: BusinessProfilePageRendererProps) {
  const [page, setPage] = useState<BusinessProfilePage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPage()
  }, [])

  const loadPage = async () => {
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id

      if (!uid) {
        // Fallback to legacy rendering if not authenticated
        setPage(null)
        setLoading(false)
        return
      }

      // Load business profile with page blocks
      // Try to select page_blocks, but handle gracefully if columns don't exist yet
      let profile: any = null
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('page_blocks, page_template_id, business_name, name, description, logo_url, hero_image_url, tagline, value_prop_headline, value_prop_body')
          .eq('user_id', uid)
          .maybeSingle()
        
        if (error && error.code === '42703') {
          // Column doesn't exist - migration not run yet
          console.warn('page_blocks column not found. Please run migration 2025122505_business_profile_page_builder.sql')
          // Fallback: select only basic columns
          const { data: basicData } = await supabase
            .from('business_profiles')
            .select('business_name, name, description, logo_url, hero_image_url, tagline, value_prop_headline, value_prop_body')
            .eq('user_id', uid)
            .maybeSingle()
          profile = basicData
        } else {
          profile = data
        }
      } catch (err: any) {
        // If query fails, try basic columns only
        const { data: basicData } = await supabase
          .from('business_profiles')
          .select('business_name, name, description, logo_url, hero_image_url, tagline, value_prop_headline, value_prop_body')
          .eq('user_id', uid)
          .maybeSingle()
        profile = basicData
      }

      // Always migrate/create blocks - even if page_blocks exists but is empty
      // This ensures we always have a page to display
      if (profile?.page_blocks && Array.isArray(profile.page_blocks) && profile.page_blocks.length > 0) {
        // Use existing saved blocks
        setPage({
          id: 'overview',
          templateId: (profile.page_template_id as any) || 'employer-brand',
          blocks: profile.page_blocks as any,
        })
      } else {
        // Migrate legacy data or create default page
        const businessName = profile?.business_name || profile?.name || profileData.name || 'Your Business'
        const migratedPage = migrateLegacyDataToBlocks(
          {
            business_name: businessName,
            description: profile?.description || profileData.description || '',
            logo_url: profile?.logo_url || profileData.logo_url || null,
            hero_image_url: profile?.hero_image_url || profileData.hero_image_url || null,
            tagline: profile?.tagline || profileData.tagline || null,
            value_prop_headline: profile?.value_prop_headline || profileData.value_prop_headline || null,
            value_prop_body: profile?.value_prop_body || profileData.value_prop_body || null,
            impact_stats: profileData.impact_stats || [],
            culture_values: profileData.culture_values || [],
            benefits: profileData.benefits || [],
            business_areas: profileData.business_areas || [],
          },
          (profile?.page_template_id as string) || 'employer-brand'
        )
        setPage(migratedPage)
      }

      setLoading(false)
    } catch (err) {
      console.error('Failed to load page:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Always ensure we have blocks to render - never show empty state
  let blocksToRender: PageBlock[] = []
  
  if (page && page.blocks && Array.isArray(page.blocks) && page.blocks.length > 0) {
    // Use saved blocks
    blocksToRender = [...page.blocks].sort((a, b) => a.order - b.order)
  } else {
    // Create blocks from profileData (always creates at least Hero + Content + CTA)
    const defaultPage = migrateLegacyDataToBlocks(
      {
        business_name: profileData.name,
        description: profileData.value_prop_body || profileData.mission || profileData.description || '',
        logo_url: profileData.logo_url || null,
        hero_image_url: profileData.hero_image_url || null,
        tagline: profileData.tagline || null,
        value_prop_headline: profileData.value_prop_headline || null,
        value_prop_body: profileData.value_prop_body || null,
        impact_stats: profileData.impact_stats || [],
        culture_values: profileData.culture_values || [],
        benefits: profileData.benefits || [],
        business_areas: profileData.business_areas || [],
      },
      'employer-brand'
    )
    blocksToRender = [...defaultPage.blocks].sort((a, b) => a.order - b.order)
  }

  // Safety check - if still no blocks, create absolute minimum
  if (blocksToRender.length === 0) {
    const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    blocksToRender = [
      {
        id: generateId(),
        type: 'hero',
        order: 0,
        data: {
          heading: profileData.name || 'Your Business',
          subheading: 'Join our team',
          ctaText: 'View Opportunities',
          ctaLink: '/jobs',
        },
      },
      {
        id: generateId(),
        type: 'cta',
        order: 1,
        data: {
          heading: 'Ready to Join Us?',
          buttonText: 'View Open Roles',
          buttonLink: '/jobs',
          variant: 'primary',
        },
      },
    ]
  }

  return (
    <div className="min-h-screen bg-white">
      {blocksToRender.map((block) => (
        <BlockRenderer key={block.id} block={block} editMode={false} />
      ))}
    </div>
  )
}
