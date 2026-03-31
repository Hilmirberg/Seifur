import { NextRequest, NextResponse } from 'next/server'
import type { FuelStation } from '@/lib/types'
import { haversineKm } from '@/lib/route-utils'

export async function GET(req: NextRequest) {
  const bbox = req.nextUrl.searchParams.get('bbox') ?? '63.4,-24.5,66.5,-13.5'

  const query = `[out:json][timeout:10];node["amenity"="fuel"](${bbox});out;`
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } })
    const data = await res.json()

    const [south, west, north, east] = bbox.split(',').map(Number)
    const centerLat = (south + north) / 2
    const centerLon = (west + east) / 2

    const stations: FuelStation[] = (data?.elements ?? [])
      .filter((el: Record<string, unknown>) => el.type === 'node')
      .map((el: Record<string, unknown>) => {
        const tags = (el.tags ?? {}) as Record<string, string>
        const lat = Number(el.lat)
        const lon = Number(el.lon)
        return {
          id: String(el.id),
          name: tags.name ?? tags.brand ?? tags.operator ?? 'Fuel station',
          lat,
          lon,
          distanceFromRouteKm: Math.round(haversineKm(centerLat, centerLon, lat, lon) * 10) / 10,
        }
      })
      .sort((a: FuelStation, b: FuelStation) => a.distanceFromRouteKm - b.distanceFromRouteKm)

    return NextResponse.json(stations)
  } catch {
    return NextResponse.json([])
  }
}
