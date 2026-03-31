import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'
import { isFRoad } from '@/lib/froad-list'
import { datexConditionToStatus } from '@/lib/road-condition-colors'
import type { RoadCondition } from '@/lib/types'

// DATEX II services from Vegagerðin — try each until one succeeds
const DATEX_URLS = [
  'https://datex.vegagerdin.is/datex2/roadConditions',
  'https://datex.vegagerdin.is/datex2/situations',
  'https://datex.vegagerdin.is/',
]

let cache: { data: RoadCondition[]; fetchedAt: number } | null = null
const CACHE_MS = 10 * 60 * 1000

function parseGmlCoords(gmlStr: string): [number, number][] {
  if (!gmlStr) return []
  const pairs = gmlStr.trim().split(/\s+/)
  const result: [number, number][] = []
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    const lat = parseFloat(pairs[i])
    const lon = parseFloat(pairs[i + 1])
    if (!isNaN(lat) && !isNaN(lon)) result.push([lat, lon])
  }
  return result
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  for (const url of DATEX_URLS) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const xml = await res.text()
      const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false })

      const items: RoadCondition[] = []

      // DATEX II structure: d2LogicalModel > payloadPublication > situation(s)
      const pub =
        parsed?.d2LogicalModel?.payloadPublication ??
        parsed?.d2LogicalModel ??
        parsed

      const situations = pub?.situation ?? pub?.Situation ?? []
      const list = Array.isArray(situations) ? situations : [situations]

      for (const sit of list) {
        if (!sit) continue
        const record = sit?.situationRecord ?? sit?.record ?? sit
        const records = Array.isArray(record) ? record : [record]

        for (const rec of records) {
          if (!rec) continue
          const id = rec?.$ ? rec.$['id'] : rec.id ?? String(Math.random())
          const condText =
            rec?.roadConditions?.weatherRelatedRoadConditionType ??
            rec?.roadConditionType ??
            rec?.generalObstruction?.obstructionType ??
            ''
          const status = datexConditionToStatus(String(condText))

          // GML coordinates
          const gmlCoords =
            rec?.groupOfLocations?.locationForDisplay?.pointByCoordinates?.pointCoordinates ??
            rec?.groupOfLocations?.linearExtension?.openlrLinearLocationReference ??
            rec?.locationReference?.glcPoints?.point?.pointCoordinates ??
            null

          const coords: [number, number][] = []
          if (gmlCoords) {
            const lat = parseFloat(gmlCoords.latitude ?? gmlCoords.lat ?? '')
            const lon = parseFloat(gmlCoords.longitude ?? gmlCoords.lon ?? '')
            if (!isNaN(lat) && !isNaN(lon)) coords.push([lat, lon])
          }

          const gmlLine =
            rec?.groupOfLocations?.linearExtension?.gml?.LineString?.posList ?? ''
          if (gmlLine) coords.push(...parseGmlCoords(String(gmlLine)))

          items.push({
            id: String(id),
            roadNumber: rec?.locationReference?.roadNumber ?? '',
            description: rec?.situationRecordCreationReference ?? condText ?? '',
            conditionCode: 0,
            conditionLabel: status,
            closureType: status === 'closed' ? 'closed' : null,
            isFRoad: isFRoad(rec?.locationReference?.roadNumber ?? ''),
            region: rec?.groupOfLocations?.country ?? '',
            coordinates: coords,
            updatedAt: new Date().toISOString(),
          })
        }
      }

      if (items.length > 0) {
        cache = { data: items, fetchedAt: Date.now() }
        return NextResponse.json(items)
      }
    } catch {
      // Try next URL
    }
  }

  if (cache) return NextResponse.json(cache.data)
  return NextResponse.json([])
}
