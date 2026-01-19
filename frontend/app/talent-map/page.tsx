'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BusinessDiscoveryMap, {type BusinessFeature, type RouteState } from '@/components/BusinessDiscoveryMap'

export const dynamic = 'force-dynamic'

const DEBUG_ENDPOINT = 'http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc'
const emitDebugLog = (payload: Record<string, unknown>) => {
  fetch(DEBUG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
  fetch('/api/debug-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
}

async function saveForRelocation(business) {
  const { error } = await supabase.from('relocation_scenarios').insert({
    business_name: business.name,
    work_lat: business.lat,
    work_lng: business.lng,
    home_label: 'To be decided',
    home_lat: business.lat,
    home_lng: business.lng,
    notes: 'Saved from Talent Map'
  });

  if (!error) {
    alert('Saved to Relocation Library');
  } else {
    alert('Could not save');
  }
}
const INDUSTRIES = [
  "Agriculture",
  "Architecture",
  "Automotive",
  "Aviation",
  "Banking",
  "Biotechnology",
  "Building & Construction",
  "Business Consulting",
  "Childcare & Early Education",
  "Cleaning Services",
  "Community Services",
  "Cyber Security",
  "Defence & Aerospace",
  "Education & Training",
  "Electrical & Electronics",
  "Energy & Utilities",
  "Engineering",
  "Environmental Services",
  "Financial Services",
  "Food & Beverage",
  "Government & Public Sector",
  "Healthcare",
  "Hospitality",
  "Human Resources",
  "Information Technology",
  "Insurance",
  "Legal Services",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Marketing & Advertising",
  "Media & Communications",
  "Mining & Resources",
  "Not-for-Profit",
  "Pharmaceuticals",
  "Professional Services",
  "Property & Real Estate",
  "Recruitment & Staffing",
  "Retail",
  "Sales",
  "Science & Research",
  "Sports & Recreation",
  "Telecommunications",
  "Tourism & Travel",
  "Transport",
  "Warehousing",
  "Wholesale Trade"
] as const;

const INDUSTRY_OPTIONS = [...INDUSTRIES];

type LocSuggestion = { id: string; label: string; lng: number; lat: number }
type BizSuggestion = {
  id: string
  name: string
  slug: string
  industry: string | null
  location: string | null
  lat: number | null
  lng: number | null
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

type MapStyle = 'dark' | 'light' | 'satellite' | 'streets'

const AU_BOUNDS: [[number, number], [number, number]] = [
  [112.0, -44.0], // SW
  [154.0, -10.0], // NE
]

export default function TalentMapPage() {
  return (
    <Suspense fallback={null}>
      <TalentMapPageInner />
    </Suspense>
  )
}

function TalentMapPageInner() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStyle, setActiveStyle] = useState<MapStyle>('dark')
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  const [panelsCollapsed, setPanelsCollapsed] = useState(false)
  const [mapResizeTrigger, setMapResizeTrigger] = useState(0)

  const [locQuery, setLocQuery] = useState('')
  const [locBusy, setLocBusy] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const [locOpen, setLocOpen] = useState(false)
  const [locSuggestions, setLocSuggestions] = useState<LocSuggestion[]>([])
  const [locActiveIdx, setLocActiveIdx] = useState(0)
  const RADIUS_KEY = 'creerlio_talent_map_radius_km_v1'
  const [radiusKm, setRadiusKm] = useState<number>(5)
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number; zoom?: number } | null>(null)
  const [searchCenter, setSearchCenter] = useState<{ lng: number; lat: number; label?: string } | null>(null)
  const SHOW_ALL_KEY = 'creerlio_talent_map_show_all_v1'
  const [showAllBusinesses, setShowAllBusinesses] = useState<boolean>(true)
  const [intentStatusFilter, setIntentStatusFilter] = useState<string>('')
  const [intentCompatibility, setIntentCompatibility] = useState<boolean>(false)
  const [mapFitBounds, setMapFitBounds] = useState<[[number, number], [number, number]] | null>(null)

  const [filters, setFilters] = useState({
    q: '',
    industries: [] as string[],
    work: '',
  })
  
  const [industryInput, setIndustryInput] = useState('')
  const [industryInputOpen, setIndustryInputOpen] = useState(false)
  const [industryInputActiveIdx, setIndustryInputActiveIdx] = useState(0)

  const [toggles, setToggles] = useState({
    businesses: true,
    context: false,
    schools: false,
    commute: false,
    transport: false,
    shopping: false,
    property: false,
  })

  const applyToggles = (next: Partial<typeof toggles>) => {
    setToggles((prev) => {
      const merged = { ...prev, ...next }
      const anyContext = !!(merged.schools || merged.commute || merged.transport || merged.shopping || merged.property)
      // Keep the master `context` flag in sync so the map never shows dead toggles.
      merged.context = anyContext
      return merged
    })
  }

  const [results, setResults] = useState<
    Array<{ id: string; name: string; slug: string; industries: string[]; lng: number; lat: number; approx?: boolean; intent_status?: string | null; intent_visibility?: boolean }>
  >([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessFeature | null>(null)
  const [routeState, setRouteState] = useState<RouteState | null>(null)
  const [routeQuery, setRouteQuery] = useState('')
  const [committedRouteQuery, setCommittedRouteQuery] = useState('')
  const [routeSuggestions, setRouteSuggestions] = useState<LocSuggestion[]>([])
  const [routeSuggestionsOpen, setRouteSuggestionsOpen] = useState(false)
  const [routeActiveIdx, setRouteActiveIdx] = useState(0)
  const routeAbortRef = useRef<AbortController | null>(null)
  const [selectBusinessId, setSelectBusinessId] = useState<string | null>(null)

  const TOGGLES_KEY = 'creerlio_talent_map_toggles_v1'

  const locDebounced = useDebouncedValue(locQuery, 220)
  const qDebounced = useDebouncedValue(filters.q, 220)
  const routeQueryDebounced = useDebouncedValue(routeQuery, 220)
  const locAbort = useRef<AbortController | null>(null)
  const qAbort = useRef<AbortController | null>(null)

  // Restore selected business from URL param
  useEffect(() => {
    const businessId = searchParams.get('business')
    if (businessId && businessId !== selectedBusinessId) {
      setSelectedBusinessId(businessId)
      setSelectBusinessId(businessId)
    }
  }, [searchParams])

  // Persist selected business to URL
  useEffect(() => {
    if (selectedBusinessId) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('business', selectedBusinessId)
      router.replace(`/talent-map?${params.toString()}`, { scroll: false })
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('business')
      const newUrl = params.toString() ? `/talent-map?${params.toString()}` : '/talent-map'
      router.replace(newUrl, { scroll: false })
    }
  }, [selectedBusinessId, router, searchParams])

  // Persist radius across sessions; default to 5km if no prior selection.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RADIUS_KEY)
      const n = raw ? Number(raw) : NaN
      if (Number.isFinite(n)) {
        const clamped = Math.min(100, Math.max(5, Math.round(n / 5) * 5))
        setRadiusKm(clamped)
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist toggles + showAll across sessions (TalentSearch should feel stable).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TOGGLES_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setToggles((p) => ({
            ...p,
            businesses: typeof parsed.businesses === 'boolean' ? parsed.businesses : p.businesses,
            schools: typeof parsed.schools === 'boolean' ? parsed.schools : p.schools,
            commute: typeof parsed.commute === 'boolean' ? parsed.commute : p.commute,
            transport: typeof parsed.transport === 'boolean' ? parsed.transport : p.transport,
            shopping: typeof parsed.shopping === 'boolean' ? parsed.shopping : (p as any).shopping,
            property: typeof parsed.property === 'boolean' ? parsed.property : p.property,
          }))
        }
      }
    } catch {
      // ignore
    }
    try {
      const raw = window.localStorage.getItem(SHOW_ALL_KEY)
      if (raw === '0') setShowAllBusinesses(false)
      if (raw === '1') setShowAllBusinesses(true)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ensure `context` is always derived from individual layers (prevents dead-state boots).
  useEffect(() => {
    setToggles((p) => {
      const anyContext = !!(p.schools || p.commute || p.transport || p.shopping || p.property)
      if (p.context === anyContext) return p
      return { ...p, context: anyContext }
    })
  }, [toggles.schools, toggles.commute, toggles.transport, toggles.shopping, toggles.property])

  useEffect(() => {
    try {
      window.localStorage.setItem(TOGGLES_KEY, JSON.stringify(toggles))
    } catch {
      // ignore
    }
  }, [toggles])

  useEffect(() => {
    try {
      window.localStorage.setItem(SHOW_ALL_KEY, showAllBusinesses ? '1' : '0')
    } catch {
      // ignore
    }
  }, [showAllBusinesses])

  useEffect(() => {
    try {
      window.localStorage.setItem(RADIUS_KEY, String(radiusKm))
    } catch {
      // ignore
    }
  }, [radiusKm])

  async function fetchRouteSuggestions(q: string) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
    const qq = q.trim()
    if (!qq || qq.length < 2) {
      setRouteSuggestions([])
      setRouteActiveIdx(0)
      return
    }
    if (!token) return
    routeAbortRef.current?.abort()
    const ac = new AbortController()
    routeAbortRef.current = ac
    try {
      const u = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(qq)}.json`)
      u.searchParams.set('access_token', token)
      u.searchParams.set('limit', '6')
      // Include 'address' type to support street-level addresses like "6 George Street Sydney"
      u.searchParams.set('types', 'address,place,locality,neighborhood,postcode,region')
      u.searchParams.set('country', 'AU')
      const res = await fetch(u.toString(), { signal: ac.signal })
      const json: any = await res.json().catch(() => null)
      const feats = Array.isArray(json?.features) ? json.features : []
      const next: LocSuggestion[] = feats
        .map((f: any) => {
          const id = String(f?.id || '')
          const label = String(f?.place_name || '').trim()
          const center = f?.center
          const lng = Array.isArray(center) ? center[0] : null
          const lat = Array.isArray(center) ? center[1] : null
          if (!id || !label || typeof lng !== 'number' || typeof lat !== 'number') return null
          return { id, label, lng, lat }
        })
        .filter(Boolean)
        .slice(0, 6) as any
      setRouteSuggestions(next)
      setRouteActiveIdx(0)
    } catch {
      setRouteSuggestions([])
      setRouteActiveIdx(0)
    }
  }

  useEffect(() => {
    if (!routeSuggestionsOpen) return
    fetchRouteSuggestions(routeQueryDebounced).catch(() => {})
  }, [routeQueryDebounced, routeSuggestionsOpen])

  async function fetchLocSuggestions(q: string) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
    const qq = q.trim()
    if (!qq || qq.length < 2) {
      setLocSuggestions([])
      setLocActiveIdx(0)
      return
    }
    if (!token) return
    locAbort.current?.abort()
    const ac = new AbortController()
    locAbort.current = ac
    try {
      const u = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(qq)}.json`)
      u.searchParams.set('access_token', token)
      u.searchParams.set('limit', '6')
      u.searchParams.set('types', 'place,locality,neighborhood,postcode,region')
      u.searchParams.set('country', 'AU')
      const res = await fetch(u.toString(), { signal: ac.signal })
      const json: any = await res.json().catch(() => null)
      const feats = Array.isArray(json?.features) ? json.features : []
      const next: LocSuggestion[] = feats
        .map((f: any) => {
          const id = String(f?.id || '')
          const label = String(f?.place_name || '').trim()
          const center = f?.center
          const lng = Array.isArray(center) ? center[0] : null
          const lat = Array.isArray(center) ? center[1] : null
          if (!id || !label || typeof lng !== 'number' || typeof lat !== 'number') return null
          return { id, label, lng, lat }
        })
        .filter(Boolean)
        .slice(0, 6) as any
      setLocSuggestions(next)
      setLocActiveIdx(0)
    } catch {
      // silent fail (UX rule)
      setLocSuggestions([])
      setLocActiveIdx(0)
    }
  }

  async function fetchBizSuggestions(q: string) {
    const qq = q.trim()
    if (!qq || qq.length < 2) {
      setBizSuggestions([])
      setBizActiveIdx(0)
      return
    }
    qAbort.current?.abort()
    const ac = new AbortController()
    qAbort.current = ac
    try {
      const u = new URL('/api/map/suggest', window.location.origin)
      u.searchParams.set('q', qq)
      // FIXED: Pass show_all parameter to suggestions API
      if (showAllBusinesses) {
        u.searchParams.set('show_all', '1')
      }
      const res = await fetch(u.toString(), { cache: 'no-store', signal: ac.signal })
      const json: any = await res.json().catch(() => ({}))
      const rows: any[] = Array.isArray(json?.businesses) ? json.businesses : []
      const next: BizSuggestion[] = rows
        .map((r) => ({
          id: String(r?.id || ''),
          name: String(r?.name || 'Business'),
          slug: String(r?.slug || ''),
          industry: r?.industry ? String(r.industry) : null,
          location: r?.location ? String(r.location) : null,
          lat: typeof r?.lat === 'number' ? r.lat : r?.lat == null ? null : Number(r.lat),
          lng: typeof r?.lng === 'number' ? r.lng : r?.lng == null ? null : Number(r.lng),
        }))
        .filter((b) => b.id && b.slug)
        .slice(0, 6)
      setBizSuggestions(next)
      setBizActiveIdx(0)
    } catch {
      setBizSuggestions([])
      setBizActiveIdx(0)
    }
  }

  useEffect(() => {
    if (!locOpen) return
    fetchLocSuggestions(locDebounced).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locDebounced, locOpen])

  const [bizOpen, setBizOpen] = useState(false)
  const [bizSuggestions, setBizSuggestions] = useState<BizSuggestion[]>([])
  const [bizActiveIdx, setBizActiveIdx] = useState(0)
  const industrySuggestions = useMemo(() => {
    const q = industryInput.trim().toLowerCase()
    if (q.length < 1) return [] as string[]
    return INDUSTRY_OPTIONS.filter((x) => x.toLowerCase().includes(q)).slice(0, 8) as unknown as string[]
  }, [industryInput])
  
  const bizIndustrySuggestions = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    if (q.length < 2) return [] as string[]
    return INDUSTRY_OPTIONS.filter((x) => x.toLowerCase().includes(q)).slice(0, 4) as unknown as string[]
  }, [filters.q])

  useEffect(() => {
    if (!bizOpen) return
    fetchBizSuggestions(qDebounced).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, bizOpen])

  function zoomForRadiusKm(km: number) {
    return 12 - Math.log2(Math.max(5, km) / 5)
  }

  function applyLocSuggestion(s: LocSuggestion) {
    // #region agent log
    emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4',location:'talent-map/page.tsx:applyLocSuggestion',message:'apply location suggestion',data:{label:s.label,lng:s.lng,lat:s.lat,radiusKm},timestamp:Date.now()})
    // #endregion
    setLocQuery('')
    setLocOpen(false)
    setLocError(null)
    setSearchCenter({ lng: s.lng, lat: s.lat, label: s.label })
    setFlyTo({ lng: s.lng, lat: s.lat, zoom: zoomForRadiusKm(radiusKm) })
  }

  function applyBizSuggestion(s: BizSuggestion) {
    setBizOpen(false)
    setFilters((p) => ({ ...p, q: s.name }))
    if (typeof s.lng === 'number' && typeof s.lat === 'number' && Number.isFinite(s.lng) && Number.isFinite(s.lat)) {
      setFlyTo({ lng: s.lng, lat: s.lat, zoom: 13 })
    }
  }

  function applyIndustrySuggestion(ind: string) {
    setBizOpen(false)
    setFilters((p) => ({
      ...p,
      q: '',
      industries: p.industries.includes(ind) ? p.industries : [...p.industries, ind],
    }))
  }
  
  function applyIndustryInputSuggestion(ind: string) {
    setIndustryInput('')
    setIndustryInputOpen(false)
    setFilters((p) => ({
      ...p,
      industries: p.industries.includes(ind) ? p.industries : [...p.industries, ind],
    }))
  }

  async function geocodeAndFly() {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
    const q = locQuery.trim()
    if (!q) return
    if (!token) {
      setLocError('Mapbox is not configured (NEXT_PUBLIC_MAPBOX_TOKEN missing).')
      return
    }
    setLocBusy(true)
    setLocError(null)
    // #region agent log
    emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4',location:'talent-map/page.tsx:geocodeAndFly',message:'geocode start',data:{query:q,radiusKm},timestamp:Date.now()})
    // #endregion
    try {
      const u = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`)
      u.searchParams.set('access_token', token)
      u.searchParams.set('limit', '1')
      u.searchParams.set('types', 'place,locality,neighborhood,postcode,region')
      u.searchParams.set('country', 'AU')
      const res = await fetch(u.toString())
      const json: any = await res.json().catch(() => null)
      const center = json?.features?.[0]?.center
      const lng = Array.isArray(center) ? center[0] : null
      const lat = Array.isArray(center) ? center[1] : null
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        setLocError('Location not found. Try a suburb, city, or region.')
        return
      }
      // Rough radius-to-zoom mapping (directional). Higher radius → lower zoom.
      const z = zoomForRadiusKm(radiusKm)
      setSearchCenter({ lng, lat, label: q })
      setFlyTo({ lng, lat, zoom: z })
      setLocQuery('')
      // #region agent log
      emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4',location:'talent-map/page.tsx:geocodeAndFly',message:'geocode success',data:{lng,lat,zoom:z},timestamp:Date.now()})
      // #endregion
    } catch (e: any) {
      setLocError(e?.message || 'Could not search location.')
    } finally {
      setLocBusy(false)
    }
  }

  function useCurrentLocation() {
    if (!navigator?.geolocation) {
      setLocError('Geolocation is not available in this browser.')
      return
    }
    setLocBusy(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude
        setSearchCenter({ lng, lat, label: 'Current location' })
        setFlyTo({ lng, lat, zoom: zoomForRadiusKm(radiusKm) })
        setLocQuery('Current location')
        setLocBusy(false)
        emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H11',location:'talent-map/page.tsx:current-location',message:'set current location',data:{lng,lat},timestamp:Date.now()})
      },
      () => {
        setLocError('Unable to access your location.')
        setLocBusy(false)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()
        const hasSession = !!sessionRes?.session?.user?.id
        const currentUserId = sessionRes?.session?.user?.id

        if (!hasSession) {
          setError('Please sign in to view the Talent Map.')
          return
        }

        // Clear search state if this is a new session (different user or fresh login)
        try {
          const storedUserId = localStorage.getItem('creerlio_talent_map_user_id')
          if (storedUserId !== currentUserId) {
            // New user session - clear all search filters
            localStorage.removeItem('creerlio_talent_map_search_center')
            setFilters({ q: '', industries: [], work: '' })
            setSearchCenter(null)
            setLocQuery('')
            setSelectedBusinessId(null)
            setSelectBusinessId(null)
            // Store new user ID
            localStorage.setItem('creerlio_talent_map_user_id', currentUserId || '')
          }
        } catch {}
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load Talent Map.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-collapse filters when business is selected
  useEffect(() => {
    if (selectedBusiness) {
      setFiltersCollapsed(true)
    }
  }, [selectedBusiness])

  // Trigger map resize when panels collapse/expand
  useEffect(() => {
    // #region agent log
    emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'talent-map/page.tsx:map-resize-trigger',message:'panel state changed',data:{panelsCollapsed,filtersCollapsed,triggerBefore:mapResizeTrigger},timestamp:Date.now()})
    // #endregion
    setMapResizeTrigger((n) => n + 1)
  }, [panelsCollapsed, filtersCollapsed])

  useEffect(() => {
    if (showAllBusinesses && !searchCenter && !committedRouteQuery) {
      setMapFitBounds(AU_BOUNDS)
    } else {
      setMapFitBounds(null)
    }
  }, [showAllBusinesses, searchCenter, committedRouteQuery])

  const headerRight = useMemo(() => {
    return (
      <div className="flex items-center gap-4">
        <Link href="/dashboard/talent" className="text-slate-300 hover:text-blue-400 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              Creerlio
            </Link>
            <span className="text-slate-400">/</span>
            <h1 className="text-lg font-semibold text-white">Talent Map</h1>
          </div>
          {headerRight}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-red-100">
            <div className="text-xl font-semibold">Talent Map unavailable</div>
            <div className="mt-2 text-red-200/90">{error}</div>
            <div className="mt-6 flex items-center gap-2">
              <Link href="/login?redirect=/talent-map" className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100">
                Sign in
              </Link>
              <Link href="/dashboard/talent" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-red-100 hover:bg-white/10">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : null}

        {!error ? (
        <div className="flex h-[calc(100vh-8rem)] gap-4 relative">
          {/* LEFT SIDEBAR: Filters - Full height */}
          <aside className={`${filtersCollapsed ? 'w-16' : 'w-80'} flex-shrink-0 overflow-y-auto z-20 transition-all duration-300`}>
            <div className="rounded-xl p-4 border border-white/10 bg-slate-900/50 backdrop-blur-sm h-full relative">
              {/* Collapse/Expand Button */}
              {/* Collapsed State - Vertical Label */}
              {filtersCollapsed && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-white font-semibold text-sm whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    FILTERS
                  </div>
                </div>
              )}

              {/* Collapse/Expand Button */}
              <button
                type="button"
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors z-10"
                title={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${filtersCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {!filtersCollapsed && (
              <>
              <div className="mb-1">
                <div className="text-white font-semibold text-sm">Filters</div>
              </div>
              <>
              <div className="text-xs text-slate-400 mb-5">Filters update the map in real time. No page reloads.</div>

              <div className="space-y-5">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <label className="flex items-start gap-3 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-blue-500"
                      checked={showAllBusinesses}
                      onChange={(e) => {
                        const nextChecked = e.target.checked
                        // #region agent log
                        emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'talent-map/page.tsx:showAllBusinesses',message:'toggle show all businesses',data:{nextChecked},timestamp:Date.now()})
                        // #endregion
                        setShowAllBusinesses(nextChecked)
                      }}
                    />
                    <span className="leading-snug">
                      <span className="font-semibold text-white">Show all businesses in Creerlio</span>
                      <span className="block text-xs text-slate-400 mt-1.5">
                        Ignores filters (still respects business discoverability). Useful for exploration and verification.
                      </span>
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2.5">
                    Within {radiusKm} km of…
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <input
                        value={locQuery}
                        onChange={(e) => {
                          setLocQuery(e.target.value)
                          setLocOpen(true)
                        }}
                        onFocus={() => setLocOpen(true)}
                        onBlur={() => setTimeout(() => setLocOpen(false), 120)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setLocOpen(false)
                            return
                          }
                          if (!locOpen || !locSuggestions.length) {
                            if (e.key === 'Enter') geocodeAndFly()
                            return
                          }
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setLocActiveIdx((i) => Math.min(locSuggestions.length - 1, i + 1))
                            return
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setLocActiveIdx((i) => Math.max(0, i - 1))
                            return
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const pick = locSuggestions[locActiveIdx]
                            if (pick) applyLocSuggestion(pick)
                            return
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-lg bg-white text-black border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
                        placeholder="Suburb, city, or region…"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={locOpen}
                        aria-controls="loc-suggestions"
                      />
                      {locOpen && locSuggestions.length ? (
                        <div
                          id="loc-suggestions"
                          role="listbox"
                          className="absolute left-0 right-0 mt-1.5 rounded-lg border border-white/10 bg-slate-950/98 backdrop-blur shadow-2xl overflow-hidden z-20"
                        >
                          {locSuggestions.map((s, idx) => (
                            <button
                              key={s.id}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                idx === locActiveIdx ? 'bg-blue-500/20 text-white' : 'bg-transparent text-slate-200 hover:bg-white/5'
                              }`}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyLocSuggestion(s)}
                              role="option"
                              aria-selected={idx === locActiveIdx}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={geocodeAndFly}
                      disabled={locBusy || !locQuery.trim()}
                      className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shrink-0"
                    >
                      {locBusy ? 'Searching…' : 'Go'}
                    </button>
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locBusy}
                      className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 text-sm shrink-0"
                    >
                      Use my location
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">Radius: {radiusKm} km</span>
                    <input
                      type="range"
                      min={5}
                      max={4000}
                      step={5}
                      value={radiusKm}
                      onChange={(e) => {
                        const nextRadius = Number(e.target.value)
                        // #region agent log
                        emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4',location:'talent-map/page.tsx:radius',message:'radius change',data:{nextRadius},timestamp:Date.now()})
                        // #endregion
                        setRadiusKm(nextRadius)
                      }}
                      className="w-32 accent-blue-500"
                    />
                  </div>
                  {locError ? <div className="mt-2 text-xs text-red-400 font-medium">{locError}</div> : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2.5">Intent filters</label>
                  <div className="flex flex-col gap-3">
                    <select
                      value={intentStatusFilter}
                      onChange={(e) => {
                        const next = e.target.value
                        setIntentStatusFilter(next)
                        emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H10',location:'talent-map/page.tsx:intent-filter',message:'intent status filter',data:{next},timestamp:Date.now()})
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm"
                    >
                      <option value="">All intent statuses</option>
                      <option value="actively_building_talent">Actively building talent</option>
                      <option value="future_planning">Future planning</option>
                      <option value="not_hiring">Not hiring</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        className="accent-blue-500"
                        checked={intentCompatibility}
                        onChange={(e) => {
                          const next = e.target.checked
                          setIntentCompatibility(next)
                          emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H10',location:'talent-map/page.tsx:intent-compat',message:'intent compatibility toggle',data:{next},timestamp:Date.now()})
                        }}
                      />
                      Show only compatible intent signals
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2.5">Search</label>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <input
                        value={filters.q}
                        onChange={(e) => {
                          const v = e.target.value
                          setFilters((p) => ({ ...p, q: v }))
                          setBizOpen(true)
                        }}
                        onFocus={() => setBizOpen(true)}
                        onBlur={() => setTimeout(() => setBizOpen(false), 120)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setBizOpen(false)
                            return
                          }
                          if (!bizOpen || !bizSuggestions.length) {
                            if (e.key === 'Enter' && filters.q.trim()) {
                              // Trigger search on Enter when no suggestions
                              e.preventDefault()
                              return
                            }
                            return
                          }
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setBizActiveIdx((i) => Math.min(bizSuggestions.length - 1, i + 1))
                            return
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setBizActiveIdx((i) => Math.max(0, i - 1))
                            return
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const pick = bizSuggestions[bizActiveIdx]
                            if (pick) applyBizSuggestion(pick)
                            return
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-lg bg-white text-black border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
                        placeholder="Business name or industry…"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={bizOpen}
                        aria-controls="biz-suggestions"
                      />
                      {bizOpen && (bizSuggestions.length || filters.q.trim().length >= 2) ? (
                        <div
                          id="biz-suggestions"
                          role="listbox"
                          className="absolute left-0 right-0 mt-2 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur shadow-xl overflow-hidden z-20"
                        >
                          {bizIndustrySuggestions.length ? (
                            <div className="border-b border-white/10">
                              <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-slate-400">Industries</div>
                              {bizIndustrySuggestions.map((ind) => (
                                <button
                                  key={ind}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => applyIndustrySuggestion(ind)}
                                  role="option"
                                  aria-selected={filters.industries.includes(ind)}
                                >
                                  {ind}
                                </button>
                              ))}
                            </div>
                          ) : null}
                          {bizSuggestions.length ? (
                            bizSuggestions.map((s, idx) => (
                              <button
                                key={s.id}
                                type="button"
                                className={`w-full text-left px-3 py-2 ${
                                  idx === bizActiveIdx ? 'bg-white/10 text-white' : 'bg-transparent text-slate-200 hover:bg-white/5'
                                }`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyBizSuggestion(s)}
                                role="option"
                                aria-selected={idx === bizActiveIdx}
                              >
                                <div className="text-sm font-semibold truncate">{s.name}</div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {[s.industry, s.location].filter(Boolean).join(' • ') || `/${s.slug}`}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">No suggestions yet</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Trigger search when Go is clicked
                        if (filters.q.trim()) {
                          // Search will trigger via useEffect on filters change
                        }
                      }}
                      disabled={!filters.q.trim()}
                      className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shrink-0"
                      title="Search businesses"
                    >
                      Go
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2.5">Industries</label>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={industryInput}
                        onChange={(e) => {
                          setIndustryInput(e.target.value)
                          setIndustryInputOpen(true)
                        }}
                        onFocus={() => setIndustryInputOpen(true)}
                        onBlur={() => setTimeout(() => setIndustryInputOpen(false), 120)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIndustryInputOpen(false)
                            return
                          }
                          if (!industryInputOpen || !industrySuggestions.length) {
                            if (e.key === 'Enter' && industryInput.trim()) {
                              const match = INDUSTRY_OPTIONS.find((opt) => opt.toLowerCase() === industryInput.trim().toLowerCase())
                              if (match) applyIndustryInputSuggestion(match)
                            }
                            return
                          }
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setIndustryInputActiveIdx((i) => Math.min(industrySuggestions.length - 1, i + 1))
                            return
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setIndustryInputActiveIdx((i) => Math.max(0, i - 1))
                            return
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const pick = industrySuggestions[industryInputActiveIdx]
                            if (pick) applyIndustryInputSuggestion(pick)
                            return
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white text-black border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
                        placeholder="Type industry (e.g., Accounting)..."
                      />
                    {industryInputOpen && industrySuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 rounded-lg border border-white/10 bg-slate-950/95 backdrop-blur shadow-xl overflow-hidden z-20">
                        {industrySuggestions.map((ind, idx) => (
                          <button
                            key={ind}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm ${
                              idx === industryInputActiveIdx ? 'bg-white/10 text-white' : 'bg-transparent text-slate-200 hover:bg-white/5'
                            }`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyIndustryInputSuggestion(ind)}
                            role="option"
                            aria-selected={idx === industryInputActiveIdx}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (industryInput.trim()) {
                          const match = INDUSTRY_OPTIONS.find((opt) => opt.toLowerCase() === industryInput.trim().toLowerCase())
                          if (match) applyIndustryInputSuggestion(match)
                        }
                      }}
                      disabled={!industryInput.trim()}
                      className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shrink-0"
                      title="Add industry filter"
                    >
                      Go
                    </button>
                  </div>
                  {filters.industries.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.industries.map((ind) => (
                        <span
                          key={ind}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 border border-blue-500/40 text-blue-200"
                        >
                          {ind}
                          <button
                            type="button"
                            onClick={() => setFilters((p) => ({ ...p, industries: p.industries.filter((x) => x !== ind) }))}
                            className="hover:text-blue-100"
                            aria-label={`Remove ${ind}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2.5">Work preference</label>
                  <select
                    value={filters.work}
                    onChange={(e) => setFilters((p) => ({ ...p, work: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-white text-black text-sm border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  >
                    <option value="">Any</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-200">Map Layers</div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-blue-500"
                        checked={toggles.commute}
                        onChange={(e) => applyToggles({ commute: e.target.checked })}
                      />
                      <span>Commute rings & route</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-blue-500"
                        checked={toggles.schools}
                        onChange={(e) => applyToggles({ schools: e.target.checked })}
                      />
                      <span>Schools overlay</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-blue-500"
                        checked={toggles.property}
                        onChange={(e) => applyToggles({ property: e.target.checked })}
                      />
                      <span>Real estate overlay</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-200">Map Style</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['dark', 'light', 'satellite', 'streets'] as MapStyle[]).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setActiveStyle(style)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeStyle === style
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-3 border-t border-white/10">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 text-xs font-medium transition-colors"
                    onClick={() => {
                      // #region agent log
                      emitDebugLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'talent-map/page.tsx:clear-filters',message:'clear filters',data:{showAllBusinesses},timestamp:Date.now()})
                      // #endregion
                      setFilters({ q: '', industries: [], work: '' })
                      setIndustryInput('')
                      setShowAllBusinesses(false)
                      setSearchCenter(null)
                      setLocQuery('')
                      setToggles((p) => ({
                        ...p,
                        businesses: true,
                        context: false,
                        schools: false,
                        commute: false,
                        transport: false,
                        shopping: false,
                        property: false,
                      }))
                    }}
                  >
                    Clear filters
                  </button>
                  <Link
                    href="/search?from=talent-map"
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 text-xs font-medium transition-colors"
                  >
                    Search (list view)
                  </Link>
                </div>
            </div>
              </>
              </>
              )}
            </div>
          </aside>

          {/* RIGHT SIDE: Horizontal layout with Results, Route Intelligence, and Map */}
          <div className="flex-1 flex gap-4">
            {/* Collapsible Panels Container */}
            {panelsCollapsed ? (
              /* Collapsed state - show expand button */
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPanelsCollapsed(false)}
                  className="h-full px-2 py-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm hover:bg-white/5 transition-colors flex flex-col items-center justify-center gap-2"
                  title="Expand panels"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="text-white font-semibold text-xs whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {results.length} Results • {routeState?.drivingMins ? `${routeState.drivingMins}m drive` : 'Route'}
                  </div>
                </button>
              </div>
            ) : (
              <>
                {/* LEFT COLUMN: Results Panel */}
                <div className="w-48 flex-shrink-0 rounded-xl p-3 border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-y-auto relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold text-sm">Results</div>
                    <div className="text-xs text-slate-400">
                      {results.length}
                    </div>
                  </div>

                  {results.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      No businesses found
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {results.map((business: any) => (
                        <button
                          key={business.id}
                          type="button"
                          onClick={() => {
                            setSelectedBusinessId(business.id)
                            setSelectBusinessId(business.id)
                          }}
                          className={`w-full text-left p-2 rounded border transition-all ${
                            selectedBusinessId === business.id
                              ? 'bg-blue-500/20 border-blue-500/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {business.intent_visibility && business.intent_status ? (
                              <span
                                className={`inline-flex h-2 w-2 rounded-full ${
                                  business.intent_status === 'actively_building_talent' ? 'bg-emerald-400' :
                                  business.intent_status === 'future_planning' ? 'bg-blue-400' :
                                  'bg-slate-400'
                                }`}
                                title={`Intent: ${business.intent_status.replace(/_/g, ' ')}`}
                              />
                            ) : null}
                            <div className="font-medium text-white text-xs truncate">{business.name}</div>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {Array.isArray(business.industries) && business.industries.length
                              ? business.industries[0]
                              : 'Industry not set'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* MIDDLE COLUMN: Route Intelligence Panel */}
                <div className="w-72 flex-shrink-0 rounded-xl p-4 border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-y-auto relative">
                  {/* Collapse button */}
                  <button
                    type="button"
                    onClick={() => setPanelsCollapsed(true)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors z-10"
                    title="Collapse panels"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="font-semibold text-white mb-3 text-sm">Route Intelligence</div>

                  {!selectedBusiness ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      Select a business from the Results panel to calculate routes and commute times.
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-slate-400 mb-3">
                        Point A: {selectedBusiness.properties.name} • Point B: your chosen living location
                      </div>
                      <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                          <input
                            value={routeQuery}
                            onChange={(e) => {
                              setRouteQuery(e.target.value)
                              setRouteSuggestionsOpen(true)
                            }}
                            onFocus={() => setRouteSuggestionsOpen(true)}
                            onBlur={() => setTimeout(() => setRouteSuggestionsOpen(false), 120)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setRouteSuggestionsOpen(false)
                                return
                              }
                              if (!routeSuggestionsOpen || !routeSuggestions.length) {
                                if (e.key === 'Enter' && routeQuery.trim()) {
                                  setCommittedRouteQuery(routeQuery.trim())
                                  setPanelsCollapsed(true)
                                }
                                return
                              }
                              if (e.key === 'ArrowDown') {
                                e.preventDefault()
                                setRouteActiveIdx((i) => Math.min(routeSuggestions.length - 1, i + 1))
                                return
                              }
                              if (e.key === 'ArrowUp') {
                                e.preventDefault()
                                setRouteActiveIdx((i) => Math.max(0, i - 1))
                                return
                              }
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const pick = routeSuggestions[routeActiveIdx]
                                if (pick) {
                                  setRouteQuery(pick.label)
                                  setRouteSuggestionsOpen(false)
                                  setCommittedRouteQuery(pick.label)
                                  setPanelsCollapsed(true)
                                }
                                return
                              }
                            }}
                            placeholder="Set living location…"
                            className="w-full px-3 py-2 pr-8 bg-white text-black rounded-lg text-sm border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            role="combobox"
                            aria-autocomplete="list"
                            aria-expanded={routeSuggestionsOpen}
                            aria-controls="route-suggestions"
                          />
                          {/* Clear button */}
                          {routeQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setRouteQuery('')
                                setCommittedRouteQuery('')
                                setRouteSuggestions([])
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Clear"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          {routeSuggestionsOpen && routeSuggestions.length > 0 && (
                            <div
                              id="route-suggestions"
                              role="listbox"
                              className="absolute left-0 right-0 mt-1.5 rounded-lg border border-white/10 bg-slate-950/98 backdrop-blur shadow-2xl overflow-hidden z-20"
                            >
                              {routeSuggestions.map((s, idx) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                    idx === routeActiveIdx ? 'bg-blue-500/20 text-white' : 'bg-transparent text-slate-200 hover:bg-white/5'
                                  }`}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setRouteQuery(s.label)
                                    setRouteSuggestionsOpen(false)
                                    setCommittedRouteQuery(s.label)
                                    setPanelsCollapsed(true)
                                  }}
                                  role="option"
                                  aria-selected={idx === routeActiveIdx}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (routeQuery.trim()) {
                              setCommittedRouteQuery(routeQuery.trim())
                              setPanelsCollapsed(true)
                            }
                          }}
                          disabled={!routeQuery.trim()}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {routeState?.busy ? '…' : 'Set'}
                        </button>
                      </div>
                      {routeState?.to && (
                        <div className="text-xs text-slate-300 mb-3">
                          Living location: {routeState.to.label}
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="p-2 rounded border border-white/10 bg-slate-950/40 text-center">
                          <div className="text-xs text-slate-400 mb-1">Car</div>
                          {routeState?.drivingKm ? (
                            <>
                              <div className="text-white font-medium text-sm">{routeState.drivingKm} km</div>
                              <div className="text-slate-400 text-xs">{routeState.drivingMins} min</div>
                            </>
                          ) : (
                            <div className="text-white font-medium text-sm">—</div>
                          )}
                        </div>
                        <div className="p-2 rounded border border-white/10 bg-slate-950/40 text-center">
                          <div className="text-xs text-slate-400 mb-1">Public</div>
                          <div className="text-white font-medium text-sm">N/A</div>
                        </div>
                        <div className="p-2 rounded border border-white/10 bg-slate-950/40 text-center">
                          <div className="text-xs text-slate-400 mb-1">Bike</div>
                          {routeState?.cyclingKm ? (
                            <>
                              <div className="text-white font-medium text-sm">{routeState.cyclingKm} km</div>
                              <div className="text-slate-400 text-xs">{routeState.cyclingMins} min</div>
                            </>
                          ) : (
                            <div className="text-white font-medium text-sm">—</div>
                          )}
                        </div>
                      </div>

                      {/* Business Quick Actions */}
                      {selectedBusiness.properties.slug && (
                        <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                          <Link
                            href={`/dashboard/business/view?id=${selectedBusiness.properties.id}&from=talent-map`}
                            className="w-full px-3 py-2 bg-white text-slate-900 rounded text-center font-semibold hover:bg-slate-100 text-xs"
                          >
                            View Profile
                          </Link>
                          <Link
                            href={`/dashboard/talent/connect/${selectedBusiness.properties.slug}`}
                            className="w-full px-3 py-2 bg-blue-500 text-white rounded text-center font-semibold hover:bg-blue-600 text-xs"
                          >
                            Connect
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* RIGHT COLUMN: Map container - Takes remaining space */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm h-full relative overflow-hidden">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <BusinessDiscoveryMap
                    filters={filters}
                    toggles={toggles}
                    onToggle={applyToggles}
                    flyTo={flyTo}
                    searchCenter={searchCenter}
                    radiusKm={radiusKm}
                    showAllBusinesses={showAllBusinesses}
                    onResults={(items) => setResults(items)}
                    selectedBusinessId={selectedBusinessId}
                    onSelectedBusinessId={(id) => setSelectedBusinessId(id)}
                    selectBusinessId={selectBusinessId}
                    hideLegend={true}
                    activeStyle={activeStyle}
                    onStyleChange={setActiveStyle}
                    onSelectedBusinessChange={setSelectedBusiness}
                    onRouteStateChange={setRouteState}
                    onRouteQueryChange={setRouteQuery}
                    externalRouteQuery={committedRouteQuery}
                    triggerResize={mapResizeTrigger}
                    intentStatus={intentStatusFilter}
                    intentCompatibility={intentCompatibility}
                    fitBounds={mapFitBounds}
                  />
                )}

                {/* Business count badge */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-sm border border-white/10 text-white text-sm font-medium shadow-lg z-10">
                  {results.length} {results.length === 1 ? 'business' : 'businesses'}
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : null}
      </main>
    </div>
  )
}



