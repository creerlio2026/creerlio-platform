'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminPortfolioViewPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
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
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const u = sessionRes.session?.user
        if (!u?.id) {
          router.replace('/login?redirect=/admin')
          return
        }

        const { data: { user: freshUser } } = await supabase.auth.getUser()
        const userMetadata = (freshUser || u).user_metadata || {}
        const email = u.email || ''
        
        const hasAdminFlag = userMetadata.is_admin === true || userMetadata.admin === true
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
        const isAdminEmail = adminEmails.includes(email.toLowerCase())
        
        if (hasAdminFlag || isAdminEmail) {
          setIsAdmin(true)
          loadPortfolio()
        } else {
          alert('Access denied. Admin privileges required.')
          router.replace('/')
        }
      } catch (error) {
        console.error('Error checking admin:', error)
        router.replace('/')
      }
    }
    checkAdmin()
  }, [router, userId])

  async function loadPortfolio() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id, metadata, created_at')
        .eq('user_id', userId)
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

      setMeta(saved)

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
      setBannerUrl(b)
      setAvatarUrl(a)
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  const sectionOrder = Array.isArray(meta?.sectionOrder) ? meta.sectionOrder : []
  const skills = Array.isArray(meta?.skills) ? meta.skills : []
  const experience = Array.isArray(meta?.experience) ? meta.experience : []
  const education = Array.isArray(meta?.education) ? meta.education : []
  const projects = Array.isArray(meta?.projects) ? meta.projects : []
  const attachments = Array.isArray(meta?.attachments) ? meta.attachments : []

  const title = (typeof meta?.title === 'string' && meta.title) || 'Portfolio'
  const name = (typeof meta?.name === 'string' && meta.name) || 'Talent'
  const bio = (typeof meta?.bio === 'string' && meta.bio) || ''

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

  function AttachmentThumb({ a }: { a: any }) {
    const isImg = String(a?.file_type || '').startsWith('image') || a?.item_type === 'image'
    const isVid = String(a?.file_type || '').startsWith('video') || a?.item_type === 'video'
    const ext = fileExt(String(a?.title || ''))
    const label = isImg ? 'IMG' : isVid ? 'VID' : ext ? ext.toUpperCase().slice(0, 4) : 'FILE'

    const rawUrl = typeof a?.url === 'string' ? String(a.url) : ''
    let path = String(a?.file_path || '')

    if (!path && rawUrl) {
      try {
        const url = new URL(rawUrl)
        const parts = url.pathname.split('/').filter(Boolean)
        const i = parts.findIndex((p) => p === 'object')
        if (i !== -1) {
          const bucket = parts[i + 2]
          const rest = parts.slice(i + 3).join('/')
          if (bucket === 'talent-bank' && rest) path = rest
        }
      } catch {}
    }

    const hasFresh = path ? !!thumbUrls[path] : false
    const shouldMintFresh = path && (isImg || isVid) && (!hasFresh || (rawUrl && rawUrl.includes('/storage/v1/object/sign/')))
    if (shouldMintFresh) ensureSignedUrl(path).catch(() => {})

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

    if (path) {
      return (
        <button
          type="button"
          className="w-full"
          onClick={() => openPath(path, a?.file_type ?? null, String(a?.title || 'Document'))}
          title="Open"
        >
          <div className="w-full h-32 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-950/40 text-xs font-semibold text-slate-200">
              {label}
            </div>
          </div>
        </button>
      )
    }

    return (
      <div className="w-full h-32 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-950/40 text-xs font-semibold text-slate-200">
          {label}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
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
          <Link href={`/admin/users/${userId}`} className="text-slate-300 hover:text-blue-400">
            ← Back to User Details
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Admin View</span>
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
              This user has not created a portfolio.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
              <div className="h-40 md:h-56 bg-slate-900 relative">
                {bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.25),transparent_45%)]" />
                )}
              </div>
              <div className="p-6 md:p-8 flex items-start gap-5">
                <div className="shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xl">
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold truncate">{name}</h1>
                  <p className="text-slate-300 mt-1">{title}</p>
                  {bio ? (
                    <div className="mt-4">
                      <p
                        className={`text-slate-300 leading-relaxed whitespace-pre-wrap ${bioExpanded ? '' : 'line-clamp-5'}`}
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
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {(sectionOrder.length ? sectionOrder : ['skills', 'experience', 'education', 'projects', 'attachments']).map((k) => {
                  if (k === 'skills') {
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Skills</h2>
                        {skills.length ? (
                          <div className="flex flex-wrap gap-2">
                            {skills.map((s, idx) => (
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
                      </section>
                    )
                  }

                  if (k === 'experience') {
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Experience</h2>
                        {experience.length ? (
                          <div className="space-y-3">
                            {experience.map((e: any, idx: number) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{e?.role || e?.title || 'Role'}</div>
                                <div className="text-slate-300 text-sm mt-1">
                                  {(e?.company || e?.organisation || 'Company') +
                                    (e?.startDate || e?.endDate ? ` • ${e?.startDate || ''} – ${e?.endDate || ''}` : '')}
                                </div>
                                {e?.description ? (
                                  <div className="mt-3">
                                    <div
                                      className={`text-slate-300 whitespace-pre-wrap text-sm ${
                                        expExpanded[idx] ? '' : 'line-clamp-5'
                                      }`}
                                    >
                                      {e.description}
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
                      </section>
                    )
                  }

                  if (k === 'education') {
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Education</h2>
                        {education.length ? (
                          <div className="space-y-3">
                            {education.map((e: any, idx: number) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{e?.qualification || e?.degree || 'Qualification'}</div>
                                <div className="text-slate-300 text-sm mt-1">
                                  {(e?.institution || e?.school || 'Institution') +
                                    (e?.year || e?.endYear ? ` • ${e?.year || e?.endYear}` : '')}
                                </div>
                                {e?.notes ? (
                                  <div className="mt-3">
                                    <div
                                      className={`text-slate-300 whitespace-pre-wrap text-sm ${
                                        eduExpanded[idx] ? '' : 'line-clamp-5'
                                      }`}
                                    >
                                      {e.notes}
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
                      </section>
                    )
                  }

                  if (k === 'projects') {
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Projects</h2>
                        {projects.length ? (
                          <div className="space-y-3">
                            {projects.map((p: any, idx: number) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{p?.name || 'Project'}</div>
                                {p?.url ? (
                                  <a
                                    className="text-blue-300 hover:text-blue-200 text-sm mt-1 inline-block"
                                    href={p.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {p.url}
                                  </a>
                                ) : null}
                                {p?.description ? (
                                  <div className="mt-3">
                                    <div
                                      className={`text-slate-300 whitespace-pre-wrap text-sm ${
                                        projExpanded[idx] ? '' : 'line-clamp-5'
                                      }`}
                                    >
                                      {p.description}
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
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No projects added yet.</div>
                        )}
                      </section>
                    )
                  }

                  if (k === 'attachments') {
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                        {attachments.length ? (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {attachments.map((a: any, idx: number) => (
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
                      </section>
                    )
                  }

                  return null
                })}
              </div>

              <aside className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <div className="text-slate-300 text-sm font-semibold">Admin View</div>
                  <p className="text-slate-400 text-sm mt-2">
                    You are viewing this portfolio as an administrator.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

