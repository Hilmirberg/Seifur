import { NextRequest, NextResponse } from 'next/server'
import type { SunTimes } from '@/lib/types'

function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Atlantic/Reykjavik' })
}

function dayLengthFromDayLength(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat') ?? '64.1355'
  const lon = req.nextUrl.searchParams.get('lon') ?? '-21.8954'
  const date = req.nextUrl.searchParams.get('date') ?? 'today'

  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`

  try {
    const res = await fetch(url, { next: { revalidate: 43200 } })
    const data = await res.json()

    if (data.status !== 'OK') {
      return NextResponse.json({ error: 'Failed to get sun times' }, { status: 502 })
    }

    const result: SunTimes = {
      sunrise: formatTime(data.results.sunrise),
      sunset: formatTime(data.results.sunset),
      dayLength: dayLengthFromDayLength(data.results.day_length),
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ sunrise: '--:--', sunset: '--:--', dayLength: '--' })
  }
}
