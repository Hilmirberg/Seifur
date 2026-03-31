import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'
import { isFRoad } from '@/lib/froad-list'
import { codeToStatus } from '@/lib/road-condition-colors'
import type { RoadCondition } from '@/lib/types'

const URL = 'https://gagnaveita.vegagerdin.is/api/faerd2017_1'
let cache: { data: RoadCondition[]; fetchedAt: number } | null = null
const CACHE_MS = 15 * 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  try {
    const res = await fetch(URL, { next: { revalidate: 900 } })
    const xml = await res.text()
    const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false })

    const items: RoadCondition[] = []

    // Navigate the XML structure (explore at runtime if schema differs)
    const root = parsed?.ArrayOfFaerd2017 ?? parsed?.root ?? parsed
    const entries = root?.Faerd2017 ?? root?.faerd ?? []
    const list = Array.isArray(entries) ? entries : [entries]

    for (const item of list) {
      if (!item) continue
      const id = item.IdButur ?? item.id ?? ''
      const roadNumber = item.VegNr ?? item.RoadNumber ?? item.VegHeiti ?? ''
      const description = item.Heiti ?? item.Description ?? item.VegHeiti ?? ''
      const conditionCode = Number(item.Ferd ?? item.ConditionCode ?? item.Faerd ?? 0)
      const status = codeToStatus(conditionCode)
      const closureType = item.Lokun ?? item.Closure ?? null
      const region = item.Umdaemi ?? item.Region ?? ''

      // Parse coordinates if present
      const coords: [number, number][] = []
      const latStr = item.Lat ?? item.Y ?? ''
      const lonStr = item.Lon ?? item.X ?? ''
      if (latStr && lonStr) {
        coords.push([parseFloat(latStr), parseFloat(lonStr)])
      }

      items.push({
        id: String(id),
        roadNumber: String(roadNumber),
        description: String(description),
        conditionCode,
        conditionLabel: status,
        closureType: closureType ? String(closureType) : null,
        isFRoad: isFRoad(String(roadNumber)),
        region: String(region),
        coordinates: coords,
        updatedAt: new Date().toISOString(),
      })
    }

    cache = { data: items, fetchedAt: Date.now() }
    return NextResponse.json(items)
  } catch (err) {
    console.error('roads API error:', err)
    if (cache) return NextResponse.json(cache.data) // serve stale on error
    return NextResponse.json({ error: 'Failed to fetch road conditions' }, { status: 502 })
  }
}
