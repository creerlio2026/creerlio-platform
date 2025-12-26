'use client'

import { useEffect, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

// Dynamic import for mapbox-gl to avoid SSR issues
let mapboxgl: any = null
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl')
}

interface Marker {
  id: string | number
  lat: number
  lng: number
  title: string
  description?: string
  type: 'talent' | 'business'
}

interface SearchMapProps {
  markers: Marker[]
  className?: string
  center?: { lat: number; lng: number }
  zoom?: number
  isExpanded?: boolean
}

type MapStyle = 'dark' | 'light' | 'satellite' | 'streets'

const mapStyles: Record<MapStyle, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  streets: 'mapbox://styles/mapbox/streets-v12',
}

export default function SearchMap({ markers, className = '', center, zoom = 11, isExpanded = false }: SearchMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeStyle, setActiveStyle] = useState<MapStyle>('dark')

  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined' || !mapboxgl) return

    // Mapbox token
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiY3JlZXJsaW8iLCJhIjoiY21pY3IxZHljMXFwNTJzb2FydzR4b3F1YSJ9.Is8-GyfEdqwKKEo2cGO65g'
    
    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_TOKEN

    // Calculate center from markers if not provided
    let mapCenter: [number, number]
    if (center) {
      mapCenter = [center.lng, center.lat]
    } else if (markers.length > 0) {
      // Calculate average center from markers
      const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length
      const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length
      mapCenter = [avgLng, avgLat]
    } else {
      // Default to Sydney
      mapCenter = [151.2093, -33.8688]
    }

    // Adjust zoom based on number of markers
    let mapZoom = zoom
    if (markers.length > 1) {
      mapZoom = 10 // Zoom out for multiple markers
    } else if (markers.length === 1) {
      mapZoom = 12 // Zoom in for single marker
    }

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyles[activeStyle],
        center: mapCenter,
        zoom: mapZoom,
        attributionControl: false,
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      map.current.on('load', () => {
        setIsLoading(false)
        updateMarkers()
      })
    } else {
      // Update map style when activeStyle changes
      map.current.setStyle(mapStyles[activeStyle])
      map.current.once('style.load', () => {
        updateMarkers()
      })
    }

    // Function to update markers
    const updateMarkers = () => {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      // Add new markers
      markers.forEach((markerData) => {
        // Create custom marker element
        const el = document.createElement('div')
        el.className = 'custom-marker'
        el.style.width = '32px'
        el.style.height = '32px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = markerData.type === 'talent' ? '#3b82f6' : '#10b981'
        el.style.border = '3px solid white'
        el.style.cursor = 'pointer'
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="text-black">
              <h3 class="font-semibold text-sm mb-1">${markerData.title}</h3>
              ${markerData.description ? `<p class="text-xs text-gray-600">${markerData.description}</p>` : ''}
            </div>
          `)

        // Create and add marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([markerData.lng, markerData.lat])
          .setPopup(popup)
          .addTo(map.current)

        markersRef.current.push(marker)
      })

      // Fit bounds to show all markers if there are multiple
      if (markers.length > 1 && map.current) {
        const bounds = new mapboxgl.LngLatBounds()
        markers.forEach(m => bounds.extend([m.lng, m.lat]))
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 12
        })
      } else if (markers.length === 1 && map.current) {
        map.current.setCenter([markers[0].lng, markers[0].lat])
        map.current.setZoom(12)
      }
    }

    // Update markers when they change
    if (map.current && map.current.loaded()) {
      updateMarkers()
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove())
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [markers, center, zoom, activeStyle])

  // Resize map when expanded state changes
  useEffect(() => {
    if (map.current && isExpanded) {
      // Use requestAnimationFrame to ensure DOM has fully updated
      const frameId = requestAnimationFrame(() => {
        // Double RAF to ensure layout is complete
        requestAnimationFrame(() => {
          if (map.current) {
            map.current.resize()
          }
        })
      })
      return () => cancelAnimationFrame(frameId)
    }
  }, [isExpanded])

  // Also handle window resize events
  useEffect(() => {
    if (!map.current) return

    const handleResize = () => {
      if (map.current) {
        map.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`relative w-full h-full ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Style Tabs */}
      <div className="absolute top-4 left-4 z-20 flex gap-2 bg-slate-900/90 backdrop-blur-sm rounded-lg p-1 border border-white/10">
        {(['dark', 'light', 'satellite', 'streets'] as MapStyle[]).map((style) => (
          <button
            key={style}
            onClick={(e) => {
              e.stopPropagation()
              setActiveStyle(style)
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeStyle === style
                ? 'bg-blue-500 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {style.charAt(0).toUpperCase() + style.slice(1)}
          </button>
        ))}
      </div>

      {/* Legend */}
      {markers.length > 0 && (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-white/10" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <span className="text-slate-300">Talent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
              <span className="text-slate-300">Business</span>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg z-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full rounded-lg" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
