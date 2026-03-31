import { NextRequest, NextResponse } from 'next/server'
import { geoJsonToLatLon } from '@/lib/route-utils'

export async function GET(req: NextRequest) {
  const waypointsParam = req.nextUrl.searchParams.get('waypoints')
  if (!waypointsParam) {
    return NextResponse.json({ error: 'waypoints required' }, { status: 400 })
  }

  // Format: "lat1,lon1;lat2,lon2;..." → OSRM needs "lon,lat;lon,lat"
  const points = waypointsParam.split(';').map((p) => {
    const [lat, lon] = p.split(',').map(Number)
    return `${lon},${lat}`
  })

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${points.join(';')}?overview=full&geometries=geojson`

  try {
    const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(10000) })
    const data = await res.json()

    if (data.code !== 'Ok' || !data.routes?.[0]) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 })
    }

    const route = data.routes[0]
    const geojsonCoords: number[][] = route.geometry?.coordinates ?? []
    const latLonCoords = geoJsonToLatLon(geojsonCoords)

    return NextResponse.json({
      coordinates: latLonCoords,
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
    })
  } catch {
    return NextResponse.json({ error: 'Routing failed' }, { status: 502 })
  }
}
