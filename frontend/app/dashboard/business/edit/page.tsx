'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type BusinessProfileRow = Record<string, any>
type MediaKind = 'image' | 'video' | 'document'
type MediaAsset = {
  kind: MediaKind
  url: string
  title?: string | null
  mime?: string | null
  size_bytes?: number | null
  created_at?: string | null
  path?: string | null
}

type BankItem = {
  id: number
  business_id: string
  user_id: string
  item_type: 'document' | 'image' | 'video'
  title: string
  description?: string | null
  file_path?: string | null
  file_type?: string | null
  file_size?: number | null
  created_at: string
}

function pickBusinessName(row: BusinessProfileRow): string {
  return (
    (typeof row?.name === 'string' && row.name) ||
    (typeof row?.business_name === 'string' && row.business_name) ||
    (typeof row?.company_name === 'string' && row.company_name) ||
    (typeof row?.legal_name === 'string' && row.legal_name) ||
    (typeof row?.display_name === 'string' && row.display_name) ||
    ''
  )
}

function slugify(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function humanizeMediaTitle(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) return 'Document'
  const noExt = raw.replace(/\.[a-z0-9]{2,5}$/i, '')
  const cleaned = noExt.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}…` : cleaned
}

export default function EditBusinessProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<BusinessProfileRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    location: '',
    city: '',
    state: '',
    country: '',
    phone: ''
  })

  // Public Business Profile Page (what Talent sees)
  const [publicSlug, setPublicSlug] = useState('')
  const [tagline, setTagline] = useState('')
  const [mission, setMission] = useState('')
  const [valueHeadline, setValueHeadline] = useState('')
  const [valueBody, setValueBody] = useState('')
  const [talentCommunityEnabled, setTalentCommunityEnabled] = useState(false)
  const [portfolioIntakeEnabled, setPortfolioIntakeEnabled] = useState(false)
  const [ackCountry, setAckCountry] = useState('')
  const [impactStats, setImpactStats] = useState<Array<{ label: string; value: string; footnote_optional?: string }>>([])
  const [benefits, setBenefits] = useState<Array<{ title: string; description: string }>>([])
  const [programs, setPrograms] = useState<Array<{ title: string; description: string; icon?: string }>>([])
  const [areas, setAreas] = useState<Array<{ title: string; area_slug: string; description?: string }>>([])
  const [cultureValues, setCultureValues] = useState<string[]>([])
  const [socialProof, setSocialProof] = useState<Array<{ quote: string; author?: string; context?: string }>>([])
  const [logoUrl, setLogoUrl] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Business Bank picker (select existing assets instead of re-uploading)
  const [bankOpen, setBankOpen] = useState(false)
  const [bankLoading, setBankLoading] = useState(false)
  const [bankBusy, setBankBusy] = useState(false)
  const [bankError, setBankError] = useState<string | null>(null)
  const [bankItems, setBankItems] = useState<BankItem[]>([])
  const [bankFilter, setBankFilter] = useState<'all' | 'image' | 'video' | 'document'>('all')
  const [bankQuery, setBankQuery] = useState('')
  const [bankThumbUrls, setBankThumbUrls] = useState<Record<string, string>>({})
  const [bankPreview, setBankPreview] = useState<null | { kind: 'image' | 'video'; url: string; title: string }>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  function inferKind(file: File): MediaKind {
    const t = (file.type || '').toLowerCase()
    if (t.startsWith('image/')) return 'image'
    if (t.startsWith('video/')) return 'video'
    return 'document'
  }

  function safeFileName(name: string) {
    return String(name || 'file')
      .trim()
      .replace(/[^\w.\-]+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 120)
  }

  async function ensureBankThumb(path: string) {
    if (!path) return
    if (bankThumbUrls[path]) return
    const { data, error } = await supabase.storage.from('business-bank').createSignedUrl(path, 60 * 15)
    if (!error && data?.signedUrl) setBankThumbUrls((p) => ({ ...p, [path]: data.signedUrl }))
  }

  async function loadBusinessBank() {
    setBankLoading(true)
    setBankError(null)
    try {
      const businessId = String(profile?.id ?? '')
      if (!businessId) {
        setBankError('Save your business profile first, then open Business Bank.')
        setBankItems([])
        return
      }
      const res = await supabase
        .from('business_bank_items')
        .select('id,business_id,user_id,item_type,title,description,file_path,file_type,file_size,created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (res.error) {
        if (/Could not find the table/i.test(res.error.message)) {
          setBankError('Business Bank is not configured yet. Run Supabase migration `2025122205_business_bank.sql` and refresh schema cache.')
        } else {
          setBankError(res.error.message)
        }
        setBankItems([])
        return
      }

      const rows = (res.data || []) as any[]
      setBankItems(rows as any)

      for (const it of rows.slice(0, 18)) {
        const path = it.file_path
        if (!path) continue
        if (it.item_type === 'image' || it.item_type === 'video') ensureBankThumb(path).catch(() => {})
      }
    } finally {
      setBankLoading(false)
    }
  }

  const bankFiltered = useMemo(() => {
    const q = bankQuery.trim().toLowerCase()
    return (Array.isArray(bankItems) ? bankItems : []).filter((it) => {
      if (bankFilter !== 'all' && it.item_type !== bankFilter) return false
      if (!q) return true
      const hay = `${it.title || ''} ${(it.description || '')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [bankItems, bankFilter, bankQuery])

  async function promoteBankItemToProfileMedia(item: BankItem): Promise<MediaAsset> {
    const businessId = String(profile?.id ?? '')
    if (!businessId) throw new Error('Missing business id.')
    const srcPath = item.file_path || ''
    if (!srcPath) throw new Error('Missing file path.')

    // 1) Create a short-lived signed URL for the private Business Bank object
    const { data: signed, error: signedErr } = await supabase.storage.from('business-bank').createSignedUrl(srcPath, 60)
    if (signedErr || !signed?.signedUrl) {
      throw new Error(signedErr?.message || 'Could not read file from Business Bank.')
    }

    // 2) Download the bytes in the browser and upload into public business_profile_media bucket
    const resp = await fetch(signed.signedUrl)
    if (!resp.ok) throw new Error('Failed to download file from Business Bank.')
    const blob = await resp.blob()

    const destPath = `business/${businessId}/bank-${item.id}-${Date.now()}-${safeFileName(item.title || 'asset')}`
    const up = await supabase.storage.from('business_profile_media').upload(destPath, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: item.file_type || blob.type || undefined,
    })
    if (up.error) throw new Error(up.error.message || 'Failed to attach file to profile.')

    const pub = supabase.storage.from('business_profile_media').getPublicUrl(destPath)
    const url = pub.data.publicUrl

    return {
      kind: item.item_type,
      url,
      title: humanizeMediaTitle(item.title),
      mime: item.file_type || blob.type || null,
      size_bytes: typeof item.file_size === 'number' ? item.file_size : blob.size || null,
      created_at: new Date().toISOString(),
      path: destPath,
    }
  }

  async function upsertPublicPagePatch(patch: Partial<{ logo_url: string | null; hero_image_url: string | null; media_assets: MediaAsset[] }>) {
    const businessId = String(profile?.id ?? '')
    if (!businessId) return
    const slug = publicSlug?.trim() ? slugify(publicSlug) : slugify(formData.name)
    if (!slug) return

    const payload: Record<string, any> = {
      business_id: businessId,
      slug,
      is_published: true,
      name: formData.name?.trim() ? formData.name.trim() : null,
      // keep existing page content in sync (best-effort)
      tagline: tagline?.trim() ? tagline.trim() : null,
      mission: mission?.trim() ? mission.trim() : null,
      value_prop_headline: valueHeadline?.trim() ? valueHeadline.trim() : null,
      value_prop_body: valueBody?.trim() ? valueBody.trim() : null,
      impact_stats: Array.isArray(impactStats) ? impactStats : [],
      culture_values: Array.isArray(cultureValues) ? cultureValues : [],
      business_areas: Array.isArray(areas) ? areas : [],
      benefits: Array.isArray(benefits) ? benefits : [],
      programs: Array.isArray(programs) ? programs : [],
      social_proof: Array.isArray(socialProof) ? socialProof : [],
      talent_community_enabled: !!talentCommunityEnabled,
      portfolio_intake_enabled: !!portfolioIntakeEnabled,
      acknowledgement_of_country: ackCountry?.trim() ? ackCountry.trim() : null,
      updated_at: new Date().toISOString(),
      // defaults from current state if not in patch
      logo_url: patch.logo_url !== undefined ? patch.logo_url : (logoUrl?.trim() ? logoUrl.trim() : null),
      hero_image_url: patch.hero_image_url !== undefined ? patch.hero_image_url : (heroImageUrl?.trim() ? heroImageUrl.trim() : null),
      media_assets: patch.media_assets !== undefined ? patch.media_assets : (Array.isArray(mediaAssets) ? mediaAssets : []),
    }

    const res: any = await (supabase as any).from('business_profile_pages').upsert(payload, { onConflict: 'business_id' })
    if (res?.error?.code === '42P01') {
      throw new Error(
        'Public profile pages table is missing. Run migration `2025122202_business_profile_pages.sql` and `2025122204_business_profile_media.sql`, then refresh schema cache.'
      )
    }
    if (res?.error) throw new Error(res.error.message || 'Failed to save business profile media.')
  }

  async function uploadMedia(files: FileList | null) {
    setUploadError(null)
    if (!files || files.length === 0) return
    const businessId = String(profile?.id ?? '')
    if (!businessId) {
      setUploadError('Save your business profile first, then upload media.')
      return
    }
    setUploading(true)
    try {
      const bucket = 'business_profile_media'
      const uploaded: MediaAsset[] = []

      for (const file of Array.from(files)) {
        const kind = inferKind(file)
        const path = `business/${businessId}/${Date.now()}-${safeFileName(file.name)}`
        const up = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        })
        if (up.error) {
          const msg = up.error.message || 'Upload failed.'
          if (/bucket/i.test(msg) && /not found/i.test(msg)) {
            setUploadError(
              'Storage bucket is missing. Run Supabase migration `2025122204_business_profile_media.sql` in SQL editor, then refresh schema cache and retry.'
            )
            return
          }
          setUploadError(msg)
          return
        }

        const pub = supabase.storage.from(bucket).getPublicUrl(path)
        const url = pub.data.publicUrl
        uploaded.push({
          kind,
          url,
          title: humanizeMediaTitle(file.name),
          mime: file.type || null,
          size_bytes: Number.isFinite(file.size) ? file.size : null,
          created_at: new Date().toISOString(),
          path,
        })
      }

      const next = [...uploaded, ...(Array.isArray(mediaAssets) ? mediaAssets : [])]
      setMediaAssets(next)
      // Persist immediately so uploads remain consistent across refresh (no need to click Save Profile)
      try {
        await upsertPublicPagePatch({ media_assets: next })
      } catch (e: any) {
        setUploadError(e?.message ?? 'Uploaded files, but could not save them to your public profile. Please click Save Profile.')
      }
    } finally {
      setUploading(false)
    }
  }

  async function removeMediaAsset(asset: MediaAsset) {
    const bucket = 'business_profile_media'
    const path = asset?.path || null
    const next = (Array.isArray(mediaAssets) ? mediaAssets : []).filter((a) => a !== asset)
    setMediaAssets(next)
    try {
      await upsertPublicPagePatch({ media_assets: next })
    } catch {
      // best-effort: allow UI removal even if page update fails
    }
    if (path) {
      await supabase.storage.from(bucket).remove([path]).catch(() => {})
    }
  }

  function updateMediaTitleAt(index: number, nextTitle: string) {
    setMediaAssets((prev) => {
      const list = Array.isArray(prev) ? [...prev] : []
      if (index < 0 || index >= list.length) return prev
      list[index] = { ...list[index], title: nextTitle }
      return list
    })
  }

  async function persistMediaAssets(next: MediaAsset[]) {
    try {
      await upsertPublicPagePatch({ media_assets: next })
    } catch (e: any) {
      setUploadError(e?.message ?? 'Could not save media changes. Please click Save Profile.')
    }
  }

  const fetchProfile = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile',message:'Fetch business profile entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP1'})}).catch(()=>{});
    // #endregion
    try {
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:session',message:'Business profile session check',data:{hasUid:!!uid,hasSessionErr:!!sessionErr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP1'})}).catch(()=>{});
      // #endregion
      if (!uid) {
        setErrors({ submit: 'Please sign in to edit your business profile.' })
        return
      }

      // CRITICAL: Check for talent profile to prevent cross-contamination
      let talentCheck: { data: any; error: any } = { data: null, error: null }
      try {
        // Only select id to minimize schema dependencies
        talentCheck = await supabase.from('talent_profiles').select('id').eq('user_id', uid).maybeSingle()
        // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:talent_check',message:'Checking for talent profile to prevent crossover',data:{hasTalentProfile:!!talentCheck.data,talentId:talentCheck.data?.id,hasError:!!talentCheck.error,errorCode:talentCheck.error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CROSS_CHECK'})}).catch(()=>{});
        // #endregion
      } catch (err) {
        // Talent profile check failed - schema may not have user_id column, continue anyway
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:talent_check_error',message:'Talent profile check failed (schema issue)',data:{error:err},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CROSS_CHECK'})}).catch(()=>{});
        // #endregion
      }

      // Load business profile - try user_id first (if column exists), otherwise try to find by id from users table
      let row: BusinessProfileRow | null = null
      let lastErr: any = null
      
      // First attempt: query by user_id (if column exists)
      const res: any = await (supabase.from('business_profiles').select('*') as any).eq('user_id', uid).maybeSingle()
      if (!res.error && res.data) {
        row = res.data
      // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:found',message:'Business profile lookup succeeded (by user_id)',data:{hasRow:true,hasTalentProfile:!!talentCheck.data,businessId:row?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP2'})}).catch(()=>{});
      // #endregion
      } else {
        lastErr = res.error
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:user_id_failed',message:'Business profile lookup by user_id failed - will try alternative method',data:{errorCode:res.error?.code,errorMessage:res.error?.message,errorDetails:res.error?.details,uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP2'})}).catch(()=>{});
        // #endregion
        
        // Alternative: If user_id column doesn't exist, we need to query through users table
        // However, we can't easily join in Supabase client, so we'll need to handle this differently
        // For now, if user_id query fails with column error, treat as no profile found
        if (res.error?.code === '42703' || res.error?.message?.includes('column') || res.error?.code === 'PGRST204') {
          // Column doesn't exist - user_id column is missing from business_profiles table
          // This means we need to create the profile or the schema is outdated
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:user_id_missing',message:'user_id column does not exist in business_profiles - schema issue',data:{errorCode:res.error?.code,errorMessage:res.error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP2'})}).catch(()=>{});
          // #endregion
          // Set row to null so form appears empty and user can create new profile
          row = null
        }
      }

      // VALIDATION: Warn if user has both profiles (indicates potential data corruption)
      if (talentCheck.data && row) {
        // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:dual_profile_warning',message:'WARNING: User has both talent and business profiles in edit page',data:{talentId:talentCheck.data.id,businessId:row.id,businessName:pickBusinessName(row)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DUAL_PROFILE'})}).catch(()=>{});
        // #endregion
      }

      if (lastErr && !row) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:none',message:'Business profile lookup failed for all filters',data:{errCode:lastErr?.code,errMsg:lastErr?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP2'})}).catch(()=>{});
        // #endregion
      }

      if (row) {
        setProfile(row)
        const businessName = pickBusinessName(row) || ''
        setFormData({
          name: businessName,
          description: typeof row.description === 'string' ? row.description : '',
          industry: typeof row.industry === 'string' ? row.industry : '',
          website: typeof row.website === 'string' ? row.website : '',
          location: typeof row.location === 'string' ? row.location : '',
          city: typeof row.city === 'string' ? row.city : '',
          state: typeof row.state === 'string' ? row.state : '',
          country: typeof row.country === 'string' ? row.country : '',
          phone: typeof row.phone === 'string' ? row.phone : '',
        })

        // Load public profile page content (best-effort; table may not exist yet)
        const businessId = String(row.id ?? '')
        if (businessId) {
          const pageRes: any = await (supabase as any)
            .from('business_profile_pages')
            .select('*')
            .eq('business_id', businessId)
            .maybeSingle()

          if (!pageRes?.error && pageRes?.data) {
            const p = pageRes.data as any
            setPublicSlug(typeof p.slug === 'string' ? p.slug : slugify(businessName))
            setTagline(typeof p.tagline === 'string' ? p.tagline : '')
            setMission(typeof p.mission === 'string' ? p.mission : '')
            setValueHeadline(typeof p.value_prop_headline === 'string' ? p.value_prop_headline : '')
            setValueBody(typeof p.value_prop_body === 'string' ? p.value_prop_body : '')
            setLogoUrl(typeof p.logo_url === 'string' ? p.logo_url : '')
            setHeroImageUrl(typeof p.hero_image_url === 'string' ? p.hero_image_url : '')
            setTalentCommunityEnabled(!!p.talent_community_enabled)
            setPortfolioIntakeEnabled(!!p.portfolio_intake_enabled)
            setAckCountry(typeof p.acknowledgement_of_country === 'string' ? p.acknowledgement_of_country : '')
            setImpactStats(Array.isArray(p.impact_stats) ? p.impact_stats : [])
            setBenefits(Array.isArray(p.benefits) ? p.benefits : [])
            setPrograms(Array.isArray(p.programs) ? p.programs : [])
            setAreas(Array.isArray(p.business_areas) ? p.business_areas : [])
            setCultureValues(Array.isArray(p.culture_values) ? p.culture_values : [])
            setSocialProof(Array.isArray(p.social_proof) ? p.social_proof : [])
            setMediaAssets(Array.isArray(p.media_assets) ? p.media_assets : [])
          } else {
            setPublicSlug((prev) => prev || slugify(businessName))
          }
        }
      } else {
        setProfile(null)
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:fetchProfile:error',message:'Fetch business profile error',data:{message:error?.message ?? String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP2'})}).catch(()=>{});
      // #endregion
      console.error('Error fetching profile:', error)
        setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Business name is required' })
      setIsSaving(false)
      return
    }

    try {
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:session',message:'Business profile save: session check',data:{hasUid:!!uid,hasSessionErr:!!sessionErr,formKeys:Object.keys(formData),nameLen:formData.name?.length ?? 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP3'})}).catch(()=>{});
      // #endregion
      if (!uid) {
        setErrors({ submit: 'Please sign in to save your business profile.' })
        return
      }

      const base: Record<string, any> = {
        description: formData.description?.trim() ? formData.description.trim() : null,
        industry: formData.industry?.trim() ? formData.industry.trim() : null,
        website: formData.website?.trim() ? formData.website.trim() : null,
        location: formData.location?.trim() ? formData.location.trim() : null,
        city: formData.city?.trim() ? formData.city.trim() : null,
        state: formData.state?.trim() ? formData.state.trim() : null,
        country: formData.country?.trim() ? formData.country.trim() : null,
        phone: formData.phone?.trim() ? formData.phone.trim() : null,
      }

      const nameKeyCandidates = ['name', 'business_name', 'company_name', 'legal_name', 'display_name']
      // Use user_id as the canonical column for linking profiles to users (per RLS policies)
      const ownerKey = 'user_id'

      const tryUpdateByKnownRow = async (payload: Record<string, any>) => {
        const existingId = profile?.id ?? null
        if (existingId !== null && existingId !== undefined) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:update_by_id',message:'Attempting to update business profile by id',data:{existingId,payloadKeys:Object.keys(payload)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
          // #endregion
          const res = await (supabase.from('business_profiles') as any).update(payload).eq('id' as any, existingId)
          // #region agent log
          if (res.error) {
            fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:update_by_id_error',message:'Update by id failed',data:{existingId,errorCode:res.error?.code,errorMessage:res.error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
          }
          // #endregion
          return res
        }
        // Fallback: update by user_id when id isn't available (if user_id column exists)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:update_by_user_id',message:'Attempting to update business profile by user_id (fallback)',data:{uid,payloadKeys:Object.keys(payload)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
        // #endregion
        const res = await (supabase.from('business_profiles') as any).update(payload).eq('user_id' as any, uid)
        // #region agent log
        if (res.error) {
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:update_by_user_id_error',message:'Update by user_id failed',data:{errorCode:res.error?.code,errorMessage:res.error?.message,uid,isColumnError:isInvalidColumnErr(res.error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
        }
        // #endregion
        // If user_id column doesn't exist, return error that will trigger INSERT path
        if (res.error && isInvalidColumnErr(res.error)) {
          // Return error to trigger INSERT fallback - user_id column doesn't exist
          return res
        }
        return res
      }

      const isMissingColumnErr = (err: any) => {
        return err?.code === 'PGRST204' || err?.code === '42703' || /Could not find the .* column/i.test(err?.message ?? '') || /column.*does not exist/i.test(err?.message ?? '')
      }
      
      const isInvalidColumnErr = (err: any) => {
        return err?.code === '42703' || /column.*does not exist/i.test(err?.message ?? '')
      }

      // 1) Schema-tolerant update: set the name first (required), then attempt optional fields one-by-one.
      let updatedOk = false
      let anyNameWritten = false
      let lastErr: any = null

      // Name
      for (const nameKey of nameKeyCandidates) {
        const res = await tryUpdateByKnownRow({ [nameKey]: formData.name.trim() })
        if (!res.error) {
          anyNameWritten = true
          updatedOk = true
      // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:name_ok',message:'Business profile name update succeeded',data:{nameKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
      // #endregion
          break
        }
        lastErr = res.error
        if (!isMissingColumnErr(res.error)) break
      }

      // Optional fields
      const optionalFields: Array<{ key: string; value: any }> = [
        { key: 'description', value: base.description },
        { key: 'industry', value: base.industry },
        { key: 'website', value: base.website },
        { key: 'location', value: base.location },
        { key: 'city', value: base.city },
        { key: 'state', value: base.state },
        { key: 'country', value: base.country },
        { key: 'phone', value: base.phone },
      ]

      for (const f of optionalFields) {
        // Skip empty values; avoids overwriting with null unless user actually cleared it.
        if (f.value === null) continue
        const res = await tryUpdateByKnownRow({ [f.key]: f.value })
        if (!res.error) {
          updatedOk = true
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:field_ok',message:'Business profile field update succeeded',data:{field:f.key},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
          // #endregion
          continue
        }
        lastErr = res.error
        if (isMissingColumnErr(res.error)) {
      // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:field_skip',message:'Business profile field skipped (missing column)',data:{field:f.key,errMsg:res.error?.message ?? null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
      // #endregion
          continue
        }
        // Non-schema error: stop and surface
        break
      }

      // 2) If update not possible, try insert with owner + name fallbacks.
      if (!updatedOk) {
        lastErr = null
        // Try INSERT - first with user_id, then without if column doesn't exist
        for (const nameKey of nameKeyCandidates) {
          // Try INSERT with user_id first
          let payload: Record<string, any> = { [nameKey]: formData.name.trim() }
          if (ownerKey && uid) {
            payload[ownerKey] = uid
          }
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:insert_attempt',message:'Attempting business profile insert',data:{ownerKey,nameKey,hasUserId:!!payload[ownerKey]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
          // #endregion
          let res = await supabase.from('business_profiles').insert(payload)
          if (!res.error) {
            updatedOk = true
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:insert_ok',message:'Business profile insert succeeded',data:{ownerKey,nameKey,hasUserId:!!payload[ownerKey]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
            // #endregion
            break
          }
          lastErr = res.error
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:insert_error',message:'Business profile insert failed',data:{nameKey,errorCode:res.error?.code,errorMessage:res.error?.message,isColumnError:isInvalidColumnErr(res.error),hasUserId:!!payload[ownerKey]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
          // #endregion
          // If error is due to missing user_id column, retry without it
          if (isInvalidColumnErr(res.error) && payload[ownerKey]) {
            delete payload[ownerKey]
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:insert_retry_no_user_id',message:'Retrying insert without user_id column',data:{nameKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
            // #endregion
            res = await supabase.from('business_profiles').insert(payload)
            if (!res.error) {
              updatedOk = true
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:insert_ok_no_user_id',message:'Business profile insert succeeded (without user_id)',data:{nameKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
              // #endregion
              break
            }
            lastErr = res.error
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:insert_retry_error',message:'Insert retry without user_id also failed',data:{nameKey,errorCode:res.error?.code,errorMessage:res.error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
            // #endregion
          }
          if (!isMissingColumnErr(res.error)) {
            // Not a schema-cache-missing-column issue; don't brute force further.
            break
          }
        }
        // #region agent log
        if (!updatedOk) {
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:insert_fail',message:'Business profile save failed (all payload variants)',data:{errCode:lastErr?.code,errMsg:lastErr?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
        }
        // #endregion
      }

      if (!updatedOk) {
        const msg =
          lastErr?.message
            ? `Failed to update profile (${lastErr.message}).`
            : 'Failed to update profile (schema mismatch or permissions). Please try again.'
        setErrors({ submit: msg })
        return
      }

      // Save public business profile page content (best-effort; do not block on missing table)
      try {
        const businessId = String(profile?.id ?? '')
        const slug = publicSlug?.trim() ? slugify(publicSlug) : slugify(formData.name)
        if (businessId && slug) {
          const payload = {
            business_id: businessId,
            slug,
            is_published: true,
            name: formData.name.trim(),
            logo_url: logoUrl?.trim() ? logoUrl.trim() : null,
            hero_image_url: heroImageUrl?.trim() ? heroImageUrl.trim() : null,
            tagline: tagline?.trim() ? tagline.trim() : null,
            mission: mission?.trim() ? mission.trim() : null,
            value_prop_headline: valueHeadline?.trim() ? valueHeadline.trim() : null,
            value_prop_body: valueBody?.trim() ? valueBody.trim() : null,
            impact_stats: Array.isArray(impactStats) ? impactStats : [],
            culture_values: Array.isArray(cultureValues) ? cultureValues : [],
            business_areas: Array.isArray(areas) ? areas : [],
            benefits: Array.isArray(benefits) ? benefits : [],
            programs: Array.isArray(programs) ? programs : [],
            social_proof: Array.isArray(socialProof) ? socialProof : [],
            media_assets: Array.isArray(mediaAssets) ? mediaAssets : [],
            talent_community_enabled: !!talentCommunityEnabled,
            portfolio_intake_enabled: !!portfolioIntakeEnabled,
            acknowledgement_of_country: ackCountry?.trim() ? ackCountry.trim() : null,
            updated_at: new Date().toISOString(),
          }

          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:public_page',message:'Upserting business_profile_pages',data:{hasBusinessId:!!businessId,slug,impactCount:impactStats.length,areasCount:areas.length,benefitsCount:benefits.length,programsCount:programs.length,socialCount:socialProof.length,tcEnabled:!!talentCommunityEnabled,piEnabled:!!portfolioIntakeEnabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP_PAGE'})}).catch(()=>{});
          // #endregion

          const upsertRes: any = await (supabase as any)
            .from('business_profile_pages')
            .upsert(payload, { onConflict: 'business_id' })
            .select('slug')
            .maybeSingle()

          if (!upsertRes?.error) {
            setPublicSlug(upsertRes?.data?.slug || slug)
          } else if (upsertRes?.error?.code === '42P01') {
            setErrors((prev) => ({
              ...prev,
              submit:
                'Saved basic business profile, but the public profile page table is missing. Run migration 2025122202_business_profile_pages.sql in Supabase SQL editor, then save again.',
            }))
          }
        }
      } catch {
        // ignore
      }

      router.push('/dashboard/business')
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/business/edit/page.tsx:save:error',message:'Business profile save threw',data:{message:error?.message ?? String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BP4'})}).catch(()=>{});
      // #endregion
      console.error('Error updating profile:', error)
      setErrors({
        submit: 'Failed to update profile. Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/dashboard/business" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        <div className="flex items-center gap-3">
        <Link
          href="/dashboard/business"
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
        >
          Back to Dashboard
        </Link>
          <Link
            href={publicSlug ? `/business/${slugify(publicSlug)}` : '#'}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              publicSlug ? 'border-blue-500/50 text-blue-200 hover:bg-blue-500/10' : 'border-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            aria-disabled={!publicSlug}
          >
            View Public Profile ↗
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Edit Business Profile</h1>

        <form onSubmit={handleSubmit} className="dashboard-card rounded-xl p-8 space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${
                errors.name ? 'border-red-500' : 'border-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="Your business name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Describe your business..."
            />
          </div>

          {/* Industry & Website */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Country"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Public Business Profile Page (what Talent sees) */}
          <div className="pt-6 border-t border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-2">Public Business Profile Page</h2>
            <p className="text-gray-400 mb-6">
              This controls what Talent sees at <span className="text-gray-300">/business/{publicSlug || 'your-slug'}</span>.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Business slug</label>
                <input
                  type="text"
                  value={publicSlug}
                  onChange={(e) => setPublicSlug(e.target.value)}
                  placeholder={slugify(formData.name) || 'your-business'}
                  className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">Lowercase with hyphens. This becomes the public URL.</p>
              </div>
              <div className="flex flex-col justify-end gap-3">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={talentCommunityEnabled}
                    onChange={(e) => setTalentCommunityEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Talent Community enabled
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={portfolioIntakeEnabled}
                    onChange={(e) => setPortfolioIntakeEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Portfolio intake enabled
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder={`Turn potential into impact with ${formData.name || 'your business'}.`}
                  className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mission</label>
                <input
                  type="text"
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="What you exist to do — in one sentence."
                  className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Value proposition headline</label>
                <input
                  type="text"
                  value={valueHeadline}
                  onChange={(e) => setValueHeadline(e.target.value)}
                  placeholder="Bring your ambition to us"
                  className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Value proposition body</label>
                <textarea
                  value={valueBody}
                  onChange={(e) => setValueBody(e.target.value)}
                  rows={3}
                  placeholder="Explain growth, collaboration, impact, and future-focused work."
                  className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Media uploads (images, video, documents) */}
            <div className="mt-8 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-white font-semibold">Media (images, video, documents)</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload files and they’ll appear on your public Business Profile page. Only your business account can upload/remove.
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBankOpen(true)
                        setBankError(null)
                        setBankQuery('')
                        setBankFilter('all')
                        loadBusinessBank().catch(() => {})
                      }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm hover:bg-white/10"
                    >
                      Add from Business Bank
                    </button>
                    <Link
                      href="/dashboard/business/bank"
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm hover:bg-white/10"
                    >
                      Open Bank ↗
                    </Link>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    onChange={(e) => uploadMedia(e.target.files)}
                    disabled={uploading}
                    className="text-sm text-gray-300"
                  />
                  {uploading ? <div className="text-xs text-gray-400 mt-2">Uploading…</div> : null}
                </div>
              </div>

              {uploadError ? (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 p-3 text-sm">
                  {uploadError}
                </div>
              ) : null}

              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-800 p-4">
                  <div className="text-sm text-gray-300 font-medium mb-2">Logo URL</div>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Upload an image then click “Use as logo”, or paste a URL"
                    className="w-full px-3 py-2 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  {logoUrl ? (
                    <div className="mt-3 rounded-lg border border-gray-800 bg-slate-950/40 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Logo preview" className="h-16 w-auto object-contain" />
                    </div>
                  ) : null}
                </div>
                <div className="rounded-xl border border-gray-800 p-4">
                  <div className="text-sm text-gray-300 font-medium mb-2">Hero image URL</div>
                  <input
                    type="url"
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    placeholder="Upload an image then click “Use as hero”, or paste a URL"
                    className="w-full px-3 py-2 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  {heroImageUrl ? (
                    <div className="mt-3 rounded-lg border border-gray-800 bg-slate-950/40 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImageUrl} alt="Hero preview" className="h-24 w-full object-cover rounded-md" />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300 font-medium">Uploaded assets</div>
                  <div className="text-xs text-gray-500">{Array.isArray(mediaAssets) ? mediaAssets.length : 0} items</div>
                </div>

                {Array.isArray(mediaAssets) && mediaAssets.length > 0 ? (
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    {mediaAssets.map((a, idx) => (
                      <div key={`${a.url}-${idx}`} className="rounded-xl border border-gray-800 bg-slate-950/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-gray-200 font-medium">{a.title || `Asset ${idx + 1}`}</div>
                            <div className="text-xs text-gray-500 mt-1">{a.kind}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMediaAsset(a)}
                            className="text-sm text-red-300 hover:text-red-200"
                            title="Remove"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs text-gray-400 mb-1">Public title (shown to Talent)</label>
                          <input
                            value={a.title || ''}
                            onChange={(e) => updateMediaTitleAt(idx, e.target.value)}
                            onBlur={() => {
                              const next = Array.isArray(mediaAssets) ? mediaAssets : []
                              persistMediaAssets(next)
                            }}
                            placeholder={a.kind === 'document' ? 'e.g., Company brochure' : a.kind === 'video' ? 'e.g., Life at our business' : 'e.g., Office gallery'}
                            className="w-full px-3 py-2 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                          />
                          <p className="text-[11px] text-gray-500 mt-1">
                            Tip: use a friendly label (not the file name).
                          </p>
                        </div>

                        {a.kind === 'image' ? (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.url} alt={a.title || 'Uploaded image'} className="h-28 w-full object-cover rounded-lg border border-white/10" />
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  setLogoUrl(a.url)
                                  try {
                                    await upsertPublicPagePatch({ logo_url: a.url })
                                  } catch {}
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm hover:bg-white/10"
                              >
                                Use as logo
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  setHeroImageUrl(a.url)
                                  try {
                                    await upsertPublicPagePatch({ hero_image_url: a.url })
                                  } catch {}
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm hover:bg-white/10"
                              >
                                Use as hero
                              </button>
                              <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm hover:bg-white/10"
                              >
                                Open →
                              </a>
                            </div>
                          </div>
                        ) : a.kind === 'video' ? (
                          <div className="mt-3">
                            <video className="w-full rounded-lg border border-white/10" controls preload="metadata" src={a.url} />
                          </div>
                        ) : (
                          <div className="mt-3">
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm hover:bg-white/10"
                            >
                              Open document →
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-500">No uploads yet.</div>
                )}
              </div>
            </div>

            {/* Business Bank picker modal */}
            {bankOpen ? (
              <div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                onClick={() => setBankOpen(false)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="w-full max-w-5xl rounded-2xl border border-white/10 bg-slate-950 text-white overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                      <div className="text-lg font-semibold">Add from Business Bank</div>
                      <div className="text-sm text-slate-400">Choose an existing asset to attach to your public profile.</div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm hover:bg-white/10"
                      onClick={() => setBankOpen(false)}
                    >
                      Close
                    </button>
                  </div>

                  {bankPreview ? (
                    <div
                      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                      onClick={() => setBankPreview(null)}
                    >
                      <div className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                          <div className="font-semibold truncate pr-4 text-slate-900">{bankPreview.title}</div>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-slate-900"
                            onClick={() => setBankPreview(null)}
                          >
                            Close
                          </button>
                        </div>
                        <div className="p-4 bg-black flex items-center justify-center">
                          {bankPreview.kind === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={bankPreview.url} alt={bankPreview.title} className="max-h-[75vh] w-auto object-contain" />
                          ) : (
                            <video src={bankPreview.url} controls className="max-h-[75vh] w-auto object-contain" />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {(['all', 'image', 'video', 'document'] as const).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setBankFilter(k)}
                            className={`px-3 py-1.5 rounded-lg border text-sm ${
                              bankFilter === k ? 'border-blue-500/60 bg-blue-500/15 text-blue-100' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            {k === 'all' ? 'All' : k.charAt(0).toUpperCase() + k.slice(1)}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bankQuery}
                          onChange={(e) => setBankQuery(e.target.value)}
                          placeholder="Search…"
                          className="px-3 py-2 rounded-lg bg-white text-black placeholder-gray-400 border border-blue-500/20 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => loadBusinessBank()}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm hover:bg-white/10"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {bankError ? (
                      <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 p-3 text-sm">
                        {bankError}
                      </div>
                    ) : null}

                    {bankBusy ? (
                      <div className="mt-4 text-sm text-slate-300">Attaching…</div>
                    ) : null}

                    {bankLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="mt-4 grid md:grid-cols-2 gap-3 max-h-[60vh] overflow-auto pr-1">
                        {bankFiltered.length === 0 ? (
                          <div className="text-slate-400">No items found.</div>
                        ) : (
                          bankFiltered.map((it) => {
                            const path = it.file_path || ''
                            const thumb = path ? bankThumbUrls[path] : null
                            const isImg = it.item_type === 'image'
                            const isVid = it.item_type === 'video'
                            return (
                              <div key={it.id} className="rounded-xl border border-white/10 bg-slate-900/30 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-slate-200 font-medium truncate">{it.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {it.item_type} {it.file_type ? `• ${it.file_type}` : ''} {typeof it.file_size === 'number' ? `• ${Math.round(it.file_size / 1024)} KB` : ''}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {(isImg || isVid) && path ? (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await ensureBankThumb(path)
                                          const url = bankThumbUrls[path]
                                          if (url) setBankPreview({ kind: isImg ? 'image' : 'video', url, title: it.title })
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs hover:bg-white/10"
                                      >
                                        Preview
                                      </button>
                                    ) : null}
                                  </div>
                                </div>

                                {(isImg || isVid) ? (
                                  <div className="mt-3">
                                    {thumb ? (
                                      isImg ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={thumb} alt={it.title} className="h-24 w-full object-cover rounded-lg border border-white/10" />
                                      ) : (
                                        <div className="h-24 w-full rounded-lg border border-white/10 bg-black/30 flex items-center justify-center text-slate-300 text-xs">
                                          Video preview available
                                        </div>
                                      )
                                    ) : (
                                      <div className="h-24 w-full rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 text-xs">
                                        {isImg ? 'Image' : 'Video'}
                                      </div>
                                    )}
                                  </div>
                                ) : null}

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={bankBusy}
                                    onClick={async () => {
                                      setBankBusy(true)
                                      setBankError(null)
                                      try {
                                        const asset = await promoteBankItemToProfileMedia(it)
                                        const next = [asset, ...(Array.isArray(mediaAssets) ? mediaAssets : [])]
                                        setMediaAssets(next)
                                        await upsertPublicPagePatch({ media_assets: next })
                                      } catch (e: any) {
                                        setBankError(e?.message ?? 'Failed to attach item.')
                                      } finally {
                                        setBankBusy(false)
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-100 text-sm hover:bg-blue-500/25 disabled:opacity-60"
                                  >
                                    Add to profile
                                  </button>

                                  {it.item_type === 'image' ? (
                                    <>
                                      <button
                                        type="button"
                                        disabled={bankBusy}
                                        onClick={async () => {
                                          setBankBusy(true)
                                          setBankError(null)
                                          try {
                                            const asset = await promoteBankItemToProfileMedia(it)
                                            setLogoUrl(asset.url)
                                            await upsertPublicPagePatch({ logo_url: asset.url })
                                          } catch (e: any) {
                                            setBankError(e?.message ?? 'Failed to set logo.')
                                          } finally {
                                            setBankBusy(false)
                                          }
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm hover:bg-white/10 disabled:opacity-60"
                                      >
                                        Use as logo
                                      </button>
                                      <button
                                        type="button"
                                        disabled={bankBusy}
                                        onClick={async () => {
                                          setBankBusy(true)
                                          setBankError(null)
                                          try {
                                            const asset = await promoteBankItemToProfileMedia(it)
                                            setHeroImageUrl(asset.url)
                                            await upsertPublicPagePatch({ hero_image_url: asset.url })
                                          } catch (e: any) {
                                            setBankError(e?.message ?? 'Failed to set hero image.')
                                          } finally {
                                            setBankBusy(false)
                                          }
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm hover:bg-white/10 disabled:opacity-60"
                                      >
                                        Use as hero
                                      </button>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Acknowledgement of Country (footer)</label>
              <textarea
                value={ackCountry}
                onChange={(e) => setAckCountry(e.target.value)}
                rows={3}
                placeholder="Editable acknowledgement for your organisation."
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-8 grid lg:grid-cols-2 gap-6">
              <div className="border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Impact metrics</h3>
                  <button
                    type="button"
                    onClick={() => setImpactStats((p) => [...p, { label: 'Customers served', value: '0', footnote_optional: '' }])}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {impactStats.map((s, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        className="col-span-5 px-3 py-2 bg-white border rounded-lg text-black"
                        value={s.label}
                        onChange={(e) => setImpactStats((p) => p.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                        placeholder="Label"
                      />
                      <input
                        className="col-span-3 px-3 py-2 bg-white border rounded-lg text-black"
                        value={s.value}
                        onChange={(e) => setImpactStats((p) => p.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)))}
                        placeholder="Value"
                      />
                      <input
                        className="col-span-3 px-3 py-2 bg-white border rounded-lg text-black"
                        value={s.footnote_optional || ''}
                        onChange={(e) => setImpactStats((p) => p.map((x, i) => (i === idx ? { ...x, footnote_optional: e.target.value } : x)))}
                        placeholder="Footnote"
                      />
                      <button
                        type="button"
                        onClick={() => setImpactStats((p) => p.filter((_, i) => i !== idx))}
                        className="col-span-1 text-red-300 hover:text-red-200"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Business areas</h3>
                  <button
                    type="button"
                    onClick={() => setAreas((p) => [...p, { title: 'Engineering', area_slug: 'engineering', description: '' }])}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {areas.map((a, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        className="col-span-4 px-3 py-2 bg-white border rounded-lg text-black"
                        value={a.title}
                        onChange={(e) => setAreas((p) => p.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))}
                        placeholder="Title"
                      />
                      <input
                        className="col-span-3 px-3 py-2 bg-white border rounded-lg text-black"
                        value={a.area_slug}
                        onChange={(e) => setAreas((p) => p.map((x, i) => (i === idx ? { ...x, area_slug: slugify(e.target.value) } : x)))}
                        placeholder="area-slug"
                      />
                      <input
                        className="col-span-4 px-3 py-2 bg-white border rounded-lg text-black"
                        value={a.description || ''}
                        onChange={(e) => setAreas((p) => p.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))}
                        placeholder="Short description"
                      />
                      <button
                        type="button"
                        onClick={() => setAreas((p) => p.filter((_, i) => i !== idx))}
                        className="col-span-1 text-red-300 hover:text-red-200"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid lg:grid-cols-2 gap-6">
              <div className="border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Benefits</h3>
                  <button
                    type="button"
                    onClick={() => setBenefits((p) => [...p, { title: 'Flexibility', description: 'Hybrid work and flexible hours.' }])}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {benefits.map((b, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        className="col-span-4 px-3 py-2 bg-white border rounded-lg text-black"
                        value={b.title}
                        onChange={(e) => setBenefits((p) => p.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))}
                        placeholder="Title"
                      />
                      <input
                        className="col-span-7 px-3 py-2 bg-white border rounded-lg text-black"
                        value={b.description}
                        onChange={(e) => setBenefits((p) => p.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))}
                        placeholder="Description"
                      />
                      <button
                        type="button"
                        onClick={() => setBenefits((p) => p.filter((_, i) => i !== idx))}
                        className="col-span-1 text-red-300 hover:text-red-200"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Programs</h3>
                  <button
                    type="button"
                    onClick={() => setPrograms((p) => [...p, { title: 'Early Careers', description: 'Graduate and internship pathways.' }])}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {programs.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        className="col-span-4 px-3 py-2 bg-white border rounded-lg text-black"
                        value={p.title}
                        onChange={(e) => setPrograms((x) => x.map((v, i) => (i === idx ? { ...v, title: e.target.value } : v)))}
                        placeholder="Title"
                      />
                      <input
                        className="col-span-7 px-3 py-2 bg-white border rounded-lg text-black"
                        value={p.description}
                        onChange={(e) => setPrograms((x) => x.map((v, i) => (i === idx ? { ...v, description: e.target.value } : v)))}
                        placeholder="Description"
                      />
                      <button
                        type="button"
                        onClick={() => setPrograms((p) => p.filter((_, i) => i !== idx))}
                        className="col-span-1 text-red-300 hover:text-red-200"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid lg:grid-cols-2 gap-6">
              <div className="border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Culture values</h3>
                  <button
                    type="button"
                    onClick={() => setCultureValues((p) => [...p, 'Grow'])}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {cultureValues.map((v, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-2 bg-white border rounded-lg text-black"
                        value={v}
                        onChange={(e) => setCultureValues((p) => p.map((x, i) => (i === idx ? e.target.value : x)))}
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => setCultureValues((p) => p.filter((_, i) => i !== idx))}
                        className="px-3 text-red-300 hover:text-red-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Social proof</h3>
                  <button
                    type="button"
                    onClick={() => setSocialProof((p) => [...p, { quote: 'We invest in growth and wellbeing.', author: 'Team member', context: '' }])}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {socialProof.map((s, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        className="col-span-6 px-3 py-2 bg-white border rounded-lg text-black"
                        value={s.quote}
                        onChange={(e) => setSocialProof((p) => p.map((x, i) => (i === idx ? { ...x, quote: e.target.value } : x)))}
                        placeholder="Quote"
                      />
                      <input
                        className="col-span-3 px-3 py-2 bg-white border rounded-lg text-black"
                        value={s.author || ''}
                        onChange={(e) => setSocialProof((p) => p.map((x, i) => (i === idx ? { ...x, author: e.target.value } : x)))}
                        placeholder="Author"
                      />
                      <input
                        className="col-span-2 px-3 py-2 bg-white border rounded-lg text-black"
                        value={s.context || ''}
                        onChange={(e) => setSocialProof((p) => p.map((x, i) => (i === idx ? { ...x, context: e.target.value } : x)))}
                        placeholder="Context"
                      />
                      <button
                        type="button"
                        onClick={() => setSocialProof((p) => p.filter((_, i) => i !== idx))}
                        className="col-span-1 text-red-300 hover:text-red-200"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <Link
              href="/dashboard/business"
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
