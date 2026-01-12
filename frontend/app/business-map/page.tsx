'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'

// Dynamically import SearchMap to avoid SSR issues (it supports markers)
const SearchMap = dynamic(() => import('@/components/SearchMap'), { ssr: false })

type LocSuggestion = { id: string; label: string; lng: number; lat: number }

interface AnonymizedTalent {
  id: string
  title: string | null
  skills: string[] | null
  experience_years: number | null
  bio: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  distance_km?: number
  search_summary: string | null
  availability_description: string | null
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

const SKILLS_OPTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'Vue.js', 'Angular',
  'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
  'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'GraphQL', 'REST API', 'Microservices',
  'Machine Learning', 'Data Science', 'Analytics', 'Project Management', 'Agile', 'Scrum',
  'UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Marketing', 'Sales', 'Customer Service',
  'Accounting', 'Finance', 'HR', 'Recruiting', 'Business Analysis', 'Consulting'
] as const

const ROLE_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer',
  'Backend Developer', 'DevOps Engineer', 'Data Scientist', 'Data Analyst', 'Machine Learning Engineer',
  'Product Manager', 'Project Manager', 'Business Analyst', 'UX Designer', 'UI Designer',
  'Marketing Manager', 'Sales Manager', 'Account Manager', 'HR Manager', 'Recruiter',
  'Accountant', 'Financial Analyst', 'Consultant', 'Operations Manager', 'Customer Success Manager'
] as const

