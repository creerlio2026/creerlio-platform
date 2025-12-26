'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SearchMap from '@/components/SearchMap'
import { supabase } from '@/lib/supabase'

interface Job {
  id: string | number
  title: string
  description: string | null
  location: string | null
  city: string | null
  status: string
  created_at: string
}

interface Talent {
  id: string | number
  name: string
  title: string | null
  bio: string | null
  skills: string[] | null
  location: string | null
  latitude?: number | null
  longitude?: number | null
}

interface Business {
  id: string
  name: string
  tagline?: string | null
  mission?: string | null
  slug?: string | null
}

interface MapMarker {
  id: string | number
  lat: number
  lng: number
  title: string
  description?: string
  type: 'talent' | 'business'
}

export default function SearchPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [activeRole, setActiveRole] = useState<'talent' | 'business' | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'jobs' | 'talent' | 'business'>('jobs')
  const [location, setLocation] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    jobs?: Job[]
    talent?: Talent[]
    businesses?: Business[]
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    
    // Check Supabase session (source of truth)
    supabase.auth.getSession().then(async (res: any) => {
      const data = res?.data
      const uid = data.session?.user?.id ?? null
      const email = data.session?.user?.email ?? null
      
      if (!uid) {
        // Not authenticated
        if (!cancelled) {
          setIsAuthenticated(false)
          setUserType(null)
          setActiveRole(null)
        }
        return
      }

      if (!cancelled) {
        setIsAuthenticated(true)
      }

      // CRITICAL: Determine actual user type by checking which profile exists
      // This prevents showing wrong dashboard buttons
      const [talentCheck, businessCheck] = await Promise.all([
        supabase.from('talent_profiles').select('id').eq('user_id', uid).maybeSingle(),
        supabase.from('business_profiles').select('id').eq('user_id', uid).maybeSingle()
      ])

      const hasTalentProfile = !!talentCheck.data && !talentCheck.error
      const hasBusinessProfile = !!businessCheck.data && !businessCheck.error

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'frontend/app/search/page.tsx:mount:profile_check',message:'Checking actual user profiles to determine type',data:{hasTalentProfile,hasBusinessProfile,talentError:talentCheck.error?.code,businessError:businessCheck.error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'search-auth',hypothesisId:'S1'})}).catch(()=>{});
      // #endregion

      if (!cancelled) {
        // Set user type based on actual profiles (prioritize talent if both exist for now)
        if (hasTalentProfile && !hasBusinessProfile) {
          setUserType('talent')
          setActiveRole('talent')
          try {
            localStorage.setItem('user_type', 'talent')
            localStorage.setItem('creerlio_active_role', 'talent')
          } catch {}
        } else if (hasBusinessProfile && !hasTalentProfile) {
          setUserType('business')
          setActiveRole('business')
          try {
            localStorage.setItem('user_type', 'business')
            localStorage.setItem('creerlio_active_role', 'business')
          } catch {}
        } else if (hasTalentProfile && hasBusinessProfile) {
          // User has both - use activeRole from localStorage or default to talent
          const storedActiveRole = localStorage.getItem('creerlio_active_role')
          if (storedActiveRole === 'business') {
            setUserType('business')
            setActiveRole('business')
          } else {
            setUserType('talent')
            setActiveRole('talent')
            try {
              localStorage.setItem('creerlio_active_role', 'talent')
            } catch {}
          }
        } else {
          // No profiles found - not fully set up
          setUserType(null)
          setActiveRole(null)
        }
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'frontend/app/search/page.tsx:mount:auth_set',message:'Search auth set from Supabase',data:{hasSession:!!data.session?.user?.id,hasEmail:!!email,determinedUserType:hasTalentProfile&&!hasBusinessProfile?'talent':hasBusinessProfile&&!hasTalentProfile?'business':hasTalentProfile&&hasBusinessProfile?'both':null},timestamp:Date.now(),sessionId:'debug-session',runId:'search-auth',hypothesisId:'S2'})}).catch(()=>{});
      // #endregion
    }).catch(() => {
      if (!cancelled) {
        setIsAuthenticated(false)
        setUserType(null)
        setActiveRole(null)
      }
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'frontend/app/search/page.tsx:mount',message:'Search Supabase session check failed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'search-auth',hypothesisId:'S2'})}).catch(()=>{});
      // #endregion
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const from = params?.get('from') || null
    const context = params?.get('context') || null
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'search-auth',hypothesisId:'S4',location:'frontend/app/search/page.tsx:params',message:'Search page context params',data:{from,context,path:typeof window!=='undefined'?window.location.pathname+window.location.search:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allowTalentSearch = isAuthenticated && userType === 'business' && activeRole !== 'talent'
  const isPublicTalentAudience = !isAuthenticated || userType !== 'business' || activeRole === 'talent'

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'search-auth',hypothesisId:'S3',location:'frontend/app/search/page.tsx:computed',message:'Search computed auth/cta',data:{isAuthenticated,userType,activeRole,showSignInCTA:!isAuthenticated,allowTalentSearch,isPublicTalentAudience},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [isAuthenticated, userType, activeRole, allowTalentSearch, isPublicTalentAudience])

  useEffect(() => {
    // If Talent search is not allowed in this context, ensure we aren't stuck on that tab.
    if (!allowTalentSearch && searchType === 'talent') {
      setSearchType('jobs')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowTalentSearch])

  // Geocode location string to coordinates using Mapbox Geocoding API
  const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiY3JlZXJsaW8iLCJhIjoiY21pY3IxZHljMXFwNTJzb2FydzR4b3F1YSJ9.Is8-GyfEdqwKKEo2cGO65g'
      const u = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`)
      u.searchParams.set('access_token', MAPBOX_TOKEN)
      u.searchParams.set('limit', '1')

      const res = await fetch(u.toString())
      if (!res.ok) return null
      const data: any = await res.json().catch(() => null)

      if (data?.features && data.features.length > 0) {
        const center = data.features[0]?.center
        const lng = Array.isArray(center) ? center[0] : null
        const lat = Array.isArray(center) ? center[1] : null
        if (typeof lng === 'number' && typeof lat === 'number') return { lat, lng }
      }
      return null
    } catch (err) {
      console.error('Geocoding error:', err)
      return null
    }
  }

  // Process search results and create map markers
  useEffect(() => {
    const processMarkers = async () => {
      if (searchType === 'jobs' || Object.keys(searchResults).length === 0) {
        setMapMarkers([])
        return
      }
      if (searchType === 'talent' && !allowTalentSearch) {
        setMapMarkers([])
        return
      }

      setIsGeocoding(true)
      const markers: MapMarker[] = []

      // Process Talent results
      if (searchType === 'talent' && searchResults.talent && searchResults.talent.length > 0) {
        for (const talent of searchResults.talent) {
          let lat: number | null = null
          let lng: number | null = null

          // Use existing coordinates if available
          if (talent.latitude && talent.longitude) {
            lat = talent.latitude
            lng = talent.longitude
          } else if (talent.location) {
            // Geocode location string
            const coords = await geocodeLocation(talent.location)
            if (coords) {
              lat = coords.lat
              lng = coords.lng
            }
          }

          if (lat !== null && lng !== null) {
            markers.push({
              id: talent.id,
              lat,
              lng,
              title: talent.name,
              description: talent.title || undefined,
              type: 'talent'
            })
          }
        }
      }

      // Process Business results
      if (searchResults.businesses && searchResults.businesses.length > 0) {
        // Business search uses business_profile_pages which does not include coordinates/location yet.
        // Keep results list functional; map pins will remain empty unless coordinates are added later.
      }

      setMapMarkers(markers)
      setIsGeocoding(false)
    }

    processMarkers()
  }, [searchResults, searchType, allowTalentSearch])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setError(null)
    setSearchResults({})

    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:58',message:'Starting search',data:{searchType,query:searchQuery,location},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (searchType === 'jobs') {
        const q = (searchQuery || '').trim()
        const loc = (location || '').trim()

        // Jobs are stored in Supabase (if table exists). If it's not configured yet, show a calm message.
        let qb: any = supabase.from('jobs').select('id,title,description,location,city,status,created_at').limit(100)
        // Prefer published jobs if column exists
        qb = qb.eq('status', 'published')

        if (q) {
          qb = qb.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        }
        if (loc) {
          qb = qb.or(`location.ilike.%${loc}%,city.ilike.%${loc}%`)
        }

        const res: any = await qb
        if (res.error) {
          setSearchResults({ jobs: [] })
          setError('Jobs search is not available yet (missing jobs table or permissions).')
          return
        }
        setSearchResults({ jobs: (res.data || []) as any })
      } else if (searchType === 'talent') {
        if (!allowTalentSearch) {
          setError('Talent search is only available to Business accounts.')
          return
        }
        const q = (searchQuery || '').trim().toLowerCase()
        const loc = (location || '').trim().toLowerCase()

        // Schema-tolerant select: try common naming patterns.
        const selectors = [
          'id, name, title, bio, skills, location, latitude, longitude',
          'id, full_name, title, bio, skills, location, latitude, longitude',
          'id, display_name, title, bio, skills, location, latitude, longitude',
          'id, first_name, last_name, title, bio, skills, location, latitude, longitude',
          'id, name, location',
          'id, full_name, location',
          'id, display_name, location',
        ]

        let rows: any[] | null = null
        for (const sel of selectors) {
          const r: any = await (supabase.from('talent_profiles').select(sel) as any).limit(200)
          if (!r.error) {
            rows = r.data || []
            break
          }
          // If missing-column, try next selector; otherwise stop and show error
          const msg = String(r.error?.message ?? '')
          const code = String(r.error?.code ?? '')
          const isMissingCol = code === 'PGRST204' || /Could not find the .* column/i.test(msg)
          if (!isMissingCol) {
            setSearchResults({ talent: [] })
            setError('Talent search is not available (permissions or schema mismatch).')
            return
          }
        }

        const mapped: Talent[] = (rows || []).map((t: any) => {
          const name =
            (typeof t?.name === 'string' && t.name) ||
            (typeof t?.full_name === 'string' && t.full_name) ||
            (typeof t?.display_name === 'string' && t.display_name) ||
            (typeof t?.first_name === 'string' || typeof t?.last_name === 'string'
              ? `${t?.first_name ?? ''} ${t?.last_name ?? ''}`.trim()
              : '') ||
            'Talent'

          const skills = Array.isArray(t?.skills) ? (t.skills as any[]).map((s) => String(s)) : null

          return {
            id: t?.id ?? String(Math.random()),
            name,
            title: typeof t?.title === 'string' ? t.title : null,
            bio: typeof t?.bio === 'string' ? t.bio : null,
            skills,
            location: typeof t?.location === 'string' ? t.location : null,
            latitude: typeof t?.latitude === 'number' ? t.latitude : null,
            longitude: typeof t?.longitude === 'number' ? t.longitude : null,
          }
        })

        const filtered = mapped.filter((t) => {
          const blob = `${t.name} ${t.title ?? ''} ${t.bio ?? ''} ${(t.skills || []).join(' ')} ${t.location ?? ''}`.toLowerCase()
          if (q && !blob.includes(q)) return false
          if (loc && !(t.location || '').toLowerCase().includes(loc)) return false
          return true
        })

        setSearchResults({ talent: filtered.slice(0, 100) })
      } else if (searchType === 'business') {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:business_search_start',message:'Business search started',data:{searchQuery,searchType,location},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BUS_SEARCH'})}).catch(()=>{});
        // #endregion
        // IMPORTANT: do not depend on localhost:8000 backend (often offline in this environment).
        // Search published business profiles directly from Supabase (RLS-safe public read).
        const q = (searchQuery || '').trim()
        if (!q) {
          setSearchResults({ businesses: [] })
          return
        }

        // First try searching published business profile pages
        const pagesOr = `name.ilike.%${q}%,tagline.ilike.%${q}%,mission.ilike.%${q}%,slug.ilike.%${q}%`
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:business_pages_query',message:'Querying business_profile_pages',data:{q,query:pagesOr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BUS_SEARCH'})}).catch(()=>{});
        // #endregion
        const pagesRes = await supabase
          .from('business_profile_pages')
          .select('business_id, slug, name, tagline, mission')
          .eq('is_published', true)
          .or(pagesOr)
          .limit(50)

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:business_pages_search',message:'Business pages search result',data:{q,ok:!pagesRes.error,count:(pagesRes.data||[]).length,errCode:(pagesRes.error as any)?.code,errMsg:(pagesRes.error as any)?.message,errDetails:(pagesRes.error as any)?.details,firstResult:(pagesRes.data||[])[0]||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BUS_SEARCH'})}).catch(()=>{});
        // #endregion

        let businesses: Business[] = []
        
        // Add businesses from published pages
        if (!pagesRes.error && pagesRes.data && pagesRes.data.length > 0) {
          businesses = pagesRes.data.map((r: any) => ({
            id: String(r.business_id),
            slug: typeof r.slug === 'string' ? r.slug : null,
            name: typeof r.name === 'string' ? r.name : 'Business',
            tagline: typeof r.tagline === 'string' ? r.tagline : null,
            mission: typeof r.mission === 'string' ? r.mission : null,
          }))
        }
        
        // Also search business_profiles table (combine results from both tables)
        // Note: business_profiles table has 'name' and 'description' columns
        // Also search by email if the query might be an email
        const existingIds = new Set(businesses.map(b => b.id))
        const profilesOr = `name.ilike.%${q}%,description.ilike.%${q}%`
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:business_profiles_query',message:'Querying business_profiles',data:{q,query:profilesOr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BUS_SEARCH'})}).catch(()=>{});
        // #endregion
        const profilesRes = await supabase
          .from('business_profiles')
          .select('id, name, description, user_id')
          .or(profilesOr)
          .limit(50)

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:business_profiles_search',message:'Business profiles search result',data:{q,query:profilesOr,ok:!profilesRes.error,count:(profilesRes.data||[]).length,errCode:(profilesRes.error as any)?.code,errMsg:(profilesRes.error as any)?.message,errDetails:(profilesRes.error as any)?.details,firstResult:(profilesRes.data||[])[0]||null,allResults:(profilesRes.data||[]).map((r:any)=>({id:r.id,name:r.name,description:r.description?.substring(0,50)||null}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BUS_SEARCH'})}).catch(()=>{});
        // #endregion

        // Also check if we should search by email (if query looks like email or contains @)
        if (q.includes('@') || q.includes('gmail') || q.includes('email')) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:business_email_search',message:'Query might be email, checking all business profiles',data:{q},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BUS_SEARCH'})}).catch(()=>{});
          // #endregion
          // Try to get all business profiles to see what exists (for debugging)
          const allProfilesRes = await supabase
            .from('business_profiles')
            .select('id, name, description, user_id')
            .limit(100)
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:business_all_profiles',message:'All business profiles check',data:{q,ok:!allProfilesRes.error,count:(allProfilesRes.data||[]).length,profiles:(allProfilesRes.data||[]).map((r:any)=>({id:r.id,name:r.name,hasDescription:!!r.description}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BUS_SEARCH'})}).catch(()=>{});
          // #endregion
        }

        if (!profilesRes.error && profilesRes.data && profilesRes.data.length > 0) {
          // Add businesses from profiles table, avoiding duplicates
          const profileBusinesses = profilesRes.data
            .filter((r: any) => !existingIds.has(String(r.id)))
            .map((r: any) => ({
              id: String(r.id),
              slug: null,
              name: typeof r.name === 'string' && r.name ? r.name : 'Business',
              tagline: null,
              mission: typeof r.description === 'string' ? r.description : null,
            }))
          businesses = [...businesses, ...profileBusinesses]
        }

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:business_search_final',message:'Business search final results',data:{query:q,resultCount:businesses.length,allResults:businesses.map(b=>({id:b.id,name:b.name}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'BUS_SEARCH'})}).catch(()=>{});
        // #endregion

        setSearchResults({ businesses })
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:101',message:'Search failed',data:{error:err.message,code:err.code,hasResponse:!!err.response,status:err.response?.status,searchType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.error('Search error:', err)
      
      // Format error message - handle FastAPI validation errors (arrays) and string errors
      let errorMessage = 'Search failed. Please try again.'
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail
        if (Array.isArray(detail)) {
          // FastAPI validation errors come as an array of objects
          errorMessage = detail.map((error: any) => {
            const field = error.loc?.join('.') || 'field'
            const msg = error.msg || 'Validation error'
            return `${field}: ${msg}`
          }).join(', ')
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else {
          errorMessage = JSON.stringify(detail)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              Creerlio
            </Link>

            <nav className="hidden lg:flex items-center gap-x-8 text-sm text-slate-300">
              <Link href="/about" className="hover:text-blue-400 transition-colors">About</Link>
              <Link href="/#talent" className="hover:text-blue-400 transition-colors">Talent</Link>
              <Link href="/#business" className="hover:text-blue-400 transition-colors">Business</Link>
              <Link href="/analytics" className="hover:text-blue-400 transition-colors">Analytics</Link>
              <Link href="/search" className="hover:text-blue-400 transition-colors text-blue-400">Search</Link>
              <Link href="/jobs" className="hover:text-blue-400 transition-colors">Jobs</Link>
              {isAuthenticated ? (
                <>
                  {userType === 'business' ? (
                    <Link 
                      href="/dashboard/business" 
                      className="hover:text-blue-400 transition-colors"
                    >
                      Business Dashboard
                    </Link>
                  ) : userType === 'talent' ? (
                    <Link 
                      href="/dashboard/talent" 
                      className="hover:text-blue-400 transition-colors"
                    >
                      Talent Dashboard
                    </Link>
                  ) : null}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      localStorage.removeItem('access_token')
                      localStorage.removeItem('user_email')
                      localStorage.removeItem('user_type')
                      localStorage.removeItem('creerlio_active_role')
                      setIsAuthenticated(false)
                      setUserType(null)
                      setActiveRole(null)
                      router.push('/')
                    }}
                    className="hover:text-blue-400 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : null}
            </nav>

            {isAuthenticated ? (
              userType === 'business' ? (
                <Link
                  href="/dashboard/business"
                  className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
                >
                  Business Dashboard
                </Link>
              ) : userType === 'talent' ? (
                <Link
                  href="/dashboard/talent"
                  className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
                >
                  Talent Dashboard
                </Link>
              ) : null
            ) : (
              <Link
                href="/login/talent?mode=signup"
                className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
              >
                Create Talent Account
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
              Search <span className="text-blue-400">{isPublicTalentAudience ? 'Businesses or Jobs' : 'Talent, Businesses or Jobs'}</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {isPublicTalentAudience
                ? 'Explore businesses and roles on Creerlio — then create a portfolio so businesses can connect with you.'
                : 'Find the perfect match with AI-powered search'}
            </p>
            {!isAuthenticated ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login?redirect=/portfolio"
                  className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold text-white transition-colors"
                >
                  Create your free Talent Portfolio
                </Link>
                <Link
                  href="/jobs"
                  className="px-6 py-3 rounded-xl border border-white/15 text-white hover:bg-white/5 transition-colors"
                >
                  Browse jobs
                </Link>
              </div>
            ) : null}
          </div>

          {/* Search Interface with Map */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Search Form - Left Side */}
            <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-12">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-4">
                  {/* Search Type */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchType('jobs')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        searchType === 'jobs'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Jobs
                    </button>
                    {allowTalentSearch ? (
                    <button
                      type="button"
                      onClick={() => setSearchType('talent')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        searchType === 'talent'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Talent
                    </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSearchType('business')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        searchType === 'business'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Business
                    </button>
                  </div>

                  {/* Search Input */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchType === 'jobs'
                        ? 'Search jobs… (e.g. receptionist, aged care, apprentice)'
                        : searchType === 'business'
                          ? 'Search businesses… (e.g. industry, company, program)'
                          : 'Search talent…'
                    }
                    className="w-full px-6 py-4 bg-slate-800 border border-blue-500/20 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                  />

                  {/* Location Filter */}
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (optional)"
                    className="w-full px-6 py-4 bg-slate-800 border border-blue-500/20 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                  />

                  {/* Search Button */}
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
            </div>

            {/* Map - Right Side */}
            {isMapExpanded ? (
              <div 
                className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm"
                onClick={() => setIsMapExpanded(false)}
                style={{ width: '100vw', height: '100vh' }}
              >
                <div 
                  className="absolute inset-0 rounded-xl overflow-hidden border border-blue-500/20 bg-slate-950 shadow-2xl"
                  style={{ width: '100%', height: '100%' }}
                >
                  {isGeocoding ? (
                    <div className="h-full flex items-center justify-center bg-slate-800/50 rounded-lg">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-300">Geocoding locations...</p>
                      </div>
                    </div>
                  ) : (
                    <SearchMap markers={mapMarkers} isExpanded={true} />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMapExpanded(false)
                  }}
                  className="absolute top-4 right-4 z-10 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 rounded-lg text-white font-semibold border border-white/20"
                >
                  Close
                </button>
              </div>
            ) : (
              <div 
                className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-6 transition-all relative"
              >
                <div className="h-[600px] w-full">
                  {isGeocoding ? (
                    <div className="h-full flex items-center justify-center bg-slate-800/50 rounded-lg">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-300">Geocoding locations...</p>
                      </div>
                    </div>
                  ) : (
                    <SearchMap markers={mapMarkers} isExpanded={false} />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMapExpanded(true)
                  }}
                  className="absolute bottom-6 right-6 px-3 py-1 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-white text-sm font-medium cursor-pointer transition-colors"
                >
                  Click to expand
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/50 p-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {Object.keys(searchResults).length > 0 && (
            <div className="space-y-6">
              {searchResults.jobs && searchResults.jobs.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Jobs ({searchResults.jobs.length})</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {searchResults.jobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="rounded-xl bg-slate-900/70 border border-white/10 p-6 hover:border-blue-500/50 transition-colors"
                      >
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        {job.description && (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{job.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-300">
                          {job.location && <span>📍 {job.location}</span>}
                          <span className={`px-2 py-1 rounded ${
                            job.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {allowTalentSearch && searchResults.talent && searchResults.talent.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Talent ({searchResults.talent.length})</h2>
                  {mapMarkers.length === 0 && searchResults.talent.some(t => t.location) && (
                    <p className="text-slate-400 text-sm mb-4">
                      Note: Some talent profiles may not have location data available for mapping.
                    </p>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {searchResults.talent.map((talent) => (
                      <div
                        key={talent.id}
                        className="rounded-xl bg-slate-900/70 border border-white/10 p-6"
                      >
                        <h3 className="text-xl font-semibold mb-2">{talent.name}</h3>
                        {talent.title && (
                          <p className="text-blue-400 mb-2">{talent.title}</p>
                        )}
                        {talent.bio && (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{talent.bio}</p>
                        )}
                        {talent.skills && talent.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {talent.skills.slice(0, 5).map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        {talent.location && (
                          <p className="text-slate-300 text-sm">📍 {talent.location}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.businesses && searchResults.businesses.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Businesses ({searchResults.businesses.length})</h2>
                  {mapMarkers.length === 0 && (
                    <p className="text-slate-400 text-sm mb-4">
                      Map pins require business location coordinates. You can still open the Business Profile and connect.
                    </p>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {searchResults.businesses.map((business) => (
                      <div
                        key={business.id}
                        className="rounded-xl bg-slate-900/70 border border-white/10 p-6"
                      >
                        <h3 className="text-xl font-semibold mb-2">{business.name}</h3>
                        {business.tagline ? (
                          <p className="text-blue-200 mb-2">{business.tagline}</p>
                        ) : null}
                        {business.mission ? (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{business.mission}</p>
                        ) : null}
                        {business.slug ? (
                          <Link
                            href={`/business/${business.slug}`}
                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-200 hover:bg-blue-500/30 transition-colors"
                          >
                            View Business Profile →
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {((searchResults.jobs && searchResults.jobs.length === 0) ||
                (allowTalentSearch && searchResults.talent && searchResults.talent.length === 0) ||
                (searchResults.businesses && searchResults.businesses.length === 0)) && (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg">No results found. Try different search terms.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
