import type { Camera, RoadCondition } from './types'

const R = 6371 // Earth radius in km

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Haversine distance between two lat/lon points in km */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Minimum distance from a point to any vertex of a polyline, in km */
function minDistToPolyline(lat: number, lon: number, coords: [number, number][]): number {
  let min = Infinity
  for (const [clat, clon] of coords) {
    const d = haversineKm(lat, lon, clat, clon)
    if (d < min) min = d
  }
  return min
}

/** Find cameras within maxKm of any point on the route geometry */
export function camerasNearRoute(
  cameras: Camera[],
  routeCoords: [number, number][],
  maxKm = 20,
  limit = 6
): Camera[] {
  if (!routeCoords.length) return []
  const subsample = routeCoords.filter((_, i) => i % 5 === 0) // every 5th point for speed
  return cameras
    .map((cam) => ({
      cam,
      dist: minDistToPolyline(cam.lat, cam.lon, subsample),
    }))
    .filter((x) => x.dist <= maxKm)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((x) => x.cam)
}

/** Find road conditions whose segments intersect the route bounding box + proximity */
export function roadConditionsNearRoute(
  conditions: RoadCondition[],
  routeCoords: [number, number][],
  maxKm = 10
): RoadCondition[] {
  if (!routeCoords.length) return []
  const subsample = routeCoords.filter((_, i) => i % 10 === 0)
  return conditions.filter((rc) => {
    if (!rc.coordinates.length) return false
    const midIdx = Math.floor(rc.coordinates.length / 2)
    const [rLat, rLon] = rc.coordinates[midIdx]
    return minDistToPolyline(rLat, rLon, subsample) <= maxKm
  })
}

/** Get bounding box string for Overpass API from route coords */
export function routeBbox(routeCoords: [number, number][]): string {
  if (!routeCoords.length) return '63.4,-24.5,66.5,-13.5'
  const lats = routeCoords.map(([lat]) => lat)
  const lons = routeCoords.map(([, lon]) => lon)
  const pad = 0.2
  return `${Math.min(...lats) - pad},${Math.min(...lons) - pad},${Math.max(...lats) + pad},${Math.max(...lons) + pad}`
}

/** Convert GeoJSON LineString coordinates [lon, lat] to Leaflet [lat, lon] pairs */
export function geoJsonToLatLon(coords: number[][]): [number, number][] {
  return coords.map(([lon, lat]) => [lat, lon])
}

/** Decode a polyline-encoded string to [lat, lon][] */
export function decodePolyline(encoded: string): [number, number][] {
  const result: [number, number][] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let b, shift = 0, result2 = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result2 |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result2 & 1 ? ~(result2 >> 1) : result2 >> 1

    shift = 0; result2 = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result2 |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result2 & 1 ? ~(result2 >> 1) : result2 >> 1

    result.push([lat / 1e5, lng / 1e5])
  }
  return result
}
