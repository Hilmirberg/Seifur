import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'
import type { Camera } from '@/lib/types'

const PRIMARY_URL = 'https://gagnaveita.vegagerdin.is/api/vefmyndavelar2014_1'
const FALLBACK_URL = 'https://www4.vegagerdin.is/xml/myndavelar.xml'

let cache: { data: Camera[]; fetchedAt: number } | null = null
const CACHE_MS = 30 * 60 * 1000

function regionFromName(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('reykjanes') || n.includes('reykjavík') || n.includes('hafnarfjörður')) return 'Southwest'
  if (n.includes('þórsmörk') || n.includes('vík') || n.includes('hvolsvöllur') || n.includes('selfoss') || n.includes('klaustur') || n.includes('mýrdalur') || n.includes('höfn') || n.includes('skaftá')) return 'South'
  if (n.includes('höfn') || n.includes('egilsstaðir') || n.includes('neskaupstaður') || n.includes('djúpivogur')) return 'East'
  if (n.includes('akureyri') || n.includes('mývatn') || n.includes('húsavík') || n.includes('siglufjörður') || n.includes('dalvík')) return 'North'
  if (n.includes('ísafjörður') || n.includes('westfjords') || n.includes('vesturfjörður') || n.includes('patrekur')) return 'Westfjords'
  if (n.includes('stykkishólmur') || n.includes('borgarnes') || n.includes('snæfellsnes')) return 'West'
  if (n.includes('sprengisandur') || n.includes('kjalvegur') || n.includes('öskjuleið') || n.includes('kerlingarfjöll')) return 'Highlands'
  return 'Other'
}

async function fetchAndParseCameras(url: string): Promise<Camera[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const xml = await res.text()
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false })

  const cameras: Camera[] = []

  // Try multiple possible root element names
  const root = parsed?.ArrayOfVefmyndavel ?? parsed?.ArrayOfMyndavel ?? parsed?.cameras ?? parsed
  const entries =
    root?.Vefmyndavel ?? root?.Myndavel ?? root?.camera ?? root?.Camera ?? []
  const list = Array.isArray(entries) ? entries : [entries]

  for (const item of list) {
    if (!item) continue
    const id = item.Id ?? item.id ?? String(Math.random())
    const name = item.Nafn ?? item.Name ?? item.Heiti ?? ''
    const imageUrl = item.Mynd ?? item.ImageUrl ?? item.Url ?? item.mynd ?? ''
    const lat = parseFloat(item.Lat ?? item.lat ?? item.Y ?? '0')
    const lon = parseFloat(item.Lon ?? item.lon ?? item.X ?? '0')

    if (!imageUrl) continue

    cameras.push({
      id: String(id),
      name: String(name),
      region: regionFromName(String(name)),
      imageUrl: String(imageUrl),
      lat: isNaN(lat) ? 64.9 : lat,
      lon: isNaN(lon) ? -18.1 : lon,
    })
  }

  return cameras
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
        return NextResponse.json(cameras)
      }
    } catch (err) {
      console.warn(`Camera fetch failed for ${url}:`, err)
    }
  }

  if (cache) return NextResponse.json(cache.data)
  return NextResponse.json([])
}
