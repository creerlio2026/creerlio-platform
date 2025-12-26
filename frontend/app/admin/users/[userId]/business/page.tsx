'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BusinessProfilePage } from '@/components/business-profile/BusinessProfilePage'
import type { BusinessProfilePageData } from '@/components/business-profile/types'

function safeArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function asString(v: any): string | null {
  return typeof v === 'string' ? v : null
}

function normalizePageRow(row: any): BusinessProfilePageData {
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

export default function AdminBusinessProfileViewPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pageData, setPageData] = useState<BusinessProfilePageData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const u = sessionRes.session?.user
        if (!u?.id) {
          router.replace('/login?redirect=/admin')
          return
        }

        const { data: { user: freshUser } } = await supabase.auth.getUser()
        const userMetadata = (freshUser || u).user_metadata || {}
        const email = u.email || ''
        
        const hasAdminFlag = userMetadata.is_admin === true || userMetadata.admin === true
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
        const isAdminEmail = adminEmails.includes(email.toLowerCase())
        
        if (hasAdminFlag || isAdminEmail) {
          setIsAdmin(true)
          loadBusinessProfile()
        } else {
          alert('Access denied. Admin privileges required.')
          router.replace('/')
        }
      } catch (error) {
        console.error('Error checking admin:', error)
        router.replace('/')
      } finally {
        setIsLoading(false)
      }
    }
    checkAdmin()
  }, [router, userId])

  async function loadBusinessProfile() {
    try {
      // First get the business profile
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (businessError) {
        setError(businessError.message)
        return
      }

      if (!businessData) {
        setError('Business profile not found')
        return
      }

      // Get the business profile page data
      const businessId = businessData.id
      const { data: pageDataRes, error: pageError } = await supabase
        .from('business_profile_pages')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle()

      // Combine business profile and page data
      const combined = {
        ...businessData,
        ...(pageDataRes || {}),
        business_id: businessId
      }

      setPageData(normalizePageRow(combined))
    } catch (err: any) {
      setError(err.message || 'Failed to load business profile')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <header className="sticky top-0 z-40 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href={`/admin/users/${userId}`} className="text-slate-300 hover:text-blue-400">
            ← Back to User Details
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Admin View</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
            {error}
          </div>
        ) : !pageData ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8">
            <h1 className="text-2xl font-bold">Business Profile Not Found</h1>
            <p className="text-slate-300 mt-2">
              This user does not have a business profile page set up.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="bg-slate-900/70 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400">Admin View - Business Profile</p>
            </div>
            <BusinessProfilePage data={pageData} />
          </div>
        )}
      </main>
    </div>
  )
}

