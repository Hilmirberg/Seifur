'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { RoadCondition } from '@/lib/types'
import { statusBadgeClass } from '@/lib/road-condition-colors'
import type { RoadStatus } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const REGIONS = ['All regions', 'Southwest', 'South', 'East', 'North', 'Westfjords', 'West', 'Highlands', 'Other']

export default function RoadsPage() {
  const [region, setRegion] = useState('All regions')
  const [showFroads, setShowFroads] = useState(false)

  const { data: roadsData, isLoading } = useSWR<RoadCondition[]>('/api/roads', fetcher, {
    refreshInterval: 900_000,
  })
  const roads = Array.isArray(roadsData) ? roadsData : []

  const filtered = roads.filter((r) => {
    if (region !== 'All regions' && r.region !== region) return false
    if (showFroads && !r.isFRoad) return false
    return true
  })

  const closedCount = roads.filter((r) => r.conditionLabel === 'closed').length
  const difficultCount = roads.filter((r) => r.conditionLabel === 'difficult' || r.conditionLabel === 'slippery').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Road Conditions</h1>
          {roads.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {roads.length} sections — {closedCount > 0 && <span className="text-red-600 font-medium">{closedCount} closed</span>}
              {closedCount > 0 && difficultCount > 0 && ', '}
              {difficultCount > 0 && <span className="text-orange-600 font-medium">{difficultCount} difficult/slippery</span>}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showFroads}
              onChange={(e) => setShowFroads(e.target.checked)}
              className="rounded"
            />
            F-roads only
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 animate-pulse">Loading road conditions…</div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Road</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Section</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Region</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No data available</td>
                </tr>
              ) : (
                filtered.map((road) => (
                  <tr key={road.id} className={road.conditionLabel === 'closed' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                      {road.roadNumber || '—'}
                      {road.isFRoad && (
                        <span className="ml-1.5 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-sans">4WD</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{road.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(road.conditionLabel as RoadStatus)}`}>
                        {road.conditionLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{road.region}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
