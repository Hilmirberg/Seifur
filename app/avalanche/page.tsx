'use client'

import useSWR from 'swr'
import type { AvalancheWarning } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const LEVEL_COLORS = ['', 'bg-green-100 border-green-300', 'bg-yellow-100 border-yellow-300', 'bg-orange-100 border-orange-300', 'bg-red-100 border-red-300', 'bg-red-900 border-red-700']
const LEVEL_TEXT_COLORS = ['', 'text-green-800', 'text-yellow-800', 'text-orange-800', 'text-red-800', 'text-white']
const LEVEL_LABELS = ['', 'Low', 'Moderate', 'Considerable', 'High', 'Very High']

export default function AvalanchePage() {
  const { data: warnings = [], isLoading } = useSWR<AvalancheWarning[]>('/api/avalanche', fetcher, {
    refreshInterval: 3600_000,
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avalanche Warnings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Source:{' '}
          <a href="https://en.vedur.is/avalanches/forecast/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            Icelandic Met Office (vedur.is)
          </a>
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 animate-pulse">Loading avalanche warnings…</div>
      ) : warnings.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-green-800 font-medium">No active avalanche warnings</p>
          <p className="text-sm text-green-600 mt-1">Check vedur.is for full details</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {warnings.map((w, i) => {
            const lvl = Math.min(5, Math.max(1, w.level))
            return (
              <div
                key={i}
                className={`rounded-xl border-2 p-5 ${LEVEL_COLORS[lvl]} ${LEVEL_TEXT_COLORS[lvl]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide opacity-70 mb-1">Region</div>
                    <h2 className="text-lg font-bold">{w.region}</h2>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs uppercase tracking-wide opacity-70 mb-1">Level</div>
                    <div className="text-3xl font-black">{lvl}</div>
                    <div className="text-xs font-medium">{LEVEL_LABELS[lvl]}</div>
                  </div>
                </div>
                {w.description && (
                  <p className="text-sm mt-3 opacity-90">{w.description}</p>
                )}
                {w.validUntil && (
                  <p className="text-xs mt-2 opacity-60">Valid until: {w.validUntil}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <p className="font-medium text-blue-900 mb-1">Full avalanche forecast</p>
        <p className="text-blue-700">
          For detailed regional maps and full forecast text, visit{' '}
          <a href="https://en.vedur.is/avalanches/forecast/" target="_blank" rel="noopener noreferrer" className="underline">
            en.vedur.is/avalanches/forecast
          </a>
        </p>
      </div>
    </div>
  )
}
