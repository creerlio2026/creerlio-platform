'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

// Dynamic import for mapbox-gl to avoid SSR issues
let mapboxgl: any = null
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl')
}

export interface BusinessFeature {
  id: string
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    id: string
    name: string
    slug: string
    industries: string[]
    lat: number
    lng: number
    sizeBand?: string
    openness?: string
  }
}

export interface RouteState {
  to?: { label: string; lat: number; lng: number }
  drivingMins?: number
  cyclingMins?: number
  busy: boolean
  error?: string
}

interface BusinessDiscoveryMapProps {
  filters: {
    q: string
    industries: string[]
    work: string
  }
  toggles: {
    businesses: boolean
    context: boolean
    schools: boolean
    commute: boolean
    transport: boolean
    shopping: boolean
    property: boolean
  }
  onToggle: (toggles: Partial<BusinessDiscoveryMapProps['toggles']>) => void
  flyTo: { lng: number; lat: number; zoom?: number } | null
  searchCenter: { lng: number; lat: number; label?: string } | null
  radiusKm: number
  showAllBusinesses: boolean
  onResults: (results: any[]) => void
  selectedBusinessId: string | null
  onSelectedBusinessId: (id: string | null) => void
  selectBusinessId: string | null
  hideLegend?: boolean
  activeStyle: 'dark' | 'light' | 'satellite' | 'streets'
  onStyleChange: (style: 'dark' | 'light' | 'satellite' | 'streets') => void
  onSelectedBusinessChange: (business: BusinessFeature | null) => void
  onRouteStateChange: (state: RouteState | null) => void
  onRouteQueryChange: (query: string) => void
  externalRouteQuery: string
}

const mapStyles: Record<string, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  streets: 'mapbox://styles/mapbox/streets-v12',
}

