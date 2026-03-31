import { NextResponse } from 'next/server'
import type { AvalancheWarning } from '@/lib/types'

let cache: { data: AvalancheWarning[]; fetchedAt: number } | null = null
const CACHE_MS = 60 * 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  try {
    const res = await fetch('https://en.vedur.is/avalanches/forecast/', {
      headers: { 'User-Agent': 'Seifur/1.0 (personal Iceland travel app)' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()

    // Parse avalanche warning cards from vedur.is HTML
    const warnings: AvalancheWarning[] = []

    // Match patterns like: region name + danger level
    // vedur.is uses structured data with class="avalanche-forecast" type sections
    const regionMatches = html.matchAll(
      /<(?:h[23]|div)[^>]*class="[^"]*(?:region|title)[^"]*"[^>]*>([^<]+)<\/(?:h[23]|div)>/gi
    )
    const levelMatches = html.matchAll(
      /danger[- ]?level[^"]*"[^>]*>[\s\S]*?(\d)/gi
    )

    const regions = Array.from(regionMatches).map((m) => m[1].trim())
    const levels = Array.from(levelMatches).map((m) => parseInt(m[1]))

    for (let i = 0; i < Math.max(regions.length, levels.length); i++) {
      if (regions[i] || levels[i]) {
        warnings.push({
          region: regions[i] ?? 'Iceland',
          level: levels[i] ?? 1,
          description: `Avalanche danger level ${levels[i] ?? 1}`,
          validUntil: '',
        })
      }
    }

    // Fallback: try to find any level indicators
    if (warnings.length === 0) {
      const dangerMatch = html.match(/danger level[^\d]*(\d)/i)
      if (dangerMatch) {
        warnings.push({
          region: 'Iceland',
          level: parseInt(dangerMatch[1]),
          description: `Current avalanche danger level: ${dangerMatch[1]}`,
          validUntil: '',
        })
      }
    }

    cache = { data: warnings, fetchedAt: Date.now() }
    return NextResponse.json(warnings)
  } catch (err) {
    console.error('Avalanche fetch error:', err)
    if (cache) return NextResponse.json(cache.data)
    return NextResponse.json([])
  }
}
