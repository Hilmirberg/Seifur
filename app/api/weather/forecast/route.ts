import { NextRequest, NextResponse } from 'next/server'

let cache: Map<string, { data: unknown; fetchedAt: number }> = new Map()
const CACHE_MS = 60 * 60 * 1000 // 1 hour

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = searchParams.get('lat') ?? '64.1355'
  const lon = searchParams.get('lon') ?? '-21.8954'
  const days = Math.min(Number(searchParams.get('days') ?? '7'), 16)

  const cacheKey = `${lat},${lon},${days}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return NextResponse.json(cached.data)
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode,sunrise,sunset` +
    `&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation,weathercode,snow_depth` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation,relative_humidity_2m,surface_pressure` +
    `&forecast_days=${days}` +
    `&timezone=Atlantic%2FReykjavik`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
    const data = await res.json()
    const result = { lat: parseFloat(lat), lon: parseFloat(lon), ...data }
    cache.set(cacheKey, { data: result, fetchedAt: Date.now() })
    return NextResponse.json(result)
  } catch (err) {
    console.error('Forecast fetch error:', err instanceof Error ? err.message : err)
    if (cached) return NextResponse.json(cached.data)
    return NextResponse.json({ error: 'Failed to fetch forecast' }, { status: 502 })
  }
}
