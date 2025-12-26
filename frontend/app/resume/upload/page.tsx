'use client'

import { useEffect, useRef, useState, ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const BUCKET = 'talent-bank'

export default function ResumeUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [autoPopulate, setAutoPopulate] = useState(true)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      if (!uid) router.replace('/login')
    }).catch(() => router.replace('/login'))
  }, [router])

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    setError(null)
    setFile(e.target.files?.[0] ?? null)
    fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run-resume-upload',
        hypothesisId: 'RU_PICK',
        location: 'resume/upload/page.tsx:onPick',
        message: 'file selected',
        data: { hasFile: !!e.target.files?.[0], fileType: e.target.files?.[0]?.type ?? null, fileSize: e.target.files?.[0]?.size ?? null },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }

  function chooseFile() {
    fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run-resume-upload',
        hypothesisId: 'RU_PICK',
        location: 'resume/upload/page.tsx:chooseFile',
        message: 'choose file clicked',
        data: { hasRef: !!fileInputRef.current },
        timestamp: Date.now(),
      }),
    }).catch(() => {})

    fileInputRef.current?.click()
  }

  async function upload() {
    if (!file || !userId) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      fetch('/api/debug/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run-resume-upload',
          hypothesisId: 'RU_UPLOAD',
          location: 'resume/upload/page.tsx:upload',
          message: 'upload start',
          data: { hasUser: !!userId, fileType: file.type, fileSize: file.size },
          timestamp: Date.now(),
        }),
      }).catch(() => {})

      const path = `${userId}/${crypto.randomUUID()}-${file.name}`

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })

      if (storageError) throw storageError

      // Ensure public.users row exists (Talent Bank FK can require it)
      try {
        // Keep this quiet: try only the two schemas supported by our migration helper (id vs user_id).
        const r1 = await supabase.from('users').upsert({ id: userId } as any)
        if (r1.error) {
          const msg = String((r1.error as any)?.message ?? '')
          const code = String((r1.error as any)?.code ?? '')
          const isMissingCol = code === 'PGRST204' || /Could not find the .* column/i.test(msg)
          if (isMissingCol) {
            await supabase.from('users').upsert({ user_id: userId } as any)
          }
        }
      } catch {
        // ignore
      }

      // Store resume as a Talent Bank item so it can be reviewed/recalled/deleted in the same UI.
      const { error: insertError } = await supabase.from('talent_bank_items').insert({
        user_id: userId,
        item_type: 'resume',
        title: file.name,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        is_public: false,
      })

      if (insertError) throw insertError

      if (autoPopulate) {
        setStatus('Parsing resume…')
        // Signed URL for server-side parsing (no auth leakage).
        const { data: urlData } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10)
        const signedUrl = urlData?.signedUrl ?? null

        fetch('/api/debug/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'run-resume-upload',
            hypothesisId: 'RU_PARSE',
            location: 'resume/upload/page.tsx:upload',
            message: 'parse start',
            data: { hasSignedUrl: !!signedUrl, fileType: file.type },
            timestamp: Date.now(),
          }),
        }).catch(() => {})

        if (!signedUrl) throw new Error('Failed to create signed URL for parsing')
        const pr = await fetch('/api/resume/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: signedUrl, fileType: file.type }),
        })
        const pj = await pr.json().catch(() => ({}))
        if (!pr.ok) {
          throw new Error(pj?.error ?? 'Resume parse failed')
        }

        const parsed = pj?.parsed
        fetch('/api/debug/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'run-resume-upload',
            hypothesisId: 'RU_PARSE',
            location: 'resume/upload/page.tsx:upload',
            message: 'parse ok',
            data: {
              skillsCount: Array.isArray(parsed?.skills) ? parsed.skills.length : 0,
              expCount: Array.isArray(parsed?.experience) ? parsed.experience.length : 0,
              eduCount: Array.isArray(parsed?.education) ? parsed.education.length : 0,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})

        setStatus('Applying to portfolio…')
        await applyParsedToPortfolio(parsed)
        setStatus('Done. Opening portfolio…')
        router.push('/portfolio')
        return
      }

      router.push('/dashboard/talent/bank')
    } catch (e: any) {
      const msg = String(e?.message ?? 'Upload failed')
      if (msg.includes('talent_bank_items_user_id_fkey') || msg.toLowerCase().includes('violates foreign key constraint')) {
        setError(
          'Upload failed: your database requires a matching row in public.users for this account before writing to talent_bank_items.\n\n' +
            'Fix:\n' +
            '- Run Supabase migration `2025122208_users_self_row.sql` (then refresh schema cache)\n' +
            '- Sign out + sign in again\n' +
            '- Retry the upload.'
        )
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  async function applyParsedToPortfolio(parsed: any) {
    if (!userId) return

    // Find or create portfolio item
    const existing = await supabase
      .from('talent_bank_items')
      .select('id,metadata,item_type')
      .eq('user_id', userId)
      .eq('title', 'Portfolio')
      .in('item_type', ['portfolio', 'document'])
      .order('created_at', { ascending: false })
      .limit(1)

    let portfolioId = existing.data?.[0]?.id ?? null
    let meta: any = existing.data?.[0]?.metadata ?? {}

    if (!portfolioId) {
      const ins = await supabase.from('talent_bank_items').insert({
        user_id: userId,
        item_type: 'portfolio',
        title: 'Portfolio',
        metadata: { portfolioSelections: [] },
        is_public: false,
      }).select('id,metadata')
      portfolioId = (ins.data as any)?.[0]?.id ?? null
      meta = (ins.data as any)?.[0]?.metadata ?? { portfolioSelections: [] }
    }
    if (!portfolioId) throw new Error('Failed to create portfolio record')

    const prevSel: number[] = Array.isArray(meta?.portfolioSelections) ? meta.portfolioSelections : []

    // Insert TB experience / education items
    const expRows = (Array.isArray(parsed?.experience) ? parsed.experience : []).slice(0, 12).map((e: any) => ({
      user_id: userId,
      item_type: 'experience',
      title: `${e.company || 'Company'} — ${e.title || 'Role'}`,
      metadata: {
        company: e.company || '',
        title: e.title || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        description: e.description || '',
        achievements: Array.isArray(e.achievements) ? e.achievements : [],
        source: 'resume',
      },
      is_public: false,
    }))

    const eduRows = (Array.isArray(parsed?.education) ? parsed.education : []).slice(0, 8).map((e: any) => ({
      user_id: userId,
      item_type: 'education',
      title: `${e.institution || 'Institution'} — ${e.course || e.degree || 'Course'}`,
      metadata: {
        institution: e.institution || '',
        course: e.course || '',
        degree: e.degree || '',
        field: e.field || '',
        year: e.year || '',
        notes: e.notes || '',
        source: 'resume',
      },
      is_public: false,
    }))

    let newIds: number[] = []
    if (expRows.length) {
      const ins = await supabase.from('talent_bank_items').insert(expRows as any).select('id')
      if (ins.error) throw ins.error
      newIds = newIds.concat((ins.data ?? []).map((r: any) => r.id))
    }
    if (eduRows.length) {
      const ins = await supabase.from('talent_bank_items').insert(eduRows as any).select('id')
      if (ins.error) throw ins.error
      newIds = newIds.concat((ins.data ?? []).map((r: any) => r.id))
    }

    // Merge skills into portfolio metadata (kept as freeform array)
    const skills: string[] = Array.isArray(meta?.skills) ? meta.skills : []
    const parsedSkills: string[] = Array.isArray(parsed?.skills) ? parsed.skills : []
    const mergedSkills = [...skills]
    for (const s of parsedSkills) {
      if (!mergedSkills.some((x) => (x || '').toLowerCase() === (s || '').toLowerCase())) mergedSkills.push(s)
    }

    const nextSel = Array.from(new Set<number>([...prevSel, ...newIds]))
    const nextMeta = {
      ...meta,
      portfolioSelections: nextSel,
      skills: mergedSkills,
      // only fill name if empty
      name: meta?.name || parsed?.fields?.name || meta?.name,
      resumeParsedAt: Date.now(),
    }

    fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run-resume-upload',
        hypothesisId: 'RU_APPLY',
        location: 'resume/upload/page.tsx:applyParsedToPortfolio',
        message: 'apply',
        data: { expInserted: expRows.length, eduInserted: eduRows.length, newSelected: newIds.length, skillsAdded: mergedSkills.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {})

    const upd = await supabase.from('talent_bank_items').update({ metadata: nextMeta }).eq('id', portfolioId).eq('user_id', userId)
    if (upd.error) throw upd.error
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-blue-400">Creerlio</Link>
          <Link href="/dashboard/talent" className="text-slate-300 hover:text-blue-400">← Back</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">Upload Resume</h1>
        <p className="text-slate-300 mb-8">Your resume will be saved to Talent Bank for later review, download, and deletion.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={onPick}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={chooseFile}
              className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 font-semibold"
            >
              Choose file
            </button>
            <div className="text-sm text-slate-300">
              {file ? (
                <span>
                  Selected: <span className="text-white font-medium">{file.name}</span>
                </span>
              ) : (
                <span>No file selected</span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-3">
              <input type="checkbox" checked={autoPopulate} onChange={(e) => setAutoPopulate(e.target.checked)} />
              Auto-populate Portfolio (skills + experience + education) from this resume
            </label>
            {status && <div className="text-xs text-slate-400 mb-2">{status}</div>}
            <button
              onClick={upload}
              disabled={!file || busy || !userId}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-semibold"
            >
              {busy ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}


