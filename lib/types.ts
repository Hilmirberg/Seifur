export interface HourlyData {
  time: string[]
  temperature_2m: number[]
  windspeed_10m: number[]
  winddirection_10m: number[]
  precipitation: number[]
  weathercode: number[]
  snow_depth: number[]
}

export interface DailyData {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_sum: number[]
  windspeed_10m_max: number[]
  weathercode: number[]
  sunrise: string[]
  sunset: string[]
}

export interface WeatherForecast {
  lat: number
  lon: number
  hourly: HourlyData
  daily: DailyData
}

export interface StationObservation {
  id: string
  name: string
  lat?: number
  lon?: number
  temp: number | null
  windSpeed: number | null
  windDir: number | null
  humidity: number | null
  pressure: number | null
  visibility: number | null
  snowDepth: number | null
}

export interface RoadCondition {
  id: string
  roadNumber: string
  description: string
  conditionCode: number
  conditionLabel: string
  closureType: string | null
  isFRoad: boolean
  region: string
  coordinates: [number, number][]
  updatedAt: string
}

export interface Camera {
  id: string
  name: string
  region: string
  imageUrl: string
  lat: number
  lon: number
}

export interface AvalancheWarning {
  region: string
  level: number
  description: string
  validUntil: string
}

export interface Waypoint {
  label: string
  lat: number
  lon: number
}

export interface Journey {
  from: Waypoint
  stops: Waypoint[]
  to: Waypoint
  routeGeometry: [number, number][]
  distanceKm: number
  durationMin: number
}

export interface SunTimes {
  sunrise: string
  sunset: string
  dayLength: string
}

export interface FuelStation {
  id: string
  name: string
  lat: number
  lon: number
  distanceFromRouteKm: number
}

export interface RouteConditionSummary {
  waypoint: Waypoint
  weather: WeatherForecast | null
  roadConditions: RoadCondition[]
  nearbyCameras: Camera[]
  sunTimes: SunTimes | null
  avalancheWarnings: AvalancheWarning[]
}

export interface SavedRoute {
  id: string
  name: string
  from: Waypoint
  stops: Waypoint[]
  to: Waypoint
  savedAt: string
}

export interface GeocodeResult {
  display_name: string
  lat: number
  lon: number
}

export type RoadStatus = 'open' | 'slippery' | 'difficult' | 'closed' | 'snowCovered' | 'unknown'
