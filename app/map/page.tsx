'use client'

import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { useState } from 'react'
import CameraModal from '@/components/cameras/CameraModal'
import type { RoadCondition, Camera, StationObservation, AvalancheWarning } from '@/lib/types'
import { ICELAND_LOCATIONS } from '@/lib/iceland-locations'

const IcelandMap = dynamic(() => import('@/components/map/IcelandMap'), { ssr: false })

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MapPage() {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)

  const { data: roads = [] } = useSWR<RoadCondition[]>('/api/roads', fetcher, { refreshInterval: 900_000 })
  const { data: cameras = [] } = useSWR<Camera[]>('/api/cameras', fetcher, { refreshInterval: 1800_000 })
  const { data: avalanche = [] } = useSWR<AvalancheWarning[]>('/api/avalanche', fetcher, { refreshInterval: 3600_000 })

  // Fetch observations for a handful of key stations
  const stationIds = ICELAND_LOCATIONS.filter((l) => l.stationId).map((l) => l.stationId).join(',')
  const { data: observations = [] } = useSWR<StationObservation[]>(
    `/api/weather/observations?stations=${stationIds}`,
    fetcher,
    { refreshInterval: 3600_000 }
  )

  return (
    <div className="relative">
      <IcelandMap
        roads={roads}
        cameras={cameras}
        observations={observations}
        avalanche={avalanche}
        onCameraClick={setSelectedCamera}
        className="map-container"
      />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 text-xs space-y-1.5 z-[400]">
        <div className="font-semibold text-gray-700 mb-1">Road conditions</div>
        {[
          ['#22c55e', 'Open'],
          ['#eab308', 'Slippery'],
          ['#f97316', 'Difficult'],
          ['#ef4444', 'Closed'],
          ['#93c5fd', 'Snow-covered'],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-6 h-1.5 rounded" style={{ background: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t">
          <div className="w-6 h-1.5 rounded border border-dashed border-gray-400" style={{ background: '#f97316' }} />
          <span className="text-gray-600">F-road (4WD)</span>
        </div>
      </div>

      {/* Loading hint */}
      {!roads.length && (
        <div className="absolute bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow text-sm text-gray-600 z-[400]">
          Loading road conditions…
        </div>
      )}

      {selectedCamera && (
        <CameraModal camera={selectedCamera} onClose={() => setSelectedCamera(null)} />
      )}
    </div>
  )
}