export default function BusinessMapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [businessProfileId, setBusinessProfileId] = useState<string | null>(null)
  const [businessUserId, setBusinessUserId] = useState<string | null>(null)

  const [locQuery, setLocQuery] = useState('')
  const [locBusy, setLocBusy] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const [locOpen, setLocOpen] = useState(false)
  const [locSuggestions, setLocSuggestions] = useState<LocSuggestion[]>([])
  const [locActiveIdx, setLocActiveIdx] = useState(0)
  const RADIUS_KEY = 'creerlio_business_map_radius_km_v1'
  const [radiusKm, setRadiusKm] = useState<number>(10)
  const [searchCenter, setSearchCenter] = useState<{ lng: number; lat: number; label?: string } | null>(null)

  const [filters, setFilters] = useState({
    role: '',
    skills: [] as string[],
    minExperience: '',
    location: ''
  })

  const [skillsInput, setSkillsInput] = useState('')
  const [skillsInputOpen, setSkillsInputOpen] = useState(false)
  const [skillsInputActiveIdx, setSkillsInputActiveIdx] = useState(0)

  const [talents, setTalents] = useState<AnonymizedTalent[]>([])
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null)
  const [selectedTalent, setSelectedTalent] = useState<AnonymizedTalent | null>(null)
  const [requestingConnection, setRequestingConnection] = useState(false)
  const [showTalentPopup, setShowTalentPopup] = useState(false)

  const locDebounced = useDebouncedValue(locQuery, 300)
  const roleDebounced = useDebouncedValue(filters.role, 300)
  const skillsDebounced = useDebouncedValue(filters.skills.join(','), 300)
  const locAbort = useRef<AbortController | null>(null)

  // Check authentication
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: session } = await supabase.auth.getSession()
        if (cancelled) return
        const uid = session?.session?.user?.id ?? null
        setIsAuthenticated(!!uid)

        if (uid) {
          // Get business profile ID - try multiple select patterns for schema tolerance
          const selectors = ['id, user_id', 'id']
          let businessProfile: any = null
          
          for (const sel of selectors) {
            const { data: bp, error: bpError } = await supabase
              .from('business_profiles')
              .select(sel)
              .eq('user_id', uid)
              .maybeSingle()
            
            if (bp && !bpError) {
              businessProfile = bp
              break
            }
            
            // If error is about missing column, try next selector
            const msg = String(bpError?.message ?? '')
            const code = String(bpError?.code ?? '')
            const isMissingCol = code === 'PGRST204' || /Could not find the .* column/i.test(msg)
            if (!isMissingCol) break
          }

          if (businessProfile?.id) {
            setBusinessProfileId(String(businessProfile.id))
            // Also store the user_id for message creation
            if (businessProfile.user_id) {
              setBusinessUserId(businessProfile.user_id)
            } else {
              // Fallback: get user_id separately if not included in initial query
              const { data: bpFull } = await supabase
                .from('business_profiles')
                .select('user_id')
                .eq('id', businessProfile.id)
                .maybeSingle()
              if (bpFull?.user_id) {
                setBusinessUserId(bpFull.user_id)
              }
            }
            console.log('[Business Map] Business profile loaded:', businessProfile.id)
          } else {
            console.warn('[Business Map] No business profile found for user:', uid)
          }
          // Note: We don't require business profile to search, only to request connections
        }
      } catch (err: any) {
        console.error('Auth check error:', err)
        setError(err.message || 'Authentication error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Location search
  useEffect(() => {
    if (!locDebounced || locDebounced.length < 2) {
      setLocSuggestions([])
      setLocOpen(false)
      return
    }

    setLocBusy(true)
    setLocError(null)
    locAbort.current?.abort()
    const ac = new AbortController()
    locAbort.current = ac

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setLocError('Mapbox token not configured')
      setLocBusy(false)
      return
    }

    ;(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locDebounced)}.json?access_token=${token}&limit=6&types=place,locality,neighborhood,postcode,region&country=AU`
        const res = await fetch(url, { signal: ac.signal })
        if (ac.signal.aborted) return
        const json: any = await res.json()
        const feats = Array.isArray(json?.features) ? json.features : []
        const suggestions: LocSuggestion[] = feats.map((f: any) => ({
          id: String(f?.id || ''),
          label: String(f?.place_name || '').trim(),
          lng: Array.isArray(f?.center) ? f.center[0] : 0,
          lat: Array.isArray(f?.center) ? f.center[1] : 0
        }))
        if (ac.signal.aborted) return
        setLocSuggestions(suggestions)
        setLocOpen(true)
        setLocActiveIdx(0)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        console.error('Location search error:', err)
        setLocError(err.message || 'Location search failed')
      } finally {
        if (!ac.signal.aborted) setLocBusy(false)
      }
    })()
  }, [locDebounced])

  // Load talents based on filters
  useEffect(() => {
    if (!searchCenter) {
      setTalents([])
      return
    }

    const loadTalents = async () => {
      setLoading(true)
      setError(null)
      try {
        // Use schema-tolerant query like the search page
        // Try multiple selector patterns to handle different schemas
        const selectors = [
          'id,title,skills,experience_years,bio,city,state,country,latitude,longitude,search_summary,availability_description',
          'id,title,skills,experience_years,bio,city,state,country,latitude,longitude,search_summary',
          'id,title,skills,bio,city,state,country,latitude,longitude',
          'id,title,skills,bio,latitude,longitude',
          'id,title,skills,bio',
          'id,title,skills',
          'id,title'
        ]
        
        let data: any[] | null = null
        let lastErr: any = null
        
        for (const sel of selectors) {
          let query = supabase
            .from('talent_profiles')
            .select(sel)
          
          // Try to filter by is_active if column exists (handle gracefully)
          try {
            query = query.eq('is_active', true)
          } catch {
            // Column doesn't exist, continue without filter
          }
          
          const res = await query.limit(200)
          
          if (!res.error && res.data) {
            data = res.data
            lastErr = null
            break
          }
          
          lastErr = res.error
          const msg = String(res.error?.message ?? '')
          const code = String(res.error?.code ?? '')
          const isMissingCol = code === 'PGRST204' || /Could not find the .* column/i.test(msg)
          if (!isMissingCol) break
        }
        
        if (lastErr && !data) {
          throw lastErr
        }

        // Client-side filtering for search visibility (backward compatible)
        // Default behavior: Show all talents unless explicitly opted out
        // Only hide talents if search_visible is explicitly set to false
        // If search_visible is true, they must have a search_summary to appear
        // If search_visible is null/undefined or column doesn't exist, show them (backward compatibility)
        if (data) {
          const beforeFilter = data.length
          data = data.filter((t: any) => {
            // Only filter if search_visible is explicitly set to a boolean value
            // This ensures backward compatibility with existing talents
            if (typeof t.search_visible === 'boolean') {
              if (t.search_visible === false) {
                // Explicitly opted out - hide them
                return false
              }
              if (t.search_visible === true) {
                // Explicitly opted in - must have a search_summary
                const hasSummary = typeof t.search_summary === 'string' && t.search_summary.trim().length > 0
                return hasSummary
              }
            }
            // For null, undefined, or non-existent column - show them (backward compatibility)
            return true
          })
          const afterFilter = data.length
          if (beforeFilter > afterFilter) {
            console.log(`Search visibility filter: ${beforeFilter} talents before, ${afterFilter} after filtering (${beforeFilter - afterFilter} filtered out)`)
          }
        }
        
        // Now filter by location and other criteria client-side
        const centerLat = searchCenter.lat
        const centerLng = searchCenter.lng

        // Helper function to geocode location if needed
        const geocodeTalentLocation = async (t: any): Promise<{ lat: number; lng: number } | null> => {
          // If already has coordinates, return them
          if (t.latitude && t.longitude) {
            return { lat: t.latitude, lng: t.longitude }
          }

          // Try to geocode from city, state, country
          const locationParts = [t.city, t.state, t.country].filter(Boolean)
          if (locationParts.length === 0) return null

          const locationString = locationParts.join(', ')
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          if (!token) return null

          try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationString)}.json?access_token=${token}&limit=1&country=AU`
            const response = await fetch(url)
            const geocodeData = await response.json()
            
            if (geocodeData.features && geocodeData.features.length > 0) {
              const [lng, lat] = geocodeData.features[0].center
              // Optionally save the geocoded coordinates back to the database
              // For now, we'll just use them for filtering
              return { lat, lng }
            }
          } catch (err) {
            console.warn('Geocoding failed for talent:', err)
          }
          
          return null
        }

        // Process all talents and geocode those missing coordinates
        const processedTalents = await Promise.all(
          (data || []).map(async (t: any) => {
            // Try to get coordinates (either from DB or by geocoding)
            const coords = await geocodeTalentLocation(t)
            if (!coords) {
              // If no coordinates can be determined, skip this talent (can't show on map without location)
              console.debug('Skipping talent without coordinates:', t.id, 'Location:', [t.city, t.state, t.country].filter(Boolean).join(', ') || 'none')
              return null
            }
            
            // Now use the coordinates for distance calculation
            const lat = coords.lat
            const lng = coords.lng
            
            // Calculate distance using Haversine formula
            const R = 6371000 // Earth radius in meters
            const dLat = ((lat - centerLat) * Math.PI) / 180
            const dLng = ((lng - centerLng) * Math.PI) / 180
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((centerLat * Math.PI) / 180) *
                Math.cos((lat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distanceMeters = R * c
            const distanceKm = distanceMeters / 1000

            if (distanceKm > radiusKm) return null

            // Filter by role/title (client-side)
            if (filters.role && t.title) {
              if (!t.title.toLowerCase().includes(filters.role.toLowerCase())) {
                return null
              }
            }

            // Filter by skills (client-side)
            const talentSkills = Array.isArray(t.skills) ? t.skills.map((s: any) => String(s).toLowerCase()) : []
            if (filters.skills.length > 0) {
              const hasMatchingSkill = filters.skills.some(skill => 
                talentSkills.includes(skill.toLowerCase())
              )
              if (!hasMatchingSkill) return null
            }

            // Filter by minimum experience (client-side)
            if (filters.minExperience && t.experience_years !== null && t.experience_years !== undefined) {
              const minExp = parseInt(filters.minExperience)
              if (!isNaN(minExp) && t.experience_years < minExp) {
                return null
              }
            }

            // Return the anonymized talent data with geocoded coordinates
            return {
              id: String(t.id),
              title: t.title || null,
              skills: Array.isArray(t.skills) ? t.skills : null,
              experience_years: t.experience_years !== null && t.experience_years !== undefined ? t.experience_years : null,
              bio: t.bio ? t.bio.substring(0, 200) : null, // Truncate bio
              city: t.city || null,
              state: t.state || null,
              country: t.country || null,
              latitude: lat,
              longitude: lng,
              distance_km: Math.round(distanceKm * 10) / 10,
              search_summary: (typeof t.search_summary === 'string' && t.search_summary) || null,
              availability_description: (typeof t.availability_description === 'string' && t.availability_description) || null
            } as AnonymizedTalent
          })
        )

        // Filter out nulls (all filtering already done above)
        const filtered = processedTalents.filter((t): t is AnonymizedTalent => t !== null)

        // Sort by distance
        filtered.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))

        setTalents(filtered)
      } catch (err: any) {
        console.error('Error loading talents:', err)
        setError(err.message || 'Failed to load talent')
      } finally {
        setLoading(false)
      }
    }

    loadTalents()
  }, [searchCenter, radiusKm, filters.role, filters.skills, filters.minExperience])

  // Handle location selection
  const handleLocationSelect = (suggestion: LocSuggestion) => {
    setLocQuery(suggestion.label)
    setSearchCenter({ lng: suggestion.lng, lat: suggestion.lat, label: suggestion.label })
    setLocOpen(false)
    setFilters(prev => ({ ...prev, location: suggestion.label }))
  }

  // Handle skills input
  const handleSkillsInputChange = (value: string) => {
    setSkillsInput(value)
    const matching = SKILLS_OPTIONS.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    if (matching.length > 0) {
      setSkillsInputOpen(true)
      setSkillsInputActiveIdx(0)
    } else {
      setSkillsInputOpen(false)
    }
  }

  const handleAddSkill = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      setFilters(prev => ({ ...prev, skills: [...prev.skills, skill] }))
    }
    setSkillsInput('')
    setSkillsInputOpen(false)
  }

  // Handle connection request
  const handleRequestConnection = async (talentId: string) => {
    // Check authentication first
    const { data: session } = await supabase.auth.getSession()
    const uid = session?.session?.user?.id ?? null
    
    if (!uid) {
      alert('Please sign in as a business to request connections.')
      router.push('/login?redirect=/business-map')
      return
    }

    // Check if business profile exists, reload if needed
    let currentBusinessProfileId = businessProfileId
    let currentBusinessUserId = businessUserId || uid
    
    if (!currentBusinessProfileId) {
      try {
        // Get business profile with user_id to ensure it matches the authenticated user
        const { data: bp, error: bpError } = await supabase
          .from('business_profiles')
          .select('id, user_id')
          .eq('user_id', uid)
          .maybeSingle()

        if (bpError) {
          console.error('Error fetching business profile:', bpError)
          alert(`Failed to load business profile: ${bpError.message}. Please ensure your business profile is complete.`)
          return
        }

        if (bp?.id) {
          currentBusinessProfileId = String(bp.id)
          setBusinessProfileId(currentBusinessProfileId)
          if (bp.user_id) {
            currentBusinessUserId = bp.user_id
            setBusinessUserId(bp.user_id)
          } else {
            // Business profile exists but has no user_id - this is a data integrity issue
            console.error('Business profile missing user_id:', bp.id)
            alert('Business profile configuration error. Please contact support or recreate your business profile.')
            return
          }
        } else {
          // No business profile - redirect to create one
          if (confirm('You need to complete your business profile before requesting connections. Would you like to go to your profile page now?')) {
            router.push('/dashboard/business/edit')
          }
          return
        }
      } catch (err: any) {
        console.error('Error checking business profile:', err)
        alert(`Failed to check business profile: ${err.message}. Please try again or complete your profile first.`)
        return
      }
    } else {
      // Verify the existing businessProfileId belongs to the current user
      try {
        const { data: bp, error: bpError } = await supabase
          .from('business_profiles')
          .select('id, user_id')
          .eq('id', currentBusinessProfileId)
          .maybeSingle()

        if (bpError || !bp) {
          console.error('Error verifying business profile:', bpError)
          // Reload business profile
          const { data: bpReload } = await supabase
            .from('business_profiles')
            .select('id, user_id')
            .eq('user_id', uid)
            .maybeSingle()
          
          if (bpReload?.id) {
            currentBusinessProfileId = String(bpReload.id)
            setBusinessProfileId(currentBusinessProfileId)
            if (bpReload.user_id) {
              currentBusinessUserId = bpReload.user_id
              setBusinessUserId(bpReload.user_id)
            }
          } else {
            alert('Business profile not found. Please complete your business profile first.')
            router.push('/dashboard/business/edit')
            return
          }
        } else if (bp.user_id !== uid) {
          // Business profile doesn't belong to current user
          alert('Business profile ownership mismatch. Please sign in with the correct account.')
          return
        } else {
          // Business profile is valid - ensure user_id is set
          if (bp.user_id && !currentBusinessUserId) {
            currentBusinessUserId = bp.user_id
            setBusinessUserId(bp.user_id)
          }
        }
      } catch (err: any) {
        console.error('Error verifying business profile:', err)
        alert(`Failed to verify business profile: ${err.message}`)
        return
      }
    }

    setRequestingConnection(true)
    try {
      // Use the verified business profile ID
      const bpId = currentBusinessProfileId
      if (!bpId) {
        throw new Error('Business profile not found')
      }
      
      console.log('[Business Map] Requesting connection with:', { businessProfileId: bpId, talentId, currentBusinessUserId })

      // Check if connection request already exists
      const { data: existing } = await supabase
        .from('talent_connection_requests')
        .select('id, status')
        .eq('business_id', bpId)
        .eq('talent_id', talentId)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'pending') {
          alert('Connection request already pending')
        } else if (existing.status === 'accepted') {
          alert('You are already connected with this talent')
        } else {
          alert('Connection request was previously declined')
        }
        setRequestingConnection(false)
        return
      }

      // Create connection request
      // Note: selected_sections is required but will be empty initially
      // Talent can review and select sections when they accept
      const { data: newRequest, error: insertError } = await supabase
        .from('talent_connection_requests')
        .insert({
          business_id: bpId,
          talent_id: talentId,
          status: 'pending',
          selected_sections: [] // Empty array - talent will select sections when accepting
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Create a conversation and initial message/notification for the talent
      try {
        // Get business name for the message
        const { data: businessData } = await supabase
          .from('business_profiles')
          .select('business_name, name, company_name, user_id')
          .eq('id', bpId)
          .maybeSingle()

        const businessName = businessData?.business_name || businessData?.name || businessData?.company_name || 'A business'
        const currentBusinessUserId = businessUserId || businessData?.user_id

        // Check if conversation already exists
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('talent_id', talentId)
          .eq('business_id', bpId)
          .maybeSingle()

        let conversationId = existingConv?.id

        if (!conversationId) {
          // Create new conversation
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              talent_id: talentId,
              business_id: bpId,
              last_message_at: new Date().toISOString()
            })
            .select()
            .single()

          if (!convError && newConv) {
            conversationId = newConv.id
          }
        }

        // Create initial message about the connection request
        if (conversationId && currentBusinessUserId) {
          const messageBody = `${businessName} has requested to connect with you. Review their profile in the Connection Requests section of your dashboard to accept or decline.`
          
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_type: 'business',
              sender_user_id: currentBusinessUserId,
              body: messageBody
            })
        }
      } catch (msgErr) {
        // Non-critical error - connection request was created successfully
        console.warn('Failed to create notification message:', msgErr)
      }

      alert('Connection request sent! The talent has been notified and can review your business profile before accepting.')
      setShowTalentPopup(false)
      setSelectedTalent(null)
    } catch (err: any) {
      console.error('Error requesting connection:', err)
      alert(err.message || 'Failed to send connection request')
    } finally {
      setRequestingConnection(false)
    }
  }

  // Reload business profile when popup opens (to ensure it's available)
  useEffect(() => {
    if (showTalentPopup && !businessProfileId && isAuthenticated) {
      // Reload business profile if not loaded yet
      ;(async () => {
        try {
          const { data: session } = await supabase.auth.getSession()
          const uid = session?.session?.user?.id ?? null
          
          if (uid) {
            const { data: bp } = await supabase
              .from('business_profiles')
              .select('id, user_id')
              .eq('user_id', uid)
              .maybeSingle()

            if (bp?.id) {
              setBusinessProfileId(String(bp.id))
              if (bp.user_id) {
                setBusinessUserId(bp.user_id)
              }
              console.log('[Business Map] Business profile reloaded:', bp.id)
            }
          }
        } catch (err) {
          console.error('[Business Map] Error reloading business profile:', err)
        }
      })()
    }
  }, [showTalentPopup, businessProfileId, isAuthenticated])

  // Handle talent marker click (can be called with string or number ID)
  const handleTalentMarkerClick = (talentId: string | number) => {
    const talentIdStr = String(talentId)
    const talent = talents.find(t => t.id === talentIdStr)
    if (talent) {
      setSelectedTalentId(talentIdStr)
      setSelectedTalent(talent)
      setShowTalentPopup(true)
    }
  }

  // Get map markers for SearchMap component
  const mapMarkers = useMemo(() => {
    return talents
      .filter(t => t.latitude !== null && t.longitude !== null)
      .map(t => ({
        id: t.id,
        lat: t.latitude!,
        lng: t.longitude!,
        type: 'talent' as const,
        title: t.title || 'Talent',
        description: t.city && t.state ? `${t.city}, ${t.state}` : t.city || t.state || 'Location not specified'
      }))
  }, [talents])

  // Get map center - use search center or default to Sydney
  const mapCenter = searchCenter || (talents.length > 0 && talents[0].latitude && talents[0].longitude 
    ? { lat: talents[0].latitude, lng: talents[0].longitude }
    : { lat: -33.8688, lng: 151.2093 }) // Default to Sydney

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to use the Business Map.</p>
          <Link
            href="/login?redirect=/business-map"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard/business" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-400 transition-colors">
            ← Business Dashboard
          </Link>
          <h1 className="text-xl font-semibold">Business Map - Find Talent</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="dashboard-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Search Filters</h2>

              {/* Location Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <div className="relative">
                  <input
                    type="text"
                    value={locQuery}
                    onChange={(e) => setLocQuery(e.target.value)}
                    onFocus={() => locSuggestions.length > 0 && setLocOpen(true)}
                    placeholder="City, State, or Country"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  {locOpen && locSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {locSuggestions.map((s, idx) => (
                        <button
                          key={s.id}
                          onClick={() => handleLocationSelect(s)}
                          className={`w-full text-left px-4 py-2 hover:bg-white/10 transition-colors ${
                            idx === locActiveIdx ? 'bg-blue-500/20' : ''
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Radius */}
              {searchCenter && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Radius: {radiusKm} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Role/Title Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Role/Title</label>
                <input
                  type="text"
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Skills Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                <div className="relative">
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => handleSkillsInputChange(e.target.value)}
                    placeholder="Type to search skills..."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  {skillsInputOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {SKILLS_OPTIONS.filter(s => s.toLowerCase().includes(skillsInput.toLowerCase()))
                        .slice(0, 10)
                        .map((skill, idx) => (
                          <button
                            key={skill}
                            onClick={() => handleAddSkill(skill)}
                            className={`w-full text-left px-4 py-2 hover:bg-white/10 transition-colors ${
                              idx === skillsInputActiveIdx ? 'bg-blue-500/20' : ''
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {filters.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.skills.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm flex items-center gap-1"
                      >
                        {skill}
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.minExperience}
                  onChange={(e) => setFilters(prev => ({ ...prev, minExperience: e.target.value }))}
                  placeholder="e.g., 5"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              {loading && (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-400 mt-2">Searching talent...</p>
                </div>
              )}

              {!loading && searchCenter && (
                <div className="text-sm text-gray-400 mt-4">
                  Found {talents.length} {talents.length === 1 ? 'talent' : 'talents'} within {radiusKm} km
                </div>
              )}
            </div>
          </div>

          {/* Map and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="dashboard-card rounded-xl p-0 overflow-hidden" style={{ height: '600px' }}>
              {typeof window !== 'undefined' && searchCenter && (
                <SearchMap
                  markers={mapMarkers}
                  center={mapCenter}
                  zoom={mapMarkers.length > 0 ? (mapMarkers.length === 1 ? 12 : 11) : 10}
                  className="w-full h-full"
                  onMarkerClick={handleTalentMarkerClick}
                />
              )}
              {typeof window !== 'undefined' && !searchCenter && (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">📍 Search for Talent</p>
                    <p className="text-sm">Enter a location above to find talent in your area</p>
                  </div>
                </div>
              )}
            </div>

            {/* Talent Results */}
            {talents.length > 0 && (
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Matching Talent</h2>
                <div className="space-y-4 max-h-96 overflow-auto">
                  {talents.map((talent) => (
                    <div
                      key={talent.id}
                      className="border border-white/10 rounded-lg p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
                      onClick={() => handleTalentMarkerClick(talent.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Anonymized Title */}
                          {talent.title && (
                            <h3 className="text-lg font-semibold text-white mb-2">{talent.title}</h3>
                          )}

                          {/* Search Summary Preview (if available) */}
                          {talent.search_summary && (
                            <p className="text-sm text-gray-200 mb-2 line-clamp-2">{talent.search_summary}</p>
                          )}

                          {/* Experience */}
                          {talent.experience_years !== null && (
                            <p className="text-sm text-gray-400 mb-2">
                              {talent.experience_years} {talent.experience_years === 1 ? 'year' : 'years'} of experience
                            </p>
                          )}

                          {/* Skills Preview (limited to 5) */}
                          {talent.skills && talent.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {talent.skills.slice(0, 5).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                              {talent.skills.length > 5 && (
                                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                                  +{talent.skills.length - 5} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Location (city/state only, not exact address) */}
                          {(talent.city || talent.state) && (
                            <p className="text-sm text-gray-400 mb-2">
                              📍 {[talent.city, talent.state].filter(Boolean).join(', ')}
                              {talent.distance_km && ` (${talent.distance_km} km away)`}
                            </p>
                          )}
                        </div>

                        {/* View Details Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTalentMarkerClick(talent.id)
                          }}
                          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && searchCenter && talents.length === 0 && (
              <div className="dashboard-card rounded-xl p-6 text-center">
                <p className="text-gray-400">No talent found matching your filters. Try adjusting your search criteria.</p>
              </div>
            )}

            {!searchCenter && (
              <div className="dashboard-card rounded-xl p-6 text-center">
                <p className="text-gray-400">Enter a location above to search for talent.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Talent Popup Modal */}
      {showTalentPopup && selectedTalent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Talent Summary</h2>
              <button
                onClick={() => {
                  setShowTalentPopup(false)
                  setSelectedTalent(null)
                  setSelectedTalentId(null)
                }}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Talent Details */}
            <div className="space-y-4">
              {/* Title/Role */}
              {selectedTalent.title && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{selectedTalent.title}</h3>
                </div>
              )}

              {/* Experience */}
              {selectedTalent.experience_years !== null && selectedTalent.experience_years !== undefined && (
                <div>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">{selectedTalent.experience_years}</span> {selectedTalent.experience_years === 1 ? 'year' : 'years'} of experience
                  </p>
                </div>
              )}

              {/* Location */}
              {(selectedTalent.city || selectedTalent.state || selectedTalent.country) && (
                <div>
                  <p className="text-sm text-gray-300">
                    📍 {[selectedTalent.city, selectedTalent.state, selectedTalent.country].filter(Boolean).join(', ')}
                    {selectedTalent.distance_km && ` (${selectedTalent.distance_km} km away)`}
                  </p>
                </div>
              )}

              {/* Search Summary - This is what the talent wrote for businesses to see */}
              {selectedTalent.search_summary ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">About</h4>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{selectedTalent.search_summary}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-yellow-400 italic">No summary provided by this talent.</p>
                </div>
              )}

              {/* Availability Description */}
              {selectedTalent.availability_description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Availability</h4>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{selectedTalent.availability_description}</p>
                </div>
              )}

              {/* Skills Preview */}
              {selectedTalent.skills && selectedTalent.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTalent.skills.slice(0, 8).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {selectedTalent.skills.length > 8 && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                        +{selectedTalent.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  ℹ️ This is a brief summary provided by the talent. To see their full profile and contact them, you'll need to request a connection, which they can accept or decline after reviewing your business profile.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => handleRequestConnection(selectedTalent.id)}
                  disabled={requestingConnection}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {requestingConnection ? 'Sending Request...' : 'Request Connection'}
                </button>
                <button
                  onClick={() => {
                    setShowTalentPopup(false)
                    setSelectedTalent(null)
                    setSelectedTalentId(null)
                  }}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
