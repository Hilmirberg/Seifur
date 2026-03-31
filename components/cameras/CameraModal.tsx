'use client'

import { useEffect, useRef } from 'react'
import type { Camera } from '@/lib/types'

interface CameraModalProps {
  camera: Camera
  onClose: () => void
}

export default function CameraModal({ camera, onClose }: CameraModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={dialogRef} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900 truncate">{camera.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4 flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="bg-black flex items-center justify-center min-h-[240px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={camera.imageUrl}
            alt={camera.name}
            className="max-w-full max-h-[70vh] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect fill="%23374151"/><text x="200" y="120" text-anchor="middle" fill="%239ca3af" font-family="sans-serif">Camera unavailable</text></svg>'
            }}
          />
        </div>
        <div className="px-4 py-2 text-xs text-gray-400 flex justify-between">
          <span>{camera.region}</span>
          <a href={camera.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            Open full size ↗
          </a>
        </div>
      </div>
    </div>
  )
}
