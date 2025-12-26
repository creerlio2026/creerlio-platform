export interface ImpactStat {
  label: string
  value: string
  footnote_optional?: string | null
}

export interface ProgramTile {
  title: string
  description: string
  icon?: string | null
}

export interface BenefitCard {
  title: string
  description: string
}

export interface BusinessArea {
  title: string
  area_slug: string
  description?: string | null
}

export interface SocialProofItem {
  quote: string
  author?: string | null
  context?: string | null
}

export type MediaKind = 'image' | 'video' | 'document'

export interface MediaAsset {
  kind: MediaKind
  url: string
  title?: string | null
  mime?: string | null
  size_bytes?: number | null
  created_at?: string | null
  path?: string | null
}

export interface BusinessProfilePageData {
  business_id: string
  slug: string
  is_published: boolean

  name: string
  logo_url?: string | null
  hero_image_url?: string | null
  tagline?: string | null
  mission?: string | null

  value_prop_headline?: string | null
  value_prop_body?: string | null

  impact_stats: ImpactStat[]
  culture_values: string[]
  business_areas: BusinessArea[]
  benefits: BenefitCard[]
  programs: ProgramTile[]
  live_roles_count: number
  talent_community_enabled: boolean
  portfolio_intake_enabled: boolean
  social_proof: SocialProofItem[]

  media_assets?: MediaAsset[]

  acknowledgement_of_country?: string | null

  // FUTURE-READY HOOKS (stubs only)
  // AI_MATCH_SCORE
  // TALENT_RECOMMENDATIONS
  // BUSINESS_BRAND_HEALTH
  // DIVERSITY_PIPELINE_INSIGHTS
}


