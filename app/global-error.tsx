'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f9fafb' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ maxWidth: 520, width: '100%', background: 'white', borderRadius: 12, border: '1px solid #fca5a5', padding: '1.5rem' }}>
            <h1 style={{ color: '#b91c1c', fontWeight: 700, marginBottom: 12 }}>Global error</h1>
            <pre style={{ background: '#fef2f2', padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#7f1d1d' }}>
              {error.message || 'Unknown error'}
              {'\n\n'}
              {error.stack}
            </pre>
            <button
              onClick={reset}
              style={{ marginTop: 16, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
