'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import SearchMap from '@/components/SearchMap'

interface Job {
  id: number
  title: string
  description: string | null
  location: string | null
  city: string | null
  status: string
  created_at: string
}

interface Talent {
  id: number
  name: string
  title: string | null
  bio: string | null
  skills: string[] | null
  location: string | null
  latitude?: number | null
  longitude?: number | null
}

interface Business {
  id: number
  name: string
  description: string | null
  industry: string | null
  location: string | null
  latitude?: number | null
  longitude?: number | null
}

interface MapMarker {
  id: number
  lat: number
  lng: number
  title: string
  description?: string
  type: 'talent' | 'business'
}

export default function SearchPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  
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

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')
    const storedUserType = localStorage.getItem('user_type')
    
    setIsAuthenticated(!!token && !!email)
    if (storedUserType) {
      setUserType(storedUserType)
    }
  }, [])

  // Geocode location string to coordinates using Mapbox Geocoding API
  const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiY3JlZXJsaW8iLCJhIjoiY21pY3IxZHljMXFwNTJzb2FydzR4b3F1YSJ9.Is8-GyfEdqwKKEo2cGO65g'
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            limit: 1
          }
        }
      )
      
      if (response.data.features && response.data.features.length > 0) {
        const [lng, lat] = response.data.features[0].center
        return { lat, lng }
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

      setIsGeocoding(true)
      const markers: MapMarker[] = []

      // Process Talent results
      if (searchResults.talent && searchResults.talent.length > 0) {
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
        for (const business of searchResults.businesses) {
          let lat: number | null = null
          let lng: number | null = null

          // Use existing coordinates if available
          if (business.latitude && business.longitude) {
            lat = business.latitude
            lng = business.longitude
          } else if (business.location) {
            // Geocode location string
            const coords = await geocodeLocation(business.location)
            if (coords) {
              lat = coords.lat
              lng = coords.lng
            }
          }

          if (lat !== null && lng !== null) {
            markers.push({
              id: business.id,
              lat,
              lng,
              title: business.name,
              description: business.industry || undefined,
              type: 'business'
            })
          }
        }
      }

      setMapMarkers(markers)
      setIsGeocoding(false)
    }

    processMarkers()
  }, [searchResults, searchType])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setError(null)
    setSearchResults({})

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:58',message:'Starting search',data:{searchType,query:searchQuery,location,apiUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (searchType === 'jobs') {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:65',message:'Searching jobs',data:{url:`${apiUrl}/api/jobs/public`,params:{keyword:searchQuery,location}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Build params object, only including non-empty values
        const params: Record<string, string> = {}
        if (searchQuery && searchQuery.trim()) {
          params.keyword = searchQuery.trim()
        }
        if (location && location.trim()) {
          params.location = location.trim()
        }
        
        const response = await axios.get(`${apiUrl}/api/jobs/public`, { params })
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:73',message:'Jobs search succeeded',data:{count:response.data?.jobs?.length || 0,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setSearchResults({ jobs: response.data.jobs || [] })
      } else if (searchType === 'talent') {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:77',message:'Searching talent',data:{url:`${apiUrl}/api/talent/search`,params:{query:searchQuery,location}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Build params object, only including non-empty values
        const params: Record<string, string> = {}
        if (searchQuery && searchQuery.trim()) {
          params.query = searchQuery.trim()
        }
        if (location && location.trim()) {
          params.location = location.trim()
        }
        
        const response = await axios.get(`${apiUrl}/api/talent/search`, { params })
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:85',message:'Talent search succeeded',data:{count:response.data?.talents?.length || 0,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setSearchResults({ talent: response.data.talents || [] })
      } else if (searchType === 'business') {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:89',message:'Searching businesses',data:{url:`${apiUrl}/api/business/search`,params:{query:searchQuery,location}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // Build params object, only including non-empty values
        const params: Record<string, string> = {}
        if (searchQuery && searchQuery.trim()) {
          params.query = searchQuery.trim()
        }
        if (location && location.trim()) {
          params.location = location.trim()
        }
        
        const response = await axios.get(`${apiUrl}/api/business/search`, { params })
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search/page.tsx:97',message:'Business search succeeded',data:{count:response.data?.businesses?.length || 0,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setSearchResults({ businesses: response.data.businesses || [] })
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
                  <Link 
                    href={userType === 'business' ? '/dashboard/business' : '/dashboard/talent'} 
                    className="hover:text-blue-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem('access_token')
                      localStorage.removeItem('user_email')
                      localStorage.removeItem('user_type')
                      setIsAuthenticated(false)
                      setUserType(null)
                      router.push('/')
                    }}
                    className="hover:text-blue-400 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-blue-400 transition-colors">Login</Link>
                  <Link href="/register" className="hover:text-blue-400 transition-colors">Register</Link>
                </>
              )}
            </nav>

            {isAuthenticated ? (
              <Link
                href={userType === 'business' ? '/dashboard/business' : '/dashboard/talent'}
                className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/register"
                className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
              >
                Free Trial
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
              Search <span className="text-blue-400">Talent & Jobs</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Find the perfect match with AI-powered search
            </p>
          </div>

          {/* Search Interface */}
          <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-12">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-6">
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
                  placeholder={`Search for ${searchType}...`}
                  className="w-full px-6 py-4 bg-slate-800 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />

                {/* Location Filter */}
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (optional)"
                  className="w-full px-6 py-4 bg-slate-800 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
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

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/50 p-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {Object.keys(searchResults).length > 0 && (
            <div className="space-y-6">
              {/* Map Display for Talent and Business Results */}
              {(searchResults.talent || searchResults.businesses) && mapMarkers.length > 0 && (
                <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-6">
                  <h2 className="text-2xl font-bold mb-4">Map View</h2>
                  <div className="h-[500px] w-full rounded-lg overflow-hidden">
                    {isGeocoding ? (
                      <div className="h-full flex items-center justify-center bg-slate-800/50">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-slate-300">Geocoding locations...</p>
                        </div>
                      </div>
                    ) : (
                      <SearchMap markers={mapMarkers} />
                    )}
                  </div>
                </div>
              )}

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

              {searchResults.talent && searchResults.talent.length > 0 && (
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
                  {mapMarkers.length === 0 && searchResults.businesses.some(b => b.location) && (
                    <p className="text-slate-400 text-sm mb-4">
                      Note: Some businesses may not have location data available for mapping.
                    </p>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {searchResults.businesses.map((business) => (
                      <div
                        key={business.id}
                        className="rounded-xl bg-slate-900/70 border border-white/10 p-6"
                      >
                        <h3 className="text-xl font-semibold mb-2">{business.name}</h3>
                        {business.industry && (
                          <p className="text-blue-400 mb-2">{business.industry}</p>
                        )}
                        {business.description && (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{business.description}</p>
                        )}
                        {business.location && (
                          <p className="text-slate-300 text-sm">📍 {business.location}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {((searchResults.jobs && searchResults.jobs.length === 0) ||
                (searchResults.talent && searchResults.talent.length === 0) ||
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
