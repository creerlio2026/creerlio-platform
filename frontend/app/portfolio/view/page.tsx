'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PortfolioMeta = Record<string, any>

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
  if (!path) return null
  const { data, error } = await supabase.storage.from('talent-bank').createSignedUrl(path, seconds)
  if (error) return null
  return data?.signedUrl ?? null
}

export default function PortfolioViewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<PortfolioMeta | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
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
  const [projListExpanded, setProjListExpanded] = useState(false)
  const [attachExpanded, setAttachExpanded] = useState(false)

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
        if (!uid) {
          setError('Please sign in to view your portfolio.')
          return
        }
        if (!cancelled) setUserId(uid)

        const { data, error } = await supabase
          .from('talent_bank_items')
          .select('id, metadata, created_at')
          .eq('user_id', uid)
          .eq('item_type', 'portfolio')
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          setError(error.message)
          return
        }

        const saved = (data?.[0]?.metadata ?? null) as any
        if (!saved || typeof saved !== 'object') {
          setMeta(null)
          return
        }

        if (!cancelled) setMeta(saved)

        const [b, a] = await Promise.all([
          signedUrl(String(saved.banner_path ?? '')),
          signedUrl(String(saved.avatar_path ?? '')),
        ])
        if (!cancelled) {
          setBannerUrl(b)
          setAvatarUrl(a)
        }

        // Intro video (picked in Portfolio editor)
        const introId = typeof saved?.introVideoId === 'number' ? saved.introVideoId : null
        if (introId) {
          const vidRow = await supabase
            .from('talent_bank_items')
            .select('id,title,file_path,file_type,item_type')
            .eq('user_id', uid)
            .eq('id', introId)
            .maybeSingle()
          const filePath = (vidRow.data as any)?.file_path as string | null
          if (filePath) {
            const { data: urlData } = await supabase.storage.from('talent-bank').createSignedUrl(filePath, 60 * 30)
            if (!cancelled) {
              setIntroVideoUrl(urlData?.signedUrl ?? null)
              // Never display raw filenames in the UI.
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
    return () => {
      cancelled = true
    }
  }, [])

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
    return merged
  }, [meta])
  const skills = useMemo(() => safeArray<string>(meta?.skills).map((s) => String(s || '').trim()).filter(Boolean), [meta])
  const experience = useMemo(() => {
    const raw = safeArray<any>(meta?.experience)
    return raw.filter((e) => {
      const title = String(e?.role || e?.title || '').trim()
      const company = String(e?.company || e?.organisation || '').trim()
      const desc = normalizeDisplayText(String(e?.description || ''))
      return !!(title || company || desc)
    })
  }, [meta])
  const education = useMemo(() => {
    const raw = safeArray<any>(meta?.education)
    return raw.filter((e) => {
      const inst = String(e?.institution || e?.school || '').trim()
      const degree = String(e?.qualification || e?.degree || '').trim()
      const notes = normalizeDisplayText(String(e?.notes || ''))
      return !!(inst || degree || notes)
    })
  }, [meta])
  const referees = useMemo(() => {
    const raw = safeArray<any>(meta?.referees)
    return raw.filter((r) => {
      const name = String(r?.name || '').trim()
      const notes = normalizeDisplayText(String(r?.notes || ''))
      const email = String(r?.email || '').trim()
      const phone = String(r?.phone || '').trim()
      return !!(name || notes || email || phone)
    })
  }, [meta])
  const projects = useMemo(() => {
    const raw = safeArray<any>(meta?.projects)
    return raw.filter((p) => {
      const name = String(p?.name || '').trim()
      const url = String(p?.url || '').trim()
      const desc = normalizeDisplayText(String(p?.description || ''))
      return !!(name || url || desc)
    })
  }, [meta])
  const attachments = useMemo(() => safeArray<any>(meta?.attachments), [meta])

  const socialLinks = useMemo<SocialLink[]>(() => {
    const m: any = meta ?? {}
    const list: SocialLink[] = []

    // Preferred shape: socialLinks: [{platform,url}]
    const raw = Array.isArray(m.socialLinks) ? m.socialLinks : []
    for (const it of raw) {
      const platform = String((it as any)?.platform ?? '').trim()
      const url = String((it as any)?.url ?? '').trim()
      if (!platform || !url) continue
      list.push({ platform, url })
    }

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
  }, [meta])

  const title = (typeof meta?.title === 'string' && meta.title) || 'Your Portfolio'
  const name = (typeof meta?.name === 'string' && meta.name) || 'Talent'
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
    async function loadProjectAttachments() {
      if (!userId) return
      const ids = new Set<number>()
      for (const p of projects) {
        const a = safeArray<any>((p as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      const missing = Array.from(ids).filter((id) => !tbItemCache[id])
      if (!missing.length) return

      const { data } = await supabase
        .from('talent_bank_items')
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
    loadProjectAttachments()
    return () => {
      cancelled = true
    }
  }, [userId, projects, tbItemCache])

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
      if (p.includes('website') || p.includes('portfolio')) return 'bg-emerald-500/12 border-emerald-400/25 text-emerald-200 hover:bg-emerald-500/18'
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
    const { data } = await supabase.storage.from('talent-bank').createSignedUrl(path, 60 * 30)
    if (data?.signedUrl) setThumbUrls((prev) => ({ ...prev, [path]: data.signedUrl }))
  }

  async function openPath(path: string, fileType: string | null | undefined, title: string) {
    if (!path) return
    const { data } = await supabase.storage.from('talent-bank').createSignedUrl(path, 60 * 30)
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
      if (extracted?.bucket === 'talent-bank' && extracted.path) path = extracted.path
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
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard/talent" className="text-slate-300 hover:text-blue-400">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/portfolio"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 font-semibold"
            >
              Edit Portfolio
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
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
            <h1 className="text-2xl font-bold">No portfolio saved yet</h1>
            <p className="text-slate-300 mt-2">
              Create your portfolio first, then come back here to review exactly what it looks like.
            </p>
            <div className="mt-6">
              <Link href="/portfolio" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold">
                Build your portfolio
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero */}
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
              <div className="h-44 md:h-64 bg-slate-900 relative">
                {bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
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
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
                      <Link
                        href="/portfolio"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold shrink-0"
                      >
                        Edit Portfolio
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Main */}
              <div className="lg:col-span-8 space-y-6">
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
                {introVideoUrl ? (
                  <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                    <h2 className="text-xl font-semibold mb-4">{introVideoTitle || 'Introduction Video'}</h2>
                    <div className="mx-auto max-w-3xl">
                      {/* Soft frame */}
                      <div className="rounded-3xl p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-transparent shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                        <div className="rounded-3xl overflow-hidden bg-slate-950/60 border border-white/10">
                          <div className="bg-black">
                            <video
                              src={introVideoUrl}
                              controls
                              playsInline
                              className="w-full max-h-[280px] md:max-h-[300px] object-contain"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-slate-400">
                        Tip: Keep your intro under 60–90 seconds and speak to your strongest work examples.
                      </div>
                    </div>
                  </section>
                ) : null}

                {sectionOrder.map((k) => {
                  // Intro/social are handled above or elsewhere (defensive skip).
                  if (k === 'intro' || k === 'social') return null
                  // Projects is intentionally rendered in the right column (under "Connect With Me") for layout aesthetics.
                  if (k === 'projects') return null
                  if (k === 'skills') {
                    const skillsCollapsed = skills.slice(0, 20)
                    const showAllSkills = skillsExpanded ? skills : skillsCollapsed
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Skills</h2>
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
                          <div className="text-slate-400">No skills added yet.</div>
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
              <aside className="lg:col-span-4 space-y-6">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <div className="text-slate-200 font-semibold mb-4">Connect With Me</div>
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
                  {socialLinks.length ? (
                    <div className="mt-6">
                      <div className="text-slate-400 text-xs mb-2">Social</div>
                      <SocialIconBar links={socialLinks} />
                    </div>
                  ) : null}

                  {skills.length ? (
                    <div className="mt-6">
                      <div className="text-slate-400 text-xs mb-2">Top skills</div>
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

                {/* Projects: placed under Connect With Me to sit beside the intro video */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-slate-200 font-semibold">Projects</div>
                    {projects.length > 2 ? (
                      <button
                        type="button"
                        className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setProjListExpanded((v) => !v)}
                      >
                        {projListExpanded ? 'Show less' : 'Show all'}
                      </button>
                    ) : null}
                  </div>

                  {projects.length ? (
                    <div className="space-y-3">
                      {(projListExpanded ? projects : projects.slice(0, 2)).map((p, idx) => (
                        <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                          <div className="font-semibold">{p?.name || 'Project'}</div>
                          {p?.url ? (
                            <a className="text-blue-300 hover:text-blue-200 text-sm mt-1 inline-block break-all" href={p.url} target="_blank" rel="noreferrer">
                              {p.url}
                            </a>
                          ) : null}
                          {normalizeDisplayText(String(p?.description || '')) ? (
                            <div className="mt-3">
                              <div className="text-slate-300 whitespace-pre-wrap text-sm" style={projExpanded[idx] ? undefined : clampStyle(5)}>
                                {normalizeDisplayText(String(p.description))}
                              </div>
                              <button
                                type="button"
                                className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                                onClick={() => setProjExpanded((q) => ({ ...q, [idx]: !q[idx] }))}
                              >
                                {projExpanded[idx] ? 'Show less' : 'Show more'}
                              </button>
                            </div>
                          ) : null}

                          {Array.isArray((p as any)?.attachmentIds) && (p as any).attachmentIds.length ? (
                            <div className="mt-4">
                              <div className="text-xs text-slate-400 mb-2">
                                Attached items:{' '}
                                <span className="text-slate-200 font-semibold">{(p as any).attachmentIds.length}</span>
                              </div>
                              <div className="space-y-2">
                                {(p as any).attachmentIds.slice(0, 3).map((id: any) => {
                                  const it = tbItemCache[Number(id)]
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
                                      openPath(path, it?.file_type ?? null, String(it?.title || 'Item'))
                                      return
                                    }
                                    if (String(it?.item_type).toLowerCase() === 'social') {
                                      const u = String((it?.metadata as any)?.url ?? '').trim()
                                      if (u) window.open(/^https?:\/\//i.test(u) ? u : `https://${u}`, '_blank')
                                    }
                                  }
                                  return (
                                    <div key={id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3">
                                      {tbThumb(it)}
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm text-slate-200 truncate">{String(it?.title || 'Item')}</div>
                                        <div className="text-xs text-slate-400 truncate">{String(it?.item_type || '')}</div>
                                      </div>
                                      <button type="button" className="text-xs text-blue-300 underline" onClick={open}>
                                        Open
                                      </button>
                                    </div>
                                  )
                                })}
                                {(p as any).attachmentIds.length > 3 ? (
                                  <div className="text-xs text-slate-400 px-1">+{(p as any).attachmentIds.length - 3} more…</div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">No projects added yet.</div>
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


