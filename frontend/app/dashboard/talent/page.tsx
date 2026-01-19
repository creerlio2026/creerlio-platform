'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import VideoChat from '@/components/VideoChat'
import dynamic from 'next/dynamic'

const SearchMap = dynamic(() => import('@/components/SearchMap'), { ssr: false })

const DEBUG_ENDPOINT = 'http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc'
const emitDebugLog = (payload: Record<string, unknown>) => {
  fetch(DEBUG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
  fetch('/api/debug-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
}

export default function TalentDashboard() {
  return <TalentDashboardShell />
}

interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  user_type: string
  is_active: boolean
}

type TabType = 'overview' | 'profile' | 'portfolio' | 'applications' | 'connections'
type ConnectionMode = 'career' | 'business'

type TalentIntentStatus = 'open_to_conversations' | 'passive_exploring' | 'not_available'
type IntentWorkType = 'full_time' | 'part_time' | 'contract' | 'advisory' | ''
type IntentLocationMode = 'on_site' | 'hybrid' | 'remote' | ''
type IntentAvailability = 'immediate' | '1_3_months' | '3_6_months' | 'future' | ''
type IntentSalaryBand = 'entry' | 'mid' | 'senior' | 'executive' | 'flexible' | ''

const defaultTalentIntent = {
  intent_status: 'not_available' as TalentIntentStatus,
  visibility: false,
  preferred_work_type: '' as IntentWorkType,
  location_mode: '' as IntentLocationMode,
  radius_km: 10,
  base_location: '',
  role_themes: '',
  industry_preferences: '',
  salary_band: '' as IntentSalaryBand,
  availability_timeframe: '' as IntentAvailability,
}

const SECTION_CHOICES = [
  { key: 'intro', label: 'Introduction' },
  { key: 'bio', label: 'Bio' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'projects', label: 'Projects' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'location_preferences', label: 'Location & commute preferences' },
] as const

export function TalentDashboardShell({
  forcedTab,
  forcedConnectionMode,
}: {
  forcedTab?: TabType
  forcedConnectionMode?: ConnectionMode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isBusinessRoute = pathname === '/dashboard/talent/business-connections'
  const [user, setUser] = useState<User | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [talentProfile, setTalentProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabType>(forcedTab ?? 'overview')
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(forcedConnectionMode ?? 'career')
  const [userType, setUserType] = useState<string>('talent')

  const [connLoading, setConnLoading] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)
  const [connRequests, setConnRequests] = useState<any[]>([])
  const [connAccepted, setConnAccepted] = useState<any[]>([])
  const [connDeclined, setConnDeclined] = useState<any[]>([])
  const [connWithdrawn, setConnWithdrawn] = useState<any[]>([]) // Previous connections - either party withdrew
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [requestingReconnect, setRequestingReconnect] = useState<string | null>(null) // Track which business is being sent a reconnect request
  const [reconnectModal, setReconnectModal] = useState<{ open: boolean; connection: any | null; message: string }>({
    open: false,
    connection: null,
    message: ''
  }) // Modal for sending reconnection request with custom message
  const [connectionSummaryModal, setConnectionSummaryModal] = useState<{ open: boolean; connection: any | null }>({
    open: false,
    connection: null
  }) // Modal for viewing connection summary

  // Export/Print consent requests (Business → Talent)
  const [consentLoading, setConsentLoading] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [consentReqs, setConsentReqs] = useState<any[]>([])
  const [consentBusyId, setConsentBusyId] = useState<string | null>(null)
  const didAutoLoadConsentRef = useRef(false)

  // Opportunity notifications from businesses (for withdrawn connections)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const didAutoLoadNotificationsRef = useRef(false)

  // Saved Templates state
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])
  const [savedTemplatesLoading, setSavedTemplatesLoading] = useState(false)

  useEffect(() => {
    // Set active role context for mixed-profile accounts
    try {
      localStorage.setItem('creerlio_active_role', 'talent')
      // Some pages still rely on this legacy key; force Talent context when entering Talent Dashboard
      localStorage.setItem('user_type', 'talent')
    } catch {}
    try {
      setUserType('talent')
    } catch {}
    // Allow deep-linking to specific tab
    try {
      if (forcedTab) {
        setActiveTab(forcedTab)
      } else {
        const params = new URLSearchParams(window.location.search)
        const tab = params.get('tab')
        if (tab === 'connections' || tab === 'overview' || tab === 'portfolio' || tab === 'applications') {
          setActiveTab(tab as TabType)
        }
      }
    } catch {}
  }, [forcedTab])

  useEffect(() => {
    if (forcedConnectionMode) {
      setConnectionMode(forcedConnectionMode)
      return
    }
    if (isBusinessRoute) {
      setConnectionMode('business')
      setActiveTab('connections')
    }
  }, [forcedConnectionMode, isBusinessRoute])

  // Messaging state (Supabase/RLS-backed)
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgError, setMsgError] = useState<string | null>(null)
  const [msgBusinesses, setMsgBusinesses] = useState<Array<{ id: string; name: string | null }>>([])
  const [msgSelectedBusinessId, setMsgSelectedBusinessId] = useState<string | null>(null)
  const [msgConversationId, setMsgConversationId] = useState<string | null>(null)
  const [msgItems, setMsgItems] = useState<
    Array<{ id: string; sender_type: string; body: string; created_at: string }>
  >([])
  const [msgBody, setMsgBody] = useState('')
  const didAutoLoadMessagesRef = useRef(false)

  const [bizSearchQuery, setBizSearchQuery] = useState('')
  const [bizSearchCategory, setBizSearchCategory] = useState('')
  const [bizSearchLocation, setBizSearchLocation] = useState('')
  const [bizSearchDistance, setBizSearchDistance] = useState('25')
  const [bizFiltersOpen, setBizFiltersOpen] = useState(false)
  const [bizSearchLoading, setBizSearchLoading] = useState(false)
  const [bizSearchError, setBizSearchError] = useState<string | null>(null)
  const [bizResults, setBizResults] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null)
  const bizSearchTimerRef = useRef<number | null>(null)

  const [bizConnectionsLoading, setBizConnectionsLoading] = useState(false)
  const [bizConnectionsError, setBizConnectionsError] = useState<string | null>(null)
  const [bizConnections, setBizConnections] = useState<
    Array<{ business_id: string; conversation_id: string; name: string; last_message: string; last_at: string }>
  >([])
  const [mutedBusinessIds, setMutedBusinessIds] = useState<string[]>([])
  const [snoozedBusinessIds, setSnoozedBusinessIds] = useState<string[]>([])
  
  // Video Chat state
  const [videoChatSession, setVideoChatSession] = useState<any | null>(null)
  const [videoChatLoading, setVideoChatLoading] = useState(false)
  const [videoChatError, setVideoChatError] = useState<string | null>(null)

  // Portfolio view state
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioMeta, setPortfolioMeta] = useState<any>(null)
  const [portfolioBannerUrl, setPortfolioBannerUrl] = useState<string | null>(null)
  const [portfolioAvatarUrl, setPortfolioAvatarUrl] = useState<string | null>(null)

  const [calendarItems, setCalendarItems] = useState<Array<{ id: string; title: string; dateLabel: string; businessId?: string | null }>>([])
  const [overviewMarkers, setOverviewMarkers] = useState<Array<{ id: string; lat: number; lng: number; title: string; description?: string; type: 'business' | 'job' }>>([])
  const [discoverableMarkers, setDiscoverableMarkers] = useState<Array<{ id: string; lat: number; lng: number; title: string; description?: string; type: 'business' | 'job' }>>([])
  const [overviewCenter, setOverviewCenter] = useState<{ lat: number; lng: number } | null>(null)

  const isCommercialRequest = (r: any) => !Array.isArray(r?.selected_sections) || r.selected_sections.length === 0
  const careerRequests = connRequests.filter((r) => !isCommercialRequest(r))
  const businessRequests = connRequests.filter((r) => isCommercialRequest(r))
  const careerAccepted = connAccepted.filter((r) => !isCommercialRequest(r))
  const businessAccepted = connAccepted.filter((r) => isCommercialRequest(r))
  const careerDeclined = connDeclined.filter((r) => !isCommercialRequest(r))
  const businessDeclined = connDeclined.filter((r) => isCommercialRequest(r))
  const careerWithdrawn = connWithdrawn.filter((r) => !isCommercialRequest(r))
  const businessWithdrawn = connWithdrawn.filter((r) => isCommercialRequest(r))

  useEffect(() => {
    emitDebugLog({
      sessionId:'debug-session',
      runId:'pre-fix',
      hypothesisId:'H14',
      location:'dashboard/talent/page.tsx:connection-mode',
      message:'connection mode counts',
      data:{
        connectionMode,
        career:{ requests: careerRequests.length, accepted: careerAccepted.length, declined: careerDeclined.length, withdrawn: careerWithdrawn.length },
        business:{ requests: businessRequests.length, accepted: businessAccepted.length, declined: businessDeclined.length, withdrawn: businessWithdrawn.length },
      },
      timestamp:Date.now()
    })
  }, [connectionMode, connRequests, connAccepted, connDeclined, connWithdrawn])

  // Intent Mode (Talent)
  const [intentMode, setIntentMode] = useState(defaultTalentIntent)
  const [intentLoaded, setIntentLoaded] = useState(false)
  const [intentSaving, setIntentSaving] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)
  const [intentCollapsed, setIntentCollapsed] = useState(true)
  const [intentRecordId, setIntentRecordId] = useState<string | null>(null)
  const intentOriginalRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setIsLoading(true)
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const u = sessionRes.session?.user
        // Debug logging disabled - uncomment and set NEXT_PUBLIC_DEBUG_LOG_ENABLED=true to enable
        // debugLog({ location: 'dashboard/talent/page.tsx:boot:session', message: 'Session check', data: { hasSession: !!sessionRes.session, hasUser: !!u, userId: u?.id ?? null, userEmail: u?.email ?? null, userIdType: typeof u?.id }, hypothesisId: 'H1' })
        if (!u?.id) {
          router.replace('/login?redirect=/dashboard/talent')
          return
        }
        const email = u.email || ''
        const username = email ? email.split('@')[0] : 'talent'
        // Debug logging disabled
        // debugLog({ location: 'dashboard/talent/page.tsx:boot:user_set', message: 'Setting user state', data: { userId: u.id, email, username, userIdType: typeof u.id }, hypothesisId: 'H1' })
        if (!cancelled) {
          setUser({
            id: u.id,
            email,
            username,
            full_name: null,
            user_type: 'talent',
            is_active: true,
          })
          setUserType('talent')
        }

        // CRITICAL: Check user metadata to determine registration intent (most reliable source)
        // Get fresh user data to ensure we have latest metadata
        const { data: { user: freshUser } } = await supabase.auth.getUser()
        const userMetadata = (freshUser || u).user_metadata || {}
        const registeredAsBusinessFromMetadata = userMetadata.registration_type === 'business' || userMetadata.registered_as === 'business'
        
        // Extract first name from user metadata (stored during registration)
        const firstNameFromMetadata = userMetadata.first_name || userMetadata.firstName || null
        if (!cancelled && firstNameFromMetadata) {
          setUserFirstName(firstNameFromMetadata)
        }
        
        // Check if user has business profile to prevent wrong access
        const businessCheck = await supabase.from('business_profiles').select('id').eq('user_id', u.id).maybeSingle()
        const hasBusinessProfile = !!businessCheck.data && !businessCheck.error

        // Load talent profile (schema-tolerant)
        const tpRes = await (supabase.from('talent_profiles').select('*') as any).eq('user_id', u.id).maybeSingle()
        const hasTalentProfile = !!tpRes.data && !tpRes.error
        // Debug logging disabled

        // VALIDATION: Block/redirect if user registered as business (from metadata) OR has business profile but no talent profile
        // User metadata is the most reliable indicator of registration intent - if metadata says business, redirect immediately
        const hasBusinessNoTalent = hasBusinessProfile && !hasTalentProfile
        
        // Debug logging disabled
        
        // CRITICAL: If user registered as business (from metadata) OR has business profile but no talent profile, redirect to business dashboard
        // User metadata is the source of truth - if they registered as business, they should NOT access talent dashboard
        if ((hasBusinessNoTalent || registeredAsBusinessFromMetadata) && !cancelled) {
          // Debug logging disabled
          router.replace('/dashboard/business')
          return
        }

        if (!cancelled && !tpRes.error) {
          setTalentProfile(tpRes.data || null)
          if (tpRes.data?.name && typeof tpRes.data.name === 'string') {
            setUser((prev) => (prev ? { ...prev, full_name: tpRes.data.name } : prev))
            // Extract first name from full name if not already set from metadata
            if (!firstNameFromMetadata && tpRes.data.name) {
              const nameParts = tpRes.data.name.trim().split(/\s+/)
              if (nameParts.length > 0 && !cancelled) {
                setUserFirstName(nameParts[0])
              }
            }
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
    if (!user?.id || !talentProfile?.id || intentLoaded) return
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('intent_modes')
          .select('id,intent_status,visibility,constraints')
          .eq('profile_type', 'talent')
          .eq('profile_id', talentProfile.id)
          .maybeSingle()
        if (error) {
          throw error
        }
        if (!cancelled && data) {
          const constraints = (data as any).constraints || {}
          setIntentRecordId(data.id)
          const next = {
            intent_status: (data.intent_status || 'not_available') as TalentIntentStatus,
            visibility: !!data.visibility,
            preferred_work_type: constraints.preferred_work_type || '',
            location_mode: constraints.location_mode || '',
            radius_km: typeof constraints.radius_km === 'number' ? constraints.radius_km : 10,
            base_location: constraints.base_location || '',
            role_themes: Array.isArray(constraints.role_themes) ? constraints.role_themes.join(', ') : '',
            industry_preferences: Array.isArray(constraints.industry_preferences) ? constraints.industry_preferences.join(', ') : '',
            salary_band: constraints.salary_band || '',
            availability_timeframe: constraints.availability_timeframe || '',
          }
          setIntentMode(next)
          intentOriginalRef.current = { ...next }
        }
        if (!cancelled) setIntentLoaded(true)
      } catch (err: any) {
        if (!cancelled) {
          setIntentError(err.message || 'Failed to load intent mode')
          setIntentLoaded(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, talentProfile?.id, intentLoaded])

  const parseCsv = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const saveIntentMode = async () => {
    if (!user?.id || !talentProfile?.id) return
    setIntentSaving(true)
    setIntentError(null)
    try {
      const constraints = {
        preferred_work_type: intentMode.preferred_work_type,
        location_mode: intentMode.location_mode,
        radius_km: intentMode.radius_km,
        base_location: intentMode.base_location,
        role_themes: parseCsv(intentMode.role_themes),
        industry_preferences: parseCsv(intentMode.industry_preferences),
        salary_band: intentMode.salary_band,
        availability_timeframe: intentMode.availability_timeframe,
      }

      const { data, error } = await supabase
        .from('intent_modes')
        .upsert(
          {
            id: intentRecordId || undefined,
            user_id: user.id,
            profile_type: 'talent',
            profile_id: talentProfile.id,
            intent_status: intentMode.intent_status,
            visibility: intentMode.visibility,
            constraints,
          },
          { onConflict: 'profile_type,profile_id' }
        )
        .select('id')
        .maybeSingle()

      if (error) throw error

      const intentId = data?.id || intentRecordId
      if (intentId) setIntentRecordId(intentId)

      const events: Array<{ intent_id: string | null; user_id: string; profile_type: string; profile_id: string; event_type: string }> = []
      const prev = intentOriginalRef.current
      if (!prev) {
        events.push({ intent_id: intentId || null, user_id: user.id, profile_type: 'talent', profile_id: talentProfile.id, event_type: 'intent_created' })
      } else {
        events.push({ intent_id: intentId || null, user_id: user.id, profile_type: 'talent', profile_id: talentProfile.id, event_type: 'intent_updated' })
        if (prev.visibility !== intentMode.visibility) {
          events.push({ intent_id: intentId || null, user_id: user.id, profile_type: 'talent', profile_id: talentProfile.id, event_type: 'intent_visibility_changed' })
        }
      }

      if (events.length) {
        await supabase.from('intent_events').insert(events)
      }

      intentOriginalRef.current = { ...intentMode }

      // #region agent log
      emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H8',location:'dashboard/talent/page.tsx:intent-save',message:'intent mode saved',data:{intentId,visibility:intentMode.visibility,intent_status:intentMode.intent_status},timestamp:Date.now()})
      // #endregion
    } catch (err: any) {
      setIntentError(err.message || 'Failed to save intent mode')
    } finally {
      setIntentSaving(false)
    }
  }

  useEffect(() => {
    // Debug logging disabled
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
      const talentRes = await supabase.from('talent_profiles').select('id').eq('user_id', uid).single()
      if (talentRes.error || !talentRes.data?.id) {
        setConnError('No talent profile found for this user.')
        return
      }
      const talentId = String(talentRes.data.id)

      const reqRes = await supabase
        .from('talent_connection_requests')
        .select('id, business_id, status, selected_sections, created_at, responded_at')
        .eq('talent_id', talentId)
        .order('created_at', { ascending: false })

      if (reqRes.error) {
        // Debug logging disabled
        if (/Could not find the table/i.test(reqRes.error.message)) {
          setConnError(
            "Connections are not configured yet (missing table). Run Supabase migration `2025122203_talent_connection_requests.sql` and refresh the schema cache, then reload."
          )
          return
        }
        setConnError(reqRes.error.message)
        return
      }

      const reqs = (reqRes.data || []) as any[]
      // Incoming requests from businesses (status = 'pending' or 'waiting_for_review')
      // These are requests that businesses sent TO this talent
      const pendingReqs = reqs.filter((r) => r.status === 'pending' || r.status === 'waiting_for_review')
      // Sort: 'waiting_for_review' first, then 'pending', both by created_at desc
      pendingReqs.sort((a, b) => {
        if (a.status === 'waiting_for_review' && b.status !== 'waiting_for_review') return -1
        if (a.status !== 'waiting_for_review' && b.status === 'waiting_for_review') return 1
        const aDate = new Date(a.created_at).getTime()
        const bDate = new Date(b.created_at).getTime()
        return bDate - aDate
      })
      // Accepted connections - these are requests that were accepted by this talent
      // Filter out discontinued connections - only show active accepted connections
      const acceptedReqs = reqs.filter((r) => r.status === 'accepted')
      
      // Declined/rejected requests - filter for rejected/declined status
      const declinedReqs = reqs.filter((r) => r.status === 'rejected' || r.status === 'declined')
      // Filter out requests that are older than 30 days (they should be deleted)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const activeDeclinedReqs = declinedReqs.filter((r) => {
        const respondedAt = r.responded_at ? new Date(r.responded_at) : null
        const createdAt = r.created_at ? new Date(r.created_at) : null
        // Use responded_at if available, otherwise use created_at
        const dateToCheck = respondedAt || createdAt
        return dateToCheck && dateToCheck >= thirtyDaysAgo
      })
      // Sort declined requests by responded_at desc (most recent first)
      activeDeclinedReqs.sort((a, b) => {
        const aDate = new Date(a.responded_at || a.created_at).getTime()
        const bDate = new Date(b.responded_at || b.created_at).getTime()
        return bDate - aDate
      })

      // Previous connections - either party withdrew/discontinued
      const withdrawnReqs = reqs.filter((r) => r.status === 'discontinued')
      // Sort by responded_at desc (most recent withdrawal first)
      withdrawnReqs.sort((a, b) => {
        const aDate = new Date(a.responded_at || a.created_at).getTime()
        const bDate = new Date(b.responded_at || b.created_at).getTime()
        return bDate - aDate
      })

      // Fetch business names for all requests (including withdrawn)
      const businessIds = Array.from(new Set([...pendingReqs, ...acceptedReqs, ...activeDeclinedReqs, ...withdrawnReqs].map((r) => r.business_id).filter(Boolean)))
      let businessNameMap: Record<string, string> = {}
      if (businessIds.length > 0) {
        const nameSelectors = ['id, business_name', 'id, name', 'id, company_name', 'id, display_name']
        for (const sel of nameSelectors) {
          const res = await supabase.from('business_profiles').select(sel).in('id', businessIds)
          if (!res.error && res.data) {
            for (const bp of res.data as any[]) {
              const name = bp.business_name || bp.name || bp.company_name || bp.display_name || 'Business'
              businessNameMap[String(bp.id)] = name
            }
            break
          }
        }
      }
      
      // Add business names to requests
      const pendingWithNames = pendingReqs.map((r) => ({ ...r, business_name: businessNameMap[String(r.business_id)] || 'Business' }))
      const acceptedWithNames = acceptedReqs.map((r) => ({ ...r, business_name: businessNameMap[String(r.business_id)] || 'Business' }))
      const declinedWithNames = activeDeclinedReqs.map((r) => ({ ...r, business_name: businessNameMap[String(r.business_id)] || 'Business' }))
      const withdrawnWithNames = withdrawnReqs.map((r) => ({ ...r, business_name: businessNameMap[String(r.business_id)] || 'Business' }))

      setConnRequests(pendingWithNames)
      setConnAccepted(acceptedWithNames)
      setConnDeclined(declinedWithNames)
      setConnWithdrawn(withdrawnWithNames)

      // Calendar items (read-only, derived from accepted connections)
      const commercialAccepted = acceptedWithNames.filter((r) => !Array.isArray(r.selected_sections) || r.selected_sections.length === 0)
      const events = commercialAccepted.map((r) => ({
        id: String(r.id),
        title: `${r.business_name || 'Business'} • Business interaction`,
        dateLabel: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Upcoming',
        businessId: r.business_id || null,
      }))
      setCalendarItems(events)
    } finally {
      setConnLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'overview') return
    if (!connAccepted.length) {
      setOverviewMarkers([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const businessIds = connAccepted.map((r) => r.business_id).filter(Boolean)
        if (!businessIds.length) return
        const res = await supabase
          .from('business_profiles')
          .select('id,business_name,name,latitude,longitude,city,state')
          .in('id', businessIds)
        if (res.error || !res.data) return

        const connectedMarkers = res.data
          .filter((b: any) => b.latitude != null && b.longitude != null)
          .map((b: any) => ({
            id: String(b.id),
            lat: Number(b.latitude),
            lng: Number(b.longitude),
            title: b.business_name || b.name || 'Business',
            description: [b.city, b.state].filter(Boolean).join(', ') || 'Connected business',
            type: 'job' as const,
          }))

        if (!cancelled) {
          setOverviewMarkers(connectedMarkers)
          if (connectedMarkers.length) {
            setOverviewCenter({ lat: connectedMarkers[0].lat, lng: connectedMarkers[0].lng })
          }
        }
      } catch {
        // silent
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeTab, connAccepted])

  useEffect(() => {
    if (activeTab !== 'overview') return
    let cancelled = false
    ;(async () => {
      try {
        const center = overviewCenter || (talentProfile?.latitude && talentProfile?.longitude
          ? { lat: talentProfile.latitude, lng: talentProfile.longitude }
          : null)
        if (!center) return
        const params = new URLSearchParams()
        params.set('show_all', '1')
        params.set('lat', String(center.lat))
        params.set('lng', String(center.lng))
        params.set('radius', '25')
        const res = await fetch(`/api/map/businesses?${params.toString()}`)
        const json = await res.json().catch(() => ({}))
        const businesses = Array.isArray(json?.businesses) ? json.businesses : []
        const connectedIds = new Set(overviewMarkers.map((m) => m.id))
        const nearby = businesses
          .filter((b: any) => b?.lat != null && b?.lng != null && !connectedIds.has(String(b.id)))
          .slice(0, 40)
          .map((b: any) => ({
            id: String(b.id),
            lat: Number(b.lat),
            lng: Number(b.lng),
            title: b.name || 'Business',
            description: [b.city, b.state].filter(Boolean).join(', ') || 'Discoverable business',
            type: 'business' as const,
          }))
        if (!cancelled) {
          setDiscoverableMarkers(nearby)
        }
      } catch {
        // silent
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeTab, overviewCenter, overviewMarkers, talentProfile])

  async function cancelConnectionRequest(requestId: string) {
    if (!confirm('Are you sure you want to cancel this connection request? This action cannot be undone.')) {
      return
    }
    
    setIsCancelling(true)
    setConnError(null)
    try {
      const { error } = await supabase
        .from('talent_connection_requests')
        .delete()
        .eq('id', requestId)
      
      if (error) {
        setConnError(error.message)
        return
      }
      
      // Remove from local state
      setConnRequests((prev) => prev.filter((r) => r.id !== requestId))
      setSelectedRequest(null)
      
      // Reload to ensure consistency
      await loadConnections()
    } catch (err: any) {
      setConnError(err?.message || 'Failed to cancel connection request.')
    } finally {
      setIsCancelling(false)
    }
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

  const normalizeBusinessRow = (row: any) => {
    const name =
      row?.business_name ||
      row?.name ||
      row?.company_name ||
      row?.display_name ||
      'Business'
    return {
      id: String(row?.id ?? ''),
      name,
      description: row?.description || row?.services || row?.about || '',
      category: row?.category || row?.industry || '',
      city: row?.city || '',
      state: row?.state || '',
      country: row?.country || '',
      website: row?.website || row?.website_url || row?.site_url || '',
      hours: row?.hours || row?.open_hours || row?.opening_hours || '',
      is_online: row?.is_online === true,
    }
  }

  const loadBusinessSearch = async () => {
    setBizSearchLoading(true)
    setBizSearchError(null)
    try {
      const query = bizSearchQuery.trim()
      const category = bizSearchCategory.trim()
      const location = bizSearchLocation.trim()
      const selectors = [
        'id,business_name,name,description,services,about,city,state,country,website,website_url,site_url,hours,open_hours,opening_hours,is_online',
        'id,business_name,name,description,city,state,country,website',
        'id,business_name,name,description,city,state,country',
        'id,business_name,name,description'
      ]
      let data: any[] = []
      let lastError: any = null
      for (const sel of selectors) {
        const res = await supabase
          .from('business_profiles')
          .select(sel)
          .limit(50)
          .order('created_at', { ascending: false })
        if (!res.error && res.data) {
          data = res.data as any[]
          lastError = null
          break
        }
        lastError = res.error
        const msg = String(res.error?.message ?? '')
        const code = String(res.error?.code ?? '')
        const missingCol = code === 'PGRST204' || /does not exist|Could not find the .* column/i.test(msg)
        if (!missingCol) break
      }
      if (lastError && data.length === 0) {
        setBizSearchError(lastError.message || 'Search failed.')
        return
      }

      const q = query.toLowerCase()
      const qCompact = q.replace(/\s+/g, '')
      let filtered = data
      if (q) {
        filtered = filtered.filter((b) => {
          const name = (b.business_name || b.name || '').toLowerCase()
          const desc = (b.description || b.services || b.about || '').toLowerCase()
          const nameCompact = name.replace(/\s+/g, '')
          const descCompact = desc.replace(/\s+/g, '')
          return name.includes(q) || nameCompact.includes(qCompact) || desc.includes(q) || descCompact.includes(qCompact)
        })
      }
      if (category) {
        const c = category.toLowerCase()
        filtered = filtered.filter((b) => String(b.category || b.industry || b.services || '').toLowerCase().includes(c))
      }
      if (location) {
        const l = location.toLowerCase()
        filtered = filtered.filter((b) => {
          const loc = [b.city, b.state, b.country].filter(Boolean).join(' ').toLowerCase()
          return loc.includes(l)
        })
      }

      const normalized = filtered.map(normalizeBusinessRow)
      setBizResults(normalized)
      if (normalized.length === 0) {
        setSelectedBusiness(null)
      }
    } catch (err: any) {
      setBizSearchError(err?.message || 'Failed to search businesses.')
    } finally {
      setBizSearchLoading(false)
    }
  }

  const scheduleBusinessSearch = () => {
    if (bizSearchTimerRef.current) {
      window.clearTimeout(bizSearchTimerRef.current)
    }
    bizSearchTimerRef.current = window.setTimeout(() => {
      loadBusinessSearch()
    }, 300)
  }

  const loadBusinessConnections = async () => {
    setBizConnectionsLoading(true)
    setBizConnectionsError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setBizConnectionsError('Please sign in to view business connections.')
        setBizConnections([])
        return
      }
      const talentRes = await supabase.from('talent_profiles').select('id').eq('user_id', uid).single()
      if (talentRes.error || !talentRes.data?.id) {
        setBizConnectionsError('No talent profile found for this user.')
        setBizConnections([])
        return
      }
      const talentId = String(talentRes.data.id)
      const convRes = await supabase
        .from('conversations')
        .select('id,business_id,created_at,updated_at')
        .eq('talent_id', talentId)
      if (convRes.error) {
        setBizConnectionsError('Failed to load conversations.')
        setBizConnections([])
        return
      }
      const conversations = (convRes.data || []) as any[]
      const convIds = conversations.map((c) => c.id).filter(Boolean)
      if (convIds.length === 0) {
        setBizConnections([])
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
      const businessIds = Array.from(new Set(convWithMsgs.map((c) => c.business_id).filter(Boolean))).map(String)
      let nameMap: Record<string, string> = {}
      if (businessIds.length > 0) {
        const selectors = ['id,business_name', 'id,name', 'id,company_name', 'id,display_name']
        for (const sel of selectors) {
          const res = await supabase.from('business_profiles').select(sel).in('id', businessIds)
          if (!res.error && res.data) {
            for (const bp of res.data as any[]) {
              const name = bp.business_name || bp.name || bp.company_name || bp.display_name || 'Business'
              nameMap[String(bp.id)] = name
            }
            break
          }
        }
      }

      const rows = convWithMsgs.map((c) => {
        const latest = latestByConv.get(String(c.id))
        return {
          business_id: String(c.business_id),
          conversation_id: String(c.id),
          name: nameMap[String(c.business_id)] || 'Business',
          last_message: latest?.body || '',
          last_at: latest?.created_at || c.updated_at || c.created_at || new Date().toISOString(),
        }
      })
      setBizConnections(rows)
    } catch (err: any) {
      setBizConnectionsError(err?.message || 'Failed to load business connections.')
    } finally {
      setBizConnectionsLoading(false)
    }
  }

  const openBusinessConversation = async (businessId: string) => {
    setMsgSelectedBusinessId(String(businessId))
    await loadConversation(String(businessId))
  }

  const disconnectBusinessConnection = async (businessId: string, conversationId: string) => {
    if (!confirm('Disconnect from this business? This will end the relationship and remove conversation history.')) return
    try {
      await supabase.from('messages').delete().eq('conversation_id', conversationId)
      await supabase.from('conversations').delete().eq('id', conversationId)
      await supabase
        .from('talent_connection_requests')
        .update({ status: 'discontinued', responded_at: new Date().toISOString() })
        .eq('business_id', businessId)
      setBizConnections((prev) => prev.filter((c) => c.conversation_id !== conversationId))
      if (String(msgSelectedBusinessId) === String(businessId)) {
        setMsgSelectedBusinessId(null)
        setMsgConversationId(null)
        setMsgItems([])
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to disconnect. Please try again.')
    }
  }

  const getBusinessDisplayName = (businessId: string) => {
    const fromConnections = bizConnections.find((c) => String(c.business_id) === String(businessId))
    if (fromConnections?.name) return fromConnections.name
    const fromResults = bizResults.find((b) => String(b.id) === String(businessId))
    if (fromResults?.name) return fromResults.name
    const fromSelected = selectedBusiness && String(selectedBusiness.id) === String(businessId) ? selectedBusiness.name : null
    if (fromSelected) return fromSelected
    const fromAccepted = connAccepted.find((r) => String(r.business_id) === String(businessId))
    if (fromAccepted?.business_name) return fromAccepted.business_name
    return 'Business'
  }

  const getCommercialRequestId = (businessId: string) => {
    const req = businessAccepted.find((r) => String(r.business_id) === String(businessId))
    return req?.id ? String(req.id) : null
  }

  const toggleMuted = (businessId: string) => {
    setMutedBusinessIds((prev) =>
      prev.includes(businessId) ? prev.filter((id) => id !== businessId) : [...prev, businessId]
    )
  }

  const toggleSnoozed = (businessId: string) => {
    setSnoozedBusinessIds((prev) =>
      prev.includes(businessId) ? prev.filter((id) => id !== businessId) : [...prev, businessId]
    )
  }

  const startBusinessVideoChat = async (connectionRequestId: string, businessId: string, businessName: string) => {
    setVideoChatLoading(true)
    setVideoChatError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      if (!sessionRes?.session?.user?.email) {
        throw new Error('Please sign in to start video chat')
      }
      const accessToken = sessionRes.session.access_token
      const response = await fetch('/api/video-chat/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          connection_request_id: connectionRequestId,
          initiated_by: 'talent',
          recording_enabled: false,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate video chat')
      }
      if (data.session) {
        setVideoChatSession({
          ...data.session,
          businessId,
          businessName,
          talentName: talentProfile?.name || 'Talent',
        })
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err: any) {
      setVideoChatError(err.message || 'Failed to start video chat')
      alert(err.message || 'Failed to start video chat')
    } finally {
      setVideoChatLoading(false)
    }
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

      const talentRes = await supabase.from('talent_profiles').select('id').eq('user_id', uid).single()
      if (talentRes.error || !talentRes.data?.id) {
        setConsentError('No talent profile found for this user.')
        setConsentReqs([])
        return
      }
      const talentId = String(talentRes.data.id)

      const reqRes = await supabase
        .from('talent_export_consent_requests')
        .select('id, business_id, status, request_reason, scope, requested_at, responded_at, expires_at')
        .eq('talent_id', talentId)
        .order('requested_at', { ascending: false })
        .limit(50)

      if (reqRes.error) {
        if (/Could not find the table/i.test(reqRes.error.message)) {
          setConsentError(
            'Export consent is not configured yet. Run Supabase migration `2025122207_talent_export_consent.sql` and refresh the schema cache, then reload.'
          )
        } else {
          setConsentError(reqRes.error.message)
        }
        setConsentReqs([])
        return
      }

      const rows = (reqRes.data || []) as any[]
      const businessIds = Array.from(new Set(rows.map((r) => r.business_id).filter(Boolean)))

      // Map business names (defensive selectors)
      const nameSelectors = ['id, name', 'id, business_name', 'id, company_name', 'id, display_name', 'id, legal_name']
      let nameMap: Record<string, string> = {}
      if (businessIds.length) {
        for (const sel of nameSelectors) {
          const res = await supabase.from('business_profiles').select(sel).in('id', businessIds)
          if (!res.error) {
            const mapped: Record<string, string> = {}
            for (const r of (res.data || []) as any[]) {
              const nm =
                (typeof r.name === 'string' && r.name) ||
                (typeof r.business_name === 'string' && r.business_name) ||
                (typeof r.company_name === 'string' && r.company_name) ||
                (typeof r.display_name === 'string' && r.display_name) ||
                (typeof r.legal_name === 'string' && r.legal_name) ||
                'Business'
              mapped[String(r.id)] = nm
            }
            nameMap = mapped
            break
          }
        }
      }

      setConsentReqs(rows.map((r) => ({ ...r, business_name: nameMap[String(r.business_id)] || 'Business' })))
    } finally {
      setConsentLoading(false)
    }
  }

  async function respondConsent(req: any, nextStatus: 'approved' | 'denied') {
    if (!req?.id) return
    setConsentBusyId(String(req.id))
    setConsentError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setConsentError('Please sign in to respond.')
        return
      }

      // Resolve talent id for this user (RLS should enforce anyway)
      const talentRes = await supabase.from('talent_profiles').select('id').eq('user_id', uid).single()
      const talentId = String(talentRes.data?.id ?? '')
      if (!talentId) {
        setConsentError('No talent profile found.')
        return
      }

      const upd = await supabase
        .from('talent_export_consent_requests')
        .update({ status: nextStatus, responded_at: new Date().toISOString(), responded_by_user_id: uid } as any)
        .eq('id', String(req.id))
        .select('id, business_id')
        .single()

      if (upd.error) {
        setConsentError(upd.error.message)
        return
      }

      const businessId = String((upd.data as any)?.business_id ?? req.business_id ?? '')

      await supabase.from('talent_export_consent_events').insert({
        request_id: String(req.id),
        talent_id: talentId,
        business_id: businessId,
        actor_type: 'talent',
        actor_user_id: uid,
        event_type: nextStatus === 'approved' ? 'approved' : 'denied',
        meta: { scope: req.scope || 'portfolio' },
      } as any)

      const cid = await ensureConversation(talentId, businessId)
      if (cid) {
        await supabase.from('messages').insert({
          conversation_id: cid,
          sender_type: 'talent',
          sender_user_id: uid,
          body:
            `Consent decision: ${nextStatus.toUpperCase()} for print/export.\n\n` +
            `Request ID: ${String(req.id)}\n` +
            `Scope: ${req.scope || 'portfolio'}\n\n` +
            `Reminder: Creerlio terms prohibit copying/printing without consent.`,
        } as any)
      }

      await loadConsentRequests()
    } finally {
      setConsentBusyId(null)
    }
  }

  // Load opportunity notifications from businesses
  async function loadNotifications() {
    setNotificationsLoading(true)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setNotifications([])
        return
      }

      const talentRes = await supabase.from('talent_profiles').select('id').eq('user_id', uid).single()
      if (talentRes.error || !talentRes.data?.id) {
        setNotifications([])
        return
      }
      const talentId = String(talentRes.data.id)

      const notifRes = await supabase
        .from('talent_notifications')
        .select('id, business_id, connection_request_id, notification_type, title, message, is_read, created_at, metadata')
        .eq('talent_id', talentId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (notifRes.error) {
        // Table might not exist yet
        if (/Could not find the table|relation .* does not exist/i.test(notifRes.error.message)) {
          console.log('[Notifications] Table not found - notifications feature not yet set up')
          setNotifications([])
          return
        }
        console.error('[Notifications] Error loading:', notifRes.error)
        setNotifications([])
        return
      }

      const rows = (notifRes.data || []) as any[]

      // Get business names for notifications
      const businessIds = Array.from(new Set(rows.map((r) => r.business_id).filter(Boolean)))
      let nameMap: Record<string, string> = {}
      if (businessIds.length > 0) {
        const nameRes = await supabase
          .from('business_profiles')
          .select('id, business_name, name')
          .in('id', businessIds)
        if (!nameRes.error && nameRes.data) {
          for (const bp of nameRes.data as any[]) {
            nameMap[String(bp.id)] = bp.business_name || bp.name || 'Business'
          }
        }
      }

      setNotifications(rows.map((r) => ({ ...r, business_name: nameMap[String(r.business_id)] || 'Business' })))
    } finally {
      setNotificationsLoading(false)
    }
  }

  // Mark notification as read
  async function markNotificationRead(notificationId: string) {
    try {
      await supabase
        .from('talent_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('[Notifications] Error marking as read:', err)
    }
  }

  // Messaging is now integrated into Connections tab - no separate useEffect needed

  async function loadSavedTemplates() {
    setSavedTemplatesLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        setSavedTemplates([])
        return
      }

      const { data, error } = await supabase
        .from('saved_templates')
        .select('id, template_id, name, template_state, created_at, updated_at')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setSavedTemplates(data || [])
    } catch (error: any) {
      console.error('Error loading saved templates:', error)
      setSavedTemplates([])
    } finally {
      setSavedTemplatesLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'connections' || isBusinessRoute) return
    // Auto-load connections when connections tab becomes active
    // Always reload to ensure data is fresh when switching to this tab
    loadConnections().catch(() => {})
    // Auto-load consent requests (only once per session)
    if (!didAutoLoadConsentRef.current) {
      didAutoLoadConsentRef.current = true
      loadConsentRequests().catch(() => {})
    }
    // Auto-load notifications (only once per session)
    if (!didAutoLoadNotificationsRef.current) {
      didAutoLoadNotificationsRef.current = true
      loadNotifications().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isBusinessRoute])

  useEffect(() => {
    if (activeTab === 'overview') {
      loadSavedTemplates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'connections' || !isBusinessRoute) return
    loadBusinessConnections().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isBusinessRoute])

  useEffect(() => {
    if (activeTab === 'overview') {
      loadSavedTemplates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Intentional: keep portfolio tab in-dashboard to show profile summary + actions.

  // Legacy backend (axios) auth + profile fetch removed. Supabase session is now the source of truth.

  const loadMessaging = async () => {
    setMsgLoading(true)
    setMsgError(null)
    try {
      const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()
      const hasSession = !!sessionRes?.session?.user?.id

      // Debug logging disabled

      if (!hasEnv) {
        setMsgError('Messaging is not configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).')
        return
      }
      if (sessionErr || !sessionRes.session) {
        setMsgError('Please sign in to use Messages.')
        return
      }

      const authedUserId = sessionRes.session.user.id

      const talentRes = await supabase
        .from('talent_profiles')
        .select('id')
        .eq('user_id', authedUserId)
        .single()

      // Debug logging disabled

      if (talentRes.error || !talentRes.data?.id) {
        setMsgError('Messaging is unavailable (no talent profile for this signed-in user, or schema mismatch).')
        return
      }

      const talentId = talentRes.data.id as string

      // Only show connected businesses: accepted connection requests
      const grantsRes = await supabase
        .from('talent_connection_requests')
        .select('business_id, status, responded_at')
        .eq('talent_id', talentId)
        .eq('status', 'accepted')

      if (grantsRes.error) {
        setMsgError('Could not load connections for messaging (permissions or schema issue).')
        return
      }

      const businessIds = Array.from(new Set((grantsRes.data || []).map((g: any) => g.business_id).filter(Boolean)))
      console.log('[Talent Messages] Business IDs from connections:', businessIds)
      
      if (businessIds.length === 0) {
        setMsgBusinesses([])
        setMsgSelectedBusinessId(null)
        setMsgConversationId(null)
        setMsgItems([])
        return
      }

      // Convert all IDs to strings for consistent matching
      const businessIdStrings = businessIds.map(id => String(id))

      // business_profiles "name" column varies across environments; attempt fallbacks without leaking data.
      // Try to get all possible name fields in one query (mirroring the working business dashboard approach)
      const nameSelectors = ['id, name, business_name, company_name, display_name, legal_name']
      let bizRows: Array<{ id: string; name: string | null }> | null = null
      let lastBizErr: any = null

      for (const sel of nameSelectors) {
        const attempt = await supabase.from('business_profiles').select(sel).in('id', businessIdStrings)
        console.log('[Talent Messages] Business query attempt:', {
          selector: sel,
          error: attempt.error,
          dataCount: attempt.data?.length,
          data: attempt.data
        })
        
        if (!attempt.error && attempt.data && attempt.data.length > 0) {
          const mapped = (attempt.data || []).map((r: any) => {
            const n =
              (typeof r.business_name === 'string' && r.business_name.trim()) ||
              (typeof r.name === 'string' && r.name.trim()) ||
              (typeof r.company_name === 'string' && r.company_name.trim()) ||
              (typeof r.display_name === 'string' && r.display_name.trim()) ||
              (typeof r.legal_name === 'string' && r.legal_name.trim()) ||
              null
            console.log('[Talent Messages] Mapped business:', { id: String(r.id), name: n, raw: r })
            return { id: String(r.id), name: n || 'Business' }
          })
          bizRows = mapped
          break
        }
        lastBizErr = attempt.error
      }
      
      // Fallback: if the above query fails, try individual queries (mirroring business dashboard)
      if (!bizRows || bizRows.length === 0) {
        console.log('[Talent Messages] Trying fallback queries...')
        const fallbackSelectors = ['id, name', 'id, business_name', 'id, company_name', 'id, display_name', 'id, legal_name']
        for (const sel of fallbackSelectors) {
          const attempt = await supabase.from('business_profiles').select(sel).in('id', businessIdStrings)
          console.log('[Talent Messages] Fallback query:', { selector: sel, error: attempt.error, dataCount: attempt.data?.length })
          if (!attempt.error && attempt.data && attempt.data.length > 0) {
            const mapped = (attempt.data || []).map((r: any) => {
              const n =
                (typeof r.name === 'string' && r.name.trim()) ||
                (typeof r.business_name === 'string' && r.business_name.trim()) ||
                (typeof r.company_name === 'string' && r.company_name.trim()) ||
                (typeof r.display_name === 'string' && r.display_name.trim()) ||
                (typeof r.legal_name === 'string' && r.legal_name.trim()) ||
                null
              return { id: String(r.id), name: n || 'Business' }
            })
            bizRows = mapped
            console.log('[Talent Messages] Fallback query succeeded:', bizRows)
            break
          }
          lastBizErr = attempt.error
        }
      }

      // If still no results, try querying each business individually
      if (!bizRows || bizRows.length === 0) {
        console.log('[Talent Messages] Trying individual queries for each business...')
        bizRows = []
        for (const id of businessIdStrings) {
          const individualQuery = await supabase
            .from('business_profiles')
            .select('id, business_name, name, company_name, display_name, legal_name')
            .eq('id', id)
            .maybeSingle()
          
          console.log('[Talent Messages] Individual query for', id, ':', {
            error: individualQuery.error,
            data: individualQuery.data
          })
          
          if (individualQuery.data) {
            const b = individualQuery.data
            const n =
              (b.business_name && String(b.business_name).trim()) ||
              (b.name && String(b.name).trim()) ||
              (b.company_name && String(b.company_name).trim()) ||
              (b.display_name && String(b.display_name).trim()) ||
              (b.legal_name && String(b.legal_name).trim()) ||
              'Business'
            bizRows.push({ id: String(id), name: n })
          } else {
            bizRows.push({ id: String(id), name: 'Business' })
          }
        }
      }

      // Ensure all business IDs have entries
      const foundIds = new Set(bizRows.map(b => b.id))
      businessIdStrings.forEach((id) => {
        if (!foundIds.has(id)) {
          bizRows!.push({ id: id, name: 'Business' })
        }
      })

      console.log('[Talent Messages] Final business rows:', bizRows)
      setMsgBusinesses(bizRows)
    } finally {
      setMsgLoading(false)
    }
  }

  const loadConversation = async (businessId: string) => {
    setMsgSelectedBusinessId(businessId)
    setMsgLoading(true)
    setMsgError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      if (!sessionRes?.session?.user?.id) {
        setMsgError('Please sign in to use Messages.')
        return
      }
      const authedUserId = sessionRes.session.user.id
      const talentRes = await supabase.from('talent_profiles').select('id').eq('user_id', authedUserId).single()
      if (talentRes.error || !talentRes.data?.id) {
        setMsgError('Messaging is unavailable (no talent profile for this signed-in user).')
        return
      }
      const talentId = talentRes.data.id as string

      if (!isBusinessRoute) {
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
    if (!body || !msgSelectedBusinessId) return
    setMsgLoading(true)
    setMsgError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      if (!sessionRes?.session?.user?.id) {
        setMsgError('Please sign in to use Messages.')
        return
      }
      const authedUserId = sessionRes.session.user.id
      const talentRes = await supabase.from('talent_profiles').select('id').eq('user_id', authedUserId).single()
      if (talentRes.error || !talentRes.data?.id) {
        setMsgError('Messaging is unavailable (no talent profile for this signed-in user).')
        return
      }
      const talentId = talentRes.data.id as string
      const businessId = msgSelectedBusinessId

      // Debug logging disabled

      if (!isBusinessRoute) {
        // Permission gate (career connections require acceptance)
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

        // Debug logging disabled

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
        .insert({ conversation_id: convId, sender_type: 'talent', sender_user_id: authedUserId, body })

      // Debug logging disabled

      if (insertRes.error) {
        setMsgError('Could not send message (permissions or schema issue).')
        return
      }

      setMsgBody('')
      await loadConversation(businessId)
      if (isBusinessRoute) {
        await loadBusinessConnections()
      }
    } finally {
      setMsgLoading(false)
    }
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    if (!talentProfile) return 0
    
    const fields = [
      talentProfile.name,
      talentProfile.email,
      talentProfile.title,
      talentProfile.bio,
      talentProfile.skills && Array.isArray(talentProfile.skills) && talentProfile.skills.length > 0,
      talentProfile.location || (talentProfile.city && talentProfile.country),
      talentProfile.portfolio_url || talentProfile.portfolio_data
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
      'Are you sure you want to delete your Talent account? This action cannot be undone. All your profile data, portfolio, and connections will be permanently deleted.'
    )
    
    if (!confirmed) return

    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const userId = sessionRes.session?.user?.id
      if (!userId) {
        alert('No active session found.')
        return
      }

      // Delete talent profile first
      const { error: profileError } = await supabase
        .from('talent_profiles')
        .delete()
        .eq('user_id', userId)

      if (profileError) {
        console.error('Error deleting talent profile:', profileError)
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
      
      alert('Your Talent account has been deleted successfully.')
    } catch (error: any) {
      console.error('Error deleting registration:', error)
      alert(`Failed to delete account: ${error?.message || 'Unknown error'}. Please contact support.`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-gray-900 text-2xl font-bold">Creerlio</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">Welcome, {userFirstName || user?.full_name || user?.username}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Logout
          </button>
          <button
            onClick={handleDeleteRegistration}
            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete Registration
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Talent Dashboard</h1>
          <p className="text-gray-600">Manage your profile, portfolio, and job applications</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {(['overview', 'portfolio', 'applications', 'connections'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (isBusinessRoute) {
                    router.push(`/dashboard/talent?tab=${tab}`)
                    return
                  }
                  setActiveTab(tab)
                }}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  !isBusinessRoute && activeTab === tab
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab === 'connections' ? 'Career Connections' : tab === 'portfolio' ? 'View Portfolio' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {!isBusinessRoute && tab === 'connections' && notifications.filter((n) => !n.is_read).length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full animate-pulse">
                      {notifications.filter((n) => !n.is_read).length}
                    </span>
                  )}
                </span>
                {!isBusinessRoute && activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                )}
              </button>
            ))}
            <Link
              href="/dashboard/talent/bank"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Talent Bank ↗
            </Link>
            <Link
              href="/talent-map"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Talent Map ↗
            </Link>
            <Link
              href="/portfolio/templates"
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Portfolio Templates ↗
            </Link>
            <Link
              href="/dashboard/talent/business-connections"
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                isBusinessRoute
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Business Connections
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Calendar Card */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Calendar</h2>
                {calendarItems.length ? (
                  <div className="space-y-3">
                    {calendarItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('connections')
                          setConnectionMode('business')
                          const match = connAccepted.find((r) => String(r.id) === String(item.id))
                          if (match) setSelectedRequest(match)
                          emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H13',location:'dashboard/talent/page.tsx:calendar',message:'calendar item click',data:{id:item.id},timestamp:Date.now()})
                        }}
                        className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                        <div className="text-xs text-gray-600">{item.dateLabel}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    No confirmed bookings yet. Interactions will appear here once confirmed.
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/resume/upload"
                    className="block px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Upload Resume
                  </Link>
                  <Link
                    href="/dashboard/talent/bank"
                    className="block px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Talent Bank
                  </Link>
                  <Link
                    href="/portfolio"
                    className="block px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Edit Portfolio
                  </Link>
                  <Link
                    href="/portfolio/view"
                    className="block px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    View Portfolio
                  </Link>
                  <Link
                    href="/search"
                    className="block px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Search Businesses & Jobs
                  </Link>
                </div>
              </div>

              {/* Map */}
              <div className="dashboard-card rounded-xl p-0 overflow-hidden" style={{ height: '320px' }}>
                {typeof window !== 'undefined' && (overviewMarkers.length || discoverableMarkers.length) ? (
                  <SearchMap
                    markers={[...overviewMarkers, ...discoverableMarkers]}
                    center={overviewCenter ?? undefined}
                    zoom={11}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <p className="text-sm">Map loading…</p>
                      <p className="text-xs">Connected and nearby businesses will appear here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Talent Profile Section */}
            {talentProfile ? (
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Talent Profile</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {talentProfile.skills?.map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm border border-blue-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                    <p className="text-gray-700">{talentProfile.location || 'Not set'}</p>
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-6">
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Talent Profile</h2>
                <p className="text-gray-600 mb-4">Complete your profile to start matching with opportunities</p>
                <Link
                  href="/portfolio"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Profile
                </Link>
              </div>
            </div>
            )}

            {/* Saved Templates Section */}
            <div className="dashboard-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Saved Templates</h2>
                <Link
                  href="/portfolio/templates"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Browse Templates
                </Link>
              </div>
              {savedTemplatesLoading ? (
                <p className="text-gray-600">Loading saved templates...</p>
              ) : savedTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No saved template configurations yet.</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Edit a template and save it with a name to access it quickly here.
                  </p>
                  <Link
                    href="/portfolio/templates"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Templates
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-gray-900 font-semibold">{template.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">
                            Template: {template.template_id}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Updated: {new Date(template.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/portfolio/template/${template.template_id}?load=${template.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Load
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete "${template.name}"? This action cannot be undone.`)) {
                                return
                              }
                              try {
                                const { data: { session } } = await supabase.auth.getSession()
                                if (!session?.user?.id) return
                                
                                const { error } = await supabase
                                  .from('saved_templates')
                                  .delete()
                                  .eq('id', template.id)
                                  .eq('user_id', session.user.id)
                                
                                if (error) throw error
                                await loadSavedTemplates()
                              } catch (err: any) {
                                console.error('Error deleting saved template:', err)
                                alert(err.message || 'Failed to delete saved template')
                              }
                            }}
                            className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                      <label className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
                      <p className="text-gray-900">{user.full_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">User Type</label>
                    <p className="text-gray-900 capitalize">{user.user_type}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Intent Mode</h3>
                      <p className="text-sm text-gray-600">
                        Share what you are open to right now, with clear boundaries and visibility control.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIntentCollapsed((v) => !v)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {intentCollapsed ? 'Expand' : 'Collapse'}
                    </button>
                  </div>

                  {!intentCollapsed && (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          id="intent-visibility"
                          type="checkbox"
                          className="accent-blue-600"
                          checked={intentMode.visibility}
                          onChange={(e) => setIntentMode((p) => ({ ...p, visibility: e.target.checked }))}
                        />
                        <label htmlFor="intent-visibility" className="text-sm text-gray-700">
                          Visibility on (share intent signal in discovery)
                        </label>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Intent status</label>
                          <select
                            value={intentMode.intent_status}
                            onChange={(e) => setIntentMode((p) => ({ ...p, intent_status: e.target.value as TalentIntentStatus }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                          >
                            <option value="open_to_conversations">Open to conversations</option>
                            <option value="passive_exploring">Passive exploring</option>
                            <option value="not_available">Not available</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Preferred work type</label>
                          <select
                            value={intentMode.preferred_work_type}
                            onChange={(e) => setIntentMode((p) => ({ ...p, preferred_work_type: e.target.value as IntentWorkType }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                          >
                            <option value="">Select</option>
                            <option value="full_time">Full-time</option>
                            <option value="part_time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="advisory">Advisory</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Location mode</label>
                          <select
                            value={intentMode.location_mode}
                            onChange={(e) => setIntentMode((p) => ({ ...p, location_mode: e.target.value as IntentLocationMode }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                          >
                            <option value="">Select</option>
                            <option value="on_site">On-site</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="remote">Remote</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Availability timeframe</label>
                          <select
                            value={intentMode.availability_timeframe}
                            onChange={(e) => setIntentMode((p) => ({ ...p, availability_timeframe: e.target.value as IntentAvailability }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                          >
                            <option value="">Select</option>
                            <option value="immediate">Immediate</option>
                            <option value="1_3_months">1–3 months</option>
                            <option value="3_6_months">3–6 months</option>
                            <option value="future">Future</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Base location</label>
                          <input
                            value={intentMode.base_location}
                            onChange={(e) => setIntentMode((p) => ({ ...p, base_location: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                            placeholder="Suburb or city"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Radius (km)</label>
                          <input
                            type="number"
                            min={1}
                            value={intentMode.radius_km}
                            onChange={(e) => setIntentMode((p) => ({ ...p, radius_km: Number(e.target.value) }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Role themes (comma-separated)</label>
                        <input
                          value={intentMode.role_themes}
                          onChange={(e) => setIntentMode((p) => ({ ...p, role_themes: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                          placeholder="e.g., platform engineering, product discovery"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Industry preferences (comma-separated)</label>
                        <input
                          value={intentMode.industry_preferences}
                          onChange={(e) => setIntentMode((p) => ({ ...p, industry_preferences: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                          placeholder="e.g., health, fintech, climate"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Salary band</label>
                        <select
                          value={intentMode.salary_band}
                          onChange={(e) => setIntentMode((p) => ({ ...p, salary_band: e.target.value as IntentSalaryBand }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                        >
                          <option value="">Select</option>
                          <option value="entry">Entry</option>
                          <option value="mid">Mid</option>
                          <option value="senior">Senior</option>
                          <option value="executive">Executive</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>

                      {intentError && (
                        <div className="text-sm text-red-600">{intentError}</div>
                      )}

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={saveIntentMode}
                          disabled={intentSaving}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                        >
                          {intentSaving ? 'Saving...' : 'Save Intent Mode'}
                        </button>
                        <span className="text-xs text-gray-500">
                          You can turn this off any time without affecting your profile.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href="/dashboard/talent/edit"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <div className="dashboard-card rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">View Portfolio</h2>
              {user && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Summary</h3>
                    <p className="text-gray-700"><span className="text-gray-600">Name:</span> {talentProfile?.name || user.full_name || user.username}</p>
                    <p className="text-gray-700"><span className="text-gray-600">Email:</span> {user.email}</p>
                    {talentProfile?.title && (
                      <p className="text-gray-700"><span className="text-gray-600">Title:</span> {talentProfile.title}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/portfolio/view"
                      onClick={() => {
                        // #region agent log
                        emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H12',location:'dashboard/talent/page.tsx:view-profile',message:'view profile click',data:{target:'/portfolio/view'},timestamp:Date.now()})
                        // #endregion
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      View Profile
                    </Link>
                    <Link
                      href="/portfolio"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Edit Portfolio
                    </Link>
                  </div>
                </div>
              )}
            </div>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'applied' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          app.status === 'shortlisted' ? 'bg-green-50 text-green-600 border border-green-200' :
                          app.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                          app.status === 'hired' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                          'bg-gray-50 text-gray-600 border border-gray-200'
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
                  href="/jobs"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="dashboard-card rounded-xl p-6">
            {isBusinessRoute ? (
              <div className="space-y-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Business Connections</h2>
                    <p className="text-gray-600 text-sm">
                      Discover and manage private service relationships. All communication stays inside Creerlio.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadBusinessConnections()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                      disabled={bizConnectionsLoading}
                    >
                      Refresh connections
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="border border-gray-200 rounded-lg p-4 lg:col-span-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Find a Business</h3>
                        <p className="text-sm text-gray-600">Search registered Creerlio businesses by service and location.</p>
                      </div>
                    </div>
                    <form
                      className="mt-4 space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        loadBusinessSearch()
                      }}
                    >
                      <input
                        value={bizSearchQuery}
                        onChange={(e) => {
                          setBizSearchQuery(e.target.value)
                          scheduleBusinessSearch()
                        }}
                        placeholder="Search businesses on Creerlio (e.g. mechanic, accountant, pizza)"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setBizFiltersOpen((v) => !v)}
                        className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {bizFiltersOpen ? 'Hide filters' : 'Show filters'}
                      </button>
                      {bizFiltersOpen && (
                        <div className="space-y-3">
                          <label className="block text-xs text-gray-500">Category</label>
                          <input
                            value={bizSearchCategory}
                            onChange={(e) => {
                              setBizSearchCategory(e.target.value)
                              scheduleBusinessSearch()
                            }}
                            placeholder="e.g. Accounting"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <label className="block text-xs text-gray-500">Location</label>
                          <input
                            value={bizSearchLocation}
                            onChange={(e) => {
                              setBizSearchLocation(e.target.value)
                              scheduleBusinessSearch()
                            }}
                            placeholder="Suburb / city"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <label className="block text-xs text-gray-500">Distance</label>
                          <select
                            value={bizSearchDistance}
                            onChange={(e) => {
                              setBizSearchDistance(e.target.value)
                              scheduleBusinessSearch()
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="5">Within 5 km</option>
                            <option value="10">Within 10 km</option>
                            <option value="25">Within 25 km</option>
                            <option value="50">Within 50 km</option>
                          </select>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Search
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBizSearchQuery('')
                            setBizSearchCategory('')
                            setBizSearchLocation('')
                            setBizResults([])
                            setSelectedBusiness(null)
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </form>

                    <div className="mt-4 space-y-3">
                      {bizSearchError && (
                        <div className="border border-red-300 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                          {bizSearchError}
                        </div>
                      )}
                      {bizSearchLoading && <p className="text-gray-600 text-sm">Searching businesses…</p>}
                      {!bizSearchLoading && bizResults.length === 0 && (
                        <p className="text-gray-500 text-sm">No results yet. Try a broader search.</p>
                      )}
                      <p className="text-xs text-gray-500">Results</p>
                      {bizResults.map((b) => (
                        <div
                          key={b.id}
                          className={`w-full text-left border rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors ${
                            selectedBusiness?.id === b.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedBusiness(b)}
                            className="w-full text-left"
                          >
                            <p className="text-gray-900 font-semibold">{b.name}</p>
                            <p className="text-gray-600 text-sm mt-1">
                              {[b.category, [b.city, b.state].filter(Boolean).join(', ')].filter(Boolean).join(' • ') || 'Business'}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBusiness(b)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            View commercial profile
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4" id="business-profile-panel">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Profile (Commercial View)</h3>
                    {selectedBusiness ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-900 font-semibold">{selectedBusiness.name}</p>
                          {selectedBusiness.description && (
                            <p className="text-gray-600 text-sm mt-1">{selectedBusiness.description}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {selectedBusiness.category && <p>Services: {selectedBusiness.category}</p>}
                          <p>
                            Location: {[selectedBusiness.city, selectedBusiness.state, selectedBusiness.country].filter(Boolean).join(', ') || 'Not listed'}
                          </p>
                          {selectedBusiness.hours && <p>Hours: {selectedBusiness.hours}</p>}
                          <p>
                            Availability:{' '}
                            <span className={selectedBusiness.is_online ? 'text-green-600' : 'text-gray-500'}>
                              {selectedBusiness.is_online ? 'Available' : 'Unavailable'}
                            </span>
                          </p>
                          {selectedBusiness.website && (
                            <p>
                              Website:{' '}
                              <a href={selectedBusiness.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">
                                {selectedBusiness.website}
                              </a>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => openBusinessConversation(String(selectedBusiness.id))}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Message this business
                          </button>
                          {selectedBusiness.is_online && getCommercialRequestId(String(selectedBusiness.id)) && (
                            <button
                              type="button"
                              onClick={() =>
                                startBusinessVideoChat(
                                  getCommercialRequestId(String(selectedBusiness.id)) as string,
                                  String(selectedBusiness.id),
                                  selectedBusiness.name
                                )
                              }
                              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                            >
                              Start video chat
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Select a business from search results to view the commercial profile.
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">My Business Connections</h3>
                      <p className="text-sm text-gray-600">Ongoing service relationships and message history.</p>
                    </div>
                    <button
                      onClick={() => loadBusinessConnections()}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                      disabled={bizConnectionsLoading}
                    >
                      Refresh
                    </button>
                  </div>
                  {bizConnectionsError && (
                    <div className="mb-3 border border-red-300 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                      {bizConnectionsError}
                    </div>
                  )}
                  {bizConnectionsLoading ? (
                    <p className="text-gray-600 text-sm">Loading business connections…</p>
                  ) : bizConnections.length === 0 ? (
                    <p className="text-gray-600 text-sm">No business conversations yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {bizConnections.map((c) => (
                        <div
                          key={c.conversation_id}
                          className="border border-gray-200 rounded-lg p-4"
                          onClick={() => openBusinessConversation(c.business_id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{c.name}</p>
                              <p className="text-gray-600 text-xs mt-1">{c.last_message || 'No message preview available.'}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {new Date(c.last_at).toLocaleString()}
                              </p>
                              {mutedBusinessIds.includes(c.business_id) && (
                                <p className="text-xs text-amber-600 mt-1">Muted</p>
                              )}
                              {snoozedBusinessIds.includes(c.business_id) && (
                                <p className="text-xs text-blue-600 mt-1">Respond later</p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => openBusinessConversation(c.business_id)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              >
                                Message
                              </button>
                              {getCommercialRequestId(c.business_id) && (
                                <button
                                  onClick={() =>
                                    startBusinessVideoChat(
                                      getCommercialRequestId(c.business_id) as string,
                                      c.business_id,
                                      c.name
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs"
                                >
                                  Video Chat
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/dashboard/business/view?id=${c.business_id}`)}
                                className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-xs"
                              >
                                View Business
                              </button>
                              <button
                                onClick={() => disconnectBusinessConnection(c.business_id, c.conversation_id)}
                                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs"
                              >
                                Disconnect
                              </button>
                              <button
                                onClick={() => toggleMuted(c.business_id)}
                                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                              >
                                {mutedBusinessIds.includes(c.business_id) ? 'Unmute' : 'Mute'}
                              </button>
                              <button
                                onClick={() => toggleSnoozed(c.business_id)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs hover:bg-blue-100"
                              >
                                {snoozedBusinessIds.includes(c.business_id) ? 'Resume' : 'Respond later'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
            <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Connections</h2>
                <p className="text-gray-600 text-sm">
                  {connectionMode === 'career'
                    ? 'Request career connections with businesses. Messaging unlocks only after acceptance.'
                    : 'Manage commercial and service-based relationships with businesses.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadConnections()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
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

            {!isBusinessRoute && (
              <div className="flex items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setConnectionMode('career')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    connectionMode === 'career'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Career Connections
                </button>
              </div>
            )}

            {connError && (
              <div className="mb-4 border border-red-300 bg-red-50 text-red-700 rounded-lg p-4">
                {connError}
              </div>
            )}

            {/* Opportunity Notifications from Businesses */}
            {!isBusinessRoute && connectionMode === 'career' && notifications.filter((n) => !n.is_read).length > 0 && (
              <div className="mb-6 border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                  <h3 className="text-amber-800 font-semibold">New Opportunity Invitations</h3>
                  <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                    {notifications.filter((n) => !n.is_read).length} new
                  </span>
                </div>
                <p className="text-amber-700 text-sm mb-4">
                  These businesses you previously connected with would like to reconnect. They may have new opportunities for you!
                </p>
                <div className="space-y-3">
                  {notifications.filter((n) => !n.is_read).map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{notif.title}</p>
                          <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                          <p className="text-amber-600 text-xs mt-2">
                            Received {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationRead(notif.id)
                              // Navigate to reconnect with the business
                              if (notif.business_id) {
                                router.push(`/dashboard/talent/connect/${notif.business_id}?reconnect=true`)
                              }
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-semibold transition-colors"
                          >
                            Reconnect
                          </button>
                          <button
                            type="button"
                            onClick={() => markNotificationRead(notif.id)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {!isBusinessRoute && (
                <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-gray-900 font-semibold mb-3">Print / export consent requests</h3>
                <p className="text-gray-500 text-xs mb-3">
                  Businesses cannot print/export your content via in-app controls unless you approve here. Screenshots can’t be fully prevented on the web, but we record consent decisions.
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
                              <p className="text-gray-900 text-sm font-medium">{r.business_name || 'Business'}</p>
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
              )}

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-gray-900 font-semibold mb-3">
                  {connectionMode === 'career' ? 'Career Connection Requests' : 'Business Connection Requests'}
                </h3>
                <p className="text-gray-600 text-xs mb-3">
                  {connectionMode === 'career'
                    ? 'Businesses requesting to connect about career opportunities'
                    : 'Businesses requesting a commercial or service relationship'}
                </p>
                {connLoading ? (
                  <p className="text-gray-600">Loading connection requests…</p>
                ) : (connectionMode === 'career' ? careerRequests : businessRequests).length === 0 ? (
                  <p className="text-gray-600 text-sm">No connection requests from businesses yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(connectionMode === 'career' ? careerRequests : businessRequests).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRequest(r)}
                        className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <p className="text-gray-900 text-sm font-medium">{r.business_name || 'Business'}</p>
                        <p className="text-gray-600 text-xs mt-1">
                          Request received {new Date(r.created_at).toLocaleString()}
                        </p>
                        <p className="text-blue-600 text-xs mt-1">Click to view details and respond</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                <h3 className="text-gray-900 font-semibold mb-3">
                  {connectionMode === 'career' ? 'Career Connections' : 'Business Connections'}
                </h3>
                {connLoading ? (
                  <p className="text-gray-600">Loading connections…</p>
                ) : (connectionMode === 'career' ? careerAccepted : businessAccepted).length === 0 ? (
                  <p className="text-gray-600">No accepted connections yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(connectionMode === 'career' ? careerAccepted : businessAccepted).map((r) => {
                      const handleDiscontinue = async () => {
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
                            alert('Failed to discontinue connection. Please try again.')
                            console.error('Error discontinuing connection:', error)
                          } else {
                            // Reload connections
                            await loadConnections()
                            // Clear messaging if this was the selected business
                            if (msgSelectedBusinessId === String(r.business_id)) {
                              setMsgSelectedBusinessId(null)
                              setMsgConversationId(null)
                              setMsgItems([])
                            }
                          }
                        } catch (err) {
                          console.error('Error discontinuing connection:', err)
                          alert('An error occurred. Please try again.')
                        }
                      }
                      
                      const handleOpenMessages = async () => {
                        // Load messaging for this business
                        await loadMessaging()
                        setMsgSelectedBusinessId(String(r.business_id))
                        await loadConversation(String(r.business_id))
                      }
                      
                      return (
                      <div key={r.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 text-sm font-semibold">{r.business_name || 'Business'}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Accepted {r.responded_at ? new Date(r.responded_at).toLocaleString() : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleOpenMessages}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                            >
                              Messages
                            </button>
                            <button
                              onClick={() => {
                                router.push(`/dashboard/business/view?id=${r.business_id}&from_connection=${r.id}`)
                              }}
                              className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
                            >
                              View Business
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
                                      initiated_by: 'talent',
                                      recording_enabled: true
                                    })
                                  })
                                  
                                  if (!response.ok) {
                                    const errorText = await response.text()
                                    throw new Error(errorText || `HTTP error! status: ${response.status}`)
                                  }
                                  
                                  const data = await response.json()
                                  
                                  if (!data.success) {
                                    throw new Error(data.error || 'Failed to initiate video chat')
                                  }
                                  
                                  if (data.session) {
                                    setVideoChatSession({
                                      ...data.session,
                                      businessId: r.business_id,
                                      businessName: r.business_name || 'Business',
                                      talentName: talentProfile?.name || 'Talent'
                                    })
                                  } else {
                                    throw new Error('Invalid response from server')
                                  }
                                } catch (err: any) {
                                  console.error('[Talent Dashboard] Video chat error:', err)
                                  setVideoChatError(err.message || 'Failed to start video chat')
                                  alert(err.message || 'Failed to start video chat')
                                } finally {
                                  setVideoChatLoading(false)
                                }
                              }}
                              disabled={videoChatLoading}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                            >
                              {videoChatLoading ? 'Starting...' : 'Video Chat'}
                            </button>
                            <button
                              onClick={handleDiscontinue}
                              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors"
                            >
                              Discontinue
                            </button>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>

              {/* Declined Requests */}
              <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                <h3 className="text-gray-900 font-semibold mb-3">
                  {connectionMode === 'career' ? 'Declined Career Requests' : 'Declined Business Requests'}
                </h3>
                <p className="text-gray-600 text-xs mb-3">Declined connection requests (automatically deleted after 30 days)</p>
                {connLoading ? (
                  <p className="text-gray-600">Loading declined requests…</p>
                ) : (connectionMode === 'career' ? careerDeclined : businessDeclined).length === 0 ? (
                  <p className="text-gray-600 text-sm">No declined connection requests.</p>
                ) : (
                  <div className="space-y-3">
                    {(connectionMode === 'career' ? careerDeclined : businessDeclined).map((r) => {
                      const respondedAt = r.responded_at ? new Date(r.responded_at) : new Date(r.created_at)
                      const now = new Date()
                      const daysSinceDeclined = Math.floor((now.getTime() - respondedAt.getTime()) / (1000 * 60 * 60 * 24))
                      const daysRemaining = Math.max(0, 30 - daysSinceDeclined)
                      
                      return (
                        <div
                          key={r.id}
                          className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900 text-sm font-medium">{r.business_name || 'Business'}</p>
                              <p className="text-gray-600 text-xs mt-1">
                                Declined {respondedAt.toLocaleString()}
                              </p>
                              {daysRemaining > 0 ? (
                                <p className="text-orange-600 text-xs mt-1">
                                  Will be deleted in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                                </p>
                              ) : (
                                <p className="text-red-600 text-xs mt-1">
                                  Expired - will be deleted soon
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  router.push(`/dashboard/business/view?id=${r.business_id}&from_connection_request=${r.id}&review_declined=true`)
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 text-xs"
                              >
                                Review Business
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Permanently delete this declined connection request? This action cannot be undone.`)) {
                                    return
                                  }
                                  try {
                                    const { error } = await supabase
                                      .from('talent_connection_requests')
                                      .delete()
                                      .eq('id', r.id)
                                    
                                    if (error) throw error
                                    
                                    // Remove from local state
                                    setConnDeclined((prev) => prev.filter((req) => req.id !== r.id))
                                  } catch (err: any) {
                                    console.error('Error deleting declined request:', err)
                                    alert(err.message || 'Failed to delete declined request. Please try again.')
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-60 text-xs"
                              >
                                Delete Now
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Previous Connections - Businesses where either party withdrew */}
              {(connectionMode === 'career' ? careerWithdrawn : businessWithdrawn).length > 0 && (
                <div className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <h3 className="text-amber-900 font-semibold">Previous Connections</h3>
                    <span className="text-amber-600/80 text-xs ml-2">({(connectionMode === 'career' ? careerWithdrawn : businessWithdrawn).length} withdrawn)</span>
                  </div>
                  <p className="text-amber-800 text-xs mb-4">
                    These are businesses you were previously connected with. The connection has ended.
                    You can request to reconnect - if accepted, your previous messages and video chat history will be restored.
                  </p>
                  <div className="space-y-3">
                    {(connectionMode === 'career' ? careerWithdrawn : businessWithdrawn).map((r) => {
                      const withdrawnAt = r.responded_at ? new Date(r.responded_at) : new Date(r.created_at)
                      const connectedAt = r.created_at ? new Date(r.created_at) : null

                      return (
                        <div
                          key={r.id}
                          className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm hover:border-amber-400 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{r.business_name || 'Business'}</p>
                              {connectedAt && (
                                <p className="text-gray-500 text-xs mt-1">
                                  Originally connected {connectedAt.toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-amber-600 text-xs mt-0.5">
                                Connection ended {withdrawnAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReconnectModal({
                                    open: true,
                                    connection: r,
                                    message: `Hi,\n\nI would like to reconnect with ${r.business_name || 'your business'}. I was previously connected and would appreciate the opportunity to work together again.\n\nThank you for considering my request.`
                                  })
                                }}
                                disabled={requestingReconnect === r.id}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-60"
                              >
                                Request Reconnect
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConnectionSummaryModal({
                                    open: true,
                                    connection: r
                                  })
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
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
            </div>
            )}

            {/* Messaging UI - shown when a business is selected */}
            {msgSelectedBusinessId && (
              <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <p className="text-gray-900 font-medium">
                    {`Messages with ${getBusinessDisplayName(String(msgSelectedBusinessId))}`}
                  </p>
                  <button
                    onClick={() => {
                      setMsgSelectedBusinessId(null)
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
                            m.sender_type === 'talent'
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

                {msgSelectedBusinessId && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-end gap-3">
                      <textarea
                        value={msgBody}
                        onChange={(e) => setMsgBody(e.target.value)}
                        placeholder="Write a message…"
                        rows={2}
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={msgLoading || !msgBody.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
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

            {/* Connection Request Detail Modal */}
            {selectedRequest && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Connection Request Details
                    </h2>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Business Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedRequest.business_name || 'Business'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Connection request received on {new Date(selectedRequest.created_at).toLocaleString()}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {(selectedRequest.status === 'pending' || selectedRequest.status === 'waiting_for_review') && (
                      <div className={`p-3 border rounded-lg ${
                        selectedRequest.status === 'waiting_for_review'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <p className={`text-sm ${
                          selectedRequest.status === 'waiting_for_review'
                            ? 'text-orange-700'
                            : 'text-yellow-700'
                        }`}>
                          {selectedRequest.status === 'waiting_for_review'
                            ? '📋 This connection request is waiting for your review. Review their profile and accept or decline the request.'
                            : '⏳ This business has requested to connect with you. Review their profile and accept or decline the request.'}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 gap-3">
                      <button
                        onClick={() => setSelectedRequest(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Close
                      </button>
                      <div className="flex items-center gap-3">
                        {/* View Business Profile Button */}
                        <button
                          onClick={async () => {
                            try {
                              // Navigate to business profile view page with business_id parameter
                              router.push(`/dashboard/business/view?id=${selectedRequest.business_id}&from_connection_request=${selectedRequest.id}`)
                              setSelectedRequest(null)
                            } catch (err) {
                              console.error('Error navigating to business profile:', err)
                              alert('Failed to load business profile. Please try again.')
                            }
                          }}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          View Business Profile
                        </button>
                        
                        {/* Accept/Reject buttons (only show for pending or waiting_for_review requests) */}
                        {(selectedRequest.status === 'pending' || selectedRequest.status === 'waiting_for_review') && (
                          <>
                            <button
                              onClick={async () => {
                                if (!confirm(`Accept connection request from ${selectedRequest.business_name || 'this business'}? You'll be able to message and collaborate with them.`)) {
                                  return
                                }
                                
                                try {
                                  // Get the current user's talent profile ID
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
                                    .eq('id', selectedRequest.id)
                                    .eq('talent_id', talentId) // Ensure we're updating the correct request
                                  
                                  if (error) {
                                    console.error('Error updating connection request:', error)
                                    throw error
                                  }
                                  
                                  // Verify the update was successful by checking the response
                                  const verifyRes = await supabase
                                    .from('talent_connection_requests')
                                    .select('status, talent_id')
                                    .eq('id', selectedRequest.id)
                                    .single()
                                  
                                  if (verifyRes.error) {
                                    console.error('Verification query error:', verifyRes.error)
                                    throw new Error(`Failed to verify update: ${verifyRes.error.message}. Please check if you have permission to update this request.`)
                                  }
                                  
                                  if (!verifyRes.data || verifyRes.data.status !== 'accepted') {
                                    console.error('Update verification failed:', { 
                                      expected: 'accepted', 
                                      actual: verifyRes.data?.status,
                                      requestId: selectedRequest.id,
                                      talentId: talentId,
                                      requestTalentId: verifyRes.data?.talent_id
                                    })
                                    throw new Error(`Update verification failed. Status is still '${verifyRes.data?.status || 'unknown'}'. The update may have been blocked by permissions.`)
                                  }
                                  
                                  // Create a conversation for messaging (if it doesn't exist)
                                  await ensureConversation(talentId, String(selectedRequest.business_id))
                                  
                                  alert('Connection accepted! You can now message and collaborate with this business.')
                                  setSelectedRequest(null)
                                  
                                  // Reload connections to reflect the updated status
                                  await loadConnections()
                                } catch (err: any) {
                                  console.error('Error accepting connection:', err)
                                  alert(err.message || 'Failed to accept connection request. Please try again.')
                                }
                              }}
                              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                            >
                              Accept Connection
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Decline connection request from ${selectedRequest.business_name || 'this business'}? This action cannot be undone.`)) {
                                  return
                                }
                                
                                try {
                                  const { error } = await supabase
                                    .from('talent_connection_requests')
                                    .update({ 
                                      status: 'rejected', // Use 'rejected' instead of 'declined' to match constraint
                                      responded_at: new Date().toISOString()
                                    })
                                    .eq('id', selectedRequest.id)
                                  
                                  if (error) throw error
                                  
                                  alert('Connection request declined.')
                                  setSelectedRequest(null)
                                  await loadConnections()
                                } catch (err: any) {
                                  console.error('Error declining connection:', err)
                                  alert(err.message || 'Failed to decline connection request. Please try again.')
                                }
                              }}
                              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Messages tab removed - messaging is now integrated into Connections tab */}
        {false && activeTab === 'messages' && (
          <div className="dashboard-card rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Messages</h2>
                <p className="text-gray-400 text-sm">
                  You can only message businesses you’re actively connected to.
                </p>
              </div>
              <button
                onClick={() => loadMessaging()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
                disabled={msgLoading}
              >
                Refresh
              </button>
            </div>

            {msgError && (
              <div className="mb-4 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-4">
                {msgError}
              </div>
            )}

            {msgLoading && (
              <p className="text-gray-400">Loading messaging…</p>
            )}

            {!msgLoading && !msgError && msgBusinesses.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-300 font-medium mb-2">No connected businesses yet</p>
                <p className="text-gray-500 text-sm">
                  When a business connects to you via Talent Bank permissions, you’ll be able to message them here.
                </p>
              </div>
            )}

            {!msgLoading && msgBusinesses.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Business list */}
                <div className="md:col-span-1 border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-900/40 border-b border-gray-800">
                    <p className="text-gray-300 font-medium">Connected businesses</p>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {msgBusinesses.map((b) => {
                      // Display the business name, with fallback to 'Business' if not available
                      const displayName = (b.name && b.name.trim() && b.name !== 'Business') ? b.name : 'Business'
                      return (
                        <button
                          key={b.id}
                          onClick={() => loadConversation(b.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-800/50 transition-colors ${
                            msgSelectedBusinessId === b.id ? 'bg-gray-800/60' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-white font-medium truncate" title={displayName}>{displayName}</p>
                            <span className="text-xs text-gray-500">Open</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Conversation */}
                <div className="md:col-span-2 border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-900/40 border-b border-gray-800">
                    <p className="text-gray-300 font-medium">
                      {msgSelectedBusinessId
                        ? (() => {
                            const business = msgBusinesses.find((b) => String(b.id) === String(msgSelectedBusinessId))
                            const businessName = (business?.name && business.name.trim() && business.name !== 'Business') 
                              ? business.name 
                              : 'Business'
                            return `Conversation with ${businessName}`
                          })()
                        : 'Conversation'}
                    </p>
                  </div>

                  {!msgSelectedBusinessId && (
                    <div className="p-6">
                      <p className="text-gray-400">Select a business to view messages.</p>
                    </div>
                  )}

                  {msgSelectedBusinessId && msgConversationId === null && !msgError && (
                    <div className="p-6">
                      <p className="text-gray-300 mb-2">No messages yet</p>
                      <p className="text-gray-500 text-sm">You’re connected to businesses, but no messages yet.</p>
                    </div>
                  )}

                  {msgSelectedBusinessId && msgConversationId && (
                    <div className="p-4 space-y-3 max-h-[420px] overflow-auto">
                      {msgItems.length === 0 ? (
                        <p className="text-gray-400">No messages yet.</p>
                      ) : (
                        msgItems.map((m) => (
                          <div
                            key={m.id}
                            className={`max-w-[85%] rounded-lg px-3 py-2 ${
                              m.sender_type === 'talent'
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

                  {msgSelectedBusinessId && (
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
          talentName={videoChatSession.talentName || 'Talent'}
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
              Send a message to <strong>{reconnectModal.connection.business_name || 'this business'}</strong> requesting to reconnect.
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
                disabled={requestingReconnect === reconnectModal.connection.id || !reconnectModal.message.trim()}
                onClick={async () => {
                  const conn = reconnectModal.connection
                  if (!conn) return
                  setRequestingReconnect(conn.id)
                  try {
                    const { data: sessionRes } = await supabase.auth.getSession()
                    const accessToken = sessionRes?.session?.access_token
                    if (!accessToken) {
                      alert('Please sign in to request reconnection.')
                      return
                    }

                    // Send reconnection request via API
                    const response = await fetch('/api/connections/request-reconnect', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify({
                        connection_request_id: conn.id,
                        business_id: conn.business_id,
                        message: reconnectModal.message
                      }),
                    })

                    if (response.ok) {
                      alert('Reconnection request sent! The business will be notified and can accept your request to restore the connection.')
                      setReconnectModal({ open: false, connection: null, message: '' })
                      // Reload connections to reflect the status change
                      await loadConnections()
                    } else {
                      const errorData = await response.json().catch(() => ({}))
                      throw new Error(errorData.detail || errorData.message || 'Failed to send reconnection request')
                    }
                  } catch (err: any) {
                    console.error('Error sending reconnection request:', err)
                    alert(err.message || 'Failed to send reconnection request. Please try again.')
                  } finally {
                    setRequestingReconnect(null)
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-60"
              >
                {requestingReconnect === reconnectModal.connection.id ? 'Sending...' : 'Send Request'}
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
                  This connection has ended. You can request to reconnect to restore access to messaging and collaboration features.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Business Name</p>
                  <p className="text-gray-900 font-medium">
                    {connectionSummaryModal.connection.business_name || 'Name not available'}
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
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Sections You Had Shared</p>
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
                    setReconnectModal({
                      open: true,
                      connection: conn,
                      message: `Hi,\n\nI would like to reconnect with ${conn.business_name || 'your business'}. I was previously connected and would appreciate the opportunity to work together again.\n\nThank you for considering my request.`
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


