'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ICELAND_LOCATIONS } from '@/lib/iceland-locations'
import type { WeatherForecast, StationObservation, SunTimes } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains', 80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
}

function wmoEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌧️'
  if (code <= 65) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

export default function WeatherPage() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const loc = ICELAND_LOCATIONS[selectedIdx]

  const { data: forecast, isLoading: forecastLoading } = useSWR<WeatherForecast>(
    `/api/weather/forecast?lat=${loc.lat}&lon=${loc.lon}&days=7`,
    fetcher,
    { refreshInterval: 3600_000 }
  )

  const { data: obs } = useSWR<StationObservation[]>(
    loc.stationId ? `/api/weather/observations?stations=${loc.stationId}` : null,
    fetcher,
    { refreshInterval: 3600_000 }
  )

  const today = new Date().toISOString().split('T')[0]
  const { data: sun } = useSWR<SunTimes>(
    `/api/sun?lat=${loc.lat}&lon=${loc.lon}&date=${today}`,
    fetcher
  )

  const station = obs?.[0]
  const daily = forecast?.daily

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Weather</h1>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
        >
          {ICELAND_LOCATIONS.map((l, i) => (
            <option key={i} value={i}>{l.name} — {l.region}</option>
          ))}
        </select>
      </div>

      {/* Current conditions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Temperature</div>
          <div className="text-3xl font-bold text-gray-900">
            {station?.temp != null ? `${station.temp}°C` : '—'}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Wind</div>
          <div className="text-3xl font-bold text-gray-900">
            {station?.windSpeed != null ? `${station.windSpeed}` : '—'}
            {station?.windSpeed != null && <span className="text-lg font-normal text-gray-500"> m/s</span>}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pressure</div>
          <div className="text-2xl font-bold text-gray-900">
            {station?.pressure != null ? `${station.pressure}` : '—'}
            {station?.pressure != null && <span className="text-sm font-normal text-gray-500"> hPa</span>}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Sunrise / Sunset</div>
          {sun ? (
            <div className="text-sm space-y-0.5">
              <div>🌅 {sun.sunrise}</div>
              <div>🌇 {sun.sunset}</div>
              <div className="text-xs text-gray-400">{sun.dayLength}</div>
            </div>
          ) : <div className="text-gray-400">—</div>}
        </div>
      </div>

      {/* 7-day forecast */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">7-day forecast</h2>
        {forecastLoading ? (
          <div className="text-sm text-gray-400 animate-pulse">Loading weather…</div>
        ) : daily ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {daily.time.map((dateStr, i) => {
              const code = daily.weathercode[i]
              const date = new Date(dateStr)
              return (
                <div key={dateStr} className="bg-white rounded-xl border p-3 shadow-sm text-center space-y-1">
                  <div className="text-xs font-medium text-gray-500">
                    {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-400">
                    {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-2xl">{wmoEmoji(code)}</div>
                  <div className="text-xs text-gray-500">{WMO_CODES[code] ?? 'Unknown'}</div>
                  <div className="flex justify-center gap-2 text-sm">
                    <span className="font-semibold text-gray-900">{Math.round(daily.temperature_2m_max[i])}°</span>
                    <span className="text-gray-400">{Math.round(daily.temperature_2m_min[i])}°</span>
                  </div>
                  <div className="text-xs text-blue-500">
                    {daily.precipitation_sum[i] > 0 ? `${daily.precipitation_sum[i]}mm` : ''}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(daily.windspeed_10m_max[i])} m/s
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
