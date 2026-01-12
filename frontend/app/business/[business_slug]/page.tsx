import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { BusinessProfilePage } from '@/components/business-profile/BusinessProfilePage'
import type { BusinessProfilePageData } from '@/components/business-profile/types'

// Ensure public business profiles reflect fresh edits (avoid stale cached renders)
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = Record<string, any>

function safeArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function asString(v: any): string | null {
  return typeof v === 'string' ? v : null
}

function slugToName(s: string) {
  const cleaned = s.replace(/[-_]+/g, ' ').trim()
  return cleaned ? cleaned.replace(/\b\w/g, (m) => m.toUpperCase()) : 'Business'
}

function normalizePageRow(row: Row): BusinessProfilePageData {
  const name = asString(row.name) || asString(row.business_name) || asString(row.company_name) || asString(row.legal_name) || asString(row.display_name) || 'Business'

  return {
    business_id: String(row.business_id ?? row.id ?? ''),
    slug: String(row.slug ?? ''),
    is_published: row.is_published !== false,
    name,
    logo_url: asString(row.logo_url),
    hero_image_url: asString(row.hero_image_url),
    tagline: asString(row.tagline),
    mission: asString(row.mission),
    value_prop_headline: asString(row.value_prop_headline),
    value_prop_body: asString(row.value_prop_body),
    impact_stats: safeArray(row.impact_stats),
    culture_values: safeArray(row.culture_values),
    business_areas: safeArray(row.business_areas),
    benefits: safeArray(row.benefits),
    programs: safeArray(row.programs),
    social_proof: safeArray(row.social_proof),
    media_assets: safeArray(row.media_assets),
    live_roles_count: Number(row.live_roles_count ?? 0) || 0,
    talent_community_enabled: !!row.talent_community_enabled,
    portfolio_intake_enabled: !!row.portfolio_intake_enabled,
    acknowledgement_of_country: asString(row.acknowledgement_of_country),
  }
}

export default async function BusinessPublicPage({ params }: { params: { business_slug: string } }) {
  const slug = params?.business_slug
  if (!slug) return notFound()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // Fail closed: do not crash, but also do not show data.
    return notFound()
  }

  const supabase = createClient(url, anon)

  // Primary source: business_profile_pages (enterprise content)
  const pageRes = await supabase
    .from('business_profile_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!pageRes.error && pageRes.data) {
    const data = normalizePageRow(pageRes.data as any)
    return <BusinessProfilePage data={data} />
  }

  // Fallback: attempt to resolve basic business_profiles by common slug columns
  const slugCols = ['slug', 'business_slug', 'handle']
  let bp: Row | null = null
  for (const col of slugCols) {
       // @ts-ignore 
    const res = await supabase.from('business_profiles').select('*').eq(col as any, slug).maybeSingle()
    if (!res.error && res.data) {
      bp = res.data as any
      break
    }
  }

  if (!bp) return notFound()

  // Create a minimal profile page object (no lorem ipsum; prompts are actionable)
  const minimal: BusinessProfilePageData = {
    business_id: String(bp.id ?? ''),
    slug,
    is_published: true,
    name: asString(bp.name) || asString(bp.business_name) || asString(bp.company_name) || slugToName(slug),
    logo_url: asString(bp.logo_url),
    hero_image_url: asString(bp.hero_image_url),
    tagline: asString(bp.tagline) || null,
    mission: asString(bp.mission) || null,
    value_prop_headline: null,
    value_prop_body: null,
    impact_stats: [],
    culture_values: ['Grow', 'Belong', "Shape what’s next"],
    business_areas: [],
    benefits: [],
    programs: [],
    social_proof: [],
    media_assets: [],
    live_roles_count: 0,
    talent_community_enabled: false,
    portfolio_intake_enabled: false,
    acknowledgement_of_country: null,
  }

  return <BusinessProfilePage data={minimal} />
}


