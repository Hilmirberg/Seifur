'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-lg w-full bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-4">
        <h1 className="text-lg font-bold text-red-700">Something went wrong</h1>
        <div className="bg-red-50 rounded-lg p-4 font-mono text-xs text-red-900 break-all whitespace-pre-wrap">
          {error.message || 'Unknown error'}
          {error.digest && <div className="mt-2 text-red-400">digest: {error.digest}</div>}
        </div>
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Stack trace</summary>
          <pre className="mt-2 overflow-auto text-xs bg-gray-50 p-3 rounded">
            {error.stack}
          </pre>
        </details>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
