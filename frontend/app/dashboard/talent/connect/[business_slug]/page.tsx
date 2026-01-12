'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ensureTalentProfile } from '@/lib/ensureProfile'

const SECTION_CHOICES = [
  { key: 'intro', label: 'Introduction' },
  { key: 'bio', label: 'Bio' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'projects', label: 'Projects' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'family_community', label: 'Family and Community' },
  { key: 'location_preferences', label: 'Location & commute preferences' },
] as const

type SectionKey = (typeof SECTION_CHOICES)[number]['key']
type Step = 'select' | 'review' | 'confirm'

export default function TalentConnectPage({ params }: { params: { business_slug: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params?.business_slug
  const editRequestId = searchParams?.get('edit') // Request ID if editing existing request

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('select')
  const [businessName, setBusinessName] = useState<string>('Business')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [talentId, setTalentId] = useState<string | null>(null)
  const [previewProfile, setPreviewProfile] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selected, setSelected] = useState<Record<SectionKey, boolean>>({
    intro: true,
    bio: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    attachments: false,
    family_community: false,
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

        // Check for Talent Portfolio (not Profile) - Portfolio is what gets shared with businesses
        // Allow connections even without a portfolio - they can share what they have
        const portfolioRes = await supabase
          .from('talent_bank_items')
          .select('id, metadata')
          .eq('user_id', uid)
          .eq('item_type', 'portfolio')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        // Portfolio is optional - if it doesn't exist, we'll just show an empty preview
        // This allows talents to connect even if they haven't built their portfolio yet
        // If user is mixed-profile but currently in business context, guide them to switch.
        if (hasBusiness && activeRole === 'business') {
          setError('You are currently in Business mode. Switch to Talent mode (open Talent Dashboard) to send a connection request.')
          return
        }
        
        // Get the talent_profiles.id (not user_id) - this is what talent_connection_requests.talent_id references
        // Use ensureTalentProfile to create profile if it doesn't exist (allows connections even with incomplete profiles)
        try {
          const talentProfile = await ensureTalentProfile(uid)
          const tId = String(talentProfile.id) // Use talent_profiles.id, not user_id
          if (!cancelled) setTalentId(tId)
        } catch (profileError: any) {
          console.error('[Talent Connect] Error ensuring talent profile:', profileError)
          setError(`Could not access talent profile: ${profileError.message || 'Unknown error'}. Please try again or contact support.`)
          return
        }

        // Load current talent portfolio for preview/review. Portfolio data is what gets shared.
        // If no portfolio exists, use empty object - allows connections even without a portfolio
        const portfolioData = portfolioRes.data?.metadata || {}
        if (!cancelled) setPreviewProfile(portfolioData as any)

        // Query business_profiles table using slug column
        // Handle both database slugs and generated slugs (business-{id})
        let businessData: any = null
        let businessError: any = null
        
        // First try exact slug match
        const slugRes = await supabase
          .from('business_profiles')
          .select('id, business_name, description')
          .eq('slug', slug)
          .maybeSingle()
        
        if (!slugRes.error && slugRes.data) {
          businessData = slugRes.data
        } else {
          // If slug is in format "business-{id}", extract ID and query by ID
          if (slug.startsWith('business-')) {
            const extractedId = slug.replace('business-', '')
            const idRes = await supabase
              .from('business_profiles')
              .select('id, business_name, description')
              .eq('id', extractedId)
              .maybeSingle()
            
            if (!idRes.error && idRes.data) {
              businessData = idRes.data
            } else {
              businessError = idRes.error
            }
          } else {
            // Try querying by ID directly (in case slug is actually an ID)
            const idRes = await supabase
              .from('business_profiles')
              .select('id, business_name, description')
              .eq('id', slug)
              .maybeSingle()
            
            if (!idRes.error && idRes.data) {
              businessData = idRes.data
            } else {
              businessError = idRes.error || slugRes.error
            }
          }
        }

        let row: any = null
        if (businessData) {
          row = {
            business_id: businessData.id,
            business_name: businessData.business_name
          }
        }

        if (!row || !row.business_id) {
          setError('Business profile not found.')
          return
        }

        const nm = row.business_name || 'Business'

        if (!cancelled) {
          setBusinessId(String(row.business_id))
          setBusinessName(nm)
        }

        // If editing an existing request, load its selected sections
        // Do this after tId is set (which happens above)
        if (editRequestId && tId && !cancelled) {
          setIsEditMode(true)
          const existingReqRes = await supabase
            .from('talent_connection_requests')
            .select('selected_sections')
            .eq('id', editRequestId)
            .eq('talent_id', tId)
            .maybeSingle()
          
          if (!existingReqRes.error && existingReqRes.data?.selected_sections) {
            const existingSections = Array.isArray(existingReqRes.data.selected_sections) 
              ? existingReqRes.data.selected_sections 
              : []
            
            // Pre-populate selected sections
            const newSelected: Record<SectionKey, boolean> = {
              intro: existingSections.includes('intro'),
              bio: existingSections.includes('bio'),
              skills: existingSections.includes('skills'),
              experience: existingSections.includes('experience'),
              education: existingSections.includes('education'),
              projects: existingSections.includes('projects'),
              attachments: existingSections.includes('attachments'),
              family_community: existingSections.includes('family_community'),
              location_preferences: existingSections.includes('location_preferences'),
            }
            
            if (!cancelled) {
              setSelected(newSelected)
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug, editRequestId])

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
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'talent/connect/[business_slug]/page.tsx:submit',message:isEditMode ? 'Updating connection request' : 'Submitting connection request',data:{slug,sections:selectedList.length,editMode:isEditMode,requestId:editRequestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CONNECT2'})}).catch(()=>{});
      // #endregion

      if (isEditMode && editRequestId) {
        // Update existing request
        const upd = await supabase
          .from('talent_connection_requests')
          .update({ selected_sections: selectedList })
          .eq('id', editRequestId)
          .eq('talent_id', talentId)
        
        if (upd.error) {
          setError(upd.error.message)
          return
        }
      } else {
        // Create new request
        const ins = await supabase
          .from('talent_connection_requests')
          .insert({ talent_id: talentId, business_id: businessId, status: 'pending', selected_sections: selectedList })
        if (ins.error) {
          setError(ins.error.message)
          return
        }
      }
      router.push('/dashboard/talent?tab=connections')
    } catch (e: any) {
      setError(e?.message ?? `Failed to ${isEditMode ? 'update' : 'submit'} connection request.`)
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
        'Your portfolio'
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
    if (k === 'family_community') {
      const familyCommunity = (p.family_community && typeof p.family_community === 'object') ? p.family_community : {}
      const imageIds = Array.isArray(familyCommunity.imageIds) ? familyCommunity.imageIds : []
      return (
        <div className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
          <div className="text-white font-semibold mb-2">Family and Community</div>
          {imageIds.length > 0 ? (
            <div className="text-gray-300 text-sm">
              {imageIds.length} {imageIds.length === 1 ? 'image' : 'images'} in Family and Community section.
            </div>
          ) : (
            <div className="text-gray-500">No Family and Community images yet.</div>
          )}
        </div>
      )
    }

    // For other sections, show a clear placeholder (schema varies a lot across environments)
    return (
      <div className="rounded-xl border border-gray-800 bg-slate-900/40 p-4">
        <div className="text-white font-semibold mb-1">{SECTION_CHOICES.find((s) => s.key === k)?.label}</div>
        <div className="text-gray-500 text-sm">
          Preview for this section will reflect what's currently stored in your portfolio.
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
                <h2 className="text-xl font-bold text-white">2) Choose what to share with {businessName}</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Select the sections you want to share. Uncheck any sections you'd like to keep private. The preview below shows what the business will see.
                </p>
                <div className="mb-4 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold mb-1">View Your Full Portfolio</p>
                      <p className="text-gray-300 text-sm">
                        See exactly how your portfolio appears to businesses, including all sections, images, and media.
                      </p>
                    </div>
                    <a
                      href="/portfolio/view"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold whitespace-nowrap transition-colors"
                    >
                      View Full Portfolio →
                    </a>
                  </div>
                </div>
                
                {/* Interactive section selection with previews */}
                <div className="space-y-4">
                  {SECTION_CHOICES.map((section) => {
                    const isSelected = selected[section.key]
                    return (
                      <div
                        key={section.key}
                        className={`rounded-xl border p-4 transition-all ${
                          isSelected
                            ? 'border-blue-500/50 bg-slate-900/60'
                            : 'border-gray-800 bg-slate-900/20 opacity-60'
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              setSelected((p) => ({ ...p, [section.key]: e.target.checked }))
                            }}
                            className="mt-1 h-5 w-5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-white font-semibold">{section.label}</h3>
                              {isSelected && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                                  Will be shared
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <div className="mt-2">
                                <SectionPreview k={section.key as SectionKey} />
                              </div>
                            )}
                            {!isSelected && (
                              <p className="text-gray-500 text-sm mt-1">This section will not be shared with {businessName}.</p>
                            )}
                          </div>
                        </label>
                      </div>
                    )
                  })}
                </div>
                
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-4 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-white/5"
                    >
                      Back
                    </button>
                    <p className="text-sm text-gray-400">
                      {selectedList.length} {selectedList.length === 1 ? 'section' : 'sections'} selected
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={goConfirm}
                    disabled={selectedList.length === 0}
                    className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Continue to confirmation
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white">3) {isEditMode ? 'Confirm & update request' : 'Confirm & send request'}</h2>
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-gray-200">
                  {isEditMode ? (
                    <>
                      You're about to update your connection request to <span className="font-semibold text-white">{businessName}</span> with{' '}
                      <span className="font-semibold text-white">{selectedList.length}</span> shared sections.
                    </>
                  ) : (
                    <>
                      You're about to send a connection request to <span className="font-semibold text-white">{businessName}</span> with{' '}
                      <span className="font-semibold text-white">{selectedList.length}</span> shared sections.
                    </>
                  )}
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
                    {isEditMode ? 'Update Request' : 'Send connection request'}
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