export default function BusinessDiscoveryMap(props: BusinessDiscoveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const pointBMarkerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [businesses, setBusinesses] = useState<BusinessFeature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined' || !mapboxgl) return
    if (map.current) return // Only initialize once

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) {
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyles[props.activeStyle],
      center: [151.2093, -33.8688], // Default to Sydney
      zoom: 11,
      attributionControl: false,
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Handle map style changes
  useEffect(() => {
    if (map.current && mapLoaded && props.activeStyle) {
      map.current.setStyle(mapStyles[props.activeStyle])
      map.current.once('style.load', () => {
        // Re-render markers after style change
        updateMarkers()
      })
    }
  }, [props.activeStyle, mapLoaded])

  // Handle flyTo
  useEffect(() => {
    if (map.current && mapLoaded && props.flyTo) {
      map.current.flyTo({
        center: [props.flyTo.lng, props.flyTo.lat],
        zoom: props.flyTo.zoom || 12,
        essential: true,
      })
    }
  }, [props.flyTo, mapLoaded])

  // Fetch businesses from API
  const fetchBusinesses = useCallback(async () => {
    if (!mapLoaded) return

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const ac = new AbortController()
    abortControllerRef.current = ac

    setIsLoading(true)

    try {
      const params = new URLSearchParams()

      if (props.filters.q) params.set('q', props.filters.q)
      if (props.filters.industries.length > 0) params.set('industries', props.filters.industries.join(','))
      if (props.filters.work) params.set('work', props.filters.work)
      if (props.showAllBusinesses) params.set('show_all', '1')
      if (props.searchCenter) {
        params.set('lat', String(props.searchCenter.lat))
        params.set('lng', String(props.searchCenter.lng))
        params.set('radius', String(props.radiusKm))
      }

      const response = await fetch(`/api/map/businesses?${params.toString()}`, {
        signal: ac.signal,
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch businesses')
      }

      const data = await response.json()
      const bizList = Array.isArray(data?.businesses) ? data.businesses : []

      // Convert to GeoJSON features
      const features: BusinessFeature[] = bizList
        .filter((b: any) => b.lat != null && b.lng != null && Number.isFinite(b.lat) && Number.isFinite(b.lng))
        .map((b: any) => ({
          id: String(b.id),
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [Number(b.lng), Number(b.lat)],
          },
          properties: {
            id: String(b.id),
            name: String(b.name || 'Business'),
            slug: String(b.slug || ''),
            industries: Array.isArray(b.industries) ? b.industries : (b.industry ? [b.industry] : []),
            lat: Number(b.lat),
            lng: Number(b.lng),
            sizeBand: b.size_band || b.sizeBand,
            openness: b.openness,
          },
        }))

      setBusinesses(features)
      props.onResults(features.map(f => ({
        id: f.properties.id,
        name: f.properties.name,
        slug: f.properties.slug,
        industries: f.properties.industries,
        lng: f.properties.lng,
        lat: f.properties.lat,
      })))
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to fetch businesses:', error)
        setBusinesses([])
        props.onResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    mapLoaded,
    props.filters,
    props.showAllBusinesses,
    props.searchCenter,
    props.radiusKm,
  ])

  // Trigger fetch when filters change
  useEffect(() => {
    fetchBusinesses()
  }, [fetchBusinesses])

  // Clear businesses immediately when showAllBusinesses is toggled off
  useEffect(() => {
    if (!props.showAllBusinesses) {
      // If show_all is false and no filters are applied, clear businesses immediately
      const hasFilters = props.filters.q?.trim() || props.filters.industries.length > 0 || props.filters.work?.trim()
      if (!hasFilters) {
        setBusinesses([])
        props.onResults([])
      }
    }
  }, [props.showAllBusinesses, props.filters, props])

  // Create/update markers - only recreate when businesses change, not when selection changes
  const updateMarkers = useCallback(() => {
    if (!map.current || !mapLoaded) return

    // Get current business IDs
    const currentBusinessIds = businesses.map(b => b.properties.id)
    const existingMarkerIds = markersRef.current.map((m: any) => m._businessId)

    // Remove markers for businesses that no longer exist
    markersRef.current = markersRef.current.filter((marker: any) => {
      if (!currentBusinessIds.includes(marker._businessId)) {
        marker.remove()
        return false
      }
      return true
    })

    // Add markers for new businesses - created ONCE, never recreated
    businesses.forEach((business) => {
      if (!existingMarkerIds.includes(business.properties.id)) {
        // Create marker element - fixed dimensions, no transforms
        const el = document.createElement('div')
        el.className = 'business-marker'
        el.style.width = '24px'
        el.style.height = '24px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#10b981'
        el.style.border = '3px solid white'
        el.style.cursor = 'pointer'
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)'

        // Create popup - independent lifecycle, NOT attached to marker
        const popupContent = `
          <div style="padding: 6px; min-width: 140px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px; color: #1e293b;">
              ${business.properties.name}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
              ${business.properties.industries.length > 0 ? business.properties.industries[0] : 'Business'}
            </div>
            <a
              href="/dashboard/business/view?id=${business.properties.id}"
              class="business-profile-link"
              data-id="${business.properties.id}"
              data-slug="${business.properties.slug}"
              style="display: inline-block; padding: 4px 10px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;"
              onclick="window.location.href='/dashboard/business/view?id=${business.properties.id}'; return false;"
            >
              View Profile
            </a>
          </div>
        `

        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          anchor: 'bottom',
          offset: 20,
          maxWidth: '220px'
        }).setHTML(popupContent)

        // Create marker - anchored to exact coordinates, NEVER moved
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat(business.geometry.coordinates)
          .addTo(map.current)

        // Log marker creation for verification
        console.log(`[MARKER CREATED] ID: ${business.properties.id}, LngLat:`, marker.getLngLat())

        // Store references
        ;(marker as any)._businessId = business.properties.id
        ;(marker as any)._element = el
        ;(marker as any)._popup = popup
        ;(marker as any)._isPopupOpen = false

        // CLICK handler - opens/closes popup, NO hover behavior
        el.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()

          // Verify marker coordinates haven't changed
          console.log(`[MARKER CLICK] ID: ${business.properties.id}, LngLat:`, marker.getLngLat())

          // Toggle popup
          if ((marker as any)._isPopupOpen) {
            popup.remove()
            ;(marker as any)._isPopupOpen = false
          } else {
            popup.setLngLat(business.geometry.coordinates).addTo(map.current)
            ;(marker as any)._isPopupOpen = true
          }

          // Update selection state
          props.onSelectedBusinessId(business.properties.id)
          props.onSelectedBusinessChange(business)
          props.onRouteStateChange({ busy: false })
        })

        // Popup close handler
        popup.on('close', () => {
          ;(marker as any)._isPopupOpen = false
        })

        markersRef.current.push(marker)
      }
    })
  }, [businesses, mapLoaded, props.selectedBusinessId])

  // Update markers when businesses change
  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  // Update marker colors and popups when selection changes (without recreating markers)
  useEffect(() => {
    markersRef.current.forEach((marker: any) => {
      const el = marker._element
      const popup = marker._popup
      const isSelected = marker._businessId === props.selectedBusinessId

      if (el) {
        // Update marker color
        el.style.backgroundColor = isSelected ? '#3b82f6' : '#10b981'
      }

      if (popup) {
        // Show popup for selected business, hide for others
        if (isSelected) {
          popup.addTo(map.current)
        } else {
          popup.remove()
        }
      }
    })
  }, [props.selectedBusinessId])

  // Handle selectBusinessId prop - fly to location when business is selected
  useEffect(() => {
    if (!props.selectBusinessId || !map.current || !mapLoaded) {
      console.log('[BusinessDiscoveryMap] Fly-to skipped:', { 
        hasSelectId: !!props.selectBusinessId, 
        hasMap: !!map.current, 
        mapLoaded 
      })
      return
    }
    
    console.log('[BusinessDiscoveryMap] Attempting to fly to business:', {
      selectBusinessId: props.selectBusinessId,
      businessesCount: businesses.length,
      isLoading,
      businessIds: businesses.map(b => ({ id: b.properties.id, type: typeof b.properties.id, name: b.properties.name }))
    })
    
    // Wait for businesses to load
    if (businesses.length === 0) {
      if (isLoading) {
        // Still loading, wait a bit more
        console.log('[BusinessDiscoveryMap] Waiting for businesses to load...')
        return
      }
      // Not loading but no businesses - business might not be in current results
      console.warn('[BusinessDiscoveryMap] Business not found in current results:', props.selectBusinessId)
      return
    }
    
    // Try multiple matching strategies
    const selectIdStr = String(props.selectBusinessId).trim()
    const business = businesses.find(b => {
      const bizIdStr = String(b.properties.id).trim()
      const bizIdNum = Number(b.properties.id)
      const selectIdNum = Number(selectIdStr)
      
      // Try exact ID match (string)
      if (bizIdStr === selectIdStr) {
        console.log('[BusinessDiscoveryMap] Matched by string ID:', { bizIdStr, selectIdStr })
        return true
      }
      // Try numeric ID match (only if both are valid numbers)
      if (!isNaN(bizIdNum) && !isNaN(selectIdNum) && bizIdNum === selectIdNum) {
        console.log('[BusinessDiscoveryMap] Matched by numeric ID:', { bizIdNum, selectIdNum })
        return true
      }
      // Try slug match (if selectBusinessId is a slug)
      if (b.properties.slug && String(b.properties.slug).trim() === selectIdStr) {
        console.log('[BusinessDiscoveryMap] Matched by slug:', { slug: b.properties.slug, selectIdStr })
        return true
      }
      // Try name match (case-insensitive)
      if (b.properties.name && String(b.properties.name).toLowerCase().trim() === selectIdStr.toLowerCase().trim()) {
        console.log('[BusinessDiscoveryMap] Matched by name:', { name: b.properties.name, selectIdStr })
        return true
      }
      return false
    })
    
    if (business) {
      console.log('[BusinessDiscoveryMap] Business found, updating selection and flying to:', {
        id: business.properties.id,
        name: business.properties.name,
        coordinates: business.geometry.coordinates
      })
      props.onSelectedBusinessChange(business)
      // Fly to the business location when selected from results
      const [lng, lat] = business.geometry.coordinates
      if (Number.isFinite(lng) && Number.isFinite(lat) && lng !== 0 && lat !== 0) {
        console.log('[BusinessDiscoveryMap] Flying to business:', business.properties.name, { lng, lat, id: business.properties.id })
        try {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 14, // Zoom in closer when selecting a business
            duration: 1000, // Smooth animation
            essential: true, // Make it essential so it doesn't get cancelled
          })
          console.log('[BusinessDiscoveryMap] Fly-to command executed successfully')
        } catch (flyErr) {
          console.error('[BusinessDiscoveryMap] Fly-to error:', flyErr)
          // Fallback: just set the center without animation
          try {
            map.current.setCenter([lng, lat])
            map.current.setZoom(14)
          } catch (setErr) {
            console.error('[BusinessDiscoveryMap] Set center/zoom also failed:', setErr)
          }
        }
      } else {
        console.warn('[BusinessDiscoveryMap] Business has invalid coordinates:', business.properties.name, { lng, lat })
      }
    } else {
      console.warn('[BusinessDiscoveryMap] Business not found:', {
        selectBusinessId: props.selectBusinessId,
        selectIdType: typeof props.selectBusinessId,
        selectIdValue: props.selectBusinessId,
        availableBusinesses: businesses.map(b => ({ 
          id: b.properties.id, 
          idType: typeof b.properties.id,
          idValue: b.properties.id,
          name: b.properties.name, 
          slug: b.properties.slug 
        }))
      })
    }
  }, [props.selectBusinessId, businesses, mapLoaded, isLoading, props])

  // Draw commute rings around selected business
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const sourceId = 'commute-rings-source'
    const layerId = 'commute-rings-layer'

    // Remove existing layers and sources
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId)
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId)
    }

    // Only draw if commute toggle is enabled and business is selected
    if (!props.toggles.commute || !props.selectedBusinessId) return

    const selectedBiz = businesses.find(b => b.properties.id === props.selectedBusinessId)
    if (!selectedBiz) return

    const center = selectedBiz.geometry.coordinates
    const radiusInKm = props.radiusKm

    // Create concentric circles at different distances
    const createCircle = (radiusKm: number) => {
      const points = 64
      const coords = []
      const distanceX = radiusKm / (111.32 * Math.cos(center[1] * Math.PI / 180))
      const distanceY = radiusKm / 110.574

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI)
        const x = distanceX * Math.cos(theta)
        const y = distanceY * Math.sin(theta)
        coords.push([center[0] + x, center[1] + y])
      }
      coords.push(coords[0]) // Close the circle

      return coords
    }

    // Create multiple rings: 25%, 50%, 75%, 100% of radius
    const rings = [
      { distance: radiusInKm * 0.25, opacity: 0.15 },
      { distance: radiusInKm * 0.5, opacity: 0.12 },
      { distance: radiusInKm * 0.75, opacity: 0.09 },
      { distance: radiusInKm, opacity: 0.06 },
    ]

    const features = rings.map((ring, idx) => ({
      type: 'Feature' as const,
      properties: { opacity: ring.opacity },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [createCircle(ring.distance)],
      },
    }))

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features,
      },
    })

    map.current.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': ['get', 'opacity'],
      },
    })

    // Add ring borders
    map.current.addLayer({
      id: `${layerId}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#3b82f6',
        'line-width': 1,
        'line-opacity': 0.3,
      },
    })
  }, [mapLoaded, props.toggles.commute, props.selectedBusinessId, businesses, props.radiusKm])

  // Handle external route query changes (when user clicks "Set" button)
  // Also handle clearing the route when query is empty
  useEffect(() => {
    if (!mapLoaded) return

    // If route query is cleared, remove route from map
    if (!props.externalRouteQuery || props.externalRouteQuery.trim() === '') {
      const routeSourceId = 'route-source'
      const routeLayerId = 'route-layer'
      
      // Remove route layer and source
      if (map.current.getLayer(routeLayerId)) {
        map.current.removeLayer(routeLayerId)
      }
      if (map.current.getSource(routeSourceId)) {
        map.current.removeSource(routeSourceId)
      }
      
      // Remove Point B marker
      if (pointBMarkerRef.current) {
        pointBMarkerRef.current.remove()
        pointBMarkerRef.current = null
      }
      
      // Clear route state
      props.onRouteStateChange({ busy: false, error: null, to: null, drivingMins: null, cyclingMins: null })
      return
    }

    if (!props.selectedBusinessId) return

    const selectedBiz = businesses.find(b => {
      const bizId = String(b.properties.id)
      const selectId = String(props.selectedBusinessId)
      return bizId === selectId || Number(bizId) === Number(selectId)
    })
    if (!selectedBiz) return

    // Geocode the route query to get Point B
    const geocodePointB = async () => {
      const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!MAPBOX_TOKEN) return

      props.onRouteStateChange({ busy: true })

      try {
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(props.externalRouteQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
        const geocodeRes = await fetch(geocodeUrl)
        const geocodeData = await geocodeRes.json()

        if (!geocodeData.features || geocodeData.features.length === 0) {
          props.onRouteStateChange({ busy: false, error: 'Location not found' })
          return
        }

        const pointB = geocodeData.features[0]
        const [lngB, latB] = pointB.center
        const pointBLabel = pointB.place_name

        // Calculate routes using Mapbox Directions API
        const pointA = selectedBiz.geometry.coordinates

        // Calculate driving route
        const drivingUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pointA[0]},${pointA[1]};${lngB},${latB}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        const drivingRes = await fetch(drivingUrl)
        const drivingData = await drivingRes.json()

        // Calculate cycling route
        const cyclingUrl = `https://api.mapbox.com/directions/v5/mapbox/cycling/${pointA[0]},${pointA[1]};${lngB},${latB}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        const cyclingRes = await fetch(cyclingUrl)
        const cyclingData = await cyclingRes.json()

        const drivingMins = drivingData.routes?.[0]?.duration ? Math.round(drivingData.routes[0].duration / 60) : undefined
        const cyclingMins = cyclingData.routes?.[0]?.duration ? Math.round(cyclingData.routes[0].duration / 60) : undefined

        // Draw the driving route on the map
        if (drivingData.routes?.[0]?.geometry) {
          const routeSourceId = 'route-source'
          const routeLayerId = 'route-layer'

          // Remove existing route
          if (map.current.getLayer(routeLayerId)) {
            map.current.removeLayer(routeLayerId)
          }
          if (map.current.getSource(routeSourceId)) {
            map.current.removeSource(routeSourceId)
          }

          map.current.addSource(routeSourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: drivingData.routes[0].geometry,
            },
          })

          map.current.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeSourceId,
            paint: {
              'line-color': '#10b981',
              'line-width': 4,
              'line-opacity': 0.8,
            },
          })
        }

        // Create or update draggable Point B marker
        if (pointBMarkerRef.current) {
          pointBMarkerRef.current.remove()
        }

        const markerEl = document.createElement('div')
        markerEl.style.width = '32px'
        markerEl.style.height = '32px'
        markerEl.style.borderRadius = '50%'
        markerEl.style.backgroundColor = '#ef4444'
        markerEl.style.border = '3px solid white'
        markerEl.style.cursor = 'grab'
        markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)'

        const pointBMarker = new mapboxgl.Marker(markerEl, { draggable: true })
          .setLngLat([lngB, latB])
          .addTo(map.current)

        // Recalculate route when marker is dragged
        pointBMarker.on('dragend', async () => {
          const newLngLat = pointBMarker.getLngLat()

          try {
            const selectedBiz = businesses.find(b => b.properties.id === props.selectedBusinessId)
            if (!selectedBiz) return

            const pointA = selectedBiz.geometry.coordinates

            // Recalculate driving route
            const drivingUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pointA[0]},${pointA[1]};${newLngLat.lng},${newLngLat.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
            const drivingRes = await fetch(drivingUrl)
            const drivingData = await drivingRes.json()

            // Recalculate cycling route
            const cyclingUrl = `https://api.mapbox.com/directions/v5/mapbox/cycling/${pointA[0]},${pointA[1]};${newLngLat.lng},${newLngLat.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
            const cyclingRes = await fetch(cyclingUrl)
            const cyclingData = await cyclingRes.json()

            const newDrivingMins = drivingData.routes?.[0]?.duration ? Math.round(drivingData.routes[0].duration / 60) : undefined
            const newCyclingMins = cyclingData.routes?.[0]?.duration ? Math.round(cyclingData.routes[0].duration / 60) : undefined

            // Update route on map
            if (drivingData.routes?.[0]?.geometry) {
              const routeSourceId = 'route-source'
              const source = map.current.getSource(routeSourceId)
              if (source) {
                source.setData({
                  type: 'Feature',
                  properties: {},
                  geometry: drivingData.routes[0].geometry,
                })
              }
            }

            // Reverse geocode to get location name
            const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${newLngLat.lng},${newLngLat.lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
            const reverseRes = await fetch(reverseGeocodeUrl)
            const reverseData = await reverseRes.json()
            const newLabel = reverseData.features?.[0]?.place_name || `${newLngLat.lat.toFixed(4)}, ${newLngLat.lng.toFixed(4)}`

            props.onRouteStateChange({
              to: { label: newLabel, lat: newLngLat.lat, lng: newLngLat.lng },
              drivingMins: newDrivingMins,
              cyclingMins: newCyclingMins,
              busy: false,
            })
          } catch (error) {
            console.error('Route recalculation error:', error)
          }
        })

        pointBMarkerRef.current = pointBMarker

        props.onRouteStateChange({
          to: { label: pointBLabel, lat: latB, lng: lngB },
          drivingMins,
          cyclingMins,
          busy: false,
        })
      } catch (error) {
        console.error('Route calculation error:', error)
        props.onRouteStateChange({ busy: false, error: 'Failed to calculate route' })
      }
    }

    geocodePointB()
  }, [props.externalRouteQuery, props.selectedBusinessId, businesses, mapLoaded])

  // Real estate overlay - Heatmap layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const heatmapSourceId = 'real-estate-heatmap-source'
    const heatmapLayerId = 'real-estate-heatmap-layer'

    // Remove existing layers and sources
    if (map.current.getLayer(heatmapLayerId)) {
      map.current.removeLayer(heatmapLayerId)
    }
    if (map.current.getSource(heatmapSourceId)) {
      map.current.removeSource(heatmapSourceId)
    }

    // Only show if property toggle is enabled
    if (!props.toggles.property) return

    // Generate sample real estate data points (in production, this would come from an API)
    // For now, create a grid of sample data around the map center
    const bounds = map.current.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    const samplePoints = []
    const gridSize = 20

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lng = sw.lng + (ne.lng - sw.lng) * (i / gridSize)
        const lat = sw.lat + (ne.lat - sw.lat) * (j / gridSize)

        // Generate random price (simulating rental prices from $300-$1000/week)
        const price = 300 + Math.random() * 700

        samplePoints.push({
          type: 'Feature' as const,
          properties: {
            price: price,
            intensity: price / 1000, // Normalize to 0-1 for heatmap
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat],
          },
        })
      }
    }

    map.current.addSource(heatmapSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: samplePoints,
      },
    })

    map.current.addLayer({
      id: heatmapLayerId,
      type: 'heatmap',
      source: heatmapSourceId,
      paint: {
        // Increase weight as price increases
        'heatmap-weight': ['get', 'intensity'],
        // Increase intensity as zoom level increases
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
        // Color ramp for heatmap: blue (low) -> yellow -> red (high)
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33, 102, 172, 0)',
          0.2, 'rgb(103, 169, 207)',
          0.4, 'rgb(209, 229, 240)',
          0.6, 'rgb(253, 219, 199)',
          0.8, 'rgb(239, 138, 98)',
          1, 'rgb(178, 24, 43)'
        ],
        // Adjust the heatmap radius by zoom level
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 15, 0.5],
      },
    })
  }, [mapLoaded, props.toggles.property])

  return (
    <div className="w-full h-full relative bg-gray-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}
