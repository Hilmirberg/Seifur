import { NextRequest, NextResponse } from 'next/server'
import type { GeocodeResult } from '@/lib/types'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=is`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Seifur/1.0 (personal Iceland travel app)',
        Accept: 'application/json',
      },
      next: { revalidate: 86400 },
    })
    const data = await res.json()

    const results: GeocodeResult[] = (data ?? []).map((r: Record<string, unknown>) => ({
      display_name: String(r.display_name ?? ''),
      lat: parseFloat(String(r.lat)),
      lon: parseFloat(String(r.lon)),
    }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
