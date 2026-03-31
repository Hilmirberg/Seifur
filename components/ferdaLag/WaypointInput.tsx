'use client'

import { useState, useEffect, useRef } from 'react'
import type { GeocodeResult, Waypoint } from '@/lib/types'

interface WaypointInputProps {
  label: string
  value: Waypoint | null
  onChange: (wp: Waypoint | null) => void
  placeholder?: string
  onGps?: () => void
  showGps?: boolean
  loading?: boolean
}

export default function WaypointInput({
  label, value, onChange, placeholder, onGps, showGps, loading,
}: WaypointInputProps) {
  const [query, setQuery] = useState(value?.label ?? '')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value?.label ?? '')
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(val: string) {
    setQuery(val)
    onChange(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`)
        const data: GeocodeResult[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  function select(r: GeocodeResult) {
    const short = r.display_name.split(',')[0].trim()
    onChange({ label: short, lat: r.lat, lon: r.lon })
    setQuery(short)
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder ?? label}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(searching || loading) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {value && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</div>
          )}
        </div>
        {showGps && onGps && (
          <button
            onClick={onGps}
            type="button"
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Use my location"
          >
            📍
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {results.slice(0, 5).map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 truncate"
                onClick={() => select(r)}
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
