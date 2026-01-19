'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { fadeIn, fadeUp, stagger } from './motionPresets'
import type { BusinessProfilePageData } from './types'
import { ImpactMetrics } from './ImpactMetrics'
import { Briefcase, HeartHandshake, Sparkles, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/35 backdrop-blur p-8">
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-300 leading-relaxed">{body}</p>
    </div>
  )
}

function safeSlug(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function humanTitle(input: any): string | null {
  if (typeof input !== 'string') return null
  const raw = input.trim()
  if (!raw) return null
  // Remove extension
  const noExt = raw.replace(/\.[a-z0-9]{2,5}$/i, '')
  // Replace separators and de-noise common patterns
  const cleaned = noExt
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+(copy|final|v\d+)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return null
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}…` : cleaned
}

function docBadge(m: any): string {
  const mime = typeof m?.mime === 'string' ? m.mime.toLowerCase() : ''
  const url = typeof m?.url === 'string' ? m.url.toLowerCase() : ''
  if (mime.includes('pdf') || url.includes('.pdf')) return 'PDF'
  if (mime.includes('word') || url.includes('.doc') || url.includes('.docx')) return 'DOC'
  if (mime.includes('powerpoint') || url.includes('.ppt') || url.includes('.pptx')) return 'PPT'
  if (mime.includes('excel') || url.includes('.xls') || url.includes('.xlsx')) return 'XLS'
  return 'DOC'
}

export function BusinessProfilePage({ data }: { data: BusinessProfilePageData }) {
  const name = data.name || 'Business'
  const [connectState, setConnectState] = useState<'loading' | 'anon' | 'talent' | 'business' | 'blocked'>('loading')

  const heroTitle = 'Grow. Belong. Shape what’s next.'
  const heroSubtitle = data.tagline?.trim()
    ? data.tagline.trim()
    : `Turn potential into impact with ${name}.`

  const valueHeadline = data.value_prop_headline?.trim() || 'Bring your ambition to us'
  const valueBody =
    data.value_prop_body?.trim() ||
    'Build future-focused skills, collaborate with high-trust teams, and do meaningful work that improves customer and community outcomes.'

  const areas = Array.isArray(data.business_areas) ? data.business_areas : []
  const benefits = Array.isArray(data.benefits) ? data.benefits : []
  const programs = Array.isArray(data.programs) ? data.programs : []
  const social = Array.isArray(data.social_proof) ? data.social_proof : []
  const media = Array.isArray((data as any).media_assets) ? ((data as any).media_assets as any[]) : []
  const mediaImages = media.filter((m) => m?.kind === 'image' && typeof m?.url === 'string')
  const mediaVideos = media.filter((m) => m?.kind === 'video' && typeof m?.url === 'string')
  const mediaDocs = media.filter((m) => m?.kind === 'document' && typeof m?.url === 'string')

  useEffect(() => {
    let cancelled = false
    async function checkTalent() {
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const uid = sessionRes.session?.user?.id ?? null
        if (!uid) {
          if (!cancelled) setConnectState('anon')
          return
        }
        // Support mixed-profile accounts (a single auth user with both talent + business profiles)
        // by using a persisted "active role" set by dashboards.
        let activeRole: 'talent' | 'business' | null = null
        try {
          const v = localStorage.getItem('creerlio_active_role')
          if (v === 'talent' || v === 'business') activeRole = v
        } catch {}

        const [talentRes, bizRes] = await Promise.all([
          supabase.from('talent_profiles').select('id').eq('user_id', uid).maybeSingle(),
          supabase.from('business_profiles').select('id').eq('user_id', uid).maybeSingle(),
        ])
        const hasTalent = !talentRes.error && !!talentRes.data?.id
        const hasBusiness = !bizRes.error && !!bizRes.data?.id
        const next: typeof connectState =
          hasTalent && hasBusiness
            ? activeRole === 'talent'
              ? 'talent'
              : 'business'
            : hasTalent
              ? 'talent'
              : hasBusiness
                ? 'business'
                : 'blocked'
        if (!cancelled) setConnectState(next)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BusinessProfilePage.tsx:canConnect',message:'Business page connect eligibility checked',data:{hasUid:!!uid,hasTalentProfile:hasTalent,hasBusinessProfile:hasBusiness,activeRole:activeRole,connectState:next,slug:data.slug},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CONNECT1'})}).catch(()=>{});
        // #endregion
      } catch {
        if (!cancelled) setConnectState('blocked')
      }
    }
    checkTalent()
    return () => {
      cancelled = true
    }
  }, [data.slug])

  const connectHref = useMemo(() => `/dashboard/talent/connect/${data.slug}`, [data.slug])
  const signInHref = useMemo(() => `/login?redirect=/business/${data.slug}`, [data.slug])
  const connectAnonHref = useMemo(
    () => `/login/talent?mode=signup&redirect=/dashboard/talent/connect/${data.slug}`,
    [data.slug]
  )
  const isAnon = connectState === 'anon'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-slate-950" />
          {data.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.hero_image_url}
              alt={`${name} hero`}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(circle_at_30%_85%,rgba(168,85,247,0.22),transparent_45%)]" />
          )}
        </motion.div>

        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center font-bold">C</div>
              <span className="text-xl font-bold">Creerlio</span>
            </Link>
            <div className="flex items-center gap-3">
              {isAnon ? (
                <>
                  <Link
                    href={connectAnonHref}
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
                  <Link
                    href={`/jobs`}
                    className="px-4 py-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    Explore Roles
                  </Link>
                  {connectState === 'talent' ? (
                    <Link
                      href={connectHref}
                      className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Connection Request
                    </Link>
                  ) : connectState === 'anon' ? (
                    <Link
                      href={signInHref}
                      className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Sign in to connect
                    </Link>
                  ) : connectState === 'business' ? (
                    <span className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 cursor-not-allowed">
                      Connect (Talent only)
                    </span>
                  ) : null}
                  <a
                    href="#talent-community"
                    className={`px-4 py-2 rounded-lg ${
                      data.talent_community_enabled
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 cursor-not-allowed'
                    } transition-colors`}
                    aria-disabled={!data.talent_community_enabled}
                  >
                    Join Talent Community
                  </a>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-10 pb-20">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">
            <motion.p variants={fadeUp} className="text-sm text-slate-200/90 tracking-wide uppercase">
              Life at {name}
            </motion.p>
            <motion.h1 variants={fadeUp} className="mt-3 text-4xl md:text-6xl font-extrabold leading-tight">
              {heroTitle}
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 text-lg md:text-xl text-slate-200 leading-relaxed">
              {heroSubtitle}
            </motion.p>

            {!isAnon ? (
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/jobs"
                  className="px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Explore Roles
                </Link>
                <a
                  href="#areas"
                  className="px-5 py-3 rounded-xl border border-white/15 text-white hover:bg-white/5 transition-colors"
                >
                  Business Areas
                </a>
                <a
                  href="#support"
                  className="px-5 py-3 rounded-xl border border-white/15 text-white hover:bg-white/5 transition-colors"
                >
                  Support Hub
                </a>
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* VALUE PROP */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-3 gap-10 items-start">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-white">
              {valueHeadline}
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-slate-300 leading-relaxed">
              {valueBody}
            </motion.p>
            {!isAnon ? (
              <motion.p variants={fadeUp} className="mt-4 text-slate-400 text-sm">
                Businesses can edit this copy in their Dashboard.
              </motion.p>
            ) : null}
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="lg:col-span-2 grid sm:grid-cols-2 gap-4"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="flex items-center gap-3 text-slate-200">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">Growth</span>
              </div>
              <p className="text-slate-300 mt-3">
                Continuous learning, mentoring, and meaningful stretch opportunities.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="flex items-center gap-3 text-slate-200">
                <Users className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Collaboration</span>
              </div>
              <p className="text-slate-300 mt-3">
                High-trust teams, clear ownership, and shared outcomes.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="flex items-center gap-3 text-slate-200">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span className="font-semibold">Impact</span>
              </div>
              <p className="text-slate-300 mt-3">
                Work that improves customer experiences and community outcomes.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="flex items-center gap-3 text-slate-200">
                <Briefcase className="w-5 h-5 text-slate-200" />
                <span className="font-semibold">Future-focused</span>
              </div>
              <p className="text-slate-300 mt-3">
                Modern practices, responsible technology, and long-term career pathways.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* IMPACT METRICS */}
      <ImpactMetrics stats={data.impact_stats} />

      {/* PROGRAMS */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-white mb-8">
              Career streams & programs
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {programs.map((p, idx) => (
                <motion.div
                  key={`${p.title}-${idx}`}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5 text-blue-300" />
                    </div>
                    <h3 className="font-semibold text-white">{p.title}</h3>
                  </div>
                  <p className="text-slate-300 mt-4 text-sm leading-relaxed">{p.description}</p>
                  <button
                    type="button"
                    className="mt-5 text-blue-300 hover:text-blue-200 text-sm font-medium"
                    // TODO: modal or sub-page
                    onClick={() => {}}
                  >
                    Learn more →
                  </button>
                </motion.div>
              ))}
            </div>
            {programs.length === 0 && !isAnon ? (
              <motion.div variants={fadeUp} className="text-slate-400 mt-6">
                Add programs (e.g., Early Careers, Indigenous Careers, Career Comeback) in your Dashboard.
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* CULTURE PILLARS (NON-NEGOTIABLE) */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="text-2xl md:text-3xl font-bold text-white mb-8"
          >
            Culture pillars
          </motion.h2>
          <div className="grid lg:grid-cols-3 gap-4">
            <Pillar title="Grow" body="Master new skills through continuous learning and future‑ready career pathways." />
            <Pillar title="Belong" body="Inclusive, values‑driven teams built on trust, respect, and diverse perspectives." />
            <Pillar title="Shape what’s next" body="Real impact for customers and communities—today and for the future." />
          </div>
          {Array.isArray(data.culture_values) && data.culture_values.length > 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/35 p-6">
              <p className="text-slate-300 font-medium mb-3">Values</p>
              <div className="flex flex-wrap gap-2">
                {data.culture_values.map((v, i) => (
                  <span key={`${v}-${i}`} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* SUPPORT HUB */}
      {!isAnon ? (
      <section id="support" className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/15 via-emerald-500/10 to-purple-500/10 p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Career Support Hub</h2>
            <p className="text-slate-200 mt-3 max-w-2xl">
              Refine your application skills with Creerlio guidance—practical, calm, and designed for real outcomes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/about" className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors">
                Resume tips
              </Link>
              <Link href="/about" className="px-4 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5 transition-colors">
                Interview prep
              </Link>
              <Link href="/portfolio" className="px-4 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5 transition-colors">
                Portfolio best practices
              </Link>
            </div>
            {/* TODO: AI_MATCH_SCORE */}
            {/* TODO: BUSINESS_BRAND_HEALTH */}
          </div>
        </div>
      </section>
      ) : null}

      {/* BENEFITS */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Benefits & wellbeing</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {benefits.map((b, idx) => (
              <div
                key={`${b.title}-${idx}`}
                className="min-w-[280px] max-w-[320px] rounded-2xl border border-white/10 bg-slate-950/35 p-6"
              >
                <p className="text-white font-semibold">{b.title}</p>
                <p className="text-slate-300 mt-3 text-sm leading-relaxed">{b.description}</p>
                <button type="button" className="mt-5 text-blue-300 hover:text-blue-200 text-sm font-medium" onClick={() => {}}>
                  Explore more →
                </button>
              </div>
            ))}
            {benefits.length === 0 && !isAnon ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-slate-400">
                Add benefits in your Dashboard (e.g., flexibility, wellness, parental leave).
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* MEDIA */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Media</h2>

          {mediaImages.length + mediaVideos.length + mediaDocs.length === 0 && !isAnon ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-slate-400">
              Add images, videos, or documents in your Business Dashboard.
            </div>
          ) : null}

          {mediaImages.length > 0 ? (
            <div className="mb-8">
              <p className="text-slate-200 font-semibold mb-3">Gallery</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaImages.slice(0, 12).map((m, idx) => (
                  <div key={`${m.url}-${idx}`} className="rounded-2xl border border-white/10 bg-slate-950/35 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="Gallery image" className="w-full h-56 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {mediaVideos.length > 0 ? (
            <div className="mb-8">
              <p className="text-slate-200 font-semibold mb-3">Videos</p>
              <div className="grid md:grid-cols-2 gap-4">
                {mediaVideos.slice(0, 6).map((m, idx) => (
                  <div key={`${m.url}-${idx}`} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <video className="w-full rounded-xl" controls preload="metadata" src={m.url} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {mediaDocs.length > 0 ? (
            <div>
              <p className="text-slate-200 font-semibold mb-3">Documents</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaDocs.slice(0, 12).map((m, idx) => (
                  <a
                    key={`${m.url}-${idx}`}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-white/10 bg-slate-950/35 p-5 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-slate-200">{docBadge(m)}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">FILE</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-200 font-semibold truncate">
                            {humanTitle((m as any)?.title) || `Document ${idx + 1}`}
                          </div>
                          <div className="text-slate-400 text-sm mt-1">
                            Open document
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-slate-200 transition-colors">Open →</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* BUSINESS AREAS */}
      <section id="areas" className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Business areas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((a, idx) => {
              const areaSlug = a.area_slug || safeSlug(a.title)
              return (
                <Link
                  key={`${a.title}-${idx}`}
                  href={`/business/${data.slug}/area/${areaSlug}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-semibold">{a.title}</p>
                      {a.description ? <p className="text-slate-400 text-sm mt-2">{a.description}</p> : null}
                    </div>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
          {areas.length === 0 && !isAnon ? (
            <div className="text-slate-400 mt-6">
              Add business areas in your Dashboard (e.g., Engineering, Data, Risk, Cyber).
            </div>
          ) : null}
        </div>
      </section>

      {/* TALENT COMMUNITY CTA */}
      {!isAnon ? (
      <section id="talent-community" className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Join the {name} Talent Community
              </h2>
              <p className="text-slate-300 mt-3 leading-relaxed">
                No obligation. Build a long‑term relationship, get early access to opportunities, and share your portfolio on your terms.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`px-5 py-3 rounded-xl font-semibold transition-colors ${
                  data.talent_community_enabled
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 cursor-not-allowed'
                }`}
                onClick={() => {}}
                aria-disabled={!data.talent_community_enabled}
              >
                Join Talent Community
              </button>
              <Link
                href="/portfolio"
                className={`px-5 py-3 rounded-xl border font-semibold transition-colors ${
                  data.portfolio_intake_enabled
                    ? 'border-white/15 text-white hover:bg-white/5'
                    : 'border-white/10 text-slate-400 cursor-not-allowed pointer-events-none'
                }`}
                aria-disabled={!data.portfolio_intake_enabled}
              >
                Share Your Portfolio
              </Link>
            </div>
          </div>
          {/* TODO: TALENT_RECOMMENDATIONS */}
          {/* TODO: DIVERSITY_PIPELINE_INSIGHTS */}
        </div>
      </section>
      ) : null}

      {/* SOCIAL PROOF */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Social proof</h2>
          <div className="grid lg:grid-cols-3 gap-4">
            {social.map((s, idx) => (
              <div key={`${idx}`} className="rounded-2xl border border-white/10 bg-slate-950/35 p-6">
                <p className="text-slate-200 leading-relaxed">“{s.quote}”</p>
                {(s.author || s.context) ? (
                  <p className="text-slate-400 text-sm mt-4">
                    {s.author ? <span className="font-medium text-slate-300">{s.author}</span> : null}
                    {s.context ? <span className="ml-2">{s.context}</span> : null}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {social.length === 0 && !isAnon ? (
            <div className="text-slate-400 mt-6">
              Add testimonials, awards, or quotes in your Dashboard to build trust.
            </div>
          ) : null}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-slate-300 font-semibold">Acknowledgement of Country</p>
              <p className="text-slate-400 mt-2 leading-relaxed">
                {data.acknowledgement_of_country?.trim()
                  ? data.acknowledgement_of_country.trim()
                  : 'We acknowledge the Traditional Custodians of the lands on which we work and live, and pay our respects to Elders past and present.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 md:justify-end">
              <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                Accessibility
              </Link>
              <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                Employer values
              </Link>
              <Link href="/terms" className="text-slate-300 hover:text-white transition-colors">
                Terms and Conditions
              </Link>
            </div>
          </div>
          <div className="text-slate-500 text-sm mt-8">
            © {new Date().getFullYear()} Creerlio • Business profile pages are permission-safe and designed for long-term talent relationships.
          </div>
        </div>
      </footer>
    </div>
  )
}


