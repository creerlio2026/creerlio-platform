import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ParsedResume = {
  fields: {
    name?: string | null
    email?: string | null
    phone?: string | null
  }
  socialLinks: Array<{
    platform: string
    url: string
  }>
  skills: string[]
  experience: Array<{
    company: string
    title: string
    startDate: string
    endDate: string
    description: string
    achievements?: string[]
  }>
  education: Array<{
    institution: string
    course?: string
    degree?: string
    field?: string
    year?: string
    notes?: string
  }>
  credentials: Array<{
    name: string
    issuer?: string
    credentialId?: string
    expiry?: string
    notes?: string
  }>
  referees: Array<{
    name: string
    relationship?: string
    company?: string
    title?: string
    email?: string
    phone?: string
    notes?: string
  }>
}

function env(name: string) {
  const v = process.env[name]
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function clipTextForLLM(text: string) {
  // Keep prompt bounded for cost/latency. Use head+tail to preserve context.
  const max = 22000
  if (text.length <= max) return text
  const head = text.slice(0, 14000)
  const tail = text.slice(-6000)
  return `${head}\n\n--- SNIP ---\n\n${tail}`
}

function coerceParsedResume(x: any): ParsedResume | null {
  if (!x || typeof x !== 'object') return null
  const fields = x.fields && typeof x.fields === 'object' ? x.fields : {}
  const socialLinksRaw = Array.isArray(x.socialLinks) ? x.socialLinks : []
  const socialLinks = socialLinksRaw
    .map((s: any) => ({
      platform: String(s?.platform ?? '').trim(),
      url: String(s?.url ?? '').trim(),
    }))
    .filter((s: any) => !!s.platform && !!s.url)
    .slice(0, 20)
  const skills = Array.isArray(x.skills) ? x.skills.map((s: any) => String(s)).filter(Boolean) : []
  const experienceRaw = Array.isArray(x.experience) ? x.experience : []
  const educationRaw = Array.isArray(x.education) ? x.education : []
  const credentialsRaw = Array.isArray(x.credentials) ? x.credentials : []
  const refereesRaw = Array.isArray(x.referees) ? x.referees : []

  const experience = experienceRaw
    .map((e: any) => ({
      company: String(e?.company ?? '').trim() || 'Company',
      title: String(e?.title ?? '').trim() || 'Role',
      startDate: String(e?.startDate ?? '').trim(),
      endDate: String(e?.endDate ?? '').trim(),
      description: String(e?.description ?? '').trim(),
      achievements: Array.isArray(e?.achievements) ? e.achievements.map((a: any) => String(a)).filter(Boolean) : undefined,
    }))
    .slice(0, 12)

  const education = educationRaw
    .map((e: any) => ({
      institution: String(e?.institution ?? '').trim() || 'Institution',
      course: e?.course != null ? String(e.course).trim() : undefined,
      degree: e?.degree != null ? String(e.degree).trim() : undefined,
      field: e?.field != null ? String(e.field).trim() : undefined,
      year: e?.year != null ? String(e.year).trim() : undefined,
      notes: e?.notes != null ? String(e.notes).trim() : undefined,
    }))
    .slice(0, 8)

  const credentials = credentialsRaw
    .map((c: any) => ({
      name: String(c?.name ?? '').trim(),
      issuer: c?.issuer != null ? String(c.issuer).trim() : undefined,
      credentialId: c?.credentialId != null ? String(c.credentialId).trim() : undefined,
      expiry: c?.expiry != null ? String(c.expiry).trim() : undefined,
      notes: c?.notes != null ? String(c.notes).trim() : undefined,
    }))
    .filter((c: any) => !!c.name)
    .slice(0, 20)

  const referees = refereesRaw
    .map((r: any) => ({
      name: String(r?.name ?? '').trim(),
      relationship: r?.relationship != null ? String(r.relationship).trim() : undefined,
      company: r?.company != null ? String(r.company).trim() : undefined,
      title: r?.title != null ? String(r.title).trim() : undefined,
      email: r?.email != null ? String(r.email).trim() : undefined,
      phone: r?.phone != null ? String(r.phone).trim() : undefined,
      notes: r?.notes != null ? String(r.notes).trim() : undefined,
    }))
    .filter((r: any) => !!r.name)
    .slice(0, 10)

  return {
    fields: {
      name: fields?.name != null ? String(fields.name).trim() : null,
      email: fields?.email != null ? String(fields.email).trim() : null,
      phone: fields?.phone != null ? String(fields.phone).trim() : null,
    },
    socialLinks,
    skills: skills.slice(0, 60),
    experience,
    education,
    credentials,
    referees,
  }
}

async function parseWithOpenAI(rawText: string, fileType: string) {
  const apiKey = env('OPENAI_API_KEY')
  if (!apiKey) return null

  const model = env('OPENAI_MODEL') || 'gpt-4o-mini'
  const text = clipTextForLLM(rawText)

  const prompt = [
    'You are a resume parser. Extract structured data from the provided resume text.',
    'Return ONLY valid JSON matching this shape:',
    JSON.stringify(
      {
        fields: { name: 'string|null', email: 'string|null', phone: 'string|null' },
        socialLinks: [{ platform: 'string', url: 'string' }],
        skills: ['string'],
        experience: [
          {
            company: 'string',
            title: 'string',
            startDate: 'string',
            endDate: 'string',
            description: 'string',
            achievements: ['string'],
          },
        ],
        education: [{ institution: 'string', course: 'string?', degree: 'string?', field: 'string?', year: 'string?', notes: 'string?' }],
        credentials: [{ name: 'string', issuer: 'string?', credentialId: 'string?', expiry: 'string?', notes: 'string?' }],
        referees: [{ name: 'string', relationship: 'string?', company: 'string?', title: 'string?', email: 'string?', phone: 'string?', notes: 'string?' }],
      },
      null,
      2
    ),
    'Rules:',
    '- Prefer ISO-like dates when possible, otherwise keep the original month/year text.',
    '- If an item is unknown, use empty string (for string fields) or null (for name/email/phone).',
    '- skills should be deduped and concise.',
    '- socialLinks should include LinkedIn, GitHub, YouTube, portfolio/website, and any other social links present. Use absolute URLs when possible.',
    '- experience should be in reverse-chronological order if possible.',
    '- For each experience entry, DO NOT summarize. Include as much role-relevant content as possible from the resume for that role.',
    '- Put bullet-style responsibilities/achievements into achievements[] (each bullet as a separate string).',
    '- Put the full role text into description as multi-line text (include the bullets too; preserve details, tools, outcomes).',
    '- credentials: certifications / licenses / accreditations.',
    '- referees: referees / references section; if none present, return empty array.',
  ].join('\n')

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `File type: ${fileType || 'unknown'}\n\nResume text:\n${text}`,
        },
      ],
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`OpenAI error (${resp.status}): ${errText.slice(0, 200)}`)
  }

  const json = await resp.json().catch(() => null)
  const content = json?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') return null

  const parsedJson = JSON.parse(content)
  return coerceParsedResume(parsedJson)
}

