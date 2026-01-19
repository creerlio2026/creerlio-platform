'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import VideoChat from '@/components/VideoChat'

interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  user_type: string
  is_active: boolean
}

type TabType = 'overview' | 'vacancies' | 'profile' | 'portfolio' | 'applications' | 'connections' | 'service_connections'

export default function BusinessDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [hasBuiltProfile, setHasBuiltProfile] = useState<boolean>(false)
  const [applications, setApplications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const isServiceConnections = activeTab === 'service_connections'
  const [userType, setUserType] = useState<string>('business')

  // Vacancies (Jobs) state
  const [vacanciesLoading, setVacanciesLoading] = useState(false)
  const [vacanciesError, setVacanciesError] = useState<string | null>(null)
  const [vacancies, setVacancies] = useState<any[]>([])
  const [vacanciesLoadedOnce, setVacanciesLoadedOnce] = useState(false)

  const [connLoading, setConnLoading] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)
  const [connRequestsFromTalent, setConnRequestsFromTalent] = useState<any[]>([]) // Pending requests initiated by talent
  const [connRequestsFromBusiness, setConnRequestsFromBusiness] = useState<any[]>([]) // Pending requests initiated by business (via map search)
  const [connReconnectRequests, setConnReconnectRequests] = useState<any[]>([]) // Pending reconnection requests
  const [connAccepted, setConnAccepted] = useState<any[]>([])
  const [connDeclined, setConnDeclined] = useState<any[]>([])
  const [connWithdrawn, setConnWithdrawn] = useState<any[]>([]) // Previous connections - talents who withdrew
  const [hasReloadedForMissingNames, setHasReloadedForMissingNames] = useState(false)
  const [sendingOpportunity, setSendingOpportunity] = useState<string | null>(null) // Track which talent is being sent an opportunity
  const [acceptingReconnect, setAcceptingReconnect] = useState<string | null>(null) // Track which reconnection is being accepted
  const [reconnectModal, setReconnectModal] = useState<{ open: boolean; connection: any | null; message: string }>({
    open: false,
    connection: null,
    message: ''
  }) // Modal for sending reconnection request with custom message
  const [connectionSummaryModal, setConnectionSummaryModal] = useState<{ open: boolean; connection: any | null }>({
    open: false,
    connection: null
  }) // Modal for viewing connection summary

  // Reconnection requests from talents (for withdrawn connections)
  const [reconnectRequests, setReconnectRequests] = useState<any[]>([])
  const [reconnectLoading, setReconnectLoading] = useState(false)
  const didAutoLoadReconnectRef = useRef(false)

  // Export/Print consent requests (Talent → Business)
  const [consentLoading, setConsentLoading] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [consentReqs, setConsentReqs] = useState<any[]>([])
  const [consentBusyId, setConsentBusyId] = useState<string | null>(null)
  const didAutoLoadConsentRef = useRef(false)

  useEffect(() => {
    // Set active role context for mixed-profile accounts
    try {
      localStorage.setItem('creerlio_active_role', 'business')
      // Some pages still rely on this legacy key; force Business context when entering Business Dashboard
      localStorage.setItem('user_type', 'business')
    } catch {}
    try {
      setUserType('business')
    } catch {}
    // Allow deep-linking to specific tab
    try {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'connections') setActiveTab('connections')
      if (tab === 'service_connections') setActiveTab('service_connections')
      if (tab === 'vacancies') setActiveTab('vacancies')
    } catch {}
  }, [])

  function isMissingColumnError(err: any) {
    const msg = String(err?.message ?? '')
    const code = String(err?.code ?? '')
    return code === 'PGRST204' || /Could not find the .* column/i.test(msg)
  }

  async function loadVacancies(opts?: { force?: boolean }) {
    if (vacanciesLoadedOnce && !opts?.force) return
    setVacanciesLoading(true)
    setVacanciesError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setVacanciesError('Please sign in to view vacancies.')
        setVacancies([])
        return
      }

      // Resolve business profile id defensively
      let businessProfileId: string | null = businessProfile?.id ? String(businessProfile.id) : null
      if (!businessProfileId) {
        const bp = await supabase.from('business_profiles').select('id').eq('user_id', uid).maybeSingle()
        if (bp.error || !bp.data?.id) {
          setVacanciesError('No business profile found for this user.')
          setVacancies([])
          return
        }
        businessProfileId = String(bp.data.id)
      }

      const filterKeys = ['business_profile_id', 'business_id', 'company_id'] as const
      const selectors = [
        'id,title,status,is_active,employment_type,location,city,country,created_at,application_url,application_email',
        'id,title,status,is_active,location,city,country,employment_type,created_at',
        'id,title,status,is_active,created_at',
        'id,title,created_at',
        'id,created_at',
      ]

      let data: any[] | null = null
      let lastErr: any = null

      outer: for (const fk of filterKeys) {
        for (const sel of selectors) {
          const res: any = await (supabase
            .from('jobs')
            .select(sel)
            .eq(fk, businessProfileId)
            .order('created_at', { ascending: false })
            .limit(50) as any)

          if (!res.error) {
            data = (res.data || []) as any[]
            break outer
          }

          lastErr = res.error
          if (isMissingColumnError(res.error)) continue
          break outer
        }
      }

      if (!data) {
        const msg = String(lastErr?.message ?? 'Failed to load vacancies.')
        setVacanciesError(
          isMissingColumnError(lastErr)
            ? `Jobs table schema mismatch: ${msg}. Please run the jobs migration and refresh the Supabase schema cache.`
            : msg
        )
        setVacancies([])
        return
      }

      setVacancies(data)
      setVacanciesLoadedOnce(true)
    } finally {
      setVacanciesLoading(false)
    }
  }

  // Keep the overview "Job Postings" stat real (best-effort), even before opening the Vacancies tab.
  useEffect(() => {
    if (!user?.id) return
    loadVacancies().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Messaging state (Supabase/RLS-backed)
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgError, setMsgError] = useState<string | null>(null)
  const [msgTalents, setMsgTalents] = useState<Array<{ id: string; name: string | null }>>([])
  const [msgSelectedTalentId, setMsgSelectedTalentId] = useState<string | null>(null)
  
  // Video Chat state
  const [videoChatSession, setVideoChatSession] = useState<any | null>(null)
  const [videoChatLoading, setVideoChatLoading] = useState(false)
  const [videoChatError, setVideoChatError] = useState<string | null>(null)

  const [serviceConnections, setServiceConnections] = useState<
    Array<{ talent_id: string; conversation_id: string; talent_name: string; last_message: string; last_at: string }>
  >([])
  const [serviceLoading, setServiceLoading] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [msgConversationId, setMsgConversationId] = useState<string | null>(null)
  const [msgItems, setMsgItems] = useState<
    Array<{ id: string; sender_type: string; body: string; created_at: string }>
  >([])
  const [msgBody, setMsgBody] = useState('')

  // Profile view state
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMeta, setProfileMeta] = useState<any>(null)
  const [profileBannerUrl, setProfileBannerUrl] = useState<string | null>(null)
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setIsLoading(true)
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const u = sessionRes.session?.user
        if (!u?.id) {
          router.replace('/login?redirect=/dashboard/business')
          return
        }
        const email = u.email || ''
        const username = email ? email.split('@')[0] : 'business'
        if (!cancelled) {
          setUser({
            id: u.id,
            email,
            username,
            full_name: null,
            user_type: 'business',
            is_active: true,
          })
          setUserType('business')
        }

        // CRITICAL: Check user metadata to determine registration intent (most reliable source)
        // Get fresh user data to ensure we have latest metadata
        const { data: { user: freshUser } } = await supabase.auth.getUser()
        const userMetadata = (freshUser || u).user_metadata || {}
        const registeredAsTalentFromMetadata = userMetadata.registration_type === 'talent' || userMetadata.registered_as === 'talent'
        
        // Extract first name from user metadata (stored during registration)
        const firstNameFromMetadata = userMetadata.first_name || userMetadata.firstName || null
        if (!cancelled && firstNameFromMetadata) {
          setUserFirstName(firstNameFromMetadata)
        }
        
        // Check if user has talent profile to prevent wrong access
        const talentCheck = await supabase.from('talent_profiles').select('id').eq('user_id', u.id).maybeSingle()
        const hasTalentProfile = !!talentCheck.data && !talentCheck.error

        // Load business profile (schema-tolerant)
        const bpRes = await (supabase.from('business_profiles').select('*') as any).eq('user_id', u.id).maybeSingle()
        const hasBusinessProfile = !!bpRes.data && !bpRes.error

        // VALIDATION: Block/redirect if user registered as talent (from metadata) OR has talent profile but no business profile
        // User metadata is the most reliable indicator of registration intent - if metadata says talent, redirect immediately
        const hasTalentNoBusiness = hasTalentProfile && !hasBusinessProfile
        
        // CRITICAL: If user registered as talent (from metadata) OR has talent profile but no business profile, redirect to talent dashboard
        // User metadata is the source of truth - if they registered as talent, they should NOT access business dashboard
        if ((hasTalentNoBusiness || registeredAsTalentFromMetadata) && !cancelled) {
          router.replace('/dashboard/talent')
          return
        }

        if (!cancelled && !bpRes.error) {
          setBusinessProfile(bpRes.data || null)
          const businessName = bpRes.data?.business_name || bpRes.data?.name || null
          if (businessName && typeof businessName === 'string') {
            setUser((prev) => (prev ? { ...prev, full_name: businessName } : prev))
            // Extract first name from business name if not already set from metadata
            if (!firstNameFromMetadata && businessName) {
              const nameParts = businessName.trim().split(/\s+/)
              if (nameParts.length > 0 && !cancelled) {
                setUserFirstName(nameParts[0])
              }
            }
          }
          
          // Check if business has a profile built (in business_bank_items)
          // This determines if they've actually used the profile builder
          if (bpRes.data && !cancelled) {
            const { data: profileData } = await supabase
              .from('business_bank_items')
              .select('id')
              .eq('user_id', u.id)
              .eq('item_type', 'profile')
              .limit(1)
              .maybeSingle()
            
            if (!cancelled) {
              setHasBuiltProfile(!!profileData?.id)
            }
          } else if (!cancelled) {
            // No business_profiles record either
            setHasBuiltProfile(false)
          }
        }

        // Legacy "applications" are optional; keep empty unless table exists and user has rows.
        setApplications([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    boot().catch(() => {
      if (!cancelled) setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    // Debug logging disabled
  }, [activeTab])

  // Auto-reload connections if any are missing names (only once to avoid infinite loops)
  useEffect(() => {
    if (connAccepted.length > 0 && !hasReloadedForMissingNames && !connLoading) {
      const missingNames = connAccepted.filter(r => !r.talent_name || !r.talent_name.trim())
      if (missingNames.length > 0) {
        console.log('[Business Connections] Auto-reloading connections with missing names:', missingNames.length)
        setHasReloadedForMissingNames(true)
        // Delay reload slightly to avoid rapid re-renders
        const timer = setTimeout(() => {
          loadConnections().then(() => {
            // Reset the flag after reload completes
            setTimeout(() => setHasReloadedForMissingNames(false), 3000)
          })
        }, 2000)
        return () => clearTimeout(timer)
      } else {
        // All connections have names, reset the flag
        if (hasReloadedForMissingNames) {
          setHasReloadedForMissingNames(false)
        }
      }
    }
  }, [connAccepted, hasReloadedForMissingNames, connLoading])

  useEffect(() => {
    if (activeTab !== 'vacancies') return
    loadVacancies().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'service_connections') return
    loadServiceConnections().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function loadConnections() {
    setConnLoading(true)
    setConnError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
        if (!uid) {
        setConnError('Please sign in to view connection requests.')
          return
        }
      const businessRes = await supabase.from('business_profiles').select('id').eq('user_id', uid).single()
      if (businessRes.error || !businessRes.data?.id) {
        setConnError('No business profile found for this user.')
        return
      }
      const businessId = String(businessRes.data.id)

      const reqRes = await supabase
        .from('talent_connection_requests')
        .select('id, talent_id, status, selected_sections, created_at, responded_at, initiated_by, reconnect_requested_by, reconnect_message')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (reqRes.error) {
        if (/Could not find the table/i.test(reqRes.error.message)) {
          setConnError(
            "Connections are not configured yet (missing table). Run Supabase migration `2025122203_talent_connection_requests.sql` and refresh the schema cache, then reload."
          )
          return
        }
        // If initiated_by column doesn't exist yet, retry without it
        // Supabase/PostgREST error format: "column [table].[col] does not exist" (code 42703)
        if (/does not exist/i.test(reqRes.error.message) || reqRes.error.code === '42703') {
          console.log('[Business Connections] Some columns not found, retrying with basic query')
          const basicReqRes = await supabase
            .from('talent_connection_requests')
            .select('id, talent_id, status, selected_sections, created_at, responded_at')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })

          if (basicReqRes.error) {
            setConnError(basicReqRes.error.message)
            return
          }
          // Add default values for missing columns
          const basicReqs = (basicReqRes.data || []).map((r: any) => ({
            ...r,
            // Infer initiated_by: if has selected_sections with content, talent initiated
            initiated_by: (r.selected_sections && Array.isArray(r.selected_sections) && r.selected_sections.length > 0) ? 'talent' : 'business',
            reconnect_requested_by: null,
            reconnect_message: null
          }))
          processConnectionRequests(basicReqs, businessId)
          return
        }
        setConnError(reqRes.error.message)
        return
      }

      processConnectionRequests(reqRes.data || [], businessId)
    } finally {
      setConnLoading(false)
    }
  }

  async function processConnectionRequests(reqs: any[], businessId: string) {
      // Separate pending requests by type:
      // 1. Pending from Talent (first-time connection, talent initiated)
      // 2. Pending from Business (business reached out via map search)
      // 3. Pending reconnection requests (status was discontinued, now pending again)
      const pendingFromTalent = reqs.filter((r) =>
        r.status === 'pending' &&
        (r.initiated_by === 'talent' || (!r.initiated_by && r.selected_sections && Array.isArray(r.selected_sections) && r.selected_sections.length > 0)) &&
        !r.reconnect_requested_by
      )
      const pendingFromBusiness = reqs.filter((r) =>
        r.status === 'pending' &&
        (r.initiated_by === 'business' || (!r.initiated_by && (!r.selected_sections || !Array.isArray(r.selected_sections) || r.selected_sections.length === 0))) &&
        !r.reconnect_requested_by
      )
      const pendingReconnect = reqs.filter((r) =>
        r.status === 'pending' && r.reconnect_requested_by
      )

      const acceptedReqs = reqs.filter((r) => r.status === 'accepted')
      const declinedReqs = reqs.filter((r) => r.status === 'rejected' || r.status === 'declined')
      // Previous connections - talents who withdrew/discontinued their connection
      const withdrawnReqs = reqs.filter((r) => r.status === 'discontinued')

      // Fetch talent names for all connections (pending, accepted, withdrawn)
      // Priority: portfolio metadata (most reliable) > talent_profiles.name > talent_profiles.title > API route
      // talent_id in talent_connection_requests references talent_profiles(id)
      const talentIds = Array.from(new Set([
        ...pendingFromTalent,
        ...pendingFromBusiness,
        ...pendingReconnect,
        ...acceptedReqs,
        ...withdrawnReqs
      ].map((r) => r.talent_id).filter(Boolean)))
      console.log('[Business Connections] Fetching talent names for IDs:', talentIds)
      let talentNameMap: Record<string, string> = {}
      
      if (talentIds.length > 0) {
        // Get access token for API calls
        const { data: sessionRes } = await supabase.auth.getSession()
        const accessToken = sessionRes?.session?.access_token || null
        
        for (const talentId of talentIds) {
          const talentIdStr = String(talentId)
          console.log('[Business Connections] Querying talent name for ID:', talentIdStr)
          let foundName = false
          let userId: string | null = null
          
          // Step 1: Query talent_profiles to get user_id (needed for portfolio query)
          const res = await supabase
            .from('talent_profiles')
            .select('id, name, title, user_id')
            .eq('id', talentIdStr)
            .maybeSingle()
          
          if (!res.error && res.data) {
            userId = res.data.user_id || null
            
            // Try name from talent_profiles (but portfolio metadata is more reliable)
            if (res.data.name && String(res.data.name).trim()) {
              const name = String(res.data.name).trim()
              console.log('[Business Connections] Found name in talent_profiles (will check portfolio first):', { id: talentIdStr, name })
            }
          }
          
          // Step 2: ALWAYS check portfolio metadata FIRST (most reliable - this is what talent sets when building portfolio)
          // Try both user_id (from talent_profiles) and talent_id (in case they're the same)
          const userIdsToTry = userId && userId !== talentIdStr ? [userId, talentIdStr] : [talentIdStr]
          for (const uid of userIdsToTry) {
            if (foundName) break
            
            console.log('[Business Connections] Checking portfolio metadata for user_id:', uid)
            // Use limit(1) to handle multiple portfolio items (shouldn't happen but just in case)
            const resBank = await supabase
              .from('talent_bank_items')
              .select('metadata')
              .eq('user_id', uid)
              .eq('item_type', 'portfolio')
              .limit(1)
              .maybeSingle()
            
            if (!resBank.error && resBank.data?.metadata?.name) {
              const metaName = String(resBank.data.metadata.name).trim()
              if (metaName) {
                talentNameMap[talentIdStr] = metaName
                foundName = true
                console.log('[Business Connections] ✓✓✓ Found talent name from portfolio metadata:', { id: talentIdStr, user_id: uid, name: metaName })
                break
              }
            } else if (resBank.error && !resBank.error.message.includes('JSON object requested')) {
              // Ignore "multiple rows" error, just log other errors
              console.warn('[Business Connections] Portfolio metadata query error for user_id:', uid, resBank.error.message)
            }
          }
          
          // Step 3: If portfolio metadata not found, try talent_profiles.name or title
          if (!foundName && res.data) {
            // Try name first (preferred)
            if (res.data.name && String(res.data.name).trim()) {
              const name = String(res.data.name).trim()
              talentNameMap[talentIdStr] = name
              foundName = true
              console.log('[Business Connections] ✓✓✓ Found talent name from talent_profiles.name:', { id: talentIdStr, name })
            } 
            // Try title as fallback (less preferred but better than nothing)
            else if (res.data.title && String(res.data.title).trim()) {
              const titleName = String(res.data.title).trim()
              talentNameMap[talentIdStr] = titleName
              foundName = true
              console.log('[Business Connections] ✓✓✓ Using talent_profiles.title as name:', { id: talentIdStr, name: titleName })
            }
          }
          
          // Step 4: If still not found and talent_profiles query failed, try portfolio metadata with talent_id directly
          if (!foundName && (res.error || !res.data)) {
            console.warn('[Business Connections] talent_profiles query failed, trying portfolio metadata with talent_id directly:', talentIdStr)
            const resBankDirect = await supabase
              .from('talent_bank_items')
              .select('metadata')
              .eq('user_id', talentIdStr)
              .eq('item_type', 'portfolio')
              .limit(1)
              .maybeSingle()
            
            if (!resBankDirect.error && resBankDirect.data?.metadata?.name) {
              const metaName = String(resBankDirect.data.metadata.name).trim()
              if (metaName) {
                talentNameMap[talentIdStr] = metaName
                foundName = true
                console.log('[Business Connections] ✓✓✓ Found talent name from portfolio metadata (direct query):', { id: talentIdStr, name: metaName })
              }
            }
          }
          
          // Step 5: If still not found, try querying all portfolio items and finding one with name
          if (!foundName) {
            console.log('[Business Connections] Trying to find name from any portfolio item for user_id:', userId || talentIdStr)
            const resBankAll = await supabase
              .from('talent_bank_items')
              .select('metadata')
              .eq('user_id', userId || talentIdStr)
              .eq('item_type', 'portfolio')
              .limit(10) // Get up to 10 portfolio items
            
            if (!resBankAll.error && resBankAll.data && resBankAll.data.length > 0) {
              // Find first item with a name in metadata
              for (const item of resBankAll.data) {
                if (item.metadata?.name && String(item.metadata.name).trim()) {
                  const metaName = String(item.metadata.name).trim()
                  talentNameMap[talentIdStr] = metaName
                  foundName = true
                  console.log('[Business Connections] ✓✓✓ Found talent name from portfolio metadata (multiple items query):', { id: talentIdStr, name: metaName })
                  break
                }
              }
            }
          }
          
          if (!foundName) {
            console.warn('[Business Connections] ⚠ Could not find talent name from direct queries for:', talentIdStr)
          }
        }
        
        // Step 5: For any still missing names, try API route as final fallback (within the loop scope)
        const missingNamesInLoop = talentIds.filter(id => !talentNameMap[String(id)])
        if (missingNamesInLoop.length > 0 && accessToken) {
          console.log('[Business Connections] Trying API route for missing names (within loop):', missingNamesInLoop)
          for (const talentId of missingNamesInLoop) {
            const talentIdStr = String(talentId)
            try {
              const apiRes = await fetch(`/api/talent/name?talent_id=${encodeURIComponent(talentIdStr)}`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              })
              
              if (apiRes.ok) {
                const data = await apiRes.json()
                if (data.name && String(data.name).trim()) {
                  talentNameMap[talentIdStr] = String(data.name).trim()
                  console.log('[Business Connections] ✓ Found talent name via API route:', { id: talentIdStr, name: data.name })
                }
              } else if (apiRes.status === 404) {
                console.warn('[Business Connections] API route returned 404 for:', talentIdStr, '- Name not found or route issue')
              }
            } catch (apiErr) {
              console.warn('[Business Connections] API route error for:', talentIdStr, apiErr)
            }
          }
        }
      }
      
      // Final API route attempt for any still missing names (before mapping)
      // Get access token again in case it's out of scope
      const { data: finalSessionRes } = await supabase.auth.getSession()
      const finalAccessToken = finalSessionRes?.session?.access_token || null
      const missingNames = talentIds.filter(id => !talentNameMap[String(id)])
      if (missingNames.length > 0 && finalAccessToken) {
        console.log('[Business Connections] Making final API call for missing names:', missingNames)
        const namePromises = missingNames.map(async (talentId) => {
          const talentIdStr = String(talentId)
          try {
            const apiRes = await fetch(`/api/talent/name?talent_id=${encodeURIComponent(talentIdStr)}`, {
              headers: {
                'Authorization': `Bearer ${finalAccessToken}`,
              },
            })
            
            if (apiRes.ok) {
              const data = await apiRes.json()
              if (data.name && String(data.name).trim()) {
                return { talentIdStr, name: String(data.name).trim() }
              }
            } else if (apiRes.status === 404) {
              console.warn('[Business Connections] API route not found (404) - route may not exist yet for:', talentIdStr)
            }
          } catch (apiErr) {
            console.warn('[Business Connections] Final API route error for:', talentIdStr, apiErr)
          }
          return null
        })
        
        const nameResults = await Promise.all(namePromises)
        nameResults.forEach(result => {
          if (result) {
            talentNameMap[result.talentIdStr] = result.name
            console.log('[Business Connections] ✓✓✓ Found talent name via final API call:', { id: result.talentIdStr, name: result.name })
          }
        })
      }
      
      // Add talent names to accepted connections - NEVER use "Talent" as fallback
      // Use actual name from database - if not found, it means the data doesn't exist
      const acceptedWithNames = acceptedReqs.map((r) => {
        const talentIdStr = String(r.talent_id)
        const talentName = talentNameMap[talentIdStr]
        
        if (!talentName || !talentName.trim()) {
          console.error('[Business Connections] ✗✗✗ CRITICAL ERROR: Could not find talent name for:', talentIdStr, '- All attempts failed. This should not happen.')
          // As absolute last resort, try to query portfolio metadata directly one more time
          // But for now, we'll need to reload connections or show an error
          // The UI will show "Loading name..." for these cases
        } else {
          console.log('[Business Connections] ✓✓✓ Mapping connection with name:', { talentId: talentIdStr, talentName })
        }
        
        // NEVER use "Talent" as fallback - always show actual name
        return { 
          ...r, 
          talent_name: (talentName && talentName.trim()) || null // null will show "Loading name..." in UI
        }
      })
      
      // Final check: if any connections still don't have names, log error but continue
      const finalMissing = acceptedWithNames.filter(r => !r.talent_name || !r.talent_name.trim())
      if (finalMissing.length > 0) {
        console.error('[Business Connections] ⚠⚠⚠ FINAL WARNING:', finalMissing.length, 'connections still missing names after ALL attempts:', finalMissing.map(r => ({ id: r.talent_id, name: r.talent_name })))
        // These will show "Loading name..." in the UI until we can reload and fetch them
        // TODO: Add auto-reload mechanism or useEffect to retry fetching names
      }
      
      console.log('[Business Connections] Final accepted connections with names:', acceptedWithNames.map(r => ({ id: r.talent_id, name: r.talent_name || 'MISSING' })))
      
      // Add talent names to declined connections (same logic as accepted)
      const declinedWithNames = declinedReqs.map((r) => {
        const talentIdStr = String(r.talent_id)
        const talentName = talentNameMap[talentIdStr]
        return {
          ...r,
          talent_name: (talentName && talentName.trim()) || null
        }
      })

      // Add talent names to withdrawn/discontinued connections (previous connections)
      const withdrawnWithNames = withdrawnReqs.map((r) => {
        const talentIdStr = String(r.talent_id)
        const talentName = talentNameMap[talentIdStr]
        return {
          ...r,
          talent_name: (talentName && talentName.trim()) || null
        }
      })

      // Add talent names to pending requests from talent
      const pendingFromTalentWithNames = pendingFromTalent.map((r) => {
        const talentIdStr = String(r.talent_id)
        const talentName = talentNameMap[talentIdStr]
        return {
          ...r,
          talent_name: (talentName && talentName.trim()) || null
        }
      })

      // Add talent names to pending requests from business
      const pendingFromBusinessWithNames = pendingFromBusiness.map((r) => {
        const talentIdStr = String(r.talent_id)
        const talentName = talentNameMap[talentIdStr]
        return {
          ...r,
          talent_name: (talentName && talentName.trim()) || null
        }
      })

      // Add talent names to reconnection requests
      const pendingReconnectWithNames = pendingReconnect.map((r) => {
        const talentIdStr = String(r.talent_id)
        const talentName = talentNameMap[talentIdStr]
        return {
          ...r,
          talent_name: (talentName && talentName.trim()) || null
        }
      })

      setConnRequestsFromTalent(pendingFromTalentWithNames)
      setConnRequestsFromBusiness(pendingFromBusinessWithNames)
      setConnReconnectRequests(pendingReconnectWithNames)
      setConnAccepted(acceptedWithNames)
      setConnDeclined(declinedWithNames)
      setConnWithdrawn(withdrawnWithNames)
      setConnLoading(false)
  }

  async function ensureConversation(talentId: string, businessId: string) {
    const existing = await supabase
      .from('conversations')
      .select('id')
      .eq('talent_id', talentId)
      .eq('business_id', businessId)
      .maybeSingle()
    if (!existing.error && (existing.data as any)?.id) return String((existing.data as any).id)

    const created = await supabase
      .from('conversations')
      .insert({ talent_id: talentId, business_id: businessId })
      .select('id')
      .single()
    if (!created.error && (created.data as any)?.id) return String((created.data as any).id)

    const again = await supabase
      .from('conversations')
      .select('id')
      .eq('talent_id', talentId)
      .eq('business_id', businessId)
      .maybeSingle()
    return (again.data as any)?.id ? String((again.data as any).id) : null
  }

  async function loadConsentRequests() {
    setConsentLoading(true)
    setConsentError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setConsentError('Please sign in to manage consent requests.')
        setConsentReqs([])
        return
      }

      const businessRes = await supabase.from('business_profiles').select('id').eq('user_id', uid).single()
      if (businessRes.error || !businessRes.data?.id) {
        setConsentError('No business profile found for this user.')
        setConsentReqs([])
        return
      }
      const businessId = String(businessRes.data.id)

      // For business, we would load consent requests they've made to talents
      // This is a placeholder - adjust based on actual schema
      setConsentReqs([])
    } finally {
      setConsentLoading(false)
    }
  }

  const loadServiceConnections = async () => {
    setServiceLoading(true)
    setServiceError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setServiceError('Please sign in to view business connections.')
        setServiceConnections([])
        return
      }

      const businessRes = await supabase.from('business_profiles').select('id').eq('user_id', uid).single()
      if (businessRes.error || !businessRes.data?.id) {
        setServiceError('No business profile found for this user.')
        setServiceConnections([])
        return
      }
      const businessId = String(businessRes.data.id)

      const convRes = await supabase
        .from('conversations')
        .select('id,talent_id,created_at,updated_at')
        .eq('business_id', businessId)
      if (convRes.error) {
        setServiceError('Failed to load conversations.')
        setServiceConnections([])
        return
      }
      const conversations = (convRes.data || []) as any[]
      const convIds = conversations.map((c) => c.id).filter(Boolean)
      if (convIds.length === 0) {
        setServiceConnections([])
        return
      }

      const msgRes = await supabase
        .from('messages')
        .select('id,conversation_id,body,created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(200)
      const messages = (msgRes.data || []) as any[]
      const latestByConv = new Map<string, any>()
      for (const m of messages) {
        if (!latestByConv.has(String(m.conversation_id))) {
          latestByConv.set(String(m.conversation_id), m)
        }
      }

      const convWithMsgs = conversations.filter((c) => latestByConv.has(String(c.id)))
      const talentIds = Array.from(new Set(convWithMsgs.map((c) => c.talent_id).filter(Boolean))).map(String)
      let nameMap: Record<string, string> = {}
      if (talentIds.length > 0) {
        const sel = 'id,name,full_name,display_name'
        const res = await supabase.from('talent_profiles').select(sel).in('id', talentIds)
        if (!res.error && res.data) {
          for (const t of res.data as any[]) {
            const name = t.name || t.full_name || t.display_name || 'Talent'
            nameMap[String(t.id)] = name
          }
        }
      }

      const rows = convWithMsgs.map((c) => {
        const latest = latestByConv.get(String(c.id))
        return {
          talent_id: String(c.talent_id),
          conversation_id: String(c.id),
          talent_name: nameMap[String(c.talent_id)] || 'Talent',
          last_message: latest?.body || '',
          last_at: latest?.created_at || c.updated_at || c.created_at || new Date().toISOString(),
        }
      })
      setServiceConnections(rows)
      setMsgTalents(rows.map((r) => ({ id: r.talent_id, name: r.talent_name })))
    } finally {
      setServiceLoading(false)
    }
  }

  async function respondConsent(req: any, nextStatus: 'approved' | 'denied') {
    // Placeholder - implement based on business consent flow
  }

  // Load reconnection requests from talents (business notifications)
  async function loadReconnectRequests() {
    setReconnectLoading(true)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setReconnectRequests([])
        return
      }

      const businessRes = await supabase.from('business_profiles').select('id').eq('user_id', uid).single()
      if (businessRes.error || !businessRes.data?.id) {
        setReconnectRequests([])
        return
      }
      const businessId = String(businessRes.data.id)

      // Load business notifications of type 'reconnect_request'
      const notifRes = await supabase
        .from('business_notifications')
        .select('id, talent_id, connection_request_id, notification_type, title, message, is_read, created_at, metadata')
        .eq('business_id', businessId)
        .eq('notification_type', 'reconnect_request')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (notifRes.error) {
        // Table might not exist yet - Supabase returns 404 with PGRST116 or 42P01 for missing tables
        // Also check for "does not exist" or "not found" in message
        const isTableMissing =
          notifRes.error.code === 'PGRST116' ||
          notifRes.error.code === '42P01' ||
          /relation .* does not exist|Could not find|not found/i.test(notifRes.error.message)

        if (isTableMissing) {
          console.log('[Business Reconnect] Table not found - feature not yet set up')
          setReconnectRequests([])
          return
        }
        console.error('[Business Reconnect] Error loading:', notifRes.error)
        setReconnectRequests([])
        return
      }

      const rows = (notifRes.data || []) as any[]

      // Get talent names for reconnect requests
      const talentIds = Array.from(new Set(rows.map((r) => r.talent_id).filter(Boolean)))
      let nameMap: Record<string, string> = {}
      if (talentIds.length > 0) {
        const nameRes = await supabase
          .from('talent_profiles')
          .select('id, name, title')
          .in('id', talentIds)
        if (!nameRes.error && nameRes.data) {
          for (const tp of nameRes.data as any[]) {
            nameMap[String(tp.id)] = tp.name || tp.title || 'Talent'
          }
        }
      }

      setReconnectRequests(rows.map((r) => ({
        ...r,
        talent_name: nameMap[String(r.talent_id)] || r.metadata?.talent_name || 'Talent'
      })))
    } finally {
      setReconnectLoading(false)
    }
  }

  // Accept a reconnection request
  async function acceptReconnect(notif: any) {
    if (!notif?.connection_request_id) return
    setAcceptingReconnect(notif.id)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const accessToken = sessionRes?.session?.access_token
      if (!accessToken) {
        alert('Please sign in to accept reconnection requests.')
        return
      }

      const response = await fetch('/api/connections/accept-reconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          connection_request_id: notif.connection_request_id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Connection restored with ${data.talent_name || 'talent'}! Previous messages and history are now available.`)
        // Reload connections and reconnect requests
        await Promise.all([loadConnections(), loadReconnectRequests()])
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.message || 'Failed to accept reconnection')
      }
    } catch (err: any) {
      console.error('Error accepting reconnection:', err)
      alert(err.message || 'Failed to accept reconnection request. Please try again.')
    } finally {
      setAcceptingReconnect(null)
    }
  }

  useEffect(() => {
    if (activeTab !== 'connections') return
    // Auto-load connections when connections tab becomes active
    // Always reload to ensure data is fresh when switching to this tab
    loadConnections().catch(() => {})
    // Auto-load consent requests (only once per session)
    if (!didAutoLoadConsentRef.current) {
      didAutoLoadConsentRef.current = true
      loadConsentRequests().catch(() => {})
    }
    // Auto-load reconnection requests (only once per session)
    if (!didAutoLoadReconnectRef.current) {
      didAutoLoadReconnectRef.current = true
      loadReconnectRequests().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Redirect to /dashboard/business/view when portfolio tab is active (same as purple View Profile button)
  useEffect(() => {
    if (activeTab === 'portfolio') {
      router.push('/dashboard/business/view')
    }
  }, [activeTab, router])

  const loadMessaging = async () => {
    setMsgLoading(true)
    setMsgError(null)
    try {
      const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()
      const hasSession = !!sessionRes?.session?.user?.id

      if (!hasEnv) {
        setMsgError('Messaging is not configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).')
        return
      }
      if (sessionErr || !sessionRes.session) {
        setMsgError('Please sign in to use Messages.')
        return
      }

      const authedUserId = sessionRes.session.user.id

      const businessRes = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', authedUserId)
        .single()

      if (businessRes.error || !businessRes.data?.id) {
        setMsgError('Messaging is unavailable (no business profile for this signed-in user, or schema mismatch).')
        return
      }

      const businessId = businessRes.data.id as string

      // Only show connected talents: accepted connection requests
      const grantsRes = await supabase
        .from('talent_connection_requests')
        .select('talent_id, status, responded_at')
        .eq('business_id', businessId)
        .eq('status', 'accepted')

      if (grantsRes.error) {
        setMsgError('Could not load connections for messaging (permissions or schema issue).')
        return
      }

      const talentIds = Array.from(new Set((grantsRes.data || []).map((g: any) => g.talent_id).filter(Boolean)))
      if (talentIds.length === 0) {
        setMsgTalents([])
        setMsgSelectedTalentId(null)
        setMsgConversationId(null)
        setMsgItems([])
        return
      }

      // talent_profiles "name" column varies across environments; attempt fallbacks without leaking data.
      // Try to get all possible name fields in one query
      const nameSelectors = ['id, name, full_name, display_name']
      let talentRows: Array<{ id: string; name: string | null }> | null = null
      let lastTalentErr: any = null

      for (const sel of nameSelectors) {
        const attempt = await supabase.from('talent_profiles').select(sel).in('id', talentIds)
        if (!attempt.error) {
          const mapped = (attempt.data || []).map((r: any) => {
            const n =
              (typeof r.name === 'string' && r.name.trim()) ||
              (typeof r.full_name === 'string' && r.full_name.trim()) ||
              (typeof r.display_name === 'string' && r.display_name.trim()) ||
              'Talent'
            return { id: r.id, name: n }
          })
          talentRows = mapped
          break
        }
        lastTalentErr = attempt.error
      }
      
      // Fallback: if the above query fails, try individual queries
      if (!talentRows) {
        const fallbackSelectors = ['id, name', 'id, full_name', 'id, display_name']
        for (const sel of fallbackSelectors) {
          const attempt = await supabase.from('talent_profiles').select(sel).in('id', talentIds)
          if (!attempt.error) {
            const mapped = (attempt.data || []).map((r: any) => {
              const n =
                (typeof r.name === 'string' && r.name.trim()) ||
                (typeof r.full_name === 'string' && r.full_name.trim()) ||
                (typeof r.display_name === 'string' && r.display_name.trim()) ||
                'Talent'
              return { id: r.id, name: n }
            })
            talentRows = mapped
            break
          }
          lastTalentErr = attempt.error
        }
      }

      if (!talentRows) {
        setMsgError('Could not load talent names (schema/RLS issue).')
        return
      }

      setMsgTalents(talentRows)
    } finally {
      setMsgLoading(false)
    }
  }

  const loadConversation = async (talentId: string) => {
    setMsgSelectedTalentId(talentId)
    setMsgLoading(true)
    setMsgError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      if (!sessionRes?.session?.user?.id) {
        setMsgError('Please sign in to use Messages.')
        return
      }
      const authedUserId = sessionRes.session.user.id
      const businessRes = await supabase.from('business_profiles').select('id').eq('user_id', authedUserId).single()
      if (businessRes.error || !businessRes.data?.id) {
        setMsgError('Messaging is unavailable (no business profile for this signed-in user).')
        return
      }
      const businessId = businessRes.data.id as string

      if (!isServiceConnections) {
        // Permission gate: accepted connection request must exist to show or send messages
        const gateRes = await supabase
          .from('talent_connection_requests')
          .select('id, status, responded_at')
          .eq('talent_id', talentId)
          .eq('business_id', businessId)
          .eq('status', 'accepted')
          .order('responded_at', { ascending: false })
          .limit(1)

        const gate = (gateRes.data || [])[0]
        if (!gate || gate.status !== 'accepted') {
          setMsgConversationId(null)
          setMsgItems([])
          setMsgError('Connection not accepted. Please accept the connection request first.')
          return
        }
      }

      // Find existing conversation (lazy creation on first send)
      const convRes = await supabase
        .from('conversations')
        .select('id')
        .eq('talent_id', talentId)
        .eq('business_id', businessId)
        .maybeSingle()

      if (convRes.error) {
        setMsgError('Could not load conversation (missing tables or permissions).')
        return
      }

      const convId = (convRes.data as any)?.id || null
      setMsgConversationId(convId)

      if (!convId) {
        setMsgItems([])
        return
      }

      const msgRes = await supabase
        .from('messages')
        .select('id, sender_type, body, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (msgRes.error) {
        setMsgError('Could not load messages (permissions or schema issue).')
        return
      }

      setMsgItems((msgRes.data || []) as any)
      try {
        const key = `msg_last_seen_${convId}`
        localStorage.setItem(key, String(Date.now()))
      } catch {
        // ignore
      }
    } finally {
      setMsgLoading(false)
    }
  }

  const sendMessage = async () => {
    const body = msgBody.trim()
    if (!body || !msgSelectedTalentId) return
    setMsgLoading(true)
    setMsgError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      if (!sessionRes?.session?.user?.id) {
        setMsgError('Please sign in to use Messages.')
        return
      }
      const authedUserId = sessionRes.session.user.id
      const businessRes = await supabase.from('business_profiles').select('id').eq('user_id', authedUserId).single()
      if (businessRes.error || !businessRes.data?.id) {
        setMsgError('Messaging is unavailable (no business profile for this signed-in user).')
        return
      }
      const businessId = businessRes.data.id as string
      const talentId = msgSelectedTalentId

      if (!isServiceConnections) {
        // Permission gate (again, before write) - check for accepted connection
        const gateRes = await supabase
          .from('talent_connection_requests')
          .select('id, status')
          .eq('talent_id', talentId)
          .eq('business_id', businessId)
          .eq('status', 'accepted')
          .limit(1)

        if ((gateRes.data || []).length === 0) {
          setMsgError('Connection not accepted. Please accept the connection request first.')
          return
        }
      }

      let convId = msgConversationId
      if (!convId) {
        const createRes = await supabase
          .from('conversations')
          .insert({ talent_id: talentId, business_id: businessId })
          .select('id')
          .single()

        if (createRes.error) {
          // If unique constraint hit, load existing
          const existingRes = await supabase
            .from('conversations')
            .select('id')
            .eq('talent_id', talentId)
            .eq('business_id', businessId)
            .maybeSingle()
          if (existingRes.error || !(existingRes.data as any)?.id) {
            setMsgError('Could not start conversation (permissions or schema issue).')
            return
          }
          convId = (existingRes.data as any).id
        } else {
          convId = (createRes.data as any)?.id || null
        }

        setMsgConversationId(convId)
      }

      if (!convId) {
        setMsgError('Could not start conversation.')
        return
      }

      const insertRes = await supabase
        .from('messages')
        .insert({ conversation_id: convId, sender_type: 'business', sender_user_id: authedUserId, body })

      if (insertRes.error) {
        setMsgError('Could not send message (permissions or schema issue).')
        return
      }

      setMsgBody('')
      await loadConversation(talentId)
    } finally {
      setMsgLoading(false)
    }
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    if (!businessProfile) return 0
    
    const fields = [
      businessProfile.business_name || businessProfile.name,
      businessProfile.description,
      businessProfile.industry,
      businessProfile.website,
      businessProfile.location || (businessProfile.city && businessProfile.country),
      businessProfile.logo_url
    ]
    
    const completedFields = fields.filter(Boolean).length
    return Math.round((completedFields / fields.length) * 100)
  }

  const handleLogout = () => {
    // Logout removed - just navigate home
    router.push('/')
  }

  const handleDeleteRegistration = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your Business account? This action cannot be undone. All your profile data, jobs, and connections will be permanently deleted.'
    )
    
    if (!confirmed) return

    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const userId = sessionRes.session?.user?.id
      if (!userId) {
        alert('No active session found.')
        return
      }

      // Delete business profile first
      const { error: profileError } = await supabase
        .from('business_profiles')
        .delete()
        .eq('user_id', userId)

      if (profileError) {
        console.error('Error deleting business profile:', profileError)
        // Continue anyway - profile might not exist
      }

      // Delete auth account via backend API (requires admin privileges)
      // This MUST succeed - if it fails, the user can still log in
      const accessToken = sessionRes.session?.access_token
      if (!accessToken) {
        alert('Failed to delete account: missing access token. Please sign in again.')
        return
      }
      
      let deleteResponse
      try {
        deleteResponse = await fetch('/api/auth/delete-account', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ user_id: userId }),
        })
      } catch (fetchError: any) {
        alert(`Failed to delete account: ${fetchError?.message || 'Failed to fetch'}. Please contact support.`)
        return
      }
      
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json().catch(() => ({}))
        const errorMsg = errorData?.detail || errorData?.message || 'Unknown error'
        console.error('Error deleting auth account:', errorData)
        alert(`Failed to delete account: ${errorMsg}. The account may still exist. Please contact support.`)
        return // Don't continue - deletion failed
      }
      
      const deleteResult = await deleteResponse.json().catch(() => ({}))
      if (!deleteResult.success) {
        alert(`Account deletion may have failed: ${deleteResult.message || 'Unknown error'}. Please contact support.`)
        return
      }

      // Clear localStorage
      localStorage.removeItem('creerlio_active_role')
      localStorage.removeItem('user_type')
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_email')

      // Sign out
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        // Ignore signOut errors - account is being deleted
        console.log('Sign out attempted')
      }

      // Redirect to home
      router.replace('/')
      
      alert('Your Business account has been deleted successfully.')
    } catch (error: any) {
      console.error('Error deleting registration:', error)
      alert(`Failed to delete account: ${error?.message || 'Unknown error'}. Please contact support.`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#20C997] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black border-0">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="px-4 py-2 rounded-full bg-[#20C997] text-white text-base font-bold">
              C
            </div>
            <span className="text-white text-2xl font-bold">Creerlio</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-white">Welcome, {userFirstName || user?.full_name || user?.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-white hover:text-[#20C997] transition-colors text-left"
            >
              Logout
            </button>
            <button
              onClick={handleDeleteRegistration}
              className="px-4 py-2 text-white hover:text-red-500 transition-colors text-left"
            >
              Delete Registration
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
          <p className="text-gray-600">Manage your profile, jobs, and talent connections</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {(['overview', 'vacancies', 'portfolio', 'applications', 'connections', 'service_connections'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? 'text-[#20C997]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'connections'
                  ? 'Talent Connections'
                  : tab === 'service_connections'
                    ? 'Business Connections'
                    : tab === 'portfolio'
                      ? 'View Profile'
                      : tab === 'vacancies'
                        ? 'Vacancies'
                        : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#20C997]"></span>
                )}
              </button>
            ))}
            <Link
              href="/dashboard/business/bank"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-[#20C997] transition-colors"
            >
              Business Bank ↗
            </Link>
            <Link
              href="/business-map"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-[#20C997] transition-colors"
            >
              Business Map ↗
            </Link>
            <Link
              href="/dashboard/business/edit"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-[#20C997] transition-colors"
            >
              Profile Templates ↗
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Stats Card */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Statistics</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm">Profile Views</p>
                    <p className="text-3xl font-bold text-[#20C997]">0</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Job Postings</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('vacancies')}
                      className="text-left"
                      title="Open Vacancies"
                    >
                      <p className="text-3xl font-bold text-green-600">{Array.isArray(vacancies) ? vacancies.length : 0}</p>
                    </button>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Connections</p>
                    <p className="text-3xl font-bold text-purple-600">0</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {!hasBuiltProfile && (
                    <Link
                      href="/dashboard/business/edit"
                      className="block px-4 py-3 bg-[#20C997] border-2 border-[#20C997] rounded-lg text-white hover:bg-[#1DB886] transition-colors font-semibold text-center"
                    >
                      🏢 Build Your Profile
                    </Link>
                  )}
                  <Link
                    href="/dashboard/business/edit"
                    className={`block px-4 py-3 ${hasBuiltProfile ? 'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}
                  >
                    {hasBuiltProfile ? 'Edit Profile' : 'Build Profile'}
                  </Link>
                  <Link
                    href="/dashboard/business/jobs/create"
                    className="block px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Post Job
                  </Link>
                  <Link
                    href="/dashboard/business/bank"
                    className="block px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Business Bank
                  </Link>
                  {hasBuiltProfile && (
                    <Link
                      href="/dashboard/business/view"
                      className="block px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      View Profile
                    </Link>
                  )}
                  <Link
                    href="/search"
                    className="block px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Search Talent & Jobs
                  </Link>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Summary</h2>
                {user && (
                  <div className="space-y-2">
                    <p className="text-gray-700"><span className="text-gray-600">Name:</span> {businessProfile?.business_name || businessProfile?.name || user.full_name || user.username}</p>
                    <p className="text-gray-700"><span className="text-gray-600">Email:</span> {user.email}</p>
                    {businessProfile?.industry && (
                      <p className="text-gray-700"><span className="text-gray-600">Industry:</span> {businessProfile.industry}</p>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-600 text-sm">Profile Completion</p>
                        <span className="text-[#20C997] font-semibold text-sm">{calculateProfileCompletion()}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#20C997] h-2 rounded-full transition-all"
                            style={{ width: `${calculateProfileCompletion()}%` }}
                            title={`Profile is ${calculateProfileCompletion()}% complete`}
                          ></div>
                        </div>
                      </div>
                      {calculateProfileCompletion() < 100 && (
                        <p className="text-gray-500 text-xs mt-2">
                          Complete your profile to attract more talent
                        </p>
                      )}
                      <div className="flex gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => setActiveTab('profile')}
                          className="flex-1 px-4 py-2 bg-[#20C997] hover:bg-[#1DB886] text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Edit Profile
                        </button>
                        <Link
                          href={`/dashboard/business/view`}
                          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors text-center"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Profile Section */}
            {!hasBuiltProfile ? (
              <div className="dashboard-card rounded-xl p-6 border-2 border-[#20C997] bg-blue-50">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Build Your Business Profile</h2>
                    <p className="text-gray-700 mb-4">
                      Create a professional profile to showcase your business, attract talent, and post job vacancies. 
                      Your profile will be visible to talent searching for opportunities.
                    </p>
                    <p className="text-gray-600 text-sm mb-6">
                      Add your business information, upload images, create an introduction video, and customize your profile layout.
                    </p>
                    <Link
                      href="/dashboard/business/edit"
                      className="inline-block px-8 py-4 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors font-semibold text-lg"
                    >
                      Build Your Profile →
                    </Link>
                  </div>
                  <div className="text-6xl">🏢</div>
                </div>
              </div>
            ) : businessProfile ? (
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Profile</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Industry</h3>
                    <p className="text-gray-700">{businessProfile.industry || 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                    <p className="text-gray-700">{businessProfile.location || businessProfile.city || 'Not set'}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link
                    href="/dashboard/business/edit"
                    className="inline-block px-6 py-3 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors mr-3"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/dashboard/business/view"
                    className="inline-block px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ) : (
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Business Profile</h2>
                <p className="text-gray-600 mb-4">Complete your profile to start attracting talent</p>
                <Link
                  href="/dashboard/business/edit"
                  className="inline-block px-6 py-3 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors"
                >
                  Create Profile
                </Link>
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h2>
            {user && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                  {user.full_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Business Name</label>
                      <p className="text-gray-900">{user.full_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">User Type</label>
                    <p className="text-gray-900 capitalize">{user.user_type}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href="/dashboard/business/edit"
                    className="inline-block px-6 py-3 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="dashboard-card rounded-xl p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#20C997] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Redirecting to profile view...</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vacancies' && (
          <div className="dashboard-card rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vacancies</h2>
                <p className="text-gray-600 text-sm">
                  Your posted job vacancies. Post a job to make it visible here (and on the Jobs page).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/business/jobs/create"
                  className="px-4 py-2 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors"
                >
                  Post a Job
                </Link>
                <button
                  type="button"
                  onClick={() => loadVacancies({ force: true })}
                  disabled={vacanciesLoading}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>
            </div>

            {vacanciesError && (
              <div className="mb-4 border border-red-300 bg-red-50 text-red-700 rounded-lg p-4">
                {vacanciesError}
              </div>
            )}

            {vacanciesLoading ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 border-4 border-[#20C997] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading vacancies…</p>
              </div>
            ) : Array.isArray(vacancies) && vacancies.length > 0 ? (
              <div className="space-y-4">
                {vacancies.map((job: any) => {
                  const title = String(job?.title || 'Job')
                  const status = String(job?.status || 'draft')
                  const isActive = job?.is_active == null ? null : Boolean(job?.is_active)
                  const created = job?.created_at ? new Date(String(job.created_at)).toLocaleString() : null
                  const loc =
                    String(job?.location || '').trim() ||
                    [job?.city, job?.state, job?.country].filter(Boolean).join(', ') ||
                    null

                  const badge =
                    status === 'published'
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'

                  return (
                    <div
                      key={String(job?.id ?? title)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badge}`}>
                              {status.toUpperCase()}
                            </span>
                            {isActive === false ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-600">
                                INACTIVE
                              </span>
                            ) : null}
                          </div>
                          {loc ? <p className="text-gray-600 text-sm mt-1">📍 {loc}</p> : null}
                          {created ? <p className="text-gray-500 text-xs mt-2">Created: {created}</p> : null}
                          {(job?.application_email || job?.application_url) ? (
                            <div className="mt-3 text-sm text-gray-700 space-y-1">
                              {job?.application_email ? (
                                <div>
                                  <span className="text-gray-500">Application Email:</span> {String(job.application_email)}
                                </div>
                              ) : null}
                              {job?.application_url ? (
                                <div className="break-all">
                                  <span className="text-gray-500">Application URL:</span>{' '}
                                  <a
                                    className="text-blue-600 hover:text-blue-700 underline"
                                    href={String(job.application_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {String(job.application_url)}
                                  </a>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm text-center"
                          >
                            View
                          </Link>
                          <Link
                            href={`/dashboard/business/jobs/edit/${job.id}`}
                            className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm text-center"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to cancel "${title}"? This action cannot be undone.`)) return
                              try {
                                const { error } = await supabase
                                  .from('jobs')
                                  .update({ status: 'cancelled', is_active: false })
                                  .eq('id', job.id)
                                if (error) throw error
                                alert('Job cancelled successfully.')
                                loadVacancies({ force: true })
                              } catch (err: any) {
                                console.error('Error cancelling job:', err)
                                alert(err.message || 'Failed to cancel job. Please try again.')
                              }
                            }}
                            className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm text-center"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-700 font-medium mb-2">No vacancies yet</p>
                <p className="text-gray-500 text-sm mb-5">
                  Post your first job vacancy so talent can discover it.
                </p>
                <Link
                  href="/dashboard/business/jobs/create"
                  className="inline-block px-6 py-3 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors"
                >
                  Post a Job
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Applications</h2>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{app.job_title || 'Job'}</h3>
                        {app.job_location && (
                          <p className="text-gray-600 text-sm mb-2">📍 {app.job_location}</p>
                        )}
                        <p className="text-gray-500 text-sm">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          app.status === 'applied' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          app.status === 'shortlisted' ? 'bg-green-50 text-green-600 border-green-200' :
                          app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                          app.status === 'hired' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No applications yet</p>
                <Link
                  href="/dashboard/business/jobs/create"
                  className="inline-block px-6 py-3 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors"
                >
                  Post Job
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="dashboard-card rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Talent Connections</h2>
                <p className="text-gray-600 text-sm">
                  Manage connection requests from talent. Messaging unlocks only after acceptance.
                </p>
              </div>
              <div className="flex items-center gap-2">
              <button
                onClick={() => loadConnections()}
                className="px-4 py-2 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors disabled:opacity-60"
                disabled={connLoading}
              >
                Refresh connections
              </button>
                <button
                  onClick={() => loadConsentRequests()}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60"
                  disabled={consentLoading}
                >
                  Refresh consent
                </button>
              </div>
            </div>

            {connError && (
              <div className="mb-4 border border-red-300 bg-red-50 text-red-700 rounded-lg p-4">
                {connError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-gray-900 font-semibold mb-3">Print / export consent requests</h3>
                <p className="text-gray-500 text-xs mb-3">
                  Talent cannot print/export your content via in-app controls unless you approve here. Screenshots can't be fully prevented on the web, but we record consent decisions.
                </p>
                {consentError ? (
                  <div className="mb-3 border border-red-300 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                    {consentError}
                  </div>
                ) : null}
                {consentLoading ? (
                  <p className="text-gray-600">Loading consent requests…</p>
                ) : (
                  <>
                    {consentReqs.filter((r) => r.status === 'pending').length === 0 ? (
                      <p className="text-gray-600">No pending consent requests.</p>
                    ) : (
                      <div className="space-y-3">
                        {consentReqs
                          .filter((r) => r.status === 'pending')
                          .map((r) => (
                            <div key={r.id} className="border border-gray-200 rounded-lg p-3">
                              <p className="text-gray-900 text-sm font-medium">
                              {r.talent_name && r.talent_name.trim() ? (
                                r.talent_name
                              ) : (
                                <span className="text-yellow-600 italic animate-pulse">Loading name...</span>
                              )}
                            </p>
                              <p className="text-gray-500 text-xs mt-1">Requested {new Date(r.requested_at).toLocaleString()}</p>
                              {r.request_reason ? (
                                <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap">{r.request_reason}</p>
                              ) : (
                                <p className="text-gray-500 text-sm mt-2">No reason provided.</p>
                              )}
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={consentBusyId === r.id}
                                  onClick={() => respondConsent(r, 'approved')}
                                  className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={consentBusyId === r.id}
                                  onClick={() => respondConsent(r, 'denied')}
                                  className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 disabled:opacity-60"
                                >
                                  Deny
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Reconnection Requests from Previous Connections */}
              {reconnectRequests.length > 0 && (
                <div className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    <h3 className="text-amber-900 font-semibold">Reconnection Requests</h3>
                    <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                      {reconnectRequests.length} pending
                    </span>
                  </div>
                  <p className="text-amber-800 text-xs mb-4">
                    These talents were previously connected with you and are requesting to reconnect.
                    Accepting will restore the connection along with all previous messages and video chat history.
                  </p>
                  <div className="space-y-3">
                    {reconnectRequests.map((notif) => (
                      <div
                        key={notif.id}
                        className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{notif.talent_name}</p>
                            <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                            <p className="text-amber-600 text-xs mt-2">
                              Requested {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => acceptReconnect(notif)}
                              disabled={acceptingReconnect === notif.id}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-60"
                            >
                              {acceptingReconnect === notif.id ? 'Accepting...' : 'Accept & Restore'}
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(`/portfolio/view?talent_id=${notif.talent_id}&request_id=${notif.connection_request_id}`)}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                            >
                              View Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connection Requests FROM Talent - Full portfolio access */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="text-gray-900 font-semibold">Connection Requests from Talent</h3>
                </div>
                <p className="text-gray-500 text-xs mb-3">
                  Talents who reached out to connect with you. View their full shared portfolio.
                </p>
                {connLoading ? (
                  <p className="text-gray-600">Loading connections…</p>
                ) : connRequestsFromTalent.length === 0 ? (
                  <p className="text-gray-600">No requests from talents yet.</p>
                ) : (
                  <div className="space-y-3">
                    {connRequestsFromTalent.map((r) => (
                      <Link
                        key={r.id}
                        href={`/portfolio/view?talent_id=${r.talent_id}&request_id=${r.id}`}
                        className="block border border-green-200 bg-green-50/30 rounded-lg p-3 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 text-sm font-medium">
                              {r.talent_name || 'Talent'}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              Requested {new Date(r.created_at).toLocaleString()}
                            </p>
                            {r.selected_sections && Array.isArray(r.selected_sections) && r.selected_sections.length > 0 && (
                              <p className="text-green-600 text-xs mt-1">
                                Sharing: {r.selected_sections.slice(0, 3).join(', ')}{r.selected_sections.length > 3 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <span className="text-green-600 text-sm font-medium">View Full Portfolio →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Connection Requests FROM Business - Only profile summary access */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-gray-900 font-semibold">Your Outreach Requests</h3>
                </div>
                <p className="text-gray-500 text-xs mb-3">
                  Talents you reached out to via search. You can only view their public profile summary until they accept.
                </p>
                {connLoading ? (
                  <p className="text-gray-600">Loading connections…</p>
                ) : connRequestsFromBusiness.length === 0 ? (
                  <p className="text-gray-600">No outreach requests pending.</p>
                ) : (
                  <div className="space-y-3">
                    {connRequestsFromBusiness.map((r) => (
                      <div
                        key={r.id}
                        className="border border-blue-200 bg-blue-50/30 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 text-sm font-medium">
                              {r.talent_name || 'Talent'}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              Requested {new Date(r.created_at).toLocaleString()}
                            </p>
                            <p className="text-blue-600 text-xs mt-1">
                              Awaiting talent's response
                            </p>
                          </div>
                          <span className="text-blue-500 text-xs px-2 py-1 bg-blue-100 rounded">Pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reconnection Requests - Show based on who initiated */}
              {connReconnectRequests.length > 0 && (
                <div className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    <h3 className="text-amber-900 font-semibold">Reconnection Requests</h3>
                    <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                      {connReconnectRequests.length} pending
                    </span>
                  </div>
                  <p className="text-amber-800 text-xs mb-4">
                    These are requests to reconnect from previous connections. If the talent initiated, you can view their full portfolio and message history.
                  </p>
                  <div className="space-y-3">
                    {connReconnectRequests.map((r) => {
                      const isFromTalent = r.reconnect_requested_by === 'talent'
                      return (
                        <div
                          key={r.id}
                          className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-gray-900 font-medium">{r.talent_name || 'Talent'}</p>
                                <span className={`text-xs px-2 py-0.5 rounded ${isFromTalent ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {isFromTalent ? 'Talent requested' : 'You requested'}
                                </span>
                              </div>
                              {r.reconnect_message && (
                                <p className="text-gray-600 text-sm mt-2 italic">"{r.reconnect_message}"</p>
                              )}
                              <p className="text-amber-600 text-xs mt-2">
                                Requested {new Date(r.responded_at || r.created_at).toLocaleString()}
                              </p>
                              {isFromTalent && r.selected_sections && Array.isArray(r.selected_sections) && r.selected_sections.length > 0 && (
                                <p className="text-green-600 text-xs mt-1">
                                  Will share: {r.selected_sections.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              {isFromTalent ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!confirm('Accept this reconnection request? This will restore the connection and all previous message history.')) return
                                      try {
                                        const { error } = await supabase
                                          .from('talent_connection_requests')
                                          .update({ status: 'accepted', responded_at: new Date().toISOString() })
                                          .eq('id', r.id)
                                        if (error) throw error
                                        alert('Connection restored! You can now message this talent and view their portfolio.')
                                        loadConnections()
                                      } catch (err: any) {
                                        alert(err.message || 'Failed to accept reconnection')
                                      }
                                    }}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-semibold transition-colors"
                                  >
                                    Accept & Restore
                                  </button>
                                  <Link
                                    href={`/portfolio/view?talent_id=${r.talent_id}&request_id=${r.id}&reconnect=true`}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg text-center transition-colors"
                                  >
                                    View Portfolio & History
                                  </Link>
                                </>
                              ) : (
                                <span className="text-amber-600 text-sm">Awaiting talent's response</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Declined Connection Requests */}
              {connDeclined.length > 0 && (
                <div className="border border-gray-800 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-white font-semibold mb-3">Declined Connection Requests</h3>
                  <p className="text-gray-400 text-xs mb-3">
                    These talents have declined your connection requests. They have 30 days to reconsider should their circumstances change.
                  </p>
                  <div className="space-y-3">
                    {connDeclined.map((r) => {
                      const respondedAt = r.responded_at ? new Date(r.responded_at) : new Date(r.created_at)
                      const now = new Date()
                      const daysSinceDeclined = Math.floor((now.getTime() - respondedAt.getTime()) / (1000 * 60 * 60 * 24))
                      const daysRemaining = Math.max(0, 30 - daysSinceDeclined)
                      
                      return (
                        <div
                          key={r.id}
                          className="border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-200 text-sm font-medium">
                                {r.talent_name && r.talent_name.trim() ? (
                                  r.talent_name
                                ) : (
                                  <span className="text-yellow-400 italic animate-pulse">Loading name...</span>
                                )}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                Declined {respondedAt.toLocaleString()}
                              </p>
                              {daysRemaining > 0 ? (
                                <p className="text-orange-400 text-xs mt-1">
                                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining to reconsider
                                </p>
                              ) : (
                                <p className="text-red-400 text-xs mt-1">
                                  Expired - request will be deleted soon
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="border border-gray-800 rounded-lg p-4 md:col-span-2">
                <h3 className="text-white font-semibold mb-3">Talent Connections</h3>
                {connLoading ? (
                  <p className="text-gray-400">Loading connections…</p>
                ) : connAccepted.length === 0 ? (
                  <p className="text-gray-400">No accepted connections yet.</p>
                ) : (
                  <div className="space-y-3">
                    {connAccepted.map((r) => (
                      <div
                        key={r.id}
                        className="border border-gray-800 rounded-lg p-3 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-gray-200 text-sm font-medium">
                              {r.talent_name && r.talent_name.trim() ? (
                                r.talent_name
                              ) : (
                                <span className="text-yellow-400 italic animate-pulse">Loading name...</span>
                              )}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              Accepted {r.responded_at ? new Date(r.responded_at).toLocaleString() : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                // Load messaging for this talent
                                await loadMessaging()
                                setMsgSelectedTalentId(String(r.talent_id))
                                await loadConversation(String(r.talent_id))
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-semibold transition-colors"
                            >
                              Messages
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                setVideoChatLoading(true)
                                setVideoChatError(null)
                                try {
                                  const { data: sessionRes } = await supabase.auth.getSession()
                                  if (!sessionRes?.session?.user?.email) {
                                    throw new Error('Please sign in to start video chat')
                                  }
                                  
                                  // Get access token for server-side authentication
                                  const accessToken = sessionRes.session.access_token
                                  
                                  // Initiate video chat
                                  const response = await fetch('/api/video-chat/initiate', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${accessToken}`,
                                    },
                                    body: JSON.stringify({
                                      connection_request_id: r.id,
                                      initiated_by: 'business',
                                      recording_enabled: true,
                                    }),
                                  })
                                  
                                  if (!response.ok) {
                                    const errorText = await response.text()
                                    throw new Error(errorText || `HTTP error! status: ${response.status}`)
                                  }
                                  
                                  const data = await response.json()
                                  
                                  if (!response.ok) {
                                    throw new Error(data.detail || 'Failed to initiate video chat')
                                  }
                                  
                                  if (data.success && data.session) {
                                    setVideoChatSession({
                                      ...data.session,
                                      talentId: r.talent_id,
                                      talentName: r.talent_name || '',
                                      businessName: businessProfile?.business_name || businessProfile?.name || 'Business'
                                    })
                                  } else {
                                    throw new Error(data.error || 'Failed to initiate video chat')
                                  }
                                } catch (err: any) {
                                  console.error('[Business Dashboard] Video chat error:', err)
                                  setVideoChatError(err.message || 'Failed to start video chat')
                                  alert(err.message || 'Failed to start video chat')
                                } finally {
                                  setVideoChatLoading(false)
                                }
                              }}
                              disabled={videoChatLoading}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-60"
                            >
                              {videoChatLoading ? 'Starting...' : 'Video Chat'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // Include the connection request ID so we can load shared sections
                                router.push(`/portfolio/view?talent_id=${r.talent_id}&request_id=${r.id}&shared=true`)
                              }}
                              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg font-semibold transition-colors"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!confirm('Are you sure you want to discontinue this connection? This action cannot be undone.')) {
                                  return
                                }
                                try {
                                  const { error } = await supabase
                                    .from('talent_connection_requests')
                                    .update({ 
                                      status: 'discontinued',
                                      responded_at: new Date().toISOString()
                                    })
                                    .eq('id', r.id)
                                  
                                  if (error) {
                                    console.error('Error discontinuing connection:', error)
                                    alert('Failed to discontinue connection. Please try again.')
                                  } else {
                                    // Reload connections
                                    loadConnections()
                                  }
                                } catch (err) {
                                  console.error('Error discontinuing connection:', err)
                                  alert('An error occurred. Please try again.')
                                }
                              }}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg font-semibold transition-colors"
                            >
                              Discontinue
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Previous Connections - Talents who withdrew their connection */}
              {connWithdrawn.length > 0 && (
                <div className="border border-gray-800 rounded-lg p-4 md:col-span-2 bg-gradient-to-br from-slate-900/50 to-amber-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <h3 className="text-white font-semibold">Previous Connections</h3>
                    <span className="text-amber-400/80 text-xs ml-2">({connWithdrawn.length} withdrawn)</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-4">
                    These talents previously connected with you but the connection has ended. You can request to reconnect by sending them a message.
                  </p>
                  <div className="space-y-3">
                    {connWithdrawn.map((r) => {
                      const withdrawnAt = r.responded_at ? new Date(r.responded_at) : new Date(r.created_at)

                      return (
                        <div
                          key={r.id}
                          className="border border-amber-800/30 bg-amber-900/10 rounded-lg p-3 hover:border-amber-600/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-gray-200 text-sm font-medium">
                                {r.talent_name && r.talent_name.trim() ? (
                                  r.talent_name
                                ) : (
                                  <span className="text-yellow-400 italic animate-pulse">Loading name...</span>
                                )}
                              </p>
                              <p className="text-gray-500 text-xs mt-1">
                                Originally connected {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                              </p>
                              <p className="text-amber-400/70 text-xs mt-0.5">
                                Connection ended {withdrawnAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const businessName = businessProfile?.business_name || businessProfile?.name || 'Our business'
                                  setReconnectModal({
                                    open: true,
                                    connection: r,
                                    message: `Hi ${r.talent_name || 'there'},\n\n${businessName} would like to reconnect with you. We may have new opportunities that could be a great fit for your skills and experience.\n\nWould you be interested in reconnecting?`
                                  })
                                }}
                                disabled={sendingOpportunity === r.id}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-60"
                              >
                                Request Reconnect
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setConnectionSummaryModal({
                                    open: true,
                                    connection: r
                                  })
                                }}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg font-semibold transition-colors"
                              >
                                View Summary
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Messaging UI - shown when a talent is selected */}
            {msgSelectedTalentId && !isServiceConnections && (
              <div className="mt-6 border border-gray-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-900/40 border-b border-gray-800 flex items-center justify-between">
                  <p className="text-gray-300 font-medium">
                    {(() => {
                      const talent = connAccepted.find((r) => String(r.talent_id) === String(msgSelectedTalentId))
                      const talentName = talent?.talent_name || 'Loading name...'
                      return `Conversation with ${talentName}`
                    })()}
                  </p>
                  <button
                    onClick={() => {
                      setMsgSelectedTalentId(null)
                      setMsgConversationId(null)
                      setMsgItems([])
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {msgError && (
                  <div className="p-4 border-b border-gray-800 bg-red-500/10 text-red-200 text-sm">
                    {msgError}
                  </div>
                )}

                {msgLoading && (
                  <div className="p-6 text-center">
                    <p className="text-gray-400">Loading messages…</p>
                  </div>
                )}

                {!msgLoading && msgConversationId === null && !msgError && (
                  <div className="p-6 text-center">
                    <p className="text-gray-300 mb-2">No messages yet</p>
                    <p className="text-gray-500 text-sm">Start the conversation by sending a message below.</p>
                  </div>
                )}

                {!msgLoading && msgConversationId && (
                  <div className="p-4 space-y-3 max-h-[300px] overflow-auto bg-gray-900/20">
                    {msgItems.length === 0 ? (
                      <p className="text-gray-400 text-center">No messages yet.</p>
                    ) : (
                      msgItems.map((m) => (
                        <div
                          key={m.id}
                          className={`max-w-[85%] rounded-lg px-3 py-2 ${
                            m.sender_type === 'business'
                              ? 'ml-auto bg-blue-500/20 border border-blue-500/30 text-blue-100'
                              : 'mr-auto bg-gray-800/60 border border-gray-700 text-gray-100'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(m.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {msgSelectedTalentId && (
                  <div className="p-4 border-t border-gray-800 bg-gray-900/20">
                    <div className="flex items-end gap-3">
                      <textarea
                        value={msgBody}
                        onChange={(e) => setMsgBody(e.target.value)}
                        placeholder="Write a message…"
                        rows={2}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={msgLoading || !msgBody.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
                      >
                        Send
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      If the connection is expired or revoked, messaging will be blocked.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {activeTab === 'service_connections' && (
          <div className="dashboard-card rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Business Connections</h2>
                <p className="text-gray-600 text-sm">
                  Conversations with talent who want your commercial services. No acceptance required.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadServiceConnections()}
                  className="px-4 py-2 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors disabled:opacity-60"
                  disabled={serviceLoading}
                >
                  Refresh
                </button>
              </div>
            </div>

            {serviceError && (
              <div className="mb-4 border border-red-300 bg-red-50 text-red-700 rounded-lg p-4">
                {serviceError}
              </div>
            )}

            {serviceLoading ? (
              <p className="text-gray-600">Loading business conversations…</p>
            ) : serviceConnections.length === 0 ? (
              <p className="text-gray-600">No business conversations yet.</p>
            ) : (
              <div className="space-y-3">
                {serviceConnections.map((c) => (
                  <div key={c.conversation_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold">{c.talent_name}</p>
                        <p className="text-gray-600 text-xs mt-1">{c.last_message || 'No message preview available.'}</p>
                        <p className="text-gray-500 text-xs mt-1">{new Date(c.last_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            setMsgSelectedTalentId(c.talent_id)
                            await loadConversation(c.talent_id)
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-semibold transition-colors"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Messaging UI - shown when a talent is selected */}
            {msgSelectedTalentId && (
              <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <p className="text-gray-900 font-medium">
                    {(() => {
                      const match = serviceConnections.find((c) => String(c.talent_id) === String(msgSelectedTalentId))
                      const name = match?.talent_name || msgTalents.find((t) => String(t.id) === String(msgSelectedTalentId))?.name || 'Talent'
                      return `Conversation with ${name}`
                    })()}
                  </p>
                  <button
                    onClick={() => {
                      setMsgSelectedTalentId(null)
                      setMsgConversationId(null)
                      setMsgItems([])
                    }}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {msgError && (
                  <div className="p-4 border-b border-gray-200 bg-red-50 text-red-700 text-sm">
                    {msgError}
                  </div>
                )}

                {msgLoading && (
                  <div className="p-6 text-center">
                    <p className="text-gray-600">Loading messages…</p>
                  </div>
                )}

                {!msgLoading && msgConversationId === null && !msgError && (
                  <div className="p-6 text-center">
                    <p className="text-gray-700 mb-2">No messages yet</p>
                    <p className="text-gray-500 text-sm">Start the conversation by sending a message below.</p>
                  </div>
                )}

                {!msgLoading && msgConversationId && (
                  <div className="p-4 space-y-3 max-h-[300px] overflow-auto bg-gray-50">
                    {msgItems.length === 0 ? (
                      <p className="text-gray-600 text-center">No messages yet.</p>
                    ) : (
                      msgItems.map((m) => (
                        <div
                          key={m.id}
                          className={`max-w-[85%] rounded-lg px-3 py-2 ${
                            m.sender_type === 'business'
                              ? 'ml-auto bg-blue-100 border border-blue-200 text-blue-900'
                              : 'mr-auto bg-gray-100 border border-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {new Date(m.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {msgSelectedTalentId && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-end gap-3">
                      <textarea
                        value={msgBody}
                        onChange={(e) => setMsgBody(e.target.value)}
                        placeholder="Write a message…"
                        className="flex-1 min-h-[80px] border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={msgLoading || !msgBody.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Video Chat Modal */}
      {videoChatSession && (
        <VideoChat
          sessionId={videoChatSession.id}
          roomId={videoChatSession.room_id}
          roomToken={videoChatSession.room_token}
          onEnd={() => {
            setVideoChatSession(null)
            setVideoChatError(null)
          }}
          recordingEnabled={videoChatSession.recording_enabled || false}
          talentName={videoChatSession.talentName || 'Loading name...'}
          businessName={videoChatSession.businessName || 'Business'}
        />
      )}
      
      {/* Video Chat Error Display */}
      {videoChatError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg max-w-md">
          <div className="flex items-center justify-between gap-4">
            <p>{videoChatError}</p>
            <button
              onClick={() => setVideoChatError(null)}
              className="text-red-400 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Reconnection Request Modal */}
      {reconnectModal.open && reconnectModal.connection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Request to Reconnect</h2>
              <button
                type="button"
                onClick={() => setReconnectModal({ open: false, connection: null, message: '' })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Send a message to <strong>{reconnectModal.connection.talent_name || 'this talent'}</strong> requesting to reconnect.
              If they accept, your previous conversation history will be restored.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your message
              </label>
              <textarea
                value={reconnectModal.message}
                onChange={(e) => setReconnectModal(prev => ({ ...prev, message: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                placeholder="Write a message explaining why you'd like to reconnect..."
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReconnectModal({ open: false, connection: null, message: '' })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sendingOpportunity === reconnectModal.connection.id || !reconnectModal.message.trim()}
                onClick={async () => {
                  const conn = reconnectModal.connection
                  if (!conn) return
                  setSendingOpportunity(conn.id)
                  try {
                    // Update the connection request status to 'pending' (reconnection requested)
                    // and store the reconnection message in metadata or a separate field
                    const { error: updateError } = await supabase
                      .from('talent_connection_requests')
                      .update({
                        status: 'pending',
                        responded_at: new Date().toISOString()
                      })
                      .eq('id', conn.id)

                    if (updateError) {
                      throw new Error(updateError.message || 'Failed to send reconnection request')
                    }

                    // Try to create a notification for the talent (if table exists)
                    try {
                      await supabase
                        .from('talent_notifications')
                        .insert({
                          talent_id: conn.talent_id,
                          business_id: businessProfile?.id,
                          connection_request_id: conn.id,
                          notification_type: 'reconnect_request',
                          title: `Reconnection Request from ${businessProfile?.business_name || businessProfile?.name || 'A business'}`,
                          message: reconnectModal.message,
                          metadata: {
                            business_name: businessProfile?.business_name || businessProfile?.name,
                            original_connection_date: conn.created_at
                          }
                        })
                    } catch (notifErr) {
                      // Notification table may not exist - that's okay, the status update is the main action
                      console.log('[Reconnect] Could not create notification, table may not exist')
                    }

                    alert('Reconnection request sent! The talent will see your request and can accept to restore the connection.')
                    setReconnectModal({ open: false, connection: null, message: '' })
                    // Reload connections to reflect the status change
                    await loadConnections()
                  } catch (err: any) {
                    console.error('Error sending reconnection request:', err)
                    alert(err.message || 'Failed to send reconnection request. Please try again.')
                  } finally {
                    setSendingOpportunity(null)
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-60"
              >
                {sendingOpportunity === reconnectModal.connection.id ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Summary Modal */}
      {connectionSummaryModal.open && connectionSummaryModal.connection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Previous Connection Summary</h2>
              <button
                type="button"
                onClick={() => setConnectionSummaryModal({ open: false, connection: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  This connection has ended. Full profile details are no longer available.
                  You can request to reconnect to restore access.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Talent Name</p>
                  <p className="text-gray-900 font-medium">
                    {connectionSummaryModal.connection.talent_name || 'Name not available'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Originally Connected</p>
                  <p className="text-gray-900">
                    {connectionSummaryModal.connection.created_at
                      ? new Date(connectionSummaryModal.connection.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Date not available'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Connection Ended</p>
                  <p className="text-gray-900">
                    {connectionSummaryModal.connection.responded_at
                      ? new Date(connectionSummaryModal.connection.responded_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Date not available'}
                  </p>
                </div>

                {connectionSummaryModal.connection.selected_sections &&
                  Array.isArray(connectionSummaryModal.connection.selected_sections) &&
                  connectionSummaryModal.connection.selected_sections.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Previously Shared Sections</p>
                      <p className="text-gray-700 text-sm">
                        {connectionSummaryModal.connection.selected_sections.join(', ')}
                      </p>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConnectionSummaryModal({ open: false, connection: null })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const conn = connectionSummaryModal.connection
                  setConnectionSummaryModal({ open: false, connection: null })
                  if (conn) {
                    const businessName = businessProfile?.business_name || businessProfile?.name || 'Our business'
                    setReconnectModal({
                      open: true,
                      connection: conn,
                      message: `Hi ${conn.talent_name || 'there'},\n\n${businessName} would like to reconnect with you. We may have new opportunities that could be a great fit for your skills and experience.\n\nWould you be interested in reconnecting?`
                    })
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
              >
                Request Reconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
