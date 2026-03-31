import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'
import { isFRoad } from '@/lib/froad-list'
import { codeToStatus } from '@/lib/road-condition-colors'
import type { RoadCondition } from '@/lib/types'

const VEGAGERDIN_URL = 'https://gagnaveita.vegagerdin.is/api/faerd2017_1'
const DATEX_URL = 'https://datex.vegagerdin.is/RoadConditions'

let cache: { data: RoadCondition[]; fetchedAt: number } | null = null
const CACHE_MS = 15 * 60 * 1000

async function fetchFromVegagerdin(): Promise<RoadCondition[]> {
  const res = await fetch(VEGAGERDIN_URL, {
    signal: AbortSignal.timeout(10000),
    headers: { 'Accept': 'application/xml, text/xml, */*' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false })

  // Log top-level keys on first run to debug structure
  console.log('Vegagerðin XML root keys:', Object.keys(parsed ?? {}))

  const root = parsed?.ArrayOfFaerd2017 ?? parsed?.ArrayOfFaerd ?? parsed?.root ?? Object.values(parsed ?? {})[0] ?? parsed
  const rawEntries = root?.Faerd2017 ?? root?.Faerd ?? root?.faerd ?? root?.item ?? []
  const entries = Array.isArray(rawEntries) ? rawEntries : rawEntries ? [rawEntries] : []

  console.log(`Vegagerðin: parsed ${entries.length} road entries`)

  return entries.filter(Boolean).map((item: Record<string, unknown>) => {
    const id = String(item.IdButur ?? item.Id ?? item.id ?? Math.random())
    const roadNumber = String(item.VegNr ?? item.RoadNumber ?? item.VegHeiti ?? '')
    const description = String(item.Heiti ?? item.Description ?? item.VegHeiti ?? '')
    const conditionCode = Number(item.Ferd ?? item.ConditionCode ?? item.Faerd ?? item.faerd ?? 0)
    const status = codeToStatus(conditionCode)
    const closureType = item.Lokun ?? item.Closure ?? null
    const region = String(item.Umdaemi ?? item.Region ?? '')

    const coords: [number, number][] = []
    const latStr = String(item.Lat ?? item.Y ?? '')
    const lonStr = String(item.Lon ?? item.X ?? '')
    if (latStr && lonStr && latStr !== 'undefined') {
      const lat = parseFloat(latStr)
      const lon = parseFloat(lonStr)
      if (!isNaN(lat) && !isNaN(lon)) coords.push([lat, lon])
    }

    return {
      id,
      roadNumber,
      description,
      conditionCode,
      conditionLabel: status,
      closureType: closureType ? String(closureType) : null,
      isFRoad: isFRoad(roadNumber),
      region,
      coordinates: coords,
      updatedAt: new Date().toISOString(),
    } satisfies RoadCondition
  })
}

async function fetchFromDatex(): Promise<RoadCondition[]> {
  const res = await fetch(DATEX_URL, {
    signal: AbortSignal.timeout(10000),
    headers: { 'Accept': 'application/xml, text/xml, */*' },
  })
  if (!res.ok) throw new Error(`DATEX HTTP ${res.status}`)
  const xml = await res.text()
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false })

  console.log('DATEX root keys:', Object.keys(parsed ?? {}))

  // DATEX II structure varies; extract what we can as a fallback
  // Return empty array if we can't parse — better than crashing
  const items: RoadCondition[] = []
  const d2 = parsed?.d2LogicalModel ?? parsed
  const situations = d2?.payloadPublication?.situation ?? []
  const sitList = Array.isArray(situations) ? situations : situations ? [situations] : []

  for (const sit of sitList) {
    const record = sit?.situationRecord ?? sit
    const recs = Array.isArray(record) ? record : record ? [record] : []
    for (const rec of recs) {
      const id = String(rec?.['$']?.id ?? rec?.id ?? Math.random())
      const desc = String(rec?.generalPublicComment?.[0]?.comment?.values?.value ?? rec?.roadConditionType ?? '')
      items.push({
        id,
        roadNumber: '',
        description: desc,
        conditionCode: 0,
        conditionLabel: 'unknown',
        closureType: null,
        isFRoad: false,
        region: '',
        coordinates: [],
        updatedAt: new Date().toISOString(),
      })
    }
  }
  return items
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  // Try primary source first, then fallback
  for (const [name, fn] of [['Vegagerðin', fetchFromVegagerdin], ['DATEX II', fetchFromDatex]] as const) {
    try {
      const data = await (fn as () => Promise<RoadCondition[]>)()
      if (data.length > 0) {
        cache = { data, fetchedAt: Date.now() }
        console.log(`Roads: served ${data.length} items from ${name}`)
        return NextResponse.json(data)
      }
      console.warn(`Roads: ${name} returned 0 items, trying next`)
    } catch (err) {
      console.error(`Roads: ${name} failed:`, err instanceof Error ? err.message : err)
    }
  }

  if (cache) return NextResponse.json(cache.data)
  return NextResponse.json([])
}
