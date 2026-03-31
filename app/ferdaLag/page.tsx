'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect, useRef } from 'react'
import useSWR from 'swr'
import WaypointInput from '@/components/ferdaLag/WaypointInput'
import RouteConditionCard from '@/components/ferdaLag/RouteConditionCard'
import type { Waypoint, Camera, RoadCondition, FuelStation, SavedRoute } from '@/lib/types'
import { camerasNearRoute, roadConditionsNearRoute, routeBbox } from '@/lib/route-utils'
import { savedRoutesGet, savedRoutePut, savedRouteDelete } from '@/lib/offline-cache'

const IcelandMap = dynamic(() => import('@/components/map/IcelandMap'), { ssr: false })

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface RouteResult {
  coordinates: [number, number][]
  distanceKm: number
  durationMin: number
}

export default function FerdaLagPage() {
  const [from, setFrom] = useState<Waypoint | null>(null)
  const [to, setTo] = useState<Waypoint | null>(null)
  const [stops, setStops] = useState<(Waypoint | null)[]>([])
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [planning, setPlanning] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [livePosition, setLivePosition] = useState<[number, number] | null>(null)
  const [routeName, setRouteName] = useState('')
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])
  const [fuelStations, setFuelStations] = useState<FuelStation[]>([])
  const watchIdRef = useRef<number | null>(null)

  const { data: camerasData } = useSWR<Camera[]>('/api/cameras', fetcher)
  const { data: roadsData } = useSWR<RoadCondition[]>('/api/roads', fetcher)
  const cameras = Array.isArray(camerasData) ? camerasData : []
  const roads = Array.isArray(roadsData) ? roadsData : []

  // Load saved routes on mount
  useEffect(() => {
    savedRoutesGet().then((r) => setSavedRoutes(r as SavedRoute[]))
  }, [])

  // GPS live tracking
  useEffect(() => {
    if (!from) return
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setLivePosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30_000 }
    )
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [from])

  const requestGps = useCallback(() => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFrom({ label: 'My location', lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => {
        alert('Could not get your location. Please enable location access.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  async function planRoute() {
    const allWaypoints = [from, ...stops.filter(Boolean), to].filter(Boolean) as Waypoint[]
    if (allWaypoints.length < 2) return

    setPlanning(true)
    try {
      const waypointsParam = allWaypoints.map((w) => `${w.lat},${w.lon}`).join(';')
      const res = await fetch(`/api/route?waypoints=${waypointsParam}`)
      const data: RouteResult = await res.json()
      setRoute(data)

      // Fetch fuel stations for route bounding box
      const bbox = routeBbox(data.coordinates)
      const fuelRes = await fetch(`/api/fuel?bbox=${bbox}`)
      setFuelStations(await fuelRes.json())
    } finally {
      setPlanning(false)
    }
  }

  async function saveRoute() {
    const allWaypoints = [from, ...stops.filter(Boolean), to].filter(Boolean) as Waypoint[]
    if (allWaypoints.length < 2 || !routeName.trim()) return

    const sr: SavedRoute = {
      id: Date.now().toString(),
      name: routeName.trim(),
      from: allWaypoints[0],
      stops: allWaypoints.slice(1, -1),
      to: allWaypoints[allWaypoints.length - 1],
      savedAt: new Date().toISOString(),
    }
    await savedRoutePut(sr)
    setSavedRoutes((prev) => [...prev, sr])
    setRouteName('')
  }

  function loadSavedRoute(sr: SavedRoute) {
    setFrom(sr.from)
    setTo(sr.to)
    setStops(sr.stops)
    setRoute(null)
  }

  async function deleteSavedRoute(id: string) {
    await savedRouteDelete(id)
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id))
  }

  const allWaypoints = [from, ...stops.filter(Boolean), to].filter(Boolean) as Waypoint[]
  const nearbyCameras = route ? camerasNearRoute(cameras, route.coordinates) : []
  const nearbyRoads = route ? roadConditionsNearRoute(roads, route.coordinates) : []

  return (
    <div className="min-h-screen">
      <div className="md:flex md:h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="md:w-96 md:overflow-y-auto md:border-r border-gray-200 bg-white">
          <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold text-gray-900">Ferðalag — Plan Your Journey</h1>

            {/* Saved routes dropdown */}
            {savedRoutes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Saved routes</label>
                <div className="space-y-1">
                  {savedRoutes.map((sr) => (
                    <div key={sr.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <button
                        className="flex-1 text-left text-sm text-blue-600 hover:underline truncate"
                        onClick={() => loadSavedRoute(sr)}
                      >
                        {sr.name}
                      </button>
                      <button
                        onClick={() => deleteSavedRoute(sr.id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                        title="Delete"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* From */}
            <WaypointInput
              label="From"
              value={from}
              onChange={setFrom}
              showGps
              onGps={requestGps}
              loading={gpsLoading}
            />

            {/* Stops */}
            {stops.map((stop, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <WaypointInput
                    label={`Stop ${i + 1}`}
                    value={stop}
                    onChange={(wp) => {
                      const next = [...stops]
                      next[i] = wp
                      setStops(next)
                    }}
                  />
                </div>
                <button
                  onClick={() => setStops((prev) => prev.filter((_, j) => j !== i))}
                  className="mb-[1px] px-2 py-2.5 text-gray-400 hover:text-red-500 border border-gray-300 rounded-lg"
                  title="Remove stop"
                >✕</button>
              </div>
            ))}

            <button
              onClick={() => setStops((prev) => [...prev, null])}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              + Add stop
            </button>

            {/* To */}
            <WaypointInput label="To" value={to} onChange={setTo} />

            {/* Plan button */}
            <button
              onClick={planRoute}
              disabled={!from || !to || planning}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {planning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Planning…
                </span>
              ) : 'Plan route'}
            </button>

            {/* Route summary */}
            {route && (
              <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-semibold">{route.distanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">
                    {Math.floor(route.durationMin / 60)}h {route.durationMin % 60}m
                  </span>
                </div>
              </div>
            )}

            {/* Save route */}
            {route && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Route name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => { if (e.key === 'Enter') saveRoute() }}
                />
                <button
                  onClick={saveRoute}
                  disabled={!routeName.trim()}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Save route
                </button>
              </div>
            )}
          </div>

          {/* Conditions along route */}
          {route && allWaypoints.length > 0 && (
            <div className="p-4 pt-0 space-y-3">
              <h2 className="font-semibold text-gray-700 text-sm">Conditions along route</h2>
              {allWaypoints.map((wp, i) => (
                <RouteConditionCard
                  key={i}
                  waypoint={wp}
                  nearbyCameras={nearbyCameras}
                  nearbyRoads={nearbyRoads}
                />
              ))}
            </div>
          )}

          {/* Fuel stations */}
          {fuelStations.length > 0 && (
            <div className="p-4 pt-0">
              <h2 className="font-semibold text-gray-700 text-sm mb-2">Fuel stations</h2>
              <div className="space-y-1">
                {fuelStations.slice(0, 8).map((f) => (
                  <div key={f.id} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium truncate">⛽ {f.name}</span>
                    <span className="text-gray-500 flex-shrink-0 ml-2">{f.distanceFromRouteKm} km</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 hidden md:block">
          <IcelandMap
            roads={nearbyRoads}
            cameras={nearbyCameras}
            routeCoords={route?.coordinates}
            livePosition={livePosition}
            className="h-full"
          />
        </div>
      </div>

      {/* Mobile map toggle */}
      {route && (
        <div className="md:hidden p-4">
          <details className="border rounded-xl overflow-hidden">
            <summary className="px-4 py-3 bg-gray-50 cursor-pointer font-medium text-sm">Show map</summary>
            <IcelandMap
              roads={nearbyRoads}
              cameras={nearbyCameras}
              routeCoords={route.coordinates}
              livePosition={livePosition}
              className="h-64"
            />
          </details>
        </div>
      )}

      {/* No route placeholder */}
      {!route && !planning && (
        <div className="md:hidden p-6 text-center text-gray-400 text-sm">
          Enter origin and destination to plan your route
        </div>
      )}
    </div>
  )
}
