import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'
import type { Camera } from '@/lib/types'

const PRIMARY_URL = 'https://gagnaveita.vegagerdin.is/api/vefmyndavelar2014_1'
const FALLBACK_URL = 'https://www4.vegagerdin.is/xml/myndavelar.xml'

let cache: { data: Camera[]; fetchedAt: number } | null = null
const CACHE_MS = 30 * 60 * 1000

function regionFromName(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('reykjanes') || n.includes('reykjavík') || n.includes('hafnarfjörður') || n.includes('keflavík')) return 'Southwest'
  if (n.includes('þórsmörk') || n.includes('vík') || n.includes('hvolsvöllur') || n.includes('selfoss') || n.includes('klaustur') || n.includes('mýrdalur') || n.includes('skaftá') || n.includes('kirkjubæ')) return 'South'
  if (n.includes('höfn') || n.includes('egilsstaðir') || n.includes('neskaupstaður') || n.includes('djúpivogur') || n.includes('seyðisfjörður')) return 'East'
  if (n.includes('akureyri') || n.includes('mývatn') || n.includes('húsavík') || n.includes('siglufjörður') || n.includes('dalvík') || n.includes('varmahlíð')) return 'North'
  if (n.includes('ísafjörður') || n.includes('patrekur') || n.includes('hólmavík') || n.includes('bíldudalur')) return 'Westfjords'
  if (n.includes('stykkishólmur') || n.includes('borgarnes') || n.includes('snæfellsnes') || n.includes('grundarfjörður')) return 'West'
  if (n.includes('sprengisandur') || n.includes('kjalvegur') || n.includes('öskjuleið') || n.includes('kerlingarfjöll') || n.includes('fjallabak')) return 'Highlands'
  return 'Other'
}

function extractCamerasFromParsed(parsed: Record<string, unknown>): Camera[] {
  const rootKeys = Object.keys(parsed)
  console.log('Camera XML root keys:', rootKeys)

  // Try to find the array of cameras under various possible root structures
  const root = (
    parsed?.ArrayOfVefmyndavel ??
    parsed?.ArrayOfMyndavel ??
    parsed?.cameras ??
    parsed?.Cameras ??
    (rootKeys.length === 1 ? parsed[rootKeys[0]] : null) ??
    parsed
  ) as Record<string, unknown>

  const rootSubKeys = root ? Object.keys(root) : []
  console.log('Camera XML sub-keys:', rootSubKeys)

  const entries = (
    root?.Vefmyndavel ??
    root?.vefmyndavel ??
    root?.Myndavel ??
    root?.myndavel ??
    root?.Camera ??
    root?.camera ??
    root?.item ??
    (rootSubKeys.length === 1 ? root[rootSubKeys[0]] : null)
  ) as unknown

  const list = Array.isArray(entries) ? entries : entries ? [entries] : []
  console.log(`Camera XML: found ${list.length} entries`)

  const cameras: Camera[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>

    const id = String(obj.Id ?? obj.id ?? obj.ID ?? Math.random())
    const name = String(obj.Nafn ?? obj.Name ?? obj.name ?? obj.Heiti ?? obj.heiti ?? id)
    const imageUrl = String(obj.Mynd ?? obj.ImageUrl ?? obj.Url ?? obj.url ?? obj.mynd ?? obj.image ?? '')
    const lat = parseFloat(String(obj.Lat ?? obj.lat ?? obj.Y ?? obj.y ?? ''))
    const lon = parseFloat(String(obj.Lon ?? obj.lon ?? obj.X ?? obj.x ?? ''))

    if (!imageUrl || imageUrl === 'undefined') continue

    cameras.push({
      id,
      name,
      region: regionFromName(name),
      imageUrl,
      lat: isNaN(lat) ? 64.9 : lat,
      lon: isNaN(lon) ? -18.1 : lon,
    })
  }

  return cameras
}

async function fetchAndParseCameras(url: string): Promise<Camera[]> {
  console.log(`Cameras: fetching ${url}`)
  const res = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: { 'Accept': 'application/xml, text/xml, */*' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  console.log(`Cameras: received ${xml.length} bytes, first 200: ${xml.slice(0, 200)}`)
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false })
  return extractCamerasFromParsed(parsed as Record<string, unknown>)
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  for (const url of [PRIMARY_URL, FALLBACK_URL]) {
    try {
      const cameras = await fetchAndParseCameras(url)
      if (cameras.length > 0) {
        cache = { data: cameras, fetchedAt: Date.now() }
        console.log(`Cameras: returning ${cameras.length} cameras from ${url}`)
        return NextResponse.json(cameras)
      }
      console.warn(`Cameras: ${url} returned 0 cameras`)
    } catch (err) {
      console.error(`Cameras: ${url} failed:`, err instanceof Error ? err.message : err)
    }
  }

  if (cache) return NextResponse.json(cache.data)
  return NextResponse.json([])
}
