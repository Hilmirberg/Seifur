'use client'

import useSWR from 'swr'
import type { Waypoint, WeatherForecast, SunTimes, Camera, RoadCondition } from '@/lib/types'
import { CONDITION_COLORS } from '@/lib/road-condition-colors'
import type { RoadStatus } from '@/lib/types'
import CameraModal from '@/components/cameras/CameraModal'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface RouteConditionCardProps {
  waypoint: Waypoint
  nearbyCameras: Camera[]
  nearbyRoads: RoadCondition[]
}

export default function RouteConditionCard({ waypoint, nearbyCameras, nearbyRoads }: RouteConditionCardProps) {
  const [expandedCam, setExpandedCam] = useState<Camera | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const { data: forecast } = useSWR<WeatherForecast>(
    `/api/weather/forecast?lat=${waypoint.lat}&lon=${waypoint.lon}&days=1`,
    fetcher
  )
  const { data: sun } = useSWR<SunTimes>(
    `/api/sun?lat=${waypoint.lat}&lon=${waypoint.lon}&date=${today}`,
    fetcher
  )

  const currentTemp = forecast?.hourly?.temperature_2m?.[0]
  const currentWind = forecast?.hourly?.windspeed_10m?.[0]
  const currentCode = forecast?.hourly?.weathercode?.[0]

  const froadsOnRoute = nearbyRoads.filter((r) => r.isFRoad)
  const closedRoads = nearbyRoads.filter((r) => r.conditionLabel === 'closed')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{waypoint.label}</h3>
        <span className="text-xs text-gray-400">{waypoint.lat.toFixed(3)}, {waypoint.lon.toFixed(3)}</span>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Weather */}
        <div className="space-y-0.5">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Weather</div>
          {forecast ? (
            <>
              <div className="text-2xl font-bold text-gray-900">
                {currentTemp != null ? `${Math.round(currentTemp)}°C` : '—'}
              </div>
              <div className="text-xs text-gray-500">
                Wind: {currentWind != null ? `${Math.round(currentWind)} m/s` : '—'}
              </div>
              <div className="text-xs text-gray-500">Code: {currentCode ?? '—'}</div>
            </>
          ) : (
            <div className="text-xs text-gray-400 animate-pulse">Loading…</div>
          )}
        </div>

        {/* Sunrise/Sunset */}
        <div className="space-y-0.5">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Daylight</div>
          {sun ? (
            <>
              <div className="text-sm font-medium">🌅 {sun.sunrise}</div>
              <div className="text-sm font-medium">🌇 {sun.sunset}</div>
              <div className="text-xs text-gray-500">{sun.dayLength}</div>
            </>
          ) : (
            <div className="text-xs text-gray-400 animate-pulse">Loading…</div>
          )}
        </div>

        {/* Road conditions */}
        <div className="space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Roads near here</div>
          {closedRoads.length > 0 && (
            <div className="text-xs font-semibold text-red-600">
              ⚠️ {closedRoads.length} section(s) closed
            </div>
          )}
          {froadsOnRoute.length > 0 && (
            <div className="text-xs text-orange-600 font-medium">
              ⛰️ F-road: 4WD required
            </div>
          )}
          {nearbyRoads.slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: CONDITION_COLORS[r.conditionLabel as RoadStatus] ?? '#9ca3af' }}
              />
              <span className="text-xs truncate">{r.roadNumber || r.description}</span>
            </div>
          ))}
          {nearbyRoads.length === 0 && <span className="text-xs text-gray-400">No data</span>}
        </div>

        {/* Cameras */}
        <div className="space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Cameras ({nearbyCameras.length})</div>
          <div className="flex flex-wrap gap-1">
            {nearbyCameras.slice(0, 4).map((cam) => (
              <button
                key={cam.id}
                onClick={() => setExpandedCam(cam)}
                className="relative group"
                title={cam.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cam.imageUrl}
                  alt={cam.name}
                  className="w-16 h-12 object-cover rounded border border-gray-200 hover:border-blue-400 transition-colors"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {expandedCam && <CameraModal camera={expandedCam} onClose={() => setExpandedCam(null)} />}
    </div>
  )
}
