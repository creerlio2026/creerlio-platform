'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type TalentRow = Record<string, any>

function pickTalentName(row: TalentRow | null): string {
  if (!row) return 'Talent'
  return (
    (typeof row.name === 'string' && row.name) ||
    (typeof row.full_name === 'string' && row.full_name) ||
    (typeof row.display_name === 'string' && row.display_name) ||
    (typeof row.first_name === 'string' && typeof row.last_name === 'string' && `${row.first_name} ${row.last_name}`.trim()) ||
    (typeof row.username === 'string' && row.username) ||
    'Talent'
  )
}

async function resolveBusinessProfileId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user?.id ?? null
  if (!uid) return null

  // Use user_id (canonical column per RLS policies)
  const res: any = await (supabase.from('business_profiles').select('id') as any).eq('user_id', uid).maybeSingle()
  if (!res.error && res.data?.id) return String(res.data.id)
  
  // Fallback: if no business profile found, return null (don't use uid as business_id)
  return null
}

export default function BusinessTalentViewPage() {
  const router = useRouter()
  const params = useParams()
  const talentId = String((params as any)?.talentId || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [talent, setTalent] = useState<TalentRow | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])

  const [consentStatus, setConsentStatus] = useState<'unknown' | 'none' | 'pending' | 'denied' | 'approved' | 'expired'>('unknown')
  const [consentReqId, setConsentReqId] = useState<string | null>(null)
  const [consentExpiresAt, setConsentExpiresAt] = useState<string | null>(null)

  const [consentModalOpen, setConsentModalOpen] = useState(false)
  const [consentReason, setConsentReason] = useState('')
  const [printingNow, setPrintingNow] = useState(false)

  const canPrint = useMemo(() => consentStatus === 'approved', [consentStatus])

  async function gateConnection(bid: string) {
    const gateRes = await supabase
      .from('talent_access_grants')
      .select('id, expires_at, revoked_at')
      .eq('talent_id', talentId)
      .eq('business_id', bid)
      .order('created_at', { ascending: false })
      .limit(1)

    const gate = (gateRes.data || [])[0] as any
    const isRevoked = !!gate?.revoked_at
    const isExpired = gate?.expires_at ? new Date(gate.expires_at).getTime() <= Date.now() : true
    if (!gate || isRevoked || isExpired) {
      setError(isRevoked ? 'Access revoked' : 'Connection expired')
      return false
    }
    return true
  }

  async function loadConsent(bid: string) {
    const res = await supabase
      .from('talent_export_consent_requests')
      .select('id,status,expires_at,requested_at')
      .eq('talent_id', talentId)
      .eq('business_id', bid)
      .order('requested_at', { ascending: false })
      .limit(1)

    if (res.error) {
      // Migration not applied or no permission; keep calm.
      if (/Could not find the table/i.test(res.error.message)) {
        setConsentStatus('unknown')
        return
      }
      setConsentStatus('unknown')
      return
    }

    const row: any = (res.data || [])[0] || null
    if (!row) {
      setConsentReqId(null)
      setConsentExpiresAt(null)
      setConsentStatus('none')
      return
    }

    setConsentReqId(String(row.id))
    setConsentExpiresAt(row.expires_at ? String(row.expires_at) : null)

    if (row.status === 'approved') {
      const expOk = row.expires_at ? new Date(row.expires_at).getTime() > Date.now() : true
      setConsentStatus(expOk ? 'approved' : 'expired')
      return
    }
    if (row.status === 'pending') setConsentStatus('pending')
    else if (row.status === 'denied') setConsentStatus('denied')
    else setConsentStatus('unknown')
  }

  async function load() {
    if (!talentId) return
    setLoading(true)
    setError(null)
    try {
      const bid = await resolveBusinessProfileId()
      setBusinessId(bid)
      if (!bid) {
        setError('Please sign in as a business to view Talent content.')
        return
      }

      const ok = await gateConnection(bid)
      if (!ok) return

      // Basic talent profile (schema tolerant)
      const selectors = [
        'id, name, career_stage, location',
        'id, full_name, career_stage, location',
        'id, display_name, career_stage, location',
        'id, first_name, last_name, career_stage, location',
      ]
      let tRow: any = null
      for (const sel of selectors) {
        const res: any = await (supabase.from('talent_profiles').select(sel) as any).eq('id', talentId).maybeSingle()
        if (!res.error && res.data) {
          tRow = res.data
          break
        }
      }
      setTalent(tRow)

      // Portfolio items (permissioned by RLS; may require migration)
      const itemsRes = await supabase
        .from('talent_bank_items')
        .select('id, item_type, title, content, created_at')
        .eq('talent_id', talentId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (itemsRes.error) {
        // Don’t crash; just show a calm hint.
        setPortfolioItems([])
      } else {
        setPortfolioItems((itemsRes.data || []) as any)
      }

      await loadConsent(bid)
    } finally {
      setLoading(false)
    }
  }

  async function logEvent(event_type: string, meta: any) {
    if (!businessId) return
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user?.id ?? null
    await supabase.from('talent_export_consent_events').insert({
      request_id: consentReqId,
      talent_id: talentId,
      business_id: businessId,
      actor_type: 'business',
      actor_user_id: uid,
      event_type,
      meta: meta ?? {},
    } as any)
  }

  async function requestConsent() {
    if (!businessId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id ?? null
      if (!uid) {
        setError('Please sign in to request consent.')
        return
      }

      const ins = await supabase
        .from('talent_export_consent_requests')
        .insert({
          talent_id: talentId,
          business_id: businessId,
          requested_by_user_id: uid,
          request_reason: consentReason?.trim() ? consentReason.trim() : null,
          scope: 'portfolio',
          scope_ref: {},
          status: 'pending',
        } as any)
        .select('id')
        .single()

      if (ins.error || !(ins.data as any)?.id) {
        setError(ins.error?.message || 'Could not create consent request (permissions or missing migrations).')
        return
      }
      const reqId = String((ins.data as any).id)
      setConsentReqId(reqId)

      await supabase.from('talent_export_consent_events').insert({
        request_id: reqId,
        talent_id: talentId,
        business_id: businessId,
        actor_type: 'business',
        actor_user_id: uid,
        event_type: 'request_created',
        meta: { scope: 'portfolio' },
      } as any)

      // Also send a message (best-effort)
      const conv = await supabase
        .from('conversations')
        .select('id')
        .eq('talent_id', talentId)
        .eq('business_id', businessId)
        .maybeSingle()
      const cid = (conv.data as any)?.id ? String((conv.data as any).id) : null
      if (cid) {
        await supabase.from('messages').insert({
          conversation_id: cid,
          sender_type: 'business',
          sender_user_id: uid,
          body:
            `Consent request: Please approve permission to print/export Talent portfolio content.\n\n` +
            `Reason: ${consentReason?.trim() ? consentReason.trim() : '(not specified)'}\n\n` +
            `Request ID: ${reqId}\n\n` +
            `You can approve/deny this in your Talent Dashboard → Connections.`,
        } as any)
      }

      setConsentModalOpen(false)
      setConsentReason('')
      await loadConsent(businessId)
    } finally {
      setLoading(false)
    }
  }

  async function handlePrint() {
    if (!businessId) return
    if (!canPrint) {
      setConsentModalOpen(true)
      await logEvent('print_attempt_blocked', { via: 'button' })
      return
    }
    setPrintingNow(true)
    try {
      await logEvent('print_attempt_allowed', { via: 'button' })
      window.print()
    } finally {
      setPrintingNow(false)
    }
  }

  useEffect(() => {
    load().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talentId])

  useEffect(() => {
    // Block Ctrl/Cmd+P when not approved (best effort; browser limitations apply)
    const onKeyDown = async (e: KeyboardEvent) => {
      const isPrintCombo = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')
      if (!isPrintCombo) return
      if (canPrint) {
        await logEvent('print_attempt_allowed', { via: 'kbd' })
        return
      }
      e.preventDefault()
      setConsentModalOpen(true)
      await logEvent('print_attempt_blocked', { via: 'kbd' })
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown as any, { capture: true } as any)
  }, [canPrint, businessId, consentReqId])

  const consentLabel =
    consentStatus === 'approved'
      ? consentExpiresAt
        ? `Approved until ${new Date(consentExpiresAt).toLocaleString()}`
        : 'Approved'
      : consentStatus === 'pending'
        ? 'Pending'
        : consentStatus === 'denied'
          ? 'Denied'
          : consentStatus === 'expired'
            ? 'Expired'
            : consentStatus === 'none'
              ? 'Not requested'
              : 'Unknown'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <style jsx global>{`
        @media print {
          .creerlio-print-block {
            display: none !important;
          }
          .creerlio-print-warning {
            display: block !important;
          }
        }
      `}</style>

      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/dashboard/business" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={talentId ? `/dashboard/business/messages?talentId=${encodeURIComponent(talentId)}` : '/dashboard/business/messages'}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Messages
          </Link>
          <button
            onClick={() => router.push('/dashboard/business')}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{pickTalentName(talent)}</h1>
          <p className="text-gray-400 text-sm">
            Viewing is permission-gated by Talent Bank access. Printing/export requires Talent consent.
          </p>
        </div>

        <div className="creerlio-print-warning hidden border border-amber-500/30 bg-amber-500/10 text-amber-100 rounded-lg p-4 mb-6">
          Printing is restricted by Creerlio terms. If you need a printable copy, request consent from the Talent inside the platform.
        </div>

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-4">{error}</div>
        )}

        <div className="creerlio-print-block grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 dashboard-card rounded-xl p-6 border border-gray-800">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Talent portfolio (view-only)</h2>
                <p className="text-gray-500 text-sm mt-1">
                  This is a private asset. Do not copy, print, or export without explicit consent.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || printingNow}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 ${
                  canPrint ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10'
                }`}
              >
                {canPrint ? 'Print / Export' : 'Request consent to print'}
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg border border-gray-800 bg-gray-900/20">
              <p className="text-sm text-gray-300">
                <span className="text-gray-500">Consent status:</span> {consentLabel}
              </p>
            </div>

            {loading ? (
              <p className="text-gray-400">Loading…</p>
            ) : portfolioItems.length === 0 ? (
              <div>
                <p className="text-gray-300 mb-1">No portfolio content available</p>
                <p className="text-gray-500 text-sm">
                  This may mean the Talent has no items yet, or your access doesn’t include those sections, or the Talent Bank RLS migration is not applied.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolioItems.map((it) => (
                  <div key={it.id} className="border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white font-semibold truncate">{it.title || 'Item'}</p>
                      <span className="text-xs text-gray-500">{it.item_type || 'item'}</span>
                    </div>
                    {it.content ? <p className="text-gray-300 text-sm mt-2 whitespace-pre-wrap">{String(it.content)}</p> : null}
                    <p className="text-xs text-gray-500 mt-2">{it.created_at ? new Date(it.created_at).toLocaleString() : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-card rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-3">Terms & controls</h2>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>
                <span className="text-gray-500">No printing/export by default.</span> You must request consent.
              </li>
              <li>
                <span className="text-gray-500">Audit trail:</span> requests, approvals/denials, and print attempts are recorded.
              </li>
              <li>
                <span className="text-gray-500">Screenshots:</span> browsers can’t fully block screenshots, but consent rules still apply contractually.
              </li>
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setConsentModalOpen(true)
                  logEvent('print_attempt_blocked', { via: 'panel' }).catch(() => {})
                }}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors"
              >
                Request consent
              </button>
              <Link
                href="/dashboard/business/messages"
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors text-center"
              >
                Go to Messages
              </Link>
            </div>
          </div>
        </div>
      </div>

      {consentModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setConsentModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 text-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Request consent to print/export</h2>
                <p className="text-sm text-slate-300 mt-2">
                  Creerlio prohibits printing/exporting Talent content without explicit consent. This request will be recorded.
                </p>
              </div>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
                onClick={() => setConsentModalOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-5">
              <label className="block text-sm text-slate-300 mb-2">Reason (shown to Talent)</label>
              <textarea
                value={consentReason}
                onChange={(e) => setConsentReason(e.target.value)}
                rows={4}
                placeholder="Explain why you need to print/export."
                className="w-full px-4 py-3 bg-white text-black rounded-lg border border-blue-500/20 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={requestConsent}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-60"
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


