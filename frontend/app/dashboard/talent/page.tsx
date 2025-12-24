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

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setIsLoading(true)
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const u = sessionRes.session?.user
        if (!u?.id) {
          router.replace('/login?redirect=/dashboard/talent')
          return
        }
        const email = u.email || ''
        const username = email ? email.split('@')[0] : 'talent'
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

        // Load talent profile (schema-tolerant)
        const tpRes = await (supabase.from('talent_profiles').select('*') as any).eq('user_id', u.id).maybeSingle()
        if (!cancelled && !tpRes.error) {
          setTalentProfile(tpRes.data || null)
          if (tpRes.data?.name && typeof tpRes.data.name === 'string') {
            setUser((prev) => (prev ? { ...prev, full_name: tpRes.data.name } : prev))
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:tabs',message:'Talent dashboard tabs state',data:{activeTab,tabs:['overview','profile','portfolio','applications','messages','connections']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:connections:error',message:'Connections query failed',data:{code:(reqRes.error as any)?.code ?? null,message:reqRes.error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CONNECT_ERR'})}).catch(()=>{});
        // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:auto_load',message:'Auto-loading messaging on Messages tab open',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    loadMessaging()
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'connections') return
    if (didAutoLoadConsentRef.current) return
    didAutoLoadConsentRef.current = true
    loadConsentRequests().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Legacy backend (axios) auth + profile fetch removed. Supabase session is now the source of truth.

  const loadMessaging = async () => {
    setMsgLoading(true)
    setMsgError(null)
    try {
      const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()
      const hasSession = !!sessionRes?.session?.user?.id

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:load:session',message:'Messaging load: env/session check',data:{hasEnv,hasSession,hasSessionErr:!!sessionErr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

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

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:load:talent_profile',message:'Messaging load: talent profile lookup result',data:{ok:!talentRes.error,hasData:!!talentRes.data,errCode:talentRes.error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

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

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:load:grants',message:'Messaging load: active grants query result',data:{ok:!grantsRes.error,count:(grantsRes.data||[]).length,errCode:grantsRes.error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

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
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:load:biz_fallback',message:'Business name selector succeeded',data:{selector:sel,count:mapped.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          break
        }
        lastBizErr = attempt.error
      }

      if (!bizRows) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:load:biz_fallback_fail',message:'Business name selector failed for all fallbacks',data:{errCode:lastBizErr?.code,errMsg:lastBizErr?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
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

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:send:start',message:'Send message attempt',data:{hasConversationId:!!msgConversationId,bodyLen:body.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

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

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:send:create_conv',message:'Conversation create result',data:{ok:!createRes.error,errCode:createRes.error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

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

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:messages:send:insert',message:'Message insert result',data:{ok:!insertRes.error,errCode:insertRes.error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

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
          <span className="text-gray-300">Welcome, {user?.full_name || user?.username}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Logout
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
                {tab === 'connections' ? 'Connections' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Portfolio</h2>
            {talentProfile ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
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
                <div className="pt-4 border-t border-gray-800">
                  <Link
                    href="/portfolio"
                    className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Edit Portfolio
                    </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No portfolio created yet</p>
                  <Link
                    href="/portfolio"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                  Create Portfolio
                  </Link>
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


