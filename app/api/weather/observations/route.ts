import { NextRequest, NextResponse } from 'next/server'
import type { StationObservation } from '@/lib/types'
import { ICELAND_LOCATIONS } from '@/lib/iceland-locations'

// Try apis.is first, fall back to Open-Meteo current weather per location
async function fetchApisIs(stations: string): Promise<StationObservation[] | null> {
  const url = `https://apis.is/weather/observations/en?stations=${stations}&time=1h&anytime=1`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`apis.is HTTP ${res.status}`)
    const data = await res.json()
    const results = data?.results
    if (!Array.isArray(results) || results.length === 0) return null

    return results.map((r: Record<string, unknown>) => ({
      id: String(r.id ?? r.Id ?? ''),
      name: String(r.name ?? r.Name ?? r.nafn ?? ''),
      lat: r.lat ? parseFloat(String(r.lat)) : undefined,
      lon: r.lon ? parseFloat(String(r.lon)) : undefined,
      temp: r.T !== undefined ? parseFloat(String(r.T)) : null,
      windSpeed: r.F !== undefined ? parseFloat(String(r.F)) : null,
      windDir: r.D !== undefined ? parseFloat(String(r.D)) : null,
      humidity: r.RH !== undefined ? parseFloat(String(r.RH)) : null,
      pressure: r.P !== undefined ? parseFloat(String(r.P)) : null,
      visibility: r.V !== undefined ? parseFloat(String(r.V)) : null,
      snowDepth: r.SND !== undefined ? parseFloat(String(r.SND)) : null,
    }))
  } catch (err) {
    console.warn('apis.is observations failed:', err instanceof Error ? err.message : err)
    return null
  }
}

async function fetchOpenMeteoCurrentForLocation(loc: typeof ICELAND_LOCATIONS[number]): Promise<StationObservation> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure,weather_code` +
    `&timezone=Atlantic%2FReykjavik`

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
  const data = await res.json()
  const c = data?.current ?? {}
  return {
    id: loc.stationId ?? loc.name,
    name: loc.name,
    lat: loc.lat,
    lon: loc.lon,
    temp: c.temperature_2m ?? null,
    windSpeed: c.wind_speed_10m ?? null,
    windDir: c.wind_direction_10m ?? null,
    humidity: c.relative_humidity_2m ?? null,
    pressure: c.surface_pressure ?? null,
    visibility: null,
    snowDepth: null,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const stationsParam = searchParams.get('stations') ?? '1'

  // Try apis.is first
  const apisResult = await fetchApisIs(stationsParam)
  if (apisResult && apisResult.length > 0) {
    console.log(`Observations: ${apisResult.length} results from apis.is`)
    return NextResponse.json(apisResult)
  }

  // Fall back to Open-Meteo current weather for each known station location
  console.log('Observations: apis.is empty/failed, falling back to Open-Meteo')
  const stationIds = new Set(stationsParam.split(',').map((s) => s.trim()))
  const locations = ICELAND_LOCATIONS.filter(
    (l) => l.stationId && stationIds.has(l.stationId)
  )

  // Fetch a few locations in parallel (limit to avoid rate limiting)
  const subset = locations.slice(0, 6)
  const results = await Promise.allSettled(
    subset.map((loc) => fetchOpenMeteoCurrentForLocation(loc))
  )

  const observations: StationObservation[] = results
    .filter((r): r is PromiseFulfilledResult<StationObservation> => r.status === 'fulfilled')
    .map((r) => r.value)

  console.log(`Observations: ${observations.length} results from Open-Meteo fallback`)
  return NextResponse.json(observations)
}
