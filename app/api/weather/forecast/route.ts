import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = searchParams.get('lat') ?? '64.1355'
  const lon = searchParams.get('lon') ?? '-21.8954'
  const days = Math.min(Number(searchParams.get('days') ?? '7'), 16)

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode,sunrise,sunset` +
    `&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation,weathercode,snow_depth` +
    `&forecast_days=${days}` +
    `&timezone=Atlantic%2FReykjavik`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()
    return NextResponse.json({ lat: parseFloat(lat), lon: parseFloat(lon), ...data })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch forecast' }, { status: 502 })
  }
}
