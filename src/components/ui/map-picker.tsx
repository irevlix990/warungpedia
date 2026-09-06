'use client'

import * as React from 'react'
import { MapPin, Crosshair, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import type { Map as LeafletMap, Marker, LeafletMouseEvent } from 'leaflet'

interface MapPickerProps {
  /** Hidden input name for latitude. */
  latName: string
  /** Hidden input name for longitude. */
  lngName: string
  /** Initial coordinates. */
  value?: { lat: number | null; lng: number | null }
  /** Called when user picks a location. */
  onChange?: (lat: number, lng: number) => void
  className?: string
}

/**
 * Interactive OpenStreetMap picker — click the map to pin a location,
 * or use the "Locate me" button to auto-detect.
 *
 * Uses Leaflet loaded dynamically to avoid SSR issues.
 */
export function MapPicker({
  latName,
  lngName,
  value,
  onChange,
  className,
}: MapPickerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<LeafletMap | null>(null)
  const markerRef = React.useRef<Marker | null>(null)
  const [lat, setLat] = React.useState<number | null>(value?.lat ?? null)
  const [lng, setLng] = React.useState<number | null>(value?.lng ?? null)
  const [loading, setLoading] = React.useState(true)
  const [detecting, setDetecting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const initializedRef = React.useRef(false)

  // Default center: Jakarta
  const DEFAULT_LAT = -6.2088
  const DEFAULT_LNG = 106.8456

  React.useEffect(() => {
    if (initializedRef.current || !containerRef.current) return
    initializedRef.current = true

    let disposed = false

    const init = async () => {
      try {
        const L = (await import('leaflet')).default

        // Inject Leaflet CSS if not already present
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        if (disposed || !containerRef.current) return

        const center: [number, number] =
          lat !== null && lng !== null ? [lat, lng] : [DEFAULT_LAT, DEFAULT_LNG]

        const map = L.map(containerRef.current, {
          center,
          zoom: lat !== null ? 15 : 11,
          zoomControl: false,
        })
        mapRef.current = map

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        const placeMarker = (newLat: number, newLng: number) => {
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng])
          } else {
            markerRef.current = L.marker([newLat, newLng], {
              draggable: true,
            }).addTo(map)
            markerRef.current.on('dragend', () => {
              const pos = markerRef.current!.getLatLng()
              setLat(pos.lat)
              setLng(pos.lng)
              onChange?.(pos.lat, pos.lng)
            })
          }
          setLat(newLat)
          setLng(newLng)
          onChange?.(newLat, newLng)
        }

        if (lat !== null && lng !== null) {
          placeMarker(lat, lng)
        }

        map.on('click', (e: LeafletMouseEvent) => {
          placeMarker(e.latlng.lat, e.latlng.lng)
        })

        setLoading(false)
      } catch {
        if (!disposed) {
          setError('Gagal memuat peta.')
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      disposed = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung browser ini.')
      return
    }
    setDetecting(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude
        const newLng = pos.coords.longitude
        setLat(newLat)
        setLng(newLng)
        setDetecting(false)

        const map = mapRef.current
        if (map) {
          map.setView([newLat, newLng], 16)
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng])
          } else {
            const L = (window as unknown as { L: typeof import('leaflet') }).L
            markerRef.current = L.marker([newLat, newLng], {
              draggable: true,
            }).addTo(map)
            markerRef.current.on('dragend', () => {
              const pos = markerRef.current!.getLatLng()
              setLat(pos.lat)
              setLng(pos.lng)
              onChange?.(pos.lat, pos.lng)
            })
          }
        }
        onChange?.(newLat, newLng)
      },
      () => {
        setDetecting(false)
        setError('Tidak dapat mendeteksi lokasi. Silakan klik pada peta.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          <MapPin className="mr-1 inline-block h-4 w-4 text-brand-600" />
          Titik Lokasi
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLocate}
          disabled={detecting || loading}
          className="h-8 text-xs"
        >
          {detecting ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Crosshair className="mr-1 h-3 w-3" />
          )}
          Lokasi Saya
        </Button>
      </div>

      <div
        ref={containerRef}
        className="relative h-64 w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700"
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-danger-600">{error}</p>
      )}

      {lat !== null && lng !== null && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}

      <input type="hidden" name={latName} value={lat !== null ? String(lat) : ''} />
      <input type="hidden" name={lngName} value={lng !== null ? String(lng) : ''} />

      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        Klik pada peta untuk menandai lokasi, atau geser marker untuk menyesuaikan.
      </p>
    </div>
  )
}
