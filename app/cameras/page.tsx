'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import type { Camera } from '@/lib/types'
import CameraModal from '@/components/cameras/CameraModal'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const REGIONS = ['All regions', 'Southwest', 'South', 'East', 'North', 'Westfjords', 'West', 'Highlands', 'Other']

export default function CamerasPage() {
  const t = useTranslations('cameras')
  const [region, setRegion] = useState('All regions')
  const [selected, setSelected] = useState<Camera | null>(null)

  const { data: cameras = [], isLoading } = useSWR<Camera[]>('/api/cameras', fetcher, {
    refreshInterval: 60_000, // refresh every 60s
  })

  const filtered = region === 'All regions' ? cameras : cameras.filter((c) => c.region === region)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{t('refresh')}</p>
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 animate-pulse">{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setSelected(cam)}
              className="group relative aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cam.imageUrl}
                alt={cam.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  el.style.display = 'none'
                  el.parentElement!.classList.add('bg-gray-300')
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium truncate">{cam.name}</p>
                <p className="text-white/60 text-xs">{cam.region}</p>
              </div>
            </button>
          ))}

          {filtered.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center text-gray-400 text-sm">
              No cameras found for this region
            </div>
          )}
        </div>
      )}

      {selected && <CameraModal camera={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