function logToIngest(hypothesisId: string, message: string, data: any) {
  fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'run-resume-parse',
      hypothesisId,
      location: 'app/api/resume/parse/route.ts',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}

function normalizeText(t: string) {
  return t
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractEmail(text: string) {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return m?.[0] ?? null
}

function extractPhone(text: string) {
  // Very loose: keep only digits, allow +, spaces, hyphens; require 8-15 digits total.
  const candidates = text.match(/(\+?\d[\d ()-]{7,}\d)/g) ?? []
  for (const c of candidates) {
    const digits = c.replace(/[^\d]/g, '')
    if (digits.length >= 8 && digits.length <= 15) return c.trim()
  }
  return null
}

function extractName(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const l of lines.slice(0, 8)) {
    if (l.length > 60) continue
    if (/@/.test(l)) continue
    if (/\d/.test(l)) continue
    const words = l.split(/\s+/)
    if (words.length >= 2 && words.length <= 4) return l
  }
  return null
}

function findSection(text: string, headings: string[]) {
  const lower = text.toLowerCase()
  const indexes = headings
    .map((h) => ({ h, i: lower.indexOf(h.toLowerCase()) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
  if (!indexes.length) return null
  const start = indexes[0].i
  // end at next likely heading
  const nextHeadingMatch = lower.slice(start + 1).match(/\n\s*(experience|work experience|employment|education|skills|projects|certifications|licenses|summary|profile)\s*\n/i)
  const end = nextHeadingMatch ? start + 1 + (nextHeadingMatch.index ?? 0) : text.length
  return text.slice(start, end)
}

function parseSkills(text: string): string[] {
  const sec = findSection(text, ['skills', 'technical skills', 'key skills'])
  if (!sec) return []
  const lines = sec
    .split('\n')
    .map((l) => l.replace(/^[•\-\u2022]\s*/, '').trim())
    .filter((l) => l && !/^skills/i.test(l))
  const merged = lines.join(' • ')
  const parts = merged
    .split(/[•,|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
  // de-dupe small set
  const out: string[] = []
  for (const p of parts) {
    if (!out.some((x) => x.toLowerCase() === p.toLowerCase())) out.push(p)
  }
  return out.slice(0, 40)
}

function parseExperience(text: string): ParsedResume['experience'] {
  const sec = findSection(text, ['work experience', 'experience', 'employment history', 'employment'])
  if (!sec) return []
  const lines = sec.split('\n').map((l) => l.trim()).filter(Boolean)
  const entries: ParsedResume['experience'] = []

  // Heuristic: start new entry on a line containing a date range
  const dateRe =
    /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b\s+\d{4}|\b\d{4}\b)\s*(?:–|-|to)\s*(present|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b\s+\d{4}|\b\d{4}\b)/i

  let cur: any = null
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (/^(work experience|experience|employment)/i.test(l)) continue
    const dm = l.match(dateRe)
    if (dm) {
      if (cur) entries.push(cur)
      cur = {
        company: '',
        title: '',
        startDate: dm[1] ?? '',
        endDate: dm[2] ?? '',
        description: '',
      }
      // attempt to read previous/next lines for title/company
      const prev = lines[i - 1] ?? ''
      const next = lines[i + 1] ?? ''
      const pick = (s: string) => s && s.length <= 80 ? s : ''
      // Common formats: "Company — Title" or "Title — Company"
      const dashSplit = prev.split('—').map((x) => x.trim())
      if (dashSplit.length === 2) {
        cur.company = pick(dashSplit[0])
        cur.title = pick(dashSplit[1])
      } else {
        cur.title = pick(prev)
        cur.company = pick(next)
      }
      continue
    }
    if (!cur) continue
    cur.description += (cur.description ? '\n' : '') + l
  }
  if (cur) entries.push(cur)

  // Normalize & cap
  return entries
    .map((e) => ({
      company: e.company || 'Company',
      title: e.title || 'Role',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      description: (e.description || '').trim(),
    }))
    .filter((e) => e.description || e.company || e.title)
    .slice(0, 12)
}

function parseEducation(text: string): ParsedResume['education'] {
  const sec = findSection(text, ['education', 'qualifications'])
  if (!sec) return []
  const lines = sec.split('\n').map((l) => l.trim()).filter(Boolean)
  const entries: ParsedResume['education'] = []

  // Heuristic: each non-heading block is an entry; detect years
  const yearRe = /\b(19|20)\d{2}\b/
  let cur: any = null
  for (const l of lines) {
    if (/^(education|qualifications)/i.test(l)) continue
    if (!cur) cur = { institution: '', course: '', year: '', notes: '' }
    if (!cur.institution) {
      cur.institution = l
      continue
    }
    const ym = l.match(yearRe)
    if (ym && !cur.year) {
      cur.year = ym[0]
      continue
    }
    if (!cur.course) {
      cur.course = l
      continue
    }
    cur.notes += (cur.notes ? '\n' : '') + l
    // If notes gets long, finalize
    if (cur.notes.length > 200) {
      entries.push(cur)
      cur = null
    }
  }
  if (cur) entries.push(cur)
  return entries
    .map((e) => ({
      institution: e.institution || 'Institution',
      course: e.course || '',
      year: e.year || '',
      notes: (e.notes || '').trim() || undefined,
    }))
    .slice(0, 8)
}

function parseSocialLinks(text: string): ParsedResume['socialLinks'] {
  const lower = text.toLowerCase()
  const matches = lower.match(/(https?:\/\/[^\s)]+|www\.[^\s)]+)/g) ?? []
  const cleaned = matches
    .map((u) => u.replace(/[.,;]+$/g, '').trim())
    .map((u) => (u.startsWith('www.') ? `https://${u}` : u))
    .filter(Boolean)

  const platformOf = (u: string) => {
    const x = u.toLowerCase()
    if (x.includes('linkedin.com')) return 'LinkedIn'
    if (x.includes('github.com')) return 'GitHub'
    if (x.includes('youtube.com') || x.includes('youtu.be')) return 'YouTube'
    if (x.includes('twitter.com') || x.includes('x.com')) return 'X'
    if (x.includes('instagram.com')) return 'Instagram'
    if (x.includes('facebook.com')) return 'Facebook'
    if (x.includes('tiktok.com')) return 'TikTok'
    if (x.includes('behance.net')) return 'Behance'
    if (x.includes('dribbble.com')) return 'Dribbble'
    return 'Website'
  }

  const out: ParsedResume['socialLinks'] = []
  for (const url of cleaned) {
    // skip obvious non-profile links
    if (url.includes('mailto:')) continue
    if (url.includes('tel:')) continue
    const platform = platformOf(url)
    const key = `${platform.toLowerCase()}|${url.toLowerCase()}`
    if (out.some((s) => `${s.platform.toLowerCase()}|${s.url.toLowerCase()}` === key)) continue
    out.push({ platform, url })
  }

  // Add bare LinkedIn handle patterns if present (very light heuristic)
  if (!out.some((s) => s.platform.toLowerCase() === 'linkedin')) {
    const lm = text.match(/\blinkedin\s*:\s*([^\s]+)/i)
    if (lm?.[1]) {
      const v = String(lm[1]).trim().replace(/[.,;]+$/g, '')
      if (v) out.push({ platform: 'LinkedIn', url: v.startsWith('http') ? v : `https://${v}` })
    }
  }

  return out.slice(0, 20)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const url = body?.url as string | undefined
    const fileType = (body?.fileType as string | undefined) ?? ''
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

    const openaiConfigured = !!env('OPENAI_API_KEY')
    const openaiModel = env('OPENAI_MODEL') || 'gpt-4o-mini'
    logToIngest('RP_1', 'parse start', { hasUrl: true, fileType, openaiConfigured, openaiModel })

    const res = await fetch(url)
    if (!res.ok) {
      logToIngest('RP_1', 'fetch failed', { status: res.status })
      return NextResponse.json(
        { error: `Failed to fetch file (${res.status})`, meta: { openaiConfigured, openaiModel } },
        { status: 400 }
      )
    }

    const buf = Buffer.from(await res.arrayBuffer())
    let text = ''

    if (/pdf/i.test(fileType) || url.toLowerCase().includes('.pdf')) {
      const mod: any = await import('pdf-parse')
      const pdf = mod.default ?? mod
      const out = await pdf(buf)
      text = out?.text ?? ''
    } else if (/docx/i.test(fileType) || url.toLowerCase().includes('.docx')) {
      const mammoth: any = await import('mammoth')
      const out = await mammoth.extractRawText({ buffer: buf })
      text = out?.value ?? ''
    } else if (/text\/plain/i.test(fileType) || url.toLowerCase().includes('.txt')) {
      text = buf.toString('utf8')
    } else {
      return NextResponse.json({ error: 'Unsupported file type for parsing. Please use PDF or DOCX.' }, { status: 400 })
    }

    text = normalizeText(text)

    // Prefer OpenAI parsing if configured; fall back to heuristics.
    let parsed: ParsedResume | null = null
    let parser: 'openai' | 'heuristic' = 'heuristic'
    let openaiError: string | null = null
    try {
      parsed = await parseWithOpenAI(text, fileType)
      if (parsed) {
        parser = 'openai'
        logToIngest('RP_AI', 'openai parse ok', { model: openaiModel })
      }
    } catch (e: any) {
      openaiError = String(e?.message ?? String(e)).slice(0, 240)
      logToIngest('RP_AI', 'openai parse failed', { message: openaiError })
      parsed = null
    }

    if (!parsed) {
      parser = 'heuristic'
      parsed = {
        fields: {
          name: extractName(text),
          email: extractEmail(text),
          phone: extractPhone(text),
        },
        socialLinks: parseSocialLinks(text),
        skills: parseSkills(text),
        experience: parseExperience(text),
        education: parseEducation(text),
        credentials: [],
        referees: [],
      }
    }

    const meta = {
      parser,
      openaiConfigured,
      openaiModel,
      openaiError,
      textLen: text.length,
      socialCount: parsed.socialLinks.length,
      skillsCount: parsed.skills.length,
      expCount: parsed.experience.length,
      eduCount: parsed.education.length,
    }

    logToIngest('RP_2', 'parse ok', {
      textLen: text.length,
      hasName: !!parsed.fields.name,
      hasEmail: !!parsed.fields.email,
      hasPhone: !!parsed.fields.phone,
      socialCount: parsed.socialLinks.length,
      skillsCount: parsed.skills.length,
      expCount: parsed.experience.length,
      eduCount: parsed.education.length,
      parser,
    })

    // Do NOT return raw text (too large / potentially sensitive). Only structured fields.
    return NextResponse.json({ parsed, meta })
  } catch (e: any) {
    logToIngest('RP_9', 'parse exception', { message: e?.message ?? String(e) })
    return NextResponse.json({ error: e?.message ?? 'Parse failed' }, { status: 500 })
  }
}


