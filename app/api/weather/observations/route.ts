import { NextRequest, NextResponse } from 'next/server'
import type { StationObservation } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const stations = searchParams.get('stations') ?? '1'
  const time = searchParams.get('time') ?? '1h'

  const url = `https://apis.is/weather/observations/en?stations=${stations}&time=${time}&anytime=1`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()

    const results: StationObservation[] = (data?.results ?? []).map((r: Record<string, unknown>) => ({
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

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
