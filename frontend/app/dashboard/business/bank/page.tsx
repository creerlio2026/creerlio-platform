'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type BankItem = {
  id: number
  business_id: string
  user_id: string
  item_type: 'document' | 'image' | 'video'
  title: string
  description?: string | null
  file_path?: string | null
  file_type?: string | null
  file_size?: number | null
  created_at: string
}

const BUCKET = 'business-bank'
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 // 50 MB

function safeFileName(name: string) {
  return String(name || 'file')
    .trim()
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
}

function inferKind(file: File): 'image' | 'video' | 'document' {
  const t = (file.type || '').toLowerCase()
  if (t.startsWith('image/')) return 'image'
  if (t.startsWith('video/')) return 'video'
  return 'document'
}

export default function BusinessBankPage() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [items, setItems] = useState<BankItem[]>([])
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<null | { kind: 'image' | 'video'; url: string; title: string }>(null)
  const allInputRef = useRef<HTMLInputElement | null>(null)
  const imgInputRef = useRef<HTMLInputElement | null>(null)
  const vidInputRef = useRef<HTMLInputElement | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)

  async function ensureThumb(path: string) {
    if (!path) return
    if (thumbUrls[path]) return
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 30)
    if (!error && data?.signedUrl) setThumbUrls((p) => ({ ...p, [path]: data.signedUrl }))
  }

  async function loadBusinessId(uid: string) {
    // Use user_id (canonical column per RLS policies)
    const res = await supabase.from('business_profiles').select('id').eq('user_id', uid).maybeSingle()
    if (!res.error && res.data?.id) return String(res.data.id)
    return null
  }

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setError('Please sign in as a Business to use Business Bank.')
        setItems([])
        return
      }
      const bid = await loadBusinessId(uid)
      if (!bid) {
        setError('No business profile found for this user. Create a business profile first.')
        setItems([])
        return
      }
      setBusinessId(bid)

      const res = await supabase
        .from('business_bank_items')
        .select('id,business_id,user_id,item_type,title,description,file_path,file_type,file_size,created_at')
        .eq('business_id', bid)
        .order('created_at', { ascending: false })

      if (res.error) {
        if (/Could not find the table/i.test(res.error.message)) {
          setError('Business Bank is not configured yet. Run Supabase migration `2025122205_business_bank.sql` and refresh schema cache.')
        } else {
          setError(res.error.message)
        }
        setItems([])
        return
      }
      const rows = (res.data || []) as any[]
      setItems(rows as any)

      // Prefetch thumbnails for first few items
      for (const it of rows.slice(0, 12)) {
        const path = it.file_path
        if (!path) continue
        if (it.item_type === 'image' || it.item_type === 'video') {
          ensureThumb(path).catch(() => {})
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await reload()
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grouped = useMemo(() => {
    const images = items.filter((i) => i.item_type === 'image')
    const videos = items.filter((i) => i.item_type === 'video')
    const docs = items.filter((i) => i.item_type === 'document')
    return { images, videos, docs }
  }, [items])

  async function uploadFiles(files: FileList | null, forceKind?: 'image' | 'video' | 'document') {
    setError(null)
    if (!files || files.length === 0) return
    if (!businessId) {
      setError('Missing business id. Refresh and try again.')
      return
    }
    setBusy(true)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        setError('Please sign in.')
        return
      }

      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_BYTES) {
          setError(`File too large: ${file.name}. Max size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`)
          return
        }
        const kind = forceKind ?? inferKind(file)
        const path = `business/${businessId}/${Date.now()}-${safeFileName(file.name)}`

        const up = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        })

        if (up.error) {
          const msg = up.error.message || 'Upload failed.'
          if (/bucket/i.test(msg) && /not found/i.test(msg)) {
            setError('Business Bank bucket is missing. Run Supabase migration `2025122205_business_bank.sql` and refresh schema cache.')
            return
          }
          setError(msg)
          return
        }

        const ins = await supabase.from('business_bank_items').insert({
          business_id: businessId,
          user_id: uid,
          item_type: kind,
          title: file.name,
          description: null,
          file_path: path,
          file_type: file.type || null,
          file_size: file.size,
          metadata: {},
        } as any)

        if (ins.error) {
          setError(ins.error.message)
          return
        }
      }

      await reload()
    } finally {
      setBusy(false)
    }
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    await uploadFiles(e.dataTransfer.files)
  }

  async function openItem(it: BankItem) {
    if (!it.file_path) return
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(it.file_path, 60 * 30)
    if (error || !data?.signedUrl) return

    if (it.item_type === 'image') setPreview({ kind: 'image', url: data.signedUrl, title: it.title })
    else if (it.item_type === 'video') setPreview({ kind: 'video', url: data.signedUrl, title: it.title })
    else window.open(data.signedUrl, '_blank')
  }

  async function removeItem(it: BankItem) {
    if (!confirm(`Remove "${it.title}" from Business Bank?`)) return
    setBusy(true)
    setError(null)
    try {
      if (it.file_path) {
        await supabase.storage.from(BUCKET).remove([it.file_path]).catch(() => {})
      }
      const del = await supabase.from('business_bank_items').delete().eq('id', it.id)
      if (del.error) {
        setError(del.error.message)
        return
      }
      await reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
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
                <img src={preview.url} alt={preview.title} className="max-h-[75vh] w-auto object-contain" />
              ) : (
                <video src={preview.url} controls className="max-h-[75vh] w-auto object-contain" />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/dashboard/business" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/business/edit"
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Edit Business Profile
          </Link>
          <Link
            href="/dashboard/business"
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-6xl">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Business Bank</h1>
            <p className="text-gray-400 mt-2">
              Upload and store documents, images, and video for reuse across your Business Profile.
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => allInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-60"
              >
                Upload files
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => reload()}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
            <input
              ref={allInputRef}
              type="file"
              multiple
              disabled={busy}
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              onChange={(e) => uploadFiles(e.target.files)}
              className="hidden"
            />
            <input
              ref={imgInputRef}
              type="file"
              multiple
              disabled={busy}
              accept="image/*"
              onChange={(e) => uploadFiles(e.target.files, 'image')}
              className="hidden"
            />
            <input
              ref={vidInputRef}
              type="file"
              multiple
              disabled={busy}
              accept="video/*"
              onChange={(e) => uploadFiles(e.target.files, 'video')}
              className="hidden"
            />
            <input
              ref={docInputRef}
              type="file"
              multiple
              disabled={busy}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              onChange={(e) => uploadFiles(e.target.files, 'document')}
              className="hidden"
            />
            {busy ? <div className="text-xs text-gray-400 mt-2">Working…</div> : null}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 p-4">{error}</div>
        ) : null}

        <div
          className="mb-6 rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-slate-200"
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={onDrop}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-semibold">Drag & drop files here</div>
              <div className="text-sm text-slate-400 mt-1">No URL required — you can upload directly from your computer.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => imgInputRef.current?.click()}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-60"
              >
                + Add images
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => vidInputRef.current?.click()}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-60"
              >
                + Add videos
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => docInputRef.current?.click()}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-60"
              >
                + Add documents
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Images</h2>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => imgInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm hover:bg-white/10 disabled:opacity-60"
                >
                  + Add
                </button>
              </div>
              {grouped.images.length === 0 ? (
                <div className="text-gray-400">No images yet.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {grouped.images.slice(0, 12).map((it) => {
                    const path = it.file_path || ''
                    const url = path ? thumbUrls[path] : null
                    return (
                      <div
                        key={it.id}
                        onClick={() => openItem(it)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openItem(it)
                        }}
                        tabIndex={0}
                        role="button"
                        className="rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden text-left"
                        title="Click to preview"
                      >
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={it.title} className="w-full h-28 object-cover" />
                        ) : (
                          <div className="w-full h-28 flex items-center justify-center text-gray-500">IMG</div>
                        )}
                        <div className="p-3">
                          <div className="text-sm text-gray-200 truncate">{it.title}</div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Image</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeItem(it)
                              }}
                              className="text-xs text-red-300 hover:text-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Videos</h2>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => vidInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm hover:bg-white/10 disabled:opacity-60"
                >
                  + Add
                </button>
              </div>
              {grouped.videos.length === 0 ? (
                <div className="text-gray-400">No videos yet.</div>
              ) : (
                <div className="space-y-3">
                  {grouped.videos.slice(0, 10).map((it) => (
                    <div key={it.id} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <button type="button" className="text-left" onClick={() => openItem(it)}>
                          <div className="text-gray-200 font-medium">{it.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{it.file_type || 'video'}</div>
                        </button>
                        <button type="button" onClick={() => removeItem(it)} className="text-xs text-red-300 hover:text-red-200">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Documents</h2>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => docInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm hover:bg-white/10 disabled:opacity-60"
                >
                  + Add
                </button>
              </div>
              {grouped.docs.length === 0 ? (
                <div className="text-gray-400">No documents yet.</div>
              ) : (
                <div className="space-y-2">
                  {grouped.docs.slice(0, 16).map((it) => (
                    <div key={it.id} className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <button type="button" onClick={() => openItem(it)} className="text-left min-w-0">
                          <div className="text-gray-200 font-medium truncate">{it.title}</div>
                          <div className="text-xs text-gray-500 mt-1 truncate">{it.file_type || 'document'}</div>
                        </button>
                        <button type="button" onClick={() => removeItem(it)} className="text-xs text-red-300 hover:text-red-200">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}


