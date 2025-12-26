import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ParsedSocial = {
  platform: string
  url: string
  profile?: {
    name?: string
    title?: string
    description?: string
    avatarUrl?: string
    location?: string
  }
  projects?: Array<{ name: string; description?: string; url: string; stars?: number }>
  meta?: Record<string, any>
  message?: string
}

function env(name: string) {
  const v = process.env[name]
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function normalizeUrl(u: string) {
  const s = String(u || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s.replace(/^\/+/, '')}`
}

function platformFromUrl(u: string) {
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

async function parseGitHub(url: string): Promise<ParsedSocial> {
  const m = url.match(/github\.com\/([^\/?#]+)/i)
  const username = m?.[1]
  if (!username) return { platform: 'GitHub', url, message: 'Could not detect GitHub username from URL.' }

  const ghToken = env('GITHUB_TOKEN') // optional
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Creerlio/1.0',
  }
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`

  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, { headers }),
  ])

  if (!userRes.ok) {
    return {
      platform: 'GitHub',
      url,
      message: `GitHub API error (${userRes.status}).`,
      meta: { status: userRes.status },
    }
  }

  const user = await userRes.json().catch(() => null)
  const repos = reposRes.ok ? await reposRes.json().catch(() => []) : []

  const projects = Array.isArray(repos)
    ? repos
        .filter((r: any) => r && !r.fork)
        .map((r: any) => ({
          name: String(r?.name ?? ''),
          description: r?.description != null ? String(r.description) : undefined,
          url: String(r?.html_url ?? ''),
          stars: typeof r?.stargazers_count === 'number' ? r.stargazers_count : undefined,
        }))
        .filter((p: any) => p.name && p.url)
        .sort((a: any, b: any) => (b.stars ?? 0) - (a.stars ?? 0))
        .slice(0, 12)
    : []

  return {
    platform: 'GitHub',
    url,
    profile: {
      name: user?.name ?? user?.login ?? username,
      title: user?.company ? String(user.company) : undefined,
      description: user?.bio ? String(user.bio) : undefined,
      avatarUrl: user?.avatar_url ? String(user.avatar_url) : undefined,
      location: user?.location ? String(user.location) : undefined,
    },
    projects,
    meta: { parser: 'github', repoCount: Array.isArray(repos) ? repos.length : 0 },
  }
}

async function parseYouTube(url: string): Promise<ParsedSocial> {
  // Public oEmbed gives basic channel/video metadata without an API key.
  const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
  const res = await fetch(oembed)
  if (!res.ok) {
    return { platform: 'YouTube', url, message: `YouTube oEmbed error (${res.status}).`, meta: { status: res.status } }
  }
  const j = await res.json().catch(() => null)
  return {
    platform: 'YouTube',
    url,
    profile: {
      name: j?.author_name ? String(j.author_name) : undefined,
      title: j?.title ? String(j.title) : undefined,
      avatarUrl: j?.thumbnail_url ? String(j.thumbnail_url) : undefined,
    },
    meta: { parser: 'youtube_oembed' },
  }
}

function extractMeta(html: string) {
  const pick = (re: RegExp) => {
    const m = html.match(re)
    return m?.[1] ? String(m[1]).trim() : null
  }
  const ogTitle = pick(/property=["']og:title["']\s+content=["']([^"']+)["']/i) || pick(/content=["']([^"']+)["']\s+property=["']og:title["']/i)
  const ogDesc =
    pick(/property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
    pick(/content=["']([^"']+)["']\s+property=["']og:description["']/i) ||
    pick(/name=["']description["']\s+content=["']([^"']+)["']/i)
  const ogImage =
    pick(/property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
    pick(/content=["']([^"']+)["']\s+property=["']og:image["']/i)
  const title = pick(/<title>([^<]+)<\/title>/i)
  return { title: ogTitle || title, description: ogDesc, image: ogImage }
}

async function parseOpenGraph(url: string): Promise<ParsedSocial> {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) return { platform: platformFromUrl(url), url, message: `Fetch error (${res.status}).`, meta: { status: res.status } }
  const html = await res.text().catch(() => '')
  const meta = extractMeta(html)
  return {
    platform: platformFromUrl(url),
    url,
    profile: {
      title: meta.title ?? undefined,
      description: meta.description ?? undefined,
      avatarUrl: meta.image ?? undefined,
    },
    meta: { parser: 'opengraph' },
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const rawUrl = String(body?.url ?? '').trim()
    if (!rawUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    const url = normalizeUrl(rawUrl)
    const platform = platformFromUrl(url)

    // LinkedIn: cannot reliably scrape without auth; guide user.
    if (platform === 'LinkedIn') {
      return NextResponse.json(
        {
          parsed: {
            platform,
            url,
            meta: { parser: 'unsupported' },
            message:
              'LinkedIn cannot be auto-parsed without OAuth/permissions. Recommended: export your LinkedIn profile as PDF and upload it to Talent Bank, then parse it like a resume.',
          },
        },
        { status: 200 }
      )
    }

    let parsed: ParsedSocial
    if (platform === 'GitHub') parsed = await parseGitHub(url)
    else if (platform === 'YouTube') parsed = await parseYouTube(url)
    else parsed = await parseOpenGraph(url)

    return NextResponse.json({ parsed }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}


