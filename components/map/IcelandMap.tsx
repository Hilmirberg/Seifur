'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { RoadCondition, Camera, AvalancheWarning, StationObservation } from '@/lib/types'
import { CONDITION_COLORS, CONDITION_WEIGHT } from '@/lib/road-condition-colors'
import type { RoadStatus } from '@/lib/types'
import { ICELAND_CENTER, ICELAND_DEFAULT_ZOOM } from '@/lib/iceland-locations'

// Fix Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface IcelandMapProps {
  roads?: RoadCondition[]
  cameras?: Camera[]
  observations?: StationObservation[]
  avalanche?: AvalancheWarning[]
  routeCoords?: [number, number][]
  livePosition?: [number, number] | null
  onCameraClick?: (camera: Camera) => void
  className?: string
}

export default function IcelandMap({
  roads = [],
  cameras = [],
  observations = [],
  avalanche = [],
  routeCoords,
  livePosition,
  onCameraClick,
  className = '',
}: IcelandMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<L.Layer[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: ICELAND_CENTER,
      zoom: ICELAND_DEFAULT_ZOOM,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Road condition polylines
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear existing road layers
    layersRef.current.forEach((l) => map.removeLayer(l))
    layersRef.current = []

    for (const road of roads) {
      if (!road.coordinates.length) continue
      const color = CONDITION_COLORS[road.conditionLabel as RoadStatus] ?? '#9ca3af'
      const weight = CONDITION_WEIGHT[road.conditionLabel as RoadStatus] ?? 3

      const line = L.polyline(road.coordinates, {
        color,
        weight: road.isFRoad ? weight + 1 : weight,
        opacity: 0.85,
        dashArray: road.isFRoad ? '8,4' : undefined,
      })

      line.bindPopup(
        `<b>${road.roadNumber || road.description}</b><br>
         Status: <b>${road.conditionLabel}</b>
         ${road.isFRoad ? '<br><span style="color:#f97316">⚠️ F-road — 4WD required</span>' : ''}
         ${road.closureType ? `<br><span style="color:#ef4444">CLOSED: ${road.closureType}</span>` : ''}`
      )

      line.addTo(map)
      layersRef.current.push(line)
    }
  }, [roads])

  // Camera markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const cameraIcon = L.divIcon({
      className: '',
      html: `<div style="background:#3b82f6;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)">📷</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const markers: L.Layer[] = []
    for (const cam of cameras) {
      const marker = L.marker([cam.lat, cam.lon], { icon: cameraIcon })
        .bindPopup(`<b>${cam.name}</b><br>${cam.region}`)
      if (onCameraClick) marker.on('click', () => onCameraClick(cam))
      marker.addTo(map)
      markers.push(marker)
    }

    return () => markers.forEach((m) => map.removeLayer(m))
  }, [cameras, onCameraClick])

  // Weather observation markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markers: L.Layer[] = []
    for (const obs of observations) {
      if (!obs.lat || !obs.lon) continue
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:rgba(30,64,175,0.85);color:white;border-radius:6px;padding:2px 5px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${obs.temp != null ? obs.temp + '°' : '?'} ${obs.windSpeed != null ? obs.windSpeed + 'm/s' : ''}</div>`,
        iconSize: [60, 22],
        iconAnchor: [30, 11],
      })
      const m = L.marker([obs.lat, obs.lon], { icon })
        .bindPopup(`<b>${obs.name}</b><br>Temp: ${obs.temp}°C<br>Wind: ${obs.windSpeed} m/s`)
      m.addTo(map)
      markers.push(m)
    }
    return () => markers.forEach((m) => map.removeLayer(m))
  }, [observations])

  // Route polyline
  useEffect(() => {
    const map = mapRef.current
    if (!map || !routeCoords?.length) return

    const line = L.polyline(routeCoords, { color: '#2563eb', weight: 5, opacity: 0.8 }).addTo(map)
    map.fitBounds(line.getBounds(), { padding: [40, 40] })

    return () => { map.removeLayer(line) }
  }, [routeCoords])

  // Live GPS position
  useEffect(() => {
    const map = mapRef.current
    if (!map || !livePosition) return

    const dot = L.circleMarker(livePosition, {
      radius: 10,
      color: '#1d4ed8',
      fillColor: '#3b82f6',
      fillOpacity: 1,
      weight: 3,
    }).addTo(map)

    return () => { map.removeLayer(dot) }
  }, [livePosition])

  // Avalanche region labels (simple markers)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // We can only show avalanche warnings as generic Iceland-wide info
    // without specific geometry from the scraper
    const markers: L.Layer[] = []
    for (const warn of avalanche) {
      if (warn.level >= 3) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#fbbf24;border-radius:4px;padding:2px 6px;font-size:11px;font-weight:bold;border:1px solid #f59e0b">⛰️ ${warn.region} Lvl ${warn.level}</div>`,
        })
        // Place at rough region center — would need a proper region→coords map for full accuracy
        const m = L.marker(ICELAND_CENTER, { icon })
          .bindPopup(`<b>Avalanche warning</b><br>Region: ${warn.region}<br>Level: ${warn.level}<br>${warn.description}`)
        m.addTo(map)
        markers.push(m)
      }
    }
    return () => markers.forEach((m) => map.removeLayer(m))
  }, [avalanche])

  return <div ref={containerRef} className={`w-full ${className}`} />
}
