'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  user_type: string
  is_active: boolean
}

type TabType = 'overview' | 'profile' | 'portfolio' | 'applications' | 'messages' | 'connections'

export default function TalentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [talentProfile, setTalentProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [userType, setUserType] = useState<string>('talent')

  const [connLoading, setConnLoading] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)
  const [connRequests, setConnRequests] = useState<any[]>([])
  const [connAccepted, setConnAccepted] = useState<any[]>([])

  // Export/Print consent requests (Business → Talent)
  const [consentLoading, setConsentLoading] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [consentReqs, setConsentReqs] = useState<any[]>([])
  const [consentBusyId, setConsentBusyId] = useState<string | null>(null)
  const didAutoLoadConsentRef = useRef(false)

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
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'connections') setActiveTab('connections')
    } catch {}
  }, [])

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

  // Portfolio view state
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioMeta, setPortfolioMeta] = useState<any>(null)
  const [portfolioBannerUrl, setPortfolioBannerUrl] = useState<string | null>(null)
  const [portfolioAvatarUrl, setPortfolioAvatarUrl] = useState<string | null>(null)

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
      setConnRequests(reqs.filter((r) => r.status === 'pending'))
      setConnAccepted(reqs.filter((r) => r.status === 'accepted'))
    } finally {
      setConnLoading(false)
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

  useEffect(() => {
    if (activeTab !== 'messages') return
    if (didAutoLoadMessagesRef.current) return
    didAutoLoadMessagesRef.current = true
    // Debug logging disabled
    loadMessaging()
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'connections') return
    if (didAutoLoadConsentRef.current) return
    didAutoLoadConsentRef.current = true
    loadConsentRequests().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Load portfolio data when portfolio tab is active
  useEffect(() => {
    if (activeTab !== 'portfolio') return
    if (!user?.id) return

    let cancelled = false
    const userId = user.id
    async function loadPortfolio() {
      setPortfolioLoading(true)
      try {
        const { data, error } = await supabase
          .from('talent_bank_items')
          .select('id, metadata, created_at')
          .eq('user_id', userId)
          .eq('item_type', 'portfolio')
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
            console.error('Error loading portfolio:', error)
            if (!cancelled) setPortfolioMeta(null)
            return
          }

        const saved = (data?.[0]?.metadata ?? null) as any
        if (!cancelled) {
          setPortfolioMeta(saved || null)
        }

        if (saved && typeof saved === 'object') {
          const [b, a] = await Promise.all([
            saved.banner_path ? (async () => {
              const { data: bannerData } = await supabase.storage.from('talent-bank').createSignedUrl(saved.banner_path, 60 * 30)
              return bannerData?.signedUrl ?? null
            })() : Promise.resolve(null),
            saved.avatar_path ? (async () => {
              const { data: avatarData } = await supabase.storage.from('talent-bank').createSignedUrl(saved.avatar_path, 60 * 30)
              return avatarData?.signedUrl ?? null
            })() : Promise.resolve(null),
          ])
          if (!cancelled) {
            setPortfolioBannerUrl(b)
            setPortfolioAvatarUrl(a)
          }
        }
      } catch (err) {
        console.error('Error loading portfolio:', err)
        if (!cancelled) setPortfolioMeta(null)
      } finally {
        if (!cancelled) setPortfolioLoading(false)
      }
    }
    loadPortfolio()
    return () => {
      cancelled = true
    }
  }, [activeTab, user?.id])

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

      // Only show connected businesses: active grants (not expired, not revoked)
      const grantsRes = await supabase
        .from('talent_access_grants')
        .select('business_id, expires_at, revoked_at')
        .eq('talent_id', talentId)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())

      // Debug logging disabled

      if (grantsRes.error) {
        setMsgError('Could not load connections for messaging (permissions or schema issue).')
        return
      }

      const businessIds = Array.from(new Set((grantsRes.data || []).map((g: any) => g.business_id).filter(Boolean)))
      if (businessIds.length === 0) {
        setMsgBusinesses([])
        setMsgSelectedBusinessId(null)
        setMsgConversationId(null)
        setMsgItems([])
        return
      }

      // business_profiles "name" column varies across environments; attempt fallbacks without leaking data.
      const nameSelectors = ['id, name', 'id, business_name', 'id, company_name', 'id, display_name', 'id, legal_name']
      let bizRows: Array<{ id: string; name: string | null }> | null = null
      let lastBizErr: any = null

      for (const sel of nameSelectors) {
        const attempt = await supabase.from('business_profiles').select(sel).in('id', businessIds)
        if (!attempt.error) {
          const mapped = (attempt.data || []).map((r: any) => {
            const n =
              (typeof r.name === 'string' && r.name) ||
              (typeof r.business_name === 'string' && r.business_name) ||
              (typeof r.company_name === 'string' && r.company_name) ||
              (typeof r.display_name === 'string' && r.display_name) ||
              (typeof r.legal_name === 'string' && r.legal_name) ||
              null
            return { id: r.id, name: n }
          })
          bizRows = mapped
          // Debug logging disabled
          break
        }
        lastBizErr = attempt.error
      }

      if (!bizRows) {
        // Debug logging disabled
        setMsgError('Could not load business names (schema/RLS issue).')
        return
      }

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

      // Permission gate: active grant must exist to show or send messages
      const gateRes = await supabase
        .from('talent_access_grants')
        .select('id, expires_at, revoked_at')
        .eq('talent_id', talentId)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)

      const gate = (gateRes.data || [])[0]
      const isRevoked = !!gate?.revoked_at
      const isExpired = gate?.expires_at ? new Date(gate.expires_at).getTime() <= Date.now() : true
      if (!gate || isRevoked || isExpired) {
        setMsgConversationId(null)
        setMsgItems([])
        setMsgError(isRevoked ? 'Access revoked' : 'Connection expired')
        return
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

      // Permission gate (again, before write)
      const gateRes = await supabase
        .from('talent_access_grants')
        .select('id, expires_at, revoked_at')
        .eq('talent_id', talentId)
        .eq('business_id', businessId)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .limit(1)

      if ((gateRes.data || []).length === 0) {
        setMsgError('Connection expired')
        return
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {userFirstName || user?.full_name || user?.username}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Logout
          </button>
          <button
            onClick={handleDeleteRegistration}
            className="px-4 py-2 border border-red-600 text-red-300 rounded-lg hover:bg-red-900/20 transition-colors"
          >
            Delete Registration
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Talent Dashboard</h1>
          <p className="text-gray-400">Manage your profile, portfolio, and job applications</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {(['overview', 'profile', 'portfolio', 'applications', 'messages', 'connections'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'connections' ? 'Connections' : tab === 'portfolio' ? 'View Portfolio' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
                )}
              </button>
            ))}
            <Link
              href="/dashboard/talent/bank"
              className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors"
            >
              Talent Bank ↗
            </Link>
            <Link
              href="/talent-map"
              className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors"
            >
              Talent Map ↗
            </Link>
            <Link
              href="/search"
              className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors"
            >
              Search ↗
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Stats Card */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">Profile Views</p>
                    <p className="text-3xl font-bold text-blue-400">0</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Applications</p>
                    <p className="text-3xl font-bold text-green-400">0</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Matches</p>
                    <p className="text-3xl font-bold text-purple-400">0</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/resume/upload"
                    className="block px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    Upload Resume
                  </Link>
                  <Link
                    href="/dashboard/talent/bank"
                    className="block px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    Talent Bank
                  </Link>
                  <Link
                    href="/portfolio"
                    className="block px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    Edit Portfolio
                  </Link>
                  <Link
                    href="/portfolio/view"
                    className="block px-4 py-3 bg-slate-500/10 border border-slate-500/40 rounded-lg text-slate-200 hover:bg-slate-500/20 transition-colors"
                  >
                    View Portfolio
                  </Link>
                  <Link
                    href="/search"
                    className="block px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    Search Businesses & Jobs
                  </Link>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Profile Summary</h2>
                {user && (
                  <div className="space-y-2">
                    <p className="text-gray-300"><span className="text-gray-500">Name:</span> {talentProfile?.name || user.full_name || user.username}</p>
                    <p className="text-gray-300"><span className="text-gray-500">Email:</span> {user.email}</p>
                    {talentProfile?.title && (
                      <p className="text-gray-300"><span className="text-gray-500">Title:</span> {talentProfile.title}</p>
                    )}
                    <div className="pt-2 border-t border-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-500 text-sm">Profile Completion</p>
                        <span className="text-blue-400 font-semibold text-sm">{calculateProfileCompletion()}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${calculateProfileCompletion()}%` }}
                            title={`Profile is ${calculateProfileCompletion()}% complete`}
                          ></div>
                        </div>
                      </div>
                      {calculateProfileCompletion() < 100 && (
                        <p className="text-gray-500 text-xs mt-2">
                          Complete your profile to improve your job matches
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Talent Profile Section */}
            {talentProfile ? (
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Talent Profile</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {talentProfile.skills?.map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
                    <p className="text-gray-300">{talentProfile.location || 'Not set'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Create Your Talent Profile</h2>
                <p className="text-gray-400 mb-4">Complete your profile to start matching with opportunities</p>
                <Link
                  href="/portfolio"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Profile
                </Link>
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Your Profile</h2>
            {user && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                    <p className="text-white">{user.username}</p>
                  </div>
                  {user.full_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                      <p className="text-white">{user.full_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">User Type</label>
                    <p className="text-white capitalize">{user.user_type}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <Link
                    href="/dashboard/talent/edit"
                    className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
            {/* Header with Edit button */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Portfolio</h2>
              <Link
                href="/portfolio"
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
              >
                Edit
              </Link>
            </div>

            {portfolioLoading ? (
              <div className="dashboard-card rounded-xl p-12 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !portfolioMeta ? (
              <div className="dashboard-card rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">No portfolio saved yet</h3>
                <p className="text-gray-400 mb-6">
                  Create your portfolio first, then come back here to review exactly what it looks like.
                </p>
                <Link
                  href="/portfolio"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                >
                  Build your portfolio
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Portfolio Header Section */}
                <div className="dashboard-card rounded-xl overflow-hidden border border-gray-800">
                  <div className="h-40 md:h-56 bg-slate-900 relative">
                    {portfolioBannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={portfolioBannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.25),transparent_45%)]" />
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex items-start gap-5">
                    <div className="shrink-0">
                      {portfolioAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={portfolioAvatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xl text-white">
                          {((typeof portfolioMeta?.name === 'string' && portfolioMeta.name) || 'Talent').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-3xl font-bold truncate text-white">
                        {(typeof portfolioMeta?.name === 'string' && portfolioMeta.name) || 'Talent'}
                      </h3>
                      <p className="text-gray-300 mt-1">
                        {(typeof portfolioMeta?.title === 'string' && portfolioMeta.title) || 'Your Title'}
                      </p>
                      {portfolioMeta?.bio && typeof portfolioMeta.bio === 'string' && (
                        <p className="text-gray-300 mt-4 leading-relaxed whitespace-pre-wrap">
                          {portfolioMeta.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                {Array.isArray(portfolioMeta?.skills) && portfolioMeta.skills.length > 0 && (
                  <div className="dashboard-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {portfolioMeta.skills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Section */}
                {Array.isArray(portfolioMeta?.experience) && portfolioMeta.experience.length > 0 && (
                  <div className="dashboard-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Experience</h3>
                    <div className="space-y-3">
                      {portfolioMeta.experience.map((e: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
                          <div className="font-semibold text-white">{e?.role || e?.title || 'Role'}</div>
                          <div className="text-gray-300 text-sm mt-1">
                            {(e?.company || e?.organisation || 'Company') +
                              (e?.startDate || e?.endDate ? ` • ${e?.startDate || ''} – ${e?.endDate || ''}` : '')}
                          </div>
                          {e?.description && (
                            <div className="text-gray-300 whitespace-pre-wrap text-sm mt-3">
                              {e.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Section */}
                {Array.isArray(portfolioMeta?.education) && portfolioMeta.education.length > 0 && (
                  <div className="dashboard-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Education</h3>
                    <div className="space-y-3">
                      {portfolioMeta.education.map((e: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
                          <div className="font-semibold text-white">{e?.qualification || e?.degree || 'Qualification'}</div>
                          <div className="text-gray-300 text-sm mt-1">
                            {(e?.institution || e?.school || 'Institution') +
                              (e?.year || e?.endYear ? ` • ${e?.year || e?.endYear}` : '')}
                          </div>
                          {e?.notes && (
                            <div className="text-gray-300 whitespace-pre-wrap text-sm mt-3">
                              {e.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects Section */}
                {Array.isArray(portfolioMeta?.projects) && portfolioMeta.projects.length > 0 && (
                  <div className="dashboard-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Projects</h3>
                    <div className="space-y-3">
                      {portfolioMeta.projects.map((p: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
                          <div className="font-semibold text-white">{p?.name || 'Project'}</div>
                          {p?.url && (
                            <a
                              className="text-blue-300 hover:text-blue-200 text-sm mt-1 inline-block"
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {p.url}
                            </a>
                          )}
                          {p?.description && (
                            <div className="text-gray-300 whitespace-pre-wrap text-sm mt-3">
                              {p.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Job Applications</h2>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{app.job_title || 'Job'}</h3>
                        {app.job_location && (
                          <p className="text-gray-400 text-sm mb-2">📍 {app.job_location}</p>
                        )}
                        <p className="text-gray-500 text-sm">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'applied' ? 'bg-blue-500/20 text-blue-400' :
                          app.status === 'shortlisted' ? 'bg-green-500/20 text-green-400' :
                          app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          app.status === 'hired' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
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
                <p className="text-gray-400 mb-4">No applications yet</p>
                <Link
                  href="/jobs"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="dashboard-card rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Connections</h2>
                <p className="text-gray-400 text-sm">
                  Request connections with businesses. Messaging unlocks only after acceptance.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadConnections()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
                  disabled={connLoading}
                >
                  Refresh connections
                </button>
                <button
                  onClick={() => loadConsentRequests()}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-gray-200 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-60"
                  disabled={consentLoading}
                >
                  Refresh consent
                </button>
              </div>
            </div>

            {connError && (
              <div className="mb-4 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-4">
                {connError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Print / export consent requests</h3>
                <p className="text-gray-500 text-xs mb-3">
                  Businesses cannot print/export your content via in-app controls unless you approve here. Screenshots can’t be fully prevented on the web, but we record consent decisions.
                </p>
                {consentError ? (
                  <div className="mb-3 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-3 text-sm">
                    {consentError}
                  </div>
                ) : null}
                {consentLoading ? (
                  <p className="text-gray-400">Loading consent requests…</p>
                ) : (
                  <>
                    {consentReqs.filter((r) => r.status === 'pending').length === 0 ? (
                      <p className="text-gray-400">No pending consent requests.</p>
                    ) : (
                      <div className="space-y-3">
                        {consentReqs
                          .filter((r) => r.status === 'pending')
                          .map((r) => (
                            <div key={r.id} className="border border-gray-800 rounded-lg p-3">
                              <p className="text-gray-200 text-sm font-medium">{r.business_name || 'Business'}</p>
                              <p className="text-gray-500 text-xs mt-1">Requested {new Date(r.requested_at).toLocaleString()}</p>
                              {r.request_reason ? (
                                <p className="text-gray-300 text-sm mt-2 whitespace-pre-wrap">{r.request_reason}</p>
                              ) : (
                                <p className="text-gray-500 text-sm mt-2">No reason provided.</p>
                              )}
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={consentBusyId === r.id}
                                  onClick={() => respondConsent(r, 'approved')}
                                  className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-200 hover:bg-green-500/25 disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={consentBusyId === r.id}
                                  onClick={() => respondConsent(r, 'denied')}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-200 hover:bg-red-500/20 disabled:opacity-60"
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

              <div className="border border-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Connection Requests</h3>
                {connLoading ? (
                  <p className="text-gray-400">Loading connections…</p>
                ) : connRequests.length === 0 ? (
                  <p className="text-gray-400">No connection requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {connRequests.map((r) => (
                      <div key={r.id} className="border border-gray-800 rounded-lg p-3">
                        <p className="text-gray-200 text-sm">Pending request</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Sent {new Date(r.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-800 rounded-lg p-4 md:col-span-2">
                <h3 className="text-white font-semibold mb-3">Business Connections</h3>
                {connLoading ? (
                  <p className="text-gray-400">Loading connections…</p>
                ) : connAccepted.length === 0 ? (
                  <p className="text-gray-400">No accepted connections yet.</p>
                ) : (
                  <div className="space-y-3">
                    {connAccepted.map((r) => (
                      <div key={r.id} className="border border-gray-800 rounded-lg p-3">
                        <p className="text-gray-200 text-sm">Connected</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Accepted {r.responded_at ? new Date(r.responded_at).toLocaleString() : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'messages' && (
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
                    {msgBusinesses.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => loadConversation(b.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-800/50 transition-colors ${
                          msgSelectedBusinessId === b.id ? 'bg-gray-800/60' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-white font-medium truncate">{b.name || 'Business'}</p>
                          <span className="text-xs text-gray-500">Open</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversation */}
                <div className="md:col-span-2 border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-900/40 border-b border-gray-800">
                    <p className="text-gray-300 font-medium">Conversation</p>
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
    </div>
  )
}


