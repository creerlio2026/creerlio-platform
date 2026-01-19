'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DEBUG_ENDPOINT = 'http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc'
const emitDebugLog = (payload: Record<string, unknown>) => {
  fetch(DEBUG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
  fetch('/api/debug-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
}

type BusinessProfileMeta = Record<string, any>

type SocialPlatform =
  | 'LinkedIn'
  | 'GitHub'
  | 'YouTube'
  | 'X'
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'Behance'
  | 'Dribbble'
  | 'Website'

type SocialLink = { platform: SocialPlatform | string; url: string }

function safeArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

async function signedUrl(path: string, seconds = 60 * 30) {
  if (!path) {
    console.log('[View Profile] signedUrl: empty path provided')
    return null
  }
  
  // Remove leading slash if present (paths should be relative)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Since bucket is now public, use public URL directly (faster and more reliable)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    // URL encode each path segment separately to handle spaces and special characters
    const encodedPath = cleanPath.split('/').map(segment => encodeURIComponent(segment)).join('/')
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/business-bank/${encodedPath}`
    console.log('[View Profile] Using public URL for path:', cleanPath)
    return publicUrl
  }
  
  // Fallback to signed URL if NEXT_PUBLIC_SUPABASE_URL is not available
  try {
    console.log('[View Profile] Creating signed URL for path:', cleanPath)
    
    // Try to create signed URL - this should work for authenticated users viewing active business profiles
    const { data, error } = await supabase.storage.from('business-bank').createSignedUrl(cleanPath, seconds)
    
    if (error) {
      const statusCode = (error as any).statusCode || (error as any).code || (error as any).status
      console.error('[View Profile] signedUrl error:', { 
        path: cleanPath, 
        error: error.message, 
        statusCode: statusCode,
        statusText: (error as any).statusText,
        name: error.name,
        errorDetails: error,
        errorKeys: Object.keys(error),
        fullError: JSON.stringify(error, null, 2)
      })
      
      // If 400 error, the file might not exist or path might be wrong
      // Try to list files in the directory to find the actual file name
      const errorMessage = error.message || String(error)
      const is400Error = statusCode === '400' || statusCode === 400 || String(statusCode) === '400' || 
                        errorMessage?.includes('400') || errorMessage?.includes('Bad Request') ||
                        (error as any).status === 400 || (error as any).status === '400'
      
      // ALWAYS try to list files if we get an error - the file might exist with a different name
      console.log('[View Profile] Error occurred, attempting to find file by listing directory', {
        statusCode,
        errorMessage,
        path: cleanPath,
        is400Error
      })
      
      // Always try to list files to find the correct path
      {
        const pathParts = cleanPath.split('/')
        const directory = pathParts.slice(0, -1).join('/')
        const fileName = pathParts[pathParts.length - 1]
        
        try {
          const { data: files, error: listError } = await supabase.storage
            .from('business-bank')
            .list(directory, { limit: 100, sortBy: { column: 'name', order: 'asc' } })
          
          if (!listError && Array.isArray(files)) {
            console.log('[View Profile] Found files in directory:', files.map(f => f.name))
            
            // If no files found, query business_bank_items to find actual file paths
            if (files.length === 0) {
              console.warn('[View Profile] No files found in directory. Querying business_bank_items for file paths')
              
              // Extract user_id from path (format: business/{user_id}/...)
              const pathUserId = pathParts[1] // Should be the user_id
              
              try {
                // First, try to get ALL files for this user to see what exists
                const { data: allBankItems, error: allError } = await supabase
                  .from('business_bank_items')
                  .select('file_path, title, item_type')
                  .eq('user_id', pathUserId)
                  .not('file_path', 'is', null)
                
                console.log('[View Profile] All business_bank_items for user:', {
                  userId: pathUserId,
                  count: allBankItems?.length || 0,
                  items: allBankItems?.map(i => ({ path: i.file_path, title: i.title, type: i.item_type })) || []
                })
                
                // Then try to find banner/avatar specifically
                const { data: bankItems, error: bankError } = await supabase
                  .from('business_bank_items')
                  .select('file_path, title, item_type')
                  .eq('user_id', pathUserId)
                  .not('file_path', 'is', null)
                  .or(`file_path.ilike.%banner%,file_path.ilike.%avatar%,file_path.ilike.%logo%,title.ilike.%banner%,title.ilike.%avatar%,title.ilike.%logo%`)
                
                if (!bankError && Array.isArray(bankItems) && bankItems.length > 0) {
                  console.log('[View Profile] Found banner/avatar files in business_bank_items:', bankItems.map(i => ({ 
                    path: i.file_path, 
                    title: i.title,
                    type: i.item_type 
                  })))
                  
                  // Try each file path from business_bank_items
                  for (const item of bankItems) {
                    if (item.file_path) {
                      // Check if this looks like a banner or avatar
                      const isBanner = cleanPath.includes('banner') && (item.file_path.toLowerCase().includes('banner') || item.title?.toLowerCase().includes('banner'))
                      const isAvatar = cleanPath.includes('avatar') && (item.file_path.toLowerCase().includes('avatar') || item.file_path.toLowerCase().includes('logo') || item.title?.toLowerCase().includes('avatar') || item.title?.toLowerCase().includes('logo'))
                      
                      if (isBanner || isAvatar) {
                        console.log('[View Profile] Trying file path from business_bank_items:', item.file_path)
                        const { data: correctedData, error: correctedError } = await supabase.storage
                          .from('business-bank')
                          .createSignedUrl(item.file_path, seconds)
                        
                        if (!correctedError && correctedData?.signedUrl) {
                          console.log('[View Profile] Success with file path from business_bank_items')
                          return correctedData.signedUrl
                        } else {
                          console.warn('[View Profile] Failed to create signed URL for business_bank_items path:', correctedError)
                        }
                      }
                    }
                  }
                  
                  // If no exact match, try the first image file we found
                  if (cleanPath.includes('banner') || cleanPath.includes('avatar')) {
                    const imageItem = bankItems.find(item => item.item_type === 'image' || item.item_type === 'logo')
                    if (imageItem?.file_path) {
                      console.log('[View Profile] Trying fallback image file:', imageItem.file_path)
                      const { data: fallbackData, error: fallbackError } = await supabase.storage
                        .from('business-bank')
                        .createSignedUrl(imageItem.file_path, seconds)
                      
                      if (!fallbackError && fallbackData?.signedUrl) {
                        console.log('[View Profile] Success with fallback image')
                        return fallbackData.signedUrl
                      }
                    }
                  }
                } else {
                  console.warn('[View Profile] No matching files found in business_bank_items', {
                    userId: pathUserId,
                    error: bankError,
                    allItemsCount: allBankItems?.length || 0
                  })
                }
              } catch (dbErr) {
                console.warn('[View Profile] Error querying business_bank_items:', dbErr)
              }
            }
            
            // Try to find a file that matches (case-insensitive, ignoring spaces/encoding)
            const matchingFile = files.find(f => {
              const fName = f.name.toLowerCase()
              const targetName = fileName.toLowerCase()
              // Check exact match or match ignoring URL encoding or spaces
              return fName === targetName || 
                     decodeURIComponent(fName) === decodeURIComponent(targetName) ||
                     fName.replace(/%20/g, ' ') === targetName.replace(/%20/g, ' ') ||
                     fName.replace(/\s+/g, '') === targetName.replace(/\s+/g, '') ||
                     (fName.includes('banner') && targetName.includes('banner')) ||
                     (fName.includes('avatar') && targetName.includes('avatar'))
            })
            
            if (!matchingFile && files.length > 0) {
              console.warn('[View Profile] No exact match found. Available files:', files.map(f => f.name), 'Target:', fileName)
            }
            
            if (matchingFile) {
              const correctedPath = `${directory}/${matchingFile.name}`
              console.log('[View Profile] Found matching file, trying corrected path:', correctedPath)
              const { data: correctedData, error: correctedError } = await supabase.storage
                .from('business-bank')
                .createSignedUrl(correctedPath, seconds)
              
              if (!correctedError && correctedData?.signedUrl) {
                console.log('[View Profile] Success with corrected path')
                return correctedData.signedUrl
              }
            }
          }
        } catch (listErr) {
          console.warn('[View Profile] Error listing files:', listErr)
        }
      }
      
      // If RLS/permission error or 400 (bad request - might be path encoding issue), try public URL as fallback
      const isPermissionError = error.statusCode === '403' || 
                                error.statusCode === 403 ||
                                error.statusCode === '400' ||
                                error.statusCode === 400 ||
                                error.message?.includes('row-level security') || 
                                error.message?.includes('RLS') || 
                                error.message?.includes('permission') ||
                                error.message?.includes('not found') ||
                                error.message?.includes('Bad Request')
      
      if (isPermissionError) {
        console.warn('[View Profile] Error creating signed URL, trying public URL fallback:', {
          statusCode: error.statusCode,
          message: error.message,
          path: cleanPath
        })
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl) {
          // URL encode the path segments properly - encode each segment separately
          const encodedPath = cleanPath.split('/').map(segment => encodeURIComponent(segment)).join('/')
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/business-bank/${encodedPath}`
          console.log('[View Profile] Attempting public URL:', publicUrl)
          // Return public URL - let the browser try to load it
          // If the bucket is private, this will fail, but it's worth trying
          return publicUrl
        }
      }
      
      return null
    }
    
    if (!data?.signedUrl) {
      console.warn('[View Profile] signedUrl: no URL returned', { path: cleanPath })
      return null
    }
    
    console.log('[View Profile] signedUrl success:', { path: cleanPath, hasUrl: !!data.signedUrl })
    return data.signedUrl
  } catch (err: any) {
    console.error('[View Profile] signedUrl exception:', { path: cleanPath, error: err?.message || err })
    // On exception, try public URL as last resort
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      // URL encode the path segments properly
      const encodedPath = cleanPath.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/business-bank/${encodedPath}`
      console.log('[View Profile] Exception fallback to public URL:', publicUrl)
      return publicUrl
    }
    return null
  }
}

export default function BusinessProfileViewPage() {
  return (
    <Suspense fallback={null}>
      <BusinessProfileViewPageInner />
    </Suspense>
  )
}

function BusinessProfileViewPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<BusinessProfileMeta | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [viewingBusinessSlug, setViewingBusinessSlug] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null)
  const [introVideoTitle, setIntroVideoTitle] = useState<string | null>(null)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [tbItemCache, setTbItemCache] = useState<Record<number, any>>({})
  const [preview, setPreview] = useState<
    | { kind: 'image'; url: string; title: string }
    | { kind: 'video'; url: string; title: string }
    | { kind: 'pdf'; url: string; title: string }
    | null
  >(null)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [expExpanded, setExpExpanded] = useState<Record<number, boolean>>({})
  const [eduExpanded, setEduExpanded] = useState<Record<number, boolean>>({})
  const [projExpanded, setProjExpanded] = useState<Record<number, boolean>>({})
  const [skillsExpanded, setSkillsExpanded] = useState(false)
  const [expListExpanded, setExpListExpanded] = useState(false)
  const [eduListExpanded, setEduListExpanded] = useState(false)
  const [refListExpanded, setRefListExpanded] = useState(false)
  const [refExpanded, setRefExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    // #region agent log
    emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7',location:'business/view/page.tsx:params',message:'view profile params',data:{params},timestamp:Date.now()})
    // #endregion
  }, [searchParams])

  const fromParam = searchParams.get('from')
  const backToMapHref = fromParam === 'talent-map' ? '/talent-map' : null
  const [projListExpanded, setProjListExpanded] = useState(false)
  const [attachExpanded, setAttachExpanded] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [businessProfileId, setBusinessProfileId] = useState<string | null>(null)
  const [viewingBusinessId, setViewingBusinessId] = useState<string | null>(null) // ID of business being viewed (may be different from logged-in user)
  const [isOwner, setIsOwner] = useState<boolean>(false) // Whether the logged-in user owns this business profile
  const [connectionRequestId, setConnectionRequestId] = useState<string | null>(null) // Connection request ID from URL
  const [connectionRequest, setConnectionRequest] = useState<any | null>(null) // Connection request data
  const [processingConnection, setProcessingConnection] = useState(false) // Loading state for connection actions
  // Visibility settings loaded from metadata
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    basic: true,
    social: true,
    skills: true,
    experience: true,
    education: true,
    referees: true,
    attachments: true,
    projects: true,
  })
  const [itemVisibility, setItemVisibility] = useState<Record<string, Record<number, boolean>>>({
    social: {},
    experience: {},
    education: {},
    referees: {},
    projects: {},
  })

  const isPublicViewer = !viewerId
  const publicConnectSlug = useMemo(() => {
    if (viewingBusinessSlug) return viewingBusinessSlug
    if (viewingBusinessId) return `business-${viewingBusinessId}`
    return ''
  }, [viewingBusinessSlug, viewingBusinessId])
  const publicConnectHref = useMemo(() => {
    if (!publicConnectSlug) return '/login/talent?mode=signup'
    return `/login/talent?mode=signup&redirect=/dashboard/talent/connect/${publicConnectSlug}`
  }, [publicConnectSlug])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const uid = sessionRes.session?.user?.id ?? null
        const email = sessionRes.session?.user?.email ?? null
        if (!cancelled) setAuthEmail(email)
        if (!cancelled) setViewerId(uid)
        
        // Get business ID from URL params (if viewing someone else's profile)
        const businessIdParam = searchParams?.get('id') || searchParams?.get('business_id')
        const businessSlugParam = searchParams?.get('slug') || searchParams?.get('business_slug')
        const fromConnectionRequestParam = searchParams?.get('from_connection_request')

        if (businessSlugParam && !cancelled) {
          setViewingBusinessSlug(businessSlugParam)
        }
        
        // Store connection request ID if present
        if (fromConnectionRequestParam && !cancelled) {
          setConnectionRequestId(fromConnectionRequestParam)
        }
        
        let targetBusinessId: string | null = null
        let targetUserId: string | null = uid
        const isPublicViewerNow = !uid
        
        // If a business ID or slug is provided, load that business's profile
        if (businessIdParam || businessSlugParam) {
          let bpQuery = supabase.from('business_profiles').select('id, user_id, slug')
          
          if (businessIdParam) {
            bpQuery = bpQuery.eq('id', businessIdParam)
          } else if (businessSlugParam) {
            bpQuery = bpQuery.eq('slug', businessSlugParam)
          }
          
          const bpRes = await bpQuery.maybeSingle()
          
          if (bpRes.error || !bpRes.data) {
            if (isPublicViewerNow && (businessSlugParam || businessIdParam)) {
              let pageRes = supabase
                .from('business_profile_pages')
                .select('business_id, slug, name, tagline, mission, hero_image_url, logo_url')
                .eq('is_published', true)

              if (businessSlugParam) {
                pageRes = pageRes.eq('slug', businessSlugParam)
              } else {
                pageRes = pageRes.eq('business_id', businessIdParam as any)
              }

              const pageData = await pageRes.maybeSingle()

              if (!pageData.error && pageData.data) {
                const fallbackId = String(pageData.data.business_id ?? '')
                let hero = String(pageData.data.hero_image_url || '').trim()
                let logo = String(pageData.data.logo_url || '').trim()
                if (fallbackId && (!hero || !logo)) {
                  const bpImageRes = await supabase
                    .from('business_profiles')
                    .select('hero_image_url, logo_url')
                    .eq('id', fallbackId)
                    .maybeSingle()
                  if (!bpImageRes.error && bpImageRes.data) {
                    hero = hero || String(bpImageRes.data.hero_image_url || '').trim()
                    logo = logo || String(bpImageRes.data.logo_url || '').trim()
                  }
                }
                const heroIsUrl = hero.startsWith('http://') || hero.startsWith('https://')
                const logoIsUrl = logo.startsWith('http://') || logo.startsWith('https://')
                if (!cancelled && fallbackId) {
                  setViewingBusinessId(fallbackId)
                  setBusinessProfileId(fallbackId)
                }
                if (!cancelled && pageData.data.slug) {
                  setViewingBusinessSlug(String(pageData.data.slug))
                }
                if (!cancelled) {
                  setBannerUrl(heroIsUrl ? hero : null)
                  setAvatarUrl(logoIsUrl ? logo : null)
                  setMeta({
                    name: pageData.data.name || 'Business',
                    title: pageData.data.tagline || pageData.data.name || 'Business',
                    bio: pageData.data.mission || '',
                    banner_path: heroIsUrl ? '' : hero,
                    avatar_path: logoIsUrl ? '' : logo,
                  })
                  setError(null)
                }
                return
              }
            }

            setError('Business profile not found.')
            return
          }
          
          targetBusinessId = String(bpRes.data.id)
          targetUserId = bpRes.data.user_id
          
          if (!cancelled) {
            setViewingBusinessId(targetBusinessId)
            setBusinessProfileId(targetBusinessId)
            if (bpRes.data?.slug) {
              setViewingBusinessSlug(String(bpRes.data.slug))
            }
          }
        } else {
          // No business ID provided - viewing own profile (requires auth)
          if (!uid) {
            setError('Please sign in to view your profile.')
            return
          }
          if (!cancelled) setUserId(uid)
        }

        // Determine which user_id to query (either logged-in user or the business being viewed)
        const queryUserId = targetUserId || uid
        if (!queryUserId) {
          setError('Unable to determine which profile to load.')
          return
        }
        
        // Check if the logged-in user is the owner of this business profile
        const userIsOwner = !!(uid && queryUserId === uid)
        if (!cancelled) {
          setUserId(queryUserId)
          setIsOwner(userIsOwner)
          console.log('[View Profile] Ownership check:', { uid, queryUserId, userIsOwner })
        }

        // First check if business_profiles exists (this is the source of truth)
        let bpCheckQuery = supabase
          .from('business_profiles')
          .select('id, business_name, name, user_id, is_active')
        
        if (targetBusinessId) {
          bpCheckQuery = bpCheckQuery.eq('id', targetBusinessId)
        } else {
          bpCheckQuery = bpCheckQuery.eq('user_id', queryUserId)
        }
        
        const bpCheck = await bpCheckQuery.maybeSingle()

        if (bpCheck.error || !bpCheck.data) {
          if (isPublicViewerNow && businessSlugParam) {
            const pageRes = await supabase
              .from('business_profile_pages')
              .select('business_id, slug, name, tagline, mission, hero_image_url, logo_url')
              .eq('slug', businessSlugParam)
              .eq('is_published', true)
              .maybeSingle()

            if (!pageRes.error && pageRes.data) {
              const fallbackId = String(pageRes.data.business_id ?? '')
              let hero = String(pageRes.data.hero_image_url || '').trim()
              let logo = String(pageRes.data.logo_url || '').trim()
              if (fallbackId && (!hero || !logo)) {
                const bpImageRes = await supabase
                  .from('business_profiles')
                  .select('hero_image_url, logo_url')
                  .eq('id', fallbackId)
                  .maybeSingle()
                if (!bpImageRes.error && bpImageRes.data) {
                  hero = hero || String(bpImageRes.data.hero_image_url || '').trim()
                  logo = logo || String(bpImageRes.data.logo_url || '').trim()
                }
              }
              const heroIsUrl = hero.startsWith('http://') || hero.startsWith('https://')
              const logoIsUrl = logo.startsWith('http://') || logo.startsWith('https://')
              if (!cancelled && fallbackId) {
                setBusinessProfileId(fallbackId)
                setViewingBusinessId(fallbackId)
              }
              if (!cancelled && pageRes.data.slug) {
                setViewingBusinessSlug(String(pageRes.data.slug))
              }
              if (!cancelled) {
                setBannerUrl(heroIsUrl ? hero : null)
                setAvatarUrl(logoIsUrl ? logo : null)
                setMeta({
                  name: pageRes.data.name || 'Business',
                  title: pageRes.data.tagline || pageRes.data.name || 'Business',
                  bio: pageRes.data.mission || '',
                  banner_path: heroIsUrl ? '' : hero,
                  avatar_path: logoIsUrl ? '' : logo,
                })
                setError(null)
              }
              return
            }
          }

          if (bpCheck.error) {
            console.error('[View Profile] Failed to check business_profiles:', bpCheck.error)
            setError(bpCheck.error.message)
            return
          }

          // If no business_profiles record exists, show empty state
          console.warn('[View Profile] No business_profiles record found')
          setMeta(null)
          return
        }

        // Check if business profile is active (required for public viewing)
        const isActive = bpCheck.data.is_active !== false // Default to true if column doesn't exist
        if (!isActive && queryUserId !== uid) {
          console.warn('[View Profile] Business profile is not active, may have issues loading media')
        }

        // Set business profile ID
        if (!cancelled) {
          const profileId = String(bpCheck.data.id)
          setBusinessProfileId(profileId)
          setViewingBusinessId(profileId)
        }

        // Business profile exists, now try to load the profile data from business_bank_items
        console.log('[View Profile] Loading profile metadata from bank:', { queryUserId, targetBusinessId, viewingOwnProfile: queryUserId === uid })
        const { data, error } = await supabase
          .from('business_bank_items')
          .select('id, metadata, created_at')
          .eq('user_id', queryUserId)
          .eq('item_type', 'profile')
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('[View Profile] Failed to load profile from bank:', error, { queryUserId, targetBusinessId })
          // Don't return error - business_profiles exists, so show profile even without bank data
          setMeta({ name: bpCheck.data.business_name || bpCheck.data.name || 'Business' })
          return
        }

        if (!data || !data[0]) {
          console.warn('[View Profile] No profile data in bank, but business_profiles exists', { queryUserId, targetBusinessId })
          // Business profile exists but no bank data - show basic profile
          setMeta({ name: bpCheck.data.business_name || bpCheck.data.name || 'Business' })
          return
        }

        const saved = (data[0]?.metadata ?? null) as any
        if (!saved || typeof saved !== 'object') {
          console.warn('[View Profile] Profile metadata is invalid:', saved)
          setMeta(null)
          return
        }

        // Load visibility settings
        if (!cancelled) {
          if (saved?.sectionVisibility && typeof saved.sectionVisibility === 'object') {
            setSectionVisibility((prev) => ({
              ...prev,
              ...saved.sectionVisibility,
            }))
          }
          if (saved?.itemVisibility && typeof saved.itemVisibility === 'object') {
            setItemVisibility((prev) => ({
              ...prev,
              ...saved.itemVisibility,
            }))
          }
        }

        // Debug: Log social links and media info
        console.log('[View Profile] Loaded profile metadata with:', {
          hasSocialLinks: Array.isArray(saved?.socialLinks) && saved.socialLinks.length > 0,
          socialLinksCount: Array.isArray(saved?.socialLinks) ? saved.socialLinks.length : 0,
          hasAttachments: Array.isArray(saved?.attachments) && saved.attachments.length > 0,
          attachmentsCount: Array.isArray(saved?.attachments) ? saved.attachments.length : 0,
          hasIntroVideoId: typeof saved?.introVideoId === 'number',
          introVideoId: saved?.introVideoId,
          hasBannerPath: !!saved?.banner_path,
          hasAvatarPath: !!saved?.avatar_path,
        })

        // Debug: Log ALL sections with attachments to verify data structure
        console.log('[View Profile] Loaded profile metadata:', {
          hasEducation: Array.isArray(saved?.education),
          educationCount: Array.isArray(saved?.education) ? saved.education.length : 0,
          hasProjects: Array.isArray(saved?.projects),
          projectCount: Array.isArray(saved?.projects) ? saved.projects.length : 0,
          hasExperience: Array.isArray(saved?.experience),
          experienceCount: Array.isArray(saved?.experience) ? saved.experience.length : 0,
        })

        // Debug: Log education data to verify attachmentIds are present
        if (Array.isArray(saved?.education) && saved.education.length > 0) {
          console.log('[View Profile] Loaded education data:', saved.education.map((e: any, i: number) => ({
            index: i,
            institution: e?.institution,
            degree: e?.degree,
            attachmentIds: e?.attachmentIds,
            attachmentIdsType: typeof e?.attachmentIds,
            attachmentIdsIsArray: Array.isArray(e?.attachmentIds),
            attachmentIdsLength: Array.isArray(e?.attachmentIds) ? e.attachmentIds.length : 0,
          })))
        }

        // Debug: Log projects data
        if (Array.isArray(saved?.projects) && saved.projects.length > 0) {
          console.log('[View Profile] Loaded projects data:', saved.projects.map((p: any, i: number) => ({
            index: i,
            name: p?.name,
            attachmentIds: p?.attachmentIds,
            attachmentIdsType: typeof p?.attachmentIds,
            attachmentIdsIsArray: Array.isArray(p?.attachmentIds),
            attachmentIdsLength: Array.isArray(p?.attachmentIds) ? p.attachmentIds.length : 0,
          })))
        }

        // businessProfileId is already set above if we found the business profile
        // No need to query again - we already have it from bpCheck above

        // Load banner and avatar URLs - do this after metadata is set
        if (!cancelled) {
          // Set metadata first
          setMeta(saved)
          
          // Then load images - also try to find files in business_bank_items if paths don't work
          const loadImages = async () => {
            let bannerPath = String(saved.banner_path ?? '').trim()
            let avatarPath = String(saved.avatar_path ?? '').trim()
            
            // If paths are missing, try to find them in business_bank_items
            if ((!bannerPath || !avatarPath) && queryUserId) {
              console.log('[View Profile] Checking business_bank_items for banner/avatar files')
              try {
                const { data: bankItems, error: bankError } = await supabase
                  .from('business_bank_items')
                  .select('id, item_type, file_path, title')
                  .eq('user_id', queryUserId)
                  .in('item_type', ['logo', 'image', 'profile'])
                  .not('file_path', 'is', null)
                
                if (!bankError && Array.isArray(bankItems)) {
                  console.log('[View Profile] Found business_bank_items:', bankItems.map(i => ({ type: i.item_type, path: i.file_path, title: i.title })))
                  
                  // Try to find banner (look for items with 'banner' in title or path)
                  if (!bannerPath) {
                    const bannerItem = bankItems.find(item => 
                      item.title?.toLowerCase().includes('banner') ||
                      item.file_path?.toLowerCase().includes('banner')
                    )
                    if (bannerItem?.file_path) {
                      bannerPath = bannerItem.file_path
                      console.log('[View Profile] Found banner in business_bank_items:', bannerPath)
                    }
                  }
                  
                  // Try to find avatar (look for items with 'avatar' or 'logo' in title or path)
                  if (!avatarPath) {
                    const avatarItem = bankItems.find(item => 
                      item.title?.toLowerCase().includes('avatar') ||
                      item.title?.toLowerCase().includes('logo') ||
                      item.file_path?.toLowerCase().includes('avatar') ||
                      item.file_path?.toLowerCase().includes('logo') ||
                      item.item_type === 'logo'
                    )
                    if (avatarItem?.file_path) {
                      avatarPath = avatarItem.file_path
                      console.log('[View Profile] Found avatar in business_bank_items:', avatarPath)
                    }
                  }
                }
              } catch (err) {
                console.warn('[View Profile] Error checking business_bank_items:', err)
              }
            }
            
            console.log('[View Profile] Loading banner and avatar:', {
              hasBannerPath: !!bannerPath,
              bannerPath,
              hasAvatarPath: !!avatarPath,
              avatarPath,
              queryUserId,
              viewingOwnProfile: queryUserId === uid,
              savedKeys: Object.keys(saved ?? {})
            })
            
            if (bannerPath || avatarPath) {
              const [b, a] = await Promise.all([
                bannerPath ? signedUrl(bannerPath) : Promise.resolve(null),
                avatarPath ? signedUrl(avatarPath) : Promise.resolve(null),
              ])
              
              console.log('[View Profile] Banner and avatar URLs loaded:', {
                hasBannerUrl: !!b,
                hasAvatarUrl: !!a,
                bannerUrl: b ? 'loaded' : 'failed',
                avatarUrl: a ? 'loaded' : 'failed',
                bannerPath,
                avatarPath
              })
              
              if (!cancelled) {
                setBannerUrl(b)
                setAvatarUrl(a)
              }
            } else {
              console.warn('[View Profile] No banner or avatar paths found')
              if (!cancelled) {
                setBannerUrl(null)
                setAvatarUrl(null)
              }
            }
          }
          
          loadImages().catch(err => {
            console.error('[View Profile] Error loading images:', err)
            if (!cancelled) {
              setBannerUrl(null)
              setAvatarUrl(null)
            }
          })
        }

        // Intro video (picked in profile editor)
        // Always check for introVideoId - if it exists, load the video URL
        const introId = typeof saved?.introVideoId === 'number' ? saved.introVideoId : null
        console.log('[View Profile] Loading intro video:', { introVideoId: introId, queryUserId, savedKeys: Object.keys(saved ?? {}) })
        if (introId) {
          try {
            const vidRow = await supabase
              .from('business_bank_items')
              .select('id,title,file_path,file_url,file_type,item_type,metadata')
              .eq('user_id', queryUserId)
              .eq('id', introId)
              .maybeSingle()
            const videoItem = vidRow.data as any
            if (videoItem) {
              // For uploaded/recorded videos, use file_path to get signed URL
              if (videoItem.file_path) {
                const { data: urlData } = await supabase.storage.from('business-bank').createSignedUrl(videoItem.file_path, 60 * 30)
                if (!cancelled) {
                  setIntroVideoUrl(urlData?.signedUrl ?? null)
                  setIntroVideoTitle('Introduction Video')
                }
              }
              // For linked videos, use file_url directly
              else if (videoItem.file_url) {
                if (!cancelled) {
                  setIntroVideoUrl(videoItem.file_url)
                  setIntroVideoTitle('Introduction Video')
                }
              }
              // Video ID exists but neither file_path nor file_url is present
              else if (!cancelled) {
                setIntroVideoUrl(null)
                setIntroVideoTitle('Introduction Video (file not found)')
              }
            } else if (!cancelled) {
              // Video ID exists but item not found - still show section with message
              setIntroVideoUrl(null)
              setIntroVideoTitle('Introduction Video (file not found)')
            }
          } catch (err) {
            console.error('Error loading intro video:', err)
            if (!cancelled) {
              setIntroVideoUrl(null)
              setIntroVideoTitle('Introduction Video')
            }
          }
        } else {
          if (!cancelled) {
            setIntroVideoUrl(null)
            setIntroVideoTitle(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    
    // Reload when page becomes visible to pick up latest saves from Edit Profile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        load()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [searchParams])

  // Reload images when metadata changes (fallback if initial load failed)
  useEffect(() => {
    if (!meta || loading) return
    
    const bannerPath = String(meta.banner_path ?? '').trim()
    const avatarPath = String(meta.avatar_path ?? '').trim()
    
    // Only reload if we have paths but no URLs
    if ((bannerPath && !bannerUrl) || (avatarPath && !avatarUrl)) {
      console.log('[View Profile] Metadata changed, reloading missing images:', { 
        bannerPath, 
        avatarPath, 
        hasBannerUrl: !!bannerUrl, 
        hasAvatarUrl: !!avatarUrl 
      })
      
      const loadMissingImages = async () => {
        const promises: Promise<string | null>[] = []
        if (bannerPath && !bannerUrl) {
          promises.push(signedUrl(bannerPath).then(url => {
            if (url) setBannerUrl(url)
            return url
          }))
        }
        if (avatarPath && !avatarUrl) {
          promises.push(signedUrl(avatarPath).then(url => {
            if (url) setAvatarUrl(url)
            return url
          }))
        }
        await Promise.all(promises)
      }
      
      loadMissingImages().catch(err => {
        console.error('[View Profile] Error reloading missing images:', err)
      })
    }
  }, [meta, loading, bannerUrl, avatarUrl])

  // Load connection request data when connectionRequestId is available
  useEffect(() => {
    let cancelled = false
    async function loadConnectionRequest() {
      if (!connectionRequestId) return
      
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const uid = sessionRes.session?.user?.id
        if (!uid) return
        
        // Get talent profile ID
        const talentRes = await supabase
          .from('talent_profiles')
          .select('id')
          .eq('user_id', uid)
          .maybeSingle()
        
        if (talentRes.error || !talentRes.data?.id) return
        
        const talentId = String(talentRes.data.id)
        
        // Load connection request
        const { data, error } = await supabase
          .from('talent_connection_requests')
          .select('id, business_id, talent_id, status, created_at, responded_at')
          .eq('id', connectionRequestId)
          .eq('talent_id', talentId)
          .maybeSingle()
        
        if (error) {
          console.error('Error loading connection request:', error)
          return
        }
        
        if (!cancelled && data) {
          setConnectionRequest(data)
        }
      } catch (err) {
        console.error('Error in loadConnectionRequest:', err)
      }
    }
    
    loadConnectionRequest()
    return () => {
      cancelled = true
    }
  }, [connectionRequestId])

  function normalizeDisplayText(s: string) {
    // Prevent large vertical gaps from extra blank lines (often created during edits/deletes/imports).
    return String(s || '')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const sectionOrder = useMemo(() => {
    const raw = safeArray<string>(meta?.sectionOrder)
    const fallback = ['skills', 'experience', 'education', 'referees', 'projects', 'attachments']
    const merged = raw.length ? [...raw] : [...fallback]
    for (const k of fallback) {
      if (!merged.includes(k)) merged.push(k)
    }
    // Filter out 'social' from sectionOrder - it should only appear in sidebar, not main content
    // Also filter out sections that are not visible (sectionVisibility is false)
    const filtered = merged.filter((k) => {
      const key = String(k).toLowerCase().trim()
      if (key === 'social') return false // Social always in sidebar
      // Check section visibility - default to true if not set
      const sectionKey = key === 'skills' ? 'skills' : key
      const isVisible = sectionVisibility[sectionKey] !== false // Default to true
      return isVisible
    })
    // Debug: Log if sections were filtered out
    if (merged.length !== filtered.length) {
      console.log('[View Profile] Filtered sections:', {
        original: merged,
        filtered: filtered,
        visibility: sectionVisibility,
      })
    }
    return filtered
  }, [meta, sectionVisibility])
  const skills = useMemo(() => safeArray<string>(meta?.skills).map((s) => String(s || '').trim()).filter(Boolean), [meta])
  const experience = useMemo(() => {
    const raw = safeArray<any>(meta?.experience)
    return raw
      .map((e, originalIdx) => {
        // Preserve attachmentIds
        const attachmentIds = Array.isArray(e?.attachmentIds) ? e.attachmentIds.filter((id: any) => {
          const num = Number(id)
          return Number.isFinite(num) && num > 0
        }).map((id: any) => Number(id)) : []
        
        return {
          ...e,
          attachmentIds: attachmentIds,
          _originalIndex: originalIdx, // Store original index for visibility checking
        }
      })
      .filter((e) => {
        // Filter by item visibility (default to true if not set)
        // Use the original index from the raw array
        const isItemVisible = itemVisibility.experience?.[e._originalIndex] !== false
        if (!isItemVisible) return false
        
        // Filter by content
        const title = String(e?.role || e?.title || '').trim()
        const company = String(e?.company || e?.organisation || '').trim()
        const desc = normalizeDisplayText(String(e?.description || ''))
        const hasAttachments = Array.isArray(e.attachmentIds) && e.attachmentIds.length > 0
        return !!(title || company || desc || hasAttachments)
      })
  }, [meta, itemVisibility])
  const education = useMemo(() => {
    const raw = safeArray<any>(meta?.education)
    if (!raw.length) return []
    
    const processed = raw.map((e, idx) => {
      // Extract attachmentIds - handle various formats
      let attachmentIds: number[] = []
      if (Array.isArray(e?.attachmentIds)) {
        attachmentIds = e.attachmentIds.filter((id: any) => {
          const num = Number(id)
          return Number.isFinite(num) && num > 0
        }).map((id: any) => Number(id))
      } else if (e?.attachmentIds != null) {
        // Handle single value or other formats
        const num = Number(e.attachmentIds)
        if (Number.isFinite(num) && num > 0) {
          attachmentIds = [num]
        }
      }
      
      const inst = String(e?.institution || e?.school || '').trim()
      const degree = String(e?.qualification || e?.degree || '').trim()
      const notes = normalizeDisplayText(String(e?.notes || ''))
      const year = String(e?.year || e?.endYear || '').trim()
      
      // Debug log for all education entries
      if (attachmentIds.length > 0) {
        console.log(`[View Profile] Education entry ${idx} has ${attachmentIds.length} attachments:`, {
          entryIndex: idx,
          institution: inst,
          degree: degree,
          rawAttachmentIds: e?.attachmentIds,
          processedAttachmentIds: attachmentIds,
          attachmentIdsType: typeof e?.attachmentIds,
          isArray: Array.isArray(e?.attachmentIds),
        })
      } else if (idx === 0) {
        // Log first entry even if no attachments to verify data structure
        console.log(`[View Profile] Education entry ${idx} (no attachments):`, {
          entryIndex: idx,
          institution: inst,
          degree: degree,
          rawAttachmentIds: e?.attachmentIds,
          hasAttachmentIdsKey: 'attachmentIds' in e,
          attachmentIdsValue: e?.attachmentIds,
        })
      }
      
      return {
        ...e, // Preserve all original fields first
        institution: inst,
        degree: degree,
        qualification: degree,
        school: inst,
        notes: notes,
        year: year,
        endYear: year,
        attachmentIds: attachmentIds, // Explicitly set attachmentIds as array
      }
    })
    
    return processed.filter((e, idx) => {
      // Filter by item visibility (default to true if not set)
      const isItemVisible = itemVisibility.education?.[idx] !== false
      if (!isItemVisible) return false
      
      // Include if at least one field has content OR has attachments
      const hasContent = !!(e.institution || e.degree || e.notes || e.year)
      const hasAttachments = Array.isArray(e.attachmentIds) && e.attachmentIds.length > 0
      return hasContent || hasAttachments
    })
  }, [meta, itemVisibility])
  const referees = useMemo(() => {
    // View Profile must show ALL saved referees from Edit Profile
    // Show any referee that has at least one field with content
    const raw = safeArray<any>(meta?.referees)
    const mapped = raw.map((r) => ({
      name: String(r?.name || '').trim(),
      relationship: String(r?.relationship || '').trim(),
      company: String(r?.company || '').trim(),
      title: String(r?.title || '').trim(),
      email: String(r?.email || '').trim(),
      phone: String(r?.phone || '').trim(),
      notes: normalizeDisplayText(String(r?.notes || '')),
      attachmentIds: Array.isArray(r?.attachmentIds) ? r.attachmentIds : [],
    }))
    // Include if at least one field has content - but be more lenient
    // Include if name exists OR any other field has content
    return mapped.filter((r, idx) => {
      // Filter by item visibility (default to true if not set)
      const isItemVisible = itemVisibility.referees?.[idx] !== false
      if (!isItemVisible) return false
      
      return !!(r.name || r.notes || r.email || r.phone || r.title || r.company || r.relationship)
    })
  }, [meta, itemVisibility])
  const projects = useMemo(() => {
    // View Profile must show ALL saved job vacancies from Edit Profile
    // Show any project that has at least one field with content
    const raw = safeArray<any>(meta?.projects)
    return raw
      .map((p) => ({
        name: String(p?.name || '').trim(),
        url: String(p?.url || '').trim(),
        description: normalizeDisplayText(String(p?.description || '')),
        attachmentIds: Array.isArray(p?.attachmentIds) ? p.attachmentIds : [],
      }))
      .filter((p, idx) => {
        // Filter by item visibility (default to true if not set)
        const isItemVisible = itemVisibility.projects?.[idx] !== false
        if (!isItemVisible) return false
        
        // Include if at least one field has content (same as before, but more explicit)
        return !!(p.name || p.url || p.description || (p.attachmentIds && p.attachmentIds.length > 0))
      })
  }, [meta, itemVisibility])
  const attachments = useMemo(() => {
    // Attachments don't have individual visibility, only section visibility
    return safeArray<any>(meta?.attachments)
  }, [meta])

  const socialLinks = useMemo<SocialLink[]>(() => {
    const m: any = meta ?? {}
    const list: SocialLink[] = []

    // Preferred shape: socialLinks: [{platform,url}]
    const raw = Array.isArray(m.socialLinks) ? m.socialLinks : []
    raw.forEach((it, idx) => {
      const platform = String((it as any)?.platform ?? '').trim()
      const url = String((it as any)?.url ?? '').trim()
      if (!platform || !url) return
      
      // Filter by item visibility (default to true if not set)
      const isItemVisible = itemVisibility.social?.[idx] !== false
      if (!isItemVisible) return
      
      list.push({ platform, url })
    })

    // Back-compat: single fields
    const legacy: Array<[string, string | null | undefined]> = [
      ['LinkedIn', m.linkedin || m.linkedIn || m?.social?.linkedin || m?.socials?.linkedin || null],
      ['GitHub', m.github || m?.social?.github || null],
      ['YouTube', m.youtube || m?.social?.youtube || null],
      ['Website', m.website || m?.site || null],
      ['X', m.twitter || m.x || null],
      ['Instagram', m.instagram || null],
      ['Facebook', m.facebook || null],
      ['TikTok', m.tiktok || null],
      ['Behance', m.behance || null],
      ['Dribbble', m.dribbble || null],
    ]
    for (const [platform, url0] of legacy) {
      const url = String(url0 || '').trim()
      if (!url) continue
      if (list.some((x) => String(x.platform).toLowerCase() === platform.toLowerCase())) continue
      list.push({ platform, url })
    }

    // Dedupe by platform+url
    const seen = new Set<string>()
    const out: SocialLink[] = []
    for (const it of list) {
      const key = `${String(it.platform).toLowerCase()}|${String(it.url).toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(it)
    }
    return out
  }, [meta, itemVisibility.social])

  const title = (typeof meta?.title === 'string' && meta.title) || 'Your Profile'
  const name = (typeof meta?.name === 'string' && meta.name) || 'Business'
  const bio = normalizeDisplayText((typeof meta?.bio === 'string' && meta.bio) || '')
  const location =
    (typeof (meta as any)?.location === 'string' && (meta as any).location) ||
    (typeof (meta as any)?.city === 'string' && (meta as any).city) ||
    ''

  const yearsExperience = useMemo(() => {
    const years: number[] = []
    for (const e of experience) {
      const s = String(e?.startDate ?? e?.start_date ?? '')
      const m = s.match(/\b(19|20)\d{2}\b/)
      if (m) years.push(Number(m[0]))
    }
    if (!years.length) return null
    const minYear = Math.min(...years)
    const nowYear = new Date().getFullYear()
    const diff = Math.max(0, nowYear - minYear)
    return diff >= 1 ? `${diff}+ Years Experience` : '1+ Years Experience'
  }, [experience])

  useEffect(() => {
    let cancelled = false
    async function loadAttachments() {
      if (!userId) return
      const ids = new Set<number>()
      
      // Load project attachments
      for (const p of projects) {
        const a = safeArray<any>((p as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      // Load education attachments
      for (const e of education) {
        const a = safeArray<any>((e as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      // Load experience attachments
      for (const e of experience) {
        const a = safeArray<any>((e as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      // Load referee attachments
      for (const r of referees) {
        const a = safeArray<any>((r as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      const missing = Array.from(ids).filter((id) => !tbItemCache[id])
      if (!missing.length) return

      const { data } = await supabase
        .from('business_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type')
        .eq('user_id', userId)
        .in('id', missing)

      if (cancelled) return
      const next: Record<number, any> = {}
      for (const it of data ?? []) next[(it as any).id] = it
      if (Object.keys(next).length) {
        setTbItemCache((prev) => ({ ...prev, ...next }))
      }
    }
    loadAttachments()
    return () => {
      cancelled = true
    }
  }, [userId, projects, education, experience, referees, tbItemCache])

  // Load jobs when businessProfileId is available
  useEffect(() => {
    let cancelled = false
    async function loadJobs() {
      if (!businessProfileId) {
        console.log('[View Profile] No businessProfileId, skipping jobs load')
        return
      }
      
      setJobsLoading(true)
      console.log('[View Profile] Loading jobs for businessProfileId:', businessProfileId)
      
      try {
        // Try multiple foreign key column names (schema-tolerant)
        // Match the same approach used in Business Dashboard
        const filterKeys = ['business_profile_id', 'business_id', 'company_id'] as const
        
        const isMissingColumnError = (err: any) => {
          if (!err) return false
          const msg = String(err?.message ?? '')
          const code = String(err?.code ?? '')
          return code === 'PGRST204' || /Could not find the .* column/i.test(msg)
        }

        let jobsData: any[] = []
        let lastError: any = null
        
        for (const fk of filterKeys) {
          console.log('[View Profile] Trying jobs query with foreign key:', fk, 'value:', businessProfileId)
          
          // Use string format to match Business Dashboard exactly
          const { data, error } = await supabase
            .from('jobs')
            .select('id, title, description, location, city, state, country, employment_type, status, is_active, application_url, application_email, created_at')
            .eq(fk, businessProfileId)
            .eq('is_active', true)
            .eq('status', 'published') // Only show published jobs on public profile view
            .order('created_at', { ascending: false })
            .limit(50)

          if (!error && data) {
            jobsData = data
            console.log('[View Profile] Successfully loaded jobs:', { 
              count: data.length, 
              businessProfileId,
              foreignKey: fk,
              jobs: data.map(j => ({ id: j.id, title: j.title, status: j.status }))
            })
            break
          }
          if (error) {
            lastError = error
            console.warn('[View Profile] Jobs query error:', { 
              foreignKey: fk, 
              error: error.message, 
              code: error.code,
              details: error.details 
            })
            // If it's a column not found error, try next candidate
            if (isMissingColumnError(error)) {
              console.log('[View Profile] Column not found, trying next candidate')
              continue
            }
            // Otherwise, log and try next
            console.warn('[View Profile] Jobs query error (trying next):', error)
          }
        }
        
        if (lastError && jobsData.length === 0) {
          console.error('[View Profile] Failed to load jobs after trying all candidates:', lastError)
        }

        if (!cancelled) {
          console.log('[View Profile] Setting jobs state:', { count: jobsData.length })
          setJobs(jobsData)
        }
      } catch (err) {
        console.error('[View Profile] Error loading jobs:', err)
        if (!cancelled) setJobs([])
      } finally {
        if (!cancelled) setJobsLoading(false)
      }
    }
    loadJobs()
    return () => {
      cancelled = true
    }
  }, [businessProfileId])

  function clampStyle(lines = 5) {
    // Reliable 5-line clamp without depending on Tailwind line-clamp utilities/plugins.
    return {
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical' as const,
      WebkitLineClamp: lines,
      overflow: 'hidden',
    }
  }

  function iconSvg(platform: string) {
    const p = String(platform || '').toLowerCase()
    const common = 'w-5 h-5'
    if (p.includes('linkedin')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0.5 8.5H4.5V24H0.5V8.5zM8 8.5h3.8v2.1h.1c.5-.9 1.9-2.3 4-2.3C20 8.3 24 10.8 24 16.1V24h-4v-7c0-1.7 0-3.8-2.3-3.8-2.3 0-2.7 1.8-2.7 3.7V24H11V8.5H8z" />
        </svg>
      )
    }
    if (p.includes('github')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.73.5.75 5.6.75 12c0 5.15 3.44 9.53 8.21 11.07.6.12.82-.27.82-.6v-2.2c-3.34.74-4.04-1.65-4.04-1.65-.55-1.43-1.35-1.81-1.35-1.81-1.1-.77.08-.76.08-.76 1.22.09 1.86 1.28 1.86 1.28 1.08 1.9 2.84 1.35 3.53 1.03.11-.81.42-1.35.77-1.66-2.67-.31-5.48-1.37-5.48-6.1 0-1.35.47-2.45 1.24-3.31-.12-.31-.54-1.58.12-3.29 0 0 1.01-.33 3.3 1.26a11.1 11.1 0 0 1 3-.42c1.02 0 2.04.14 3 .42 2.29-1.6 3.3-1.26 3.3-1.26.66 1.71.24 2.98.12 3.29.77.86 1.24 1.96 1.24 3.31 0 4.74-2.82 5.78-5.5 6.09.43.38.82 1.13.82 2.28v3.38c0 .33.22.72.82.6C19.81 21.53 23.25 17.15 23.25 12c0-6.4-4.98-11.5-11.25-11.5z" />
        </svg>
      )
    }
    if (p.includes('youtube')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.5 6.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C16.88 2.5 12 2.5 12 2.5h-.01s-4.88 0-8.19.34c-.47.05-1.47.06-2.36 1C.73 4.56.5 6.2.5 6.2S.16 8.1.16 10v1.8c0 1.9.34 3.8.34 3.8s.23 1.64.94 2.36c.9.94 2.08.91 2.6 1.01 1.9.18 8.02.34 8.02.34s4.88-.01 8.19-.35c.47-.05 1.47-.06 2.36-1 .71-.72.94-2.36.94-2.36s.34-1.9.34-3.8V10c0-1.9-.34-3.8-.34-3.8zM9.75 14.7V7.8l6.5 3.46-6.5 3.44z" />
        </svg>
      )
    }
    if (p === 'x' || p.includes('twitter') || p.includes('x.com')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.7l-5.2-6.8L5.9 22H2.8l7.3-8.4L.8 2h6.9l4.7 6.2L18.9 2zm-1.2 18h1.7L6.6 3.9H4.8L17.7 20z" />
        </svg>
      )
    }
    if (p.includes('instagram')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5zM18 6.5a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
        </svg>
      )
    }
    if (p.includes('facebook')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.87.24-1.46 1.49-1.46H16.7V5c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.21 1.52-4.21 4.3V11H7.3v3h2.66v8h3.54z" />
        </svg>
      )
    }
    if (p.includes('tiktok')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.7 3c.4 3 2.4 4.8 5.3 5v3.3c-1.8.1-3.4-.5-4.9-1.5v6.8c0 3.9-3.2 7.1-7.1 7.1S2.9 20.5 2.9 16.6s3.2-7.1 7.1-7.1c.4 0 .8 0 1.2.1v3.6c-.4-.1-.8-.2-1.2-.2-2 0-3.6 1.6-3.6 3.6S8 20.2 10 20.2s3.6-1.6 3.6-3.6V3h3.1z" />
        </svg>
      )
    }
    if (p.includes('behance')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8.2 11.2c.9-.5 1.4-1.3 1.4-2.4 0-2-1.5-3.1-4-3.1H0v12.6h5.9c2.7 0 4.4-1.3 4.4-3.6 0-1.5-.7-2.7-2.1-3.5zM3.1 8h2.6c1 0 1.6.4 1.6 1.3 0 1-.6 1.4-1.7 1.4H3.1V8zm2.9 7.7H3.1v-2.8h2.8c1.2 0 1.9.5 1.9 1.4 0 1-.7 1.4-1.8 1.4zm10.7-7.9c-2.7 0-4.6 2.1-4.6 5.2 0 3.3 1.8 5.3 4.7 5.3 2.1 0 3.7-1.1 4.2-3.1h-2.2c-.2.7-.8 1.1-1.8 1.1-1.2 0-2-.8-2-2.2h6.1c.1-3.7-1.6-6.3-4.4-6.3zM14.6 12c.1-1.2.8-2 1.9-2 1.2 0 1.8.8 1.9 2h-3.8zM14 5.2h5V7h-5V5.2z" />
        </svg>
      )
    }
    if (p.includes('dribbble')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5A9.5 9.5 0 1 0 21.5 12 9.51 9.51 0 0 0 12 2.5zm7.9 8.3a15.2 15.2 0 0 1-5.2.1c-.2-.5-.4-1-.7-1.6a15.1 15.1 0 0 0 3.8-3.2 7.9 7.9 0 0 1 2.1 4.7zM12 4.1a7.9 7.9 0 0 1 4.3 1.3 13.3 13.3 0 0 1-3.4 2.9A36.6 36.6 0 0 0 10 4.4c.6-.2 1.3-.3 2-.3zM8.1 5.2a34.4 34.4 0 0 1 3 3.9 14.9 14.9 0 0 1-6.2.8 7.9 7.9 0 0 1 3.2-4.7zM4.1 12v-.2a16.8 16.8 0 0 0 7.9-1.1c.2.4.4.8.5 1.1l-.3.1a16.9 16.9 0 0 0-6.9 5.4A7.9 7.9 0 0 1 4.1 12zm7.9 7.9a7.9 7.9 0 0 1-4.9-1.7 15.2 15.2 0 0 1 6.3-5c.6 1.7 1.1 3.5 1.3 5.5a7.8 7.8 0 0 1-2.7 1.2zm4.3-2.3a24.6 24.6 0 0 0-1.1-4.7 12 12 0 0 0 4.6-.2 7.9 7.9 0 0 1-3.5 4.9z" />
        </svg>
      )
    }
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a3 3 0 1 1 4.2 4.2l-1.7 1.7a1 1 0 1 1-1.4-1.4l1.7-1.7a1 1 0 1 0-1.4-1.4l-3.5 3.5a1 1 0 0 1-1.4 0z" />
        <path d="M13.4 10.6a1 1 0 0 1 0 1.4l-3.5 3.5a3 3 0 1 1-4.2-4.2l1.7-1.7a1 1 0 1 1 1.4 1.4l-1.7 1.7a1 1 0 1 0 1.4 1.4l3.5-3.5a1 1 0 0 1 1.4 0z" />
      </svg>
    )
  }

  function SocialIconBar({ links, className }: { links: SocialLink[]; className?: string }) {
    if (!links?.length) return null

    const colorClass = (platform: string) => {
      const p = String(platform || '').toLowerCase()
      if (p.includes('linkedin')) return 'bg-sky-500/15 border-sky-400/30 text-sky-200 hover:bg-sky-500/25'
      if (p.includes('youtube')) return 'bg-red-500/15 border-red-400/30 text-red-200 hover:bg-red-500/25'
      if (p.includes('instagram')) return 'bg-pink-500/15 border-pink-400/30 text-pink-200 hover:bg-pink-500/25'
      if (p.includes('github')) return 'bg-slate-200/10 border-slate-200/20 text-slate-100 hover:bg-slate-200/15'
      if (p === 'x' || p.includes('twitter') || p.includes('x.com')) return 'bg-neutral-200/10 border-neutral-200/20 text-neutral-100 hover:bg-neutral-200/15'
      if (p.includes('facebook')) return 'bg-blue-500/15 border-blue-400/30 text-blue-200 hover:bg-blue-500/25'
      if (p.includes('tiktok')) return 'bg-fuchsia-500/12 border-fuchsia-400/25 text-fuchsia-200 hover:bg-fuchsia-500/18'
      if (p.includes('behance')) return 'bg-indigo-500/15 border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/25'
      if (p.includes('dribbble')) return 'bg-rose-500/15 border-rose-400/30 text-rose-200 hover:bg-rose-500/25'
      if (p.includes('website') || p.includes('profile')) return 'bg-emerald-500/12 border-emerald-400/25 text-emerald-200 hover:bg-emerald-500/18'
      return 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
    }

    return (
      <div className={className || ''}>
        <div className="flex flex-wrap gap-2">
          {links.map((l, idx) => (
            <a
              key={`${l.platform}-${idx}`}
              href={(() => {
                const u = String(l.url || '').trim()
                if (!u) return '#'
                if (/^https?:\/\//i.test(u)) return u
                return `https://${u.replace(/^\/+/, '')}`
              })()}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${colorClass(String(l.platform))}`}
              title={`${l.platform}: ${l.url}`}
            >
              {iconSvg(l.platform)}
              <span className="text-sm font-medium">{String(l.platform)}</span>
            </a>
          ))}
        </div>
      </div>
    )
  }

  function fileExt(title: string) {
    const m = String(title || '').toLowerCase().match(/\.([a-z0-9]+)$/)
    return m?.[1] ?? ''
  }

  async function ensureSignedUrl(path: string) {
    if (!path) return
    if (thumbUrls[path]) return
    const { data } = await supabase.storage.from('business-bank').createSignedUrl(path, 60 * 30)
    if (data?.signedUrl) setThumbUrls((prev) => ({ ...prev, [path]: data.signedUrl }))
  }

  async function openPath(path: string, fileType: string | null | undefined, title: string) {
    if (!path) return
    const { data } = await supabase.storage.from('business-bank').createSignedUrl(path, 60 * 30)
    const url = data?.signedUrl
    if (!url) return
    const ft = (fileType || '').toLowerCase()
    if (ft.includes('pdf')) {
      setPreview({ kind: 'pdf', url, title: title || 'Document' })
      return
    }
    window.open(url, '_blank')
  }

  function ThumbIcon({ label }: { label: string }) {
    return (
      <div className="w-full h-32 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-950/40 text-xs font-semibold text-slate-200">
          {label}
        </div>
      </div>
    )
  }

  function tbThumb(item: any) {
    const type = String(item?.item_type ?? '').toLowerCase()
    const ft = String(item?.file_type ?? '').toLowerCase()
    const title = String(item?.title ?? '')
    const path = String(item?.file_path ?? '')
    const isImg = ft.startsWith('image/')
    const isVid = ft.startsWith('video/')
    const isPdf = ft.includes('pdf') || title.toLowerCase().endsWith('.pdf')
    const label = isImg ? 'IMG' : isVid ? 'VID' : isPdf ? 'PDF' : (type ? type.toUpperCase().slice(0, 4) : 'FILE')

    if (path && (isImg || isVid) && !thumbUrls[path]) ensureSignedUrl(path).catch(() => {})
    const url = path ? thumbUrls[path] : null

    if (url && isImg) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt={title} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
    }
    if (url && isVid) {
      return (
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
          <div className="text-white/80 text-sm">▶</div>
        </div>
      )
    }
    return (
      <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <div className="px-2 py-1 rounded-lg border border-white/10 bg-slate-950/40 text-[10px] font-semibold text-slate-200">
          {label}
        </div>
      </div>
    )
  }

  function isSupabaseSignedObjectUrl(u: string) {
    // Signed object URLs expire; don’t persist/reuse them for thumbnails.
    return u.includes('/storage/v1/object/sign/') || u.includes('token=')
  }

  function extractBucketObjectPathFromUrl(u: string): { bucket: string; path: string } | null {
    // Handles:
    // - /storage/v1/object/public/<bucket>/<path>
    // - /storage/v1/object/sign/<bucket>/<path>?token=...
    try {
      const url = new URL(u)
      const parts = url.pathname.split('/').filter(Boolean)
      const i = parts.findIndex((p) => p === 'object')
      if (i === -1) return null
      const visibility = parts[i + 1] // public|sign
      const bucket = parts[i + 2]
      const rest = parts.slice(i + 3).join('/')
      if (!visibility || !bucket || !rest) return null
      return { bucket, path: rest }
    } catch {
      return null
    }
  }

  function AttachmentThumb({ a }: { a: any }) {
    const isImg = String(a?.file_type || '').startsWith('image') || a?.item_type === 'image'
    const isVid = String(a?.file_type || '').startsWith('video') || a?.item_type === 'video'
    const ext = fileExt(String(a?.title || ''))
    const label = isImg ? 'IMG' : isVid ? 'VID' : ext ? ext.toUpperCase().slice(0, 4) : 'FILE'

    const rawUrl = typeof a?.url === 'string' ? String(a.url) : ''
    let path = String(a?.file_path || '')

    // If we only have a URL (often a stale signed URL), try to extract the bucket path.
    if (!path && rawUrl) {
      const extracted = extractBucketObjectPathFromUrl(rawUrl)
      if (extracted?.bucket === 'business-bank' && extracted.path) path = extracted.path
    }

    const hasFresh = path ? !!thumbUrls[path] : false
    const shouldMintFresh = path && (isImg || isVid) && (!hasFresh || (rawUrl && isSupabaseSignedObjectUrl(rawUrl)))
    if (shouldMintFresh) ensureSignedUrl(path).catch(() => {})

    // Prefer a freshly minted signed URL when we have a path.
    // Avoid reusing stored signed URLs (they expire and cause broken thumbnails).
    const url = path ? thumbUrls[path] : rawUrl || null

    if (url && isImg) {
      return (
        <button
          type="button"
          className="w-full h-32 rounded-xl border border-white/10 overflow-hidden"
          onClick={() => setPreview({ kind: 'image', url, title: String(a?.title || 'Image') })}
          title="Click to expand"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Attachment image"
            className="w-full h-full object-cover"
            onError={() => {
              // If a thumbnail URL is stale, attempt a refresh once.
              if (path) ensureSignedUrl(path).catch(() => {})
            }}
          />
        </button>
      )
    }

    if (url && isVid) {
      return (
        <button
          type="button"
          className="w-full h-32 rounded-xl border border-white/10 overflow-hidden"
          onClick={() => setPreview({ kind: 'video', url, title: String(a?.title || 'Video') })}
          title="Click to play"
        >
          <div className="relative w-full h-full">
            <video className="w-full h-full object-cover" src={url} muted playsInline preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold bg-black/30 text-white">
              ▶
            </div>
          </div>
        </button>
      )
    }

    // Documents/other: icon tile; clicking opens/preview via signed URL.
    if (path) {
      return (
        <button
          type="button"
          className="w-full"
          onClick={() => openPath(path, a?.file_type ?? null, String(a?.title || 'Document'))}
          title="Open"
        >
          <ThumbIcon label={label} />
        </button>
      )
    }

    return <ThumbIcon label={label} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {preview ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold truncate pr-4 text-slate-900">{preview.title}</div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-slate-900"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              {preview.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt="Preview" className="max-h-[75vh] w-auto object-contain" />
              ) : preview.kind === 'video' ? (
                <video src={preview.url} controls className="max-h-[75vh] w-auto object-contain" />
              ) : (
                <iframe title="Document preview" src={preview.url} className="w-full h-[75vh] bg-white rounded-lg" />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-[95vw] xl:max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isPublicViewer ? (
              <>
                {backToMapHref ? (
                  <Link href={backToMapHref} className="text-slate-300 hover:text-blue-400">
                    ← Back to Talent Map
                  </Link>
                ) : null}
                <Link href="/dashboard/business" className="text-slate-300 hover:text-blue-400">
                  ← Back to Dashboard
                </Link>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {isPublicViewer ? (
              <>
                <Link
                  href={publicConnectHref}
                  className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Connect with this Business
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5 transition-colors"
                >
                  Back to Home
                </Link>
              </>
            ) : (
              <>
                {/* Connection Request Action Buttons */}
                {connectionRequest && (connectionRequest.status === 'pending' || connectionRequest.status === 'waiting_for_review' || connectionRequest.status === 'rejected' || connectionRequest.status === 'declined') && (
                  <>
                    <button
                      onClick={async () => {
                        if (!confirm(`Accept connection request from ${name || 'this business'}? You'll be able to message and collaborate with them.`)) {
                          return
                        }
                        
                        setProcessingConnection(true)
                        try {
                          const { data: sessionRes } = await supabase.auth.getSession()
                          const uid = sessionRes.session?.user?.id
                          if (!uid) {
                            throw new Error('Please sign in to accept connection requests.')
                          }
                          
                          const talentRes = await supabase
                            .from('talent_profiles')
                            .select('id')
                            .eq('user_id', uid)
                            .single()
                          
                          if (talentRes.error || !talentRes.data?.id) {
                            throw new Error('Talent profile not found. Please complete your profile first.')
                          }
                          
                          const talentId = String(talentRes.data.id)
                          
                          const { error } = await supabase
                            .from('talent_connection_requests')
                            .update({ 
                              status: 'accepted',
                              responded_at: new Date().toISOString()
                            })
                            .eq('id', connectionRequest.id)
                            .eq('talent_id', talentId)
                          
                          if (error) {
                            console.error('Error accepting connection:', error)
                            throw error
                          }
                          
                          // Remove connection request ID from URL and reload
                          router.push(`/dashboard/business/view?id=${businessProfileId}`)
                          window.location.reload()
                        } catch (err: any) {
                          console.error('Error accepting connection:', err)
                          alert(err.message || 'Failed to accept connection request. Please try again.')
                        } finally {
                          setProcessingConnection(false)
                        }
                      }}
                      disabled={processingConnection}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {processingConnection ? 'Processing...' : 'Accept Connection'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Decline connection request from ${name || 'this business'}? This action cannot be undone.`)) {
                          return
                        }
                        
                        setProcessingConnection(true)
                        try {
                          const { error } = await supabase
                            .from('talent_connection_requests')
                            .update({ 
                              status: 'rejected',
                              responded_at: new Date().toISOString()
                            })
                            .eq('id', connectionRequest.id)
                          
                          if (error) throw error
                          
                          // Remove connection request ID from URL and reload
                          router.push(`/dashboard/business/view?id=${businessProfileId}`)
                          window.location.reload()
                        } catch (err: any) {
                          console.error('Error declining connection:', err)
                          alert(err.message || 'Failed to decline connection request. Please try again.')
                        } finally {
                          setProcessingConnection(false)
                        }
                      }}
                      disabled={processingConnection}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {processingConnection ? 'Processing...' : 'Decline'}
                    </button>
                    <button
                      onClick={async () => {
                        setProcessingConnection(true)
                        try {
                          const { data: sessionRes } = await supabase.auth.getSession()
                          const uid = sessionRes.session?.user?.id
                          if (!uid) {
                            throw new Error('Please sign in to update connection requests.')
                          }
                          
                          const talentRes = await supabase
                            .from('talent_profiles')
                            .select('id')
                            .eq('user_id', uid)
                            .single()
                          
                          if (talentRes.error || !talentRes.data?.id) {
                            throw new Error('Talent profile not found.')
                          }
                          
                          const talentId = String(talentRes.data.id)
                          
                          const { error } = await supabase
                            .from('talent_connection_requests')
                            .update({ 
                              status: 'waiting_for_review',
                              responded_at: new Date().toISOString()
                            })
                            .eq('id', connectionRequest.id)
                            .eq('talent_id', talentId)
                          
                          if (error) {
                            console.error('Error updating connection request:', error)
                            throw error
                          }
                          
                          // Navigate back to Connections page
                          router.push('/dashboard/talent?tab=connections')
                        } catch (err: any) {
                          console.error('Error updating connection request:', err)
                          alert(err.message || 'Failed to update connection request. Please try again.')
                        } finally {
                          setProcessingConnection(false)
                        }
                      }}
                      disabled={processingConnection}
                      className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {processingConnection ? 'Processing...' : 'Review Later'}
                    </button>
                  </>
                )}
                {isOwner && (
                  <Link
                    href="/dashboard/business/edit"
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 font-semibold"
                  >
                    Edit Profile
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[95vw] xl:max-w-[1400px] mx-auto px-4 md:px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
            {error}
          </div>
        ) : !meta ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8">
            <h1 className="text-2xl font-bold">Profile unavailable</h1>
            <p className="text-slate-300 mt-2">
              {isPublicViewer
                ? 'This business profile is not available.'
                : 'Create your profile first, then come back here to review exactly what it looks like.'}
            </p>
            {!isPublicViewer ? (
              <div className="mt-6">
                <Link href="/dashboard/business/edit" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold">
                  Build your profile
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero */}
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
              <div className="h-44 md:h-64 bg-slate-900 relative">
                {bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={bannerUrl} 
                    alt="Banner" 
                    className="w-full h-full object-cover opacity-80"
                    onError={(e) => {
                      console.error('[View Profile] Banner image failed to load:', bannerUrl)
                      e.currentTarget.style.display = 'none'
                    }}
                    onLoad={() => {
                      console.log('[View Profile] Banner image loaded successfully')
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.25),transparent_45%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end gap-5">
                  <div className="-mt-16 md:-mt-20 shrink-0">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-xl">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('[View Profile] Avatar image failed to load:', avatarUrl)
                            e.currentTarget.style.display = 'none'
                          }}
                          onLoad={() => {
                            console.log('[View Profile] Avatar image loaded successfully:', avatarUrl)
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-3xl">
                          {name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h1 className="text-3xl md:text-4xl font-bold truncate">{name}</h1>
                        <p className="text-slate-300 mt-1">{title}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300 mt-3">
                          {location ? <span>📍 {location}</span> : null}
                          {yearsExperience ? (
                            <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10">{yearsExperience}</span>
                          ) : null}
                        </div>
                      </div>
                      {isOwner && (
                        <Link
                          href="/dashboard/business/edit"
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold shrink-0"
                        >
                          Edit Profile
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Main */}
              <div className="lg:col-span-9 space-y-6">
                {/* About */}
                <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <h2 className="text-xl font-semibold mb-4">About</h2>
                  {bio ? (
                    <>
                      <p
                        className="text-slate-300 leading-relaxed whitespace-pre-wrap"
                        style={bioExpanded ? undefined : clampStyle(5)}
                      >
                        {bio}
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setBioExpanded((v) => !v)}
                      >
                        {bioExpanded ? 'Show less' : 'Show more'}
                      </button>
                    </>
                  ) : (
                    <div className="text-slate-400">No bio added yet.</div>
                  )}
                </section>

                {/* Intro video (below About, like your reference) */}
                {/* Show intro video section if introVideoId exists in saved profile, even if URL loading failed */}
                {(() => {
                  const hasIntroVideoId = typeof meta?.introVideoId === 'number' && meta.introVideoId !== null
                  if (!hasIntroVideoId) return null
                  
                  return (
                    <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                      <h2 className="text-xl font-semibold mb-4">{introVideoTitle || 'Introduction Video'}</h2>
                      {introVideoUrl ? (
                        <div className="mx-auto max-w-3xl">
                          {/* Soft frame */}
                          <div className="rounded-3xl p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-transparent shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                            <div className="rounded-3xl overflow-hidden bg-slate-950/60 border border-white/10">
                              <div className="bg-black">
                                {(() => {
                                  // Check if it's a YouTube URL
                                  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
                                  const youtubeMatch = introVideoUrl.match(youtubeRegex)
                                  if (youtubeMatch) {
                                    const videoId = youtubeMatch[1]
                                    return (
                                      <iframe
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        className="w-full aspect-video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    )
                                  }
                                  // Check if it's a Vimeo URL
                                  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/
                                  const vimeoMatch = introVideoUrl.match(vimeoRegex)
                                  if (vimeoMatch) {
                                    const videoId = vimeoMatch[1]
                                    return (
                                      <iframe
                                        src={`https://player.vimeo.com/video/${videoId}`}
                                        className="w-full aspect-video"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                      />
                                    )
                                  }
                                  // Regular video URL
                                  return (
                                    <video
                                      src={introVideoUrl}
                                      controls
                                      playsInline
                                      className="w-full max-h-[280px] md:max-h-[300px] object-contain"
                                    />
                                  )
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-slate-400">
                            Tip: Keep your intro under 60–90 seconds and speak to your strongest work examples.
                          </div>
                        </div>
                      ) : (
                        !isPublicViewer ? (
                          <div className="text-slate-400">
                            Introduction video is being loaded. If it doesn't appear, please check your video file in Edit Profile.
                          </div>
                        ) : null
                      )}
                    </section>
                  )
                })()}

                {sectionOrder.map((k) => {
                  // Intro is handled above (defensive skip).
                  if (k === 'intro') return null
                  // Job Vacancies is intentionally rendered in the right column (under "Connect With Me") for layout aesthetics.
                  if (k === 'projects') return null
                  // Social links are displayed in the sidebar under "View and Connect with {name}" - skip in main content
                  // IMPORTANT: Social section must NOT be rendered in main content - it only appears in sidebar
                  if (k === 'social' || k === 'Social' || String(k).toLowerCase() === 'social') return null
                  if (k === 'skills') {
                    const skillsCollapsed = skills.slice(0, 20)
                    const showAllSkills = skillsExpanded ? skills : skillsCollapsed
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-2">Products and Services</h2>
                        <p className="text-slate-400 text-sm mb-4">
                          Provide a detailed description of what you offer, including customer testimonials or case studies.
                        </p>
                        {skills.length ? (
                          <div className="flex flex-wrap gap-2">
                            {showAllSkills.map((s, idx) => (
                              <span
                                key={`${s}-${idx}`}
                                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No products and services added yet.</div>
                        )}
                        {skills.length > skillsCollapsed.length ? (
                          <button
                            type="button"
                            className="mt-3 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setSkillsExpanded((v) => !v)}
                          >
                            {skillsExpanded ? 'Show less' : 'Show more'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }

                  if (k === 'experience') {
                    const expList = expListExpanded ? experience : experience.slice(0, 2)
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Experience</h2>
                        {experience.length ? (
                          <div className="space-y-3">
                            {expList.map((e, idx) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{e?.role || e?.title || 'Role'}</div>
                                <div className="text-slate-300 text-sm mt-1">
                                  {(e?.company || e?.organisation || 'Company') +
                                    (e?.startDate || e?.endDate ? ` • ${e?.startDate || ''} – ${e?.endDate || ''}` : '')}
                                </div>
                                {normalizeDisplayText(String(e?.description || '')) ? (
                                  <div className="mt-3">
                                    <div
                                      className="text-slate-300 whitespace-pre-wrap text-sm"
                                      style={expExpanded[idx] ? undefined : clampStyle(5)}
                                    >
                                      {normalizeDisplayText(String(e.description))}
                                    </div>
                                    <button
                                      type="button"
                                      className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                                      onClick={() => setExpExpanded((p) => ({ ...p, [idx]: !p[idx] }))}
                                    >
                                      {expExpanded[idx] ? 'Show less' : 'Show more'}
                                    </button>
                                  </div>
                                ) : null}
                                
                                {(() => {
                                  // Render attachments for experience entries
                                  const attachmentIds = Array.isArray(e?.attachmentIds) ? e.attachmentIds.filter((id: any) => {
                                    const num = typeof id === 'number' ? id : Number(id)
                                    return Number.isFinite(num) && num > 0
                                  }) : []
                                  
                                  if (attachmentIds.length === 0) return null
                                  
                                  return (
                                    <div className="mt-4">
                                      <div className="text-xs text-slate-400 mb-2">
                                        Attached documents:{' '}
                                        <span className="text-slate-200 font-semibold">{attachmentIds.length}</span>
                                      </div>
                                      <div className="space-y-2">
                                        {attachmentIds.slice(0, 3).map((id: any) => {
                                          const numId = typeof id === 'number' ? id : Number(id)
                                          if (!Number.isFinite(numId) || numId <= 0) return null
                                          const it = tbItemCache[numId]
                                          if (!it) {
                                            return (
                                              <div key={numId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
                                                Loading document {numId}…
                                              </div>
                                            )
                                          }
                                          const open = () => {
                                            const path = String(it?.file_path ?? '')
                                            if (path) {
                                              openPath(path, it?.file_type ?? null, String(it?.title || 'Document'))
                                              return
                                            }
                                          }
                                          return (
                                            <div key={numId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3">
                                              {tbThumb(it)}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm text-slate-200 truncate">{String(it?.title || 'Document')}</div>
                                                <div className="text-xs text-slate-400 truncate">{String(it?.item_type || '')}</div>
                                              </div>
                                              <button type="button" className="text-xs text-blue-300 underline" onClick={open}>
                                                Open
                                              </button>
                                            </div>
                                          )
                                        })}
                                        {attachmentIds.length > 3 ? (
                                          <div className="text-xs text-slate-400 px-1">+{attachmentIds.length - 3} more…</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No experience added yet.</div>
                        )}
                        {experience.length > 2 ? (
                          <button
                            type="button"
                            className="mt-4 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setExpListExpanded((v) => !v)}
                          >
                            {expListExpanded ? 'Show fewer roles' : 'Show all roles'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }

                  if (k === 'education') {
                    const eduList = eduListExpanded ? education : education.slice(0, 2)
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Education</h2>
                        {education.length ? (
                          <div className="space-y-3">
                            {eduList.map((e, idx) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{e?.qualification || e?.degree || 'Qualification'}</div>
                                <div className="text-slate-300 text-sm mt-1">
                                  {(e?.institution || e?.school || 'Institution') +
                                    (e?.year || e?.endYear ? ` • ${e?.year || e?.endYear}` : '')}
                                </div>
                                {normalizeDisplayText(String(e?.notes || '')) ? (
                                  <div className="mt-3">
                                    <div
                                      className="text-slate-300 whitespace-pre-wrap text-sm"
                                      style={eduExpanded[idx] ? undefined : clampStyle(5)}
                                    >
                                      {normalizeDisplayText(String(e.notes))}
                                    </div>
                                    <button
                                      type="button"
                                      className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                                      onClick={() => setEduExpanded((p) => ({ ...p, [idx]: !p[idx] }))}
                                    >
                                      {eduExpanded[idx] ? 'Show less' : 'Show more'}
                                    </button>
                                  </div>
                                ) : null}

                                {(() => {
                                  // e comes from the processed education array (from useMemo), so attachmentIds should already be an array of numbers
                                  const attachmentIds = Array.isArray(e?.attachmentIds) ? e.attachmentIds.filter((id: any) => {
                                    const num = typeof id === 'number' ? id : Number(id)
                                    return Number.isFinite(num) && num > 0
                                  }) : []
                                  
                                  // Debug: Log attachment data for rendering
                                  if (attachmentIds.length > 0) {
                                    console.log(`[View Profile] Rendering education entry ${idx} with ${attachmentIds.length} attachments:`, {
                                      entryIndex: idx,
                                      institution: e?.institution || e?.school,
                                      degree: e?.degree || e?.qualification,
                                      processedAttachmentIds: attachmentIds,
                                      cacheSize: Object.keys(tbItemCache).length,
                                      cacheStatus: attachmentIds.map((id) => ({ id, cached: !!tbItemCache[id], item: tbItemCache[id] ? 'found' : 'missing' })),
                                    })
                                  } else if (idx === 0) {
                                    // Log first entry even without attachments to verify structure
                                    console.log(`[View Profile] Education entry ${idx} (no attachments):`, {
                                      entryIndex: idx,
                                      hasAttachmentIdsKey: 'attachmentIds' in e,
                                      attachmentIdsValue: e?.attachmentIds,
                                      attachmentIdsType: typeof e?.attachmentIds,
                                    })
                                  }
                                  
                                  if (attachmentIds.length === 0) return null
                                  
                                  return (
                                    <div className="mt-4">
                                      <div className="text-xs text-slate-400 mb-2">
                                        Attached documents:{' '}
                                        <span className="text-slate-200 font-semibold">{attachmentIds.length}</span>
                                      </div>
                                      <div className="space-y-2">
                                        {attachmentIds.slice(0, 3).map((id: any) => {
                                          const numId = typeof id === 'number' ? id : Number(id)
                                          if (!Number.isFinite(numId) || numId <= 0) return null
                                          const it = tbItemCache[numId]
                                          if (!it) {
                                            // Item not in cache yet - trigger load and show loading state
                                            // The loadAttachments useEffect should pick this up
                                            return (
                                              <div key={numId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
                                                Loading document {numId}…
                                              </div>
                                            )
                                          }
                                          const open = () => {
                                            const path = String(it?.file_path ?? '')
                                            if (path) {
                                              openPath(path, it?.file_type ?? null, String(it?.title || 'Document'))
                                              return
                                            }
                                          }
                                          return (
                                            <div key={numId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3">
                                              {tbThumb(it)}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm text-slate-200 truncate">{String(it?.title || 'Document')}</div>
                                                <div className="text-xs text-slate-400 truncate">{String(it?.item_type || '')}</div>
                                              </div>
                                              <button type="button" className="text-xs text-blue-300 underline" onClick={open}>
                                                Open
                                              </button>
                                            </div>
                                          )
                                        })}
                                        {attachmentIds.length > 3 ? (
                                          <div className="text-xs text-slate-400 px-1">+{attachmentIds.length - 3} more…</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No education added yet.</div>
                        )}
                        {education.length > 2 ? (
                          <button
                            type="button"
                            className="mt-4 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setEduListExpanded((v) => !v)}
                          >
                            {eduListExpanded ? 'Show fewer entries' : 'Show all education'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }

                  if (k === 'referees') {
                    const refList = refListExpanded ? referees : referees.slice(0, 2)
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Referees</h2>
                        {referees.length ? (
                          <div className="space-y-3">
                            {refList.map((r, idx) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{r?.name || 'Referee'}</div>
                                <div className="text-slate-300 text-sm mt-1">
                                  {(r?.title ? `${r.title} • ` : '') +
                                    (r?.company ? `${r.company} • ` : '') +
                                    (r?.relationship ? r.relationship : '')}
                                </div>
                                {(r?.email || r?.phone) && (
                                  <div className="text-slate-400 text-sm mt-2">
                                    {r?.email ? <div>Email: {r.email}</div> : null}
                                    {r?.phone ? <div>Phone: {r.phone}</div> : null}
                                  </div>
                                )}
                                {normalizeDisplayText(String(r?.notes || '')) ? (
                                  <div className="mt-3">
                                    <div
                                      className="text-slate-300 whitespace-pre-wrap text-sm"
                                      style={refExpanded[idx] ? undefined : clampStyle(5)}
                                    >
                                      {normalizeDisplayText(String(r.notes))}
                                    </div>
                                    <button
                                      type="button"
                                      className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                                      onClick={() => setRefExpanded((p) => ({ ...p, [idx]: !p[idx] }))}
                                    >
                                      {refExpanded[idx] ? 'Show less' : 'Show more'}
                                    </button>
                                  </div>
                                ) : null}

                                {(() => {
                                  // Ensure we check attachmentIds from the mapped referee object
                                  const attachmentIds = Array.isArray(r?.attachmentIds) ? r.attachmentIds : []
                                  if (attachmentIds.length === 0) return null
                                  
                                  return (
                                    <div className="mt-4">
                                      <div className="text-xs text-slate-400 mb-2">
                                        Attached documents:{' '}
                                        <span className="text-slate-200 font-semibold">{attachmentIds.length}</span>
                                      </div>
                                      <div className="space-y-2">
                                        {attachmentIds.slice(0, 3).map((id: any) => {
                                          const numId = Number(id)
                                          if (!Number.isFinite(numId) || numId <= 0) return null
                                          const it = tbItemCache[numId]
                                          if (!it) {
                                            return (
                                              <div key={id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
                                                Loading…
                                              </div>
                                            )
                                          }
                                          const open = () => {
                                            const path = String(it?.file_path ?? '')
                                            if (path) {
                                              openPath(path, it?.file_type ?? null, String(it?.title || 'Document'))
                                              return
                                            }
                                          }
                                          return (
                                            <div key={id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3">
                                              {tbThumb(it)}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm text-slate-200 truncate">{String(it?.title || 'Document')}</div>
                                                <div className="text-xs text-slate-400 truncate">{String(it?.item_type || '')}</div>
                                              </div>
                                              <button type="button" className="text-xs text-blue-300 underline" onClick={open}>
                                                Open
                                              </button>
                                            </div>
                                          )
                                        })}
                                        {attachmentIds.length > 3 ? (
                                          <div className="text-xs text-slate-400 px-1">+{attachmentIds.length - 3} more…</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No referees added yet.</div>
                        )}
                        {referees.length > 2 ? (
                          <button
                            type="button"
                            className="mt-4 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setRefListExpanded((v) => !v)}
                          >
                            {refListExpanded ? 'Show fewer referees' : 'Show all referees'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }

                  if (k === 'attachments') {
                    const aList = attachExpanded ? attachments : attachments.slice(0, 6)
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                        {attachments.length ? (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {aList.map((a, idx) => (
                              <div
                                key={`${a?.id ?? idx}`}
                                className="rounded-xl border border-white/10 bg-slate-900/40 p-3 hover:bg-slate-900/60 transition-colors"
                              >
                                <AttachmentThumb a={a} />
                                <div className="mt-3">
                                  <div className="text-sm text-slate-200 truncate">{a?.title || 'Attachment'}</div>
                                  <div className="text-xs text-slate-500 mt-1">{a?.file_type || a?.item_type || 'File'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No attachments selected yet.</div>
                        )}
                        {attachments.length > 6 ? (
                          <button
                            type="button"
                            className="mt-4 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setAttachExpanded((v) => !v)}
                          >
                            {attachExpanded ? 'Show fewer attachments' : 'Show all attachments'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }

                  // Unknown/unsupported section keys: skip silently (defensive).
                  return null
                })}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-3 space-y-6">
                {!isPublicViewer ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                    <div className="text-slate-200 font-semibold mb-4">View and Connect with {name}</div>
                    <div className="space-y-4 text-sm">
                      {authEmail ? (
                        <div>
                          <div className="text-slate-400 text-xs">Email</div>
                          <div className="text-slate-200 break-all">{authEmail}</div>
                        </div>
                      ) : null}
                      {(meta as any)?.phone ? (
                        <div>
                          <div className="text-slate-400 text-xs">Phone</div>
                          <div className="text-slate-200">{String((meta as any).phone)}</div>
                        </div>
                      ) : null}
                      {(() => {
                        // Keep legacy LinkedIn field support, but avoid duplicating if socialLinks already includes LinkedIn.
                        if (socialLinks.some((s) => String(s.platform).toLowerCase().includes('linkedin'))) return null
                        const m: any = meta ?? {}
                        const link =
                          m.linkedin ||
                          m.linkedIn ||
                          m?.social?.linkedin ||
                          m?.socialLinks?.linkedin ||
                          m?.socials?.linkedin ||
                          null
                        if (!link) return null
                        return (
                          <div>
                            <div className="text-slate-400 text-xs">LinkedIn</div>
                            <a className="text-blue-300 hover:text-blue-200 break-all" href={String(link)} target="_blank" rel="noreferrer">
                              {String(link)}
                            </a>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Social icons under Connect with Me */}
                    {socialLinks.length && sectionVisibility.social !== false ? (
                      <div className="mt-6">
                        <div className="text-slate-400 text-xs mb-2">Social</div>
                        <SocialIconBar links={socialLinks} />
                      </div>
                    ) : null}

                    {skills.length ? (
                      <div className="mt-6">
                        <div className="text-slate-400 text-xs mb-2">Products & Services</div>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(0, 6).map((s, idx) => (
                            <span key={`${s}-${idx}`} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Job Vacancies: placed under Connect With Me to sit beside the intro video */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-slate-200 font-semibold">Job Vacancies</div>
                    {jobs.length > 2 ? (
                      <button
                        type="button"
                        className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setProjListExpanded((v) => !v)}
                      >
                        {projListExpanded ? 'Show less' : 'Show all'}
                      </button>
                    ) : null}
                  </div>

                  {jobsLoading ? (
                    <div className="text-slate-400 text-sm">Loading jobs...</div>
                  ) : jobs.length > 0 ? (
                    <div className="space-y-3">
                      {(projListExpanded ? jobs : jobs.slice(0, 2)).map((job) => (
                        <div
                          key={job.id}
                          className="block rounded-xl border border-white/10 bg-slate-900/40 p-4 hover:border-blue-500/50 hover:bg-slate-900/60 transition-colors"
                        >
                          <div className="font-semibold text-white">{job.title || 'Job'}</div>
                          {(job.location || job.city || job.state || job.country) && (
                            <div className="text-slate-400 text-sm mt-1">
                              📍 {job.location || [job.city, job.state, job.country].filter(Boolean).join(', ') || 'Location not specified'}
                            </div>
                          )}
                          {job.employment_type && (
                            <div className="text-slate-400 text-sm mt-1">
                              {job.employment_type.charAt(0).toUpperCase() + job.employment_type.slice(1)}
                            </div>
                          )}
                          {job.description && (
                            <div className="mt-3">
                              <div className="text-slate-300 whitespace-pre-wrap text-sm" style={projExpanded[job.id] ? undefined : clampStyle(3)}>
                                {normalizeDisplayText(String(job.description))}
                              </div>
                              {String(job.description).split('\n').length > 3 && (
                                <button
                                  type="button"
                                  className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                                  onClick={() => setProjExpanded((q) => ({ ...q, [job.id]: !q[job.id] }))}
                                >
                                  {projExpanded[job.id] ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/jobs/${job.id}${viewingBusinessId ? `?from_business=${viewingBusinessId}` : ''}`}
                              className="text-blue-300 hover:text-blue-200 text-sm font-medium underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Details & Apply
                            </Link>
                            {job.application_url && (
                              <a
                                href={job.application_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-300 hover:text-blue-200 text-sm underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Apply via URL
                              </a>
                            )}
                            {job.application_email && (
                              <a
                                href={`mailto:${job.application_email}`}
                                className="text-blue-300 hover:text-blue-200 text-sm underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Apply via Email
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">
                      No job vacancies posted yet.
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


