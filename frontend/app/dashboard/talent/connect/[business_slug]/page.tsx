'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

type SectionKey = (typeof SECTION_CHOICES)[number]['key']
type Step = 'select' | 'review' | 'confirm'

export default function TalentConnectPage({ params }: { params: { business_slug: string } }) {
  const router = useRouter()
  const slug = params?.business_slug

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('select')
  const [businessName, setBusinessName] = useState<string>('Business')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [talentId, setTalentId] = useState<string | null>(null)
  const [previewProfile, setPreviewProfile] = useState<any>(null)
  const [selected, setSelected] = useState<Record<SectionKey, boolean>>({
    intro: true,
    bio: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    attachments: false,
    location_preferences: false,
  })
  const selectedList = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const uid = sessionRes.session?.user?.id ?? null
        if (!uid) {
          setError('Please sign in to connect with a business.')
          return
        }

        // Persist active role so mixed-profile users can request connections when in Talent context
        try {
          localStorage.setItem('creerlio_active_role', 'talent')
        } catch {}

        // Role hardening:
        // - If the auth user has both profiles, allow this page only when active role is Talent.
        // - If the auth user has only a business profile, block.
        let activeRole: 'talent' | 'business' | null = null
        try {
          const v = localStorage.getItem('creerlio_active_role')
          if (v === 'talent' || v === 'business') activeRole = v
        } catch {}

        const bizRes = await supabase.from('business_profiles').select('id').eq('user_id', uid).maybeSingle()
        const hasBusiness = !bizRes.error && !!bizRes.data?.id

        const talentRes = await supabase.from('talent_profiles').select('id').eq('user_id', uid).single()
        if (talentRes.error || !talentRes.data?.id) {
          setError('A Talent profile is required before you can connect.')
          return
        }
        // If user is mixed-profile but currently in business context, guide them to switch.
        if (hasBusiness && activeRole === 'business') {
          setError('You are currently in Business mode. Switch to Talent mode (open Talent Dashboard) to send a connection request.')
          return
        }
        const tId = String(talentRes.data.id)
        if (!cancelled) setTalentId(tId)

        // Load current talent profile for preview/review. Keep it schema-tolerant and defensive.
        const profileRes = await supabase.from('talent_profiles').select('*').eq('id', tId).maybeSingle()
        if (!cancelled) setPreviewProfile(profileRes.error ? null : (profileRes.data as any))

        const pageRes = await supabase
          .from('business_profile_pages')
          .select('business_id, name, business_name, company_name, legal_name, display_name, slug')
          .eq('slug', slug)
          .maybeSingle()

        if (pageRes.error || !pageRes.data?.business_id) {
          setError('Business profile not found.')
          return
        }

        const row: any = pageRes.data
        const nm =
          (typeof row.name === 'string' && row.name) ||
          (typeof row.business_name === 'string' && row.business_name) ||
          (typeof row.company_name === 'string' && row.company_name) ||
          (typeof row.legal_name === 'string' && row.legal_name) ||
          (typeof row.display_name === 'string' && row.display_name) ||
          'Business'

        if (!cancelled) {
          setBusinessId(String(row.business_id))
          setBusinessName(nm)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  function goReview() {
    setError(null)
    if (selectedList.length === 0) {
      setError('Please select at least one section to share.')
      return
    }
    setStep('review')
  }

  function goBack() {
    setError(null)
    if (step === 'review') setStep('select')
    else if (step === 'confirm') setStep('review')
  }

  function goConfirm() {
    setError(null)
    setStep('confirm')
  }

  async function submit() {
    setError(null)
    if (!talentId || !businessId) return
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'talent/connect/[business_slug]/page.tsx:submit',message:'Submitting connection request',data:{slug,sections:selectedList.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CONNECT2'})}).catch(()=>{});
      // #endregion

      const ins = await supabase
        .from('talent_connection_requests')
        .insert({ talent_id: talentId, business_id: businessId, status: 'pending', selected_sections: selectedList })
      if (ins.error) {
        setError(ins.error.message)
        return
      }
      router.push('/dashboard/talent?tab=connections')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to submit connection request.')
    }
  }

  function SectionPreview({ k }: { k: SectionKey }) {
    const p: any = previewProfile || {}
    if (k === 'intro') {
      const headline = (typeof p.headline === 'string' && p.headline) || ''
      const name =
        (typeof p.name === 'string' && p.name) ||
        (typeof p.talent_name === 'string' && p.talent_name) ||
        (typeof p.full_name === 'string' && p.full_name) ||
        (typeof p.display_name === 'string' && p.display_name) ||
        'Your profile'
      return (
        <div className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
          <div className="text-white font-semibold">{name}</div>
          {headline ? <div className="text-gray-300 mt-1">{headline}</div> : <div className="text-gray-500 mt-1">No headline yet.</div>}
        </div>
      )
    }
    if (k === 'bio') {
      const bio = (typeof p.bio === 'string' && p.bio) || ''
      return (
        <div className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
          <div className="text-white font-semibold mb-2">Bio</div>
          {bio ? <div className="text-gray-300 whitespace-pre-wrap">{bio}</div> : <div className="text-gray-500">No bio yet.</div>}
        </div>
      )
    }
    if (k === 'skills') {
      const skills =
        Array.isArray(p.skills) ? p.skills :
        typeof p.skills === 'string' ? p.skills.split(',').map((s: string) => s.trim()).filter(Boolean) :
        []
      return (
        <div className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
          <div className="text-white font-semibold mb-2">Skills</div>
          {skills.length ? (
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 24).map((s: string, idx: number) => (
                <span key={`${s}-${idx}`} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200 text-sm">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No skills yet.</div>
          )}
        </div>
      )
    }

    // For other sections, show a clear placeholder (schema varies a lot across environments)
    return (
      <div className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
        <div className="text-white font-semibold mb-1">{SECTION_CHOICES.find((s) => s.key === k)?.label}</div>
        <div className="text-gray-500 text-sm">
          Preview for this section will reflect what’s currently stored in your profile.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/dashboard/talent" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        <Link
          href={`/business/${slug}`}
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Business
        </Link>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-2">Connect with {businessName}</h1>
        <p className="text-gray-400 mb-8">
          Choose what you’d like to share with this business. You can revoke access later.
        </p>

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="dashboard-card rounded-xl p-6 space-y-4">
            {step === 'select' ? (
              <>
                <h2 className="text-xl font-bold text-white">1) Select what to share</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SECTION_CHOICES.map((s) => (
                    <label key={s.key} className="flex items-center gap-2 text-gray-200">
                      <input
                        type="checkbox"
                        checked={!!selected[s.key]}
                        onChange={(e) => setSelected((p) => ({ ...p, [s.key]: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <p className="text-sm text-gray-400">{selectedList.length} sections selected</p>
                  <button
                    type="button"
                    onClick={goReview}
                    disabled={selectedList.length === 0}
                    className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-60"
                  >
                    Review what you’re sending
                  </button>
                </div>
              </>
            ) : step === 'review' ? (
              <>
                <h2 className="text-xl font-bold text-white">2) Review exactly what the business will see</h2>
                <p className="text-gray-400 text-sm">
                  This preview updates based on what’s currently in your profile. You can go back to change selections.
                </p>
                <div className="space-y-3">
                  {selectedList.map((k) => (
                    <SectionPreview key={k} k={k as SectionKey} />
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-4 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goConfirm}
                    className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  >
                    Continue to confirmation
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white">3) Confirm & send request</h2>
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-gray-200">
                  You’re about to send a connection request to <span className="font-semibold text-white">{businessName}</span> with{' '}
                  <span className="font-semibold text-white">{selectedList.length}</span> shared sections.
                </div>
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-4 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  >
                    Send connection request
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


