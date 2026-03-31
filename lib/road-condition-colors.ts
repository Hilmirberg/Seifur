import type { RoadStatus } from './types'

export const CONDITION_COLORS: Record<RoadStatus, string> = {
  open: '#22c55e',
  slippery: '#eab308',
  difficult: '#f97316',
  closed: '#ef4444',
  snowCovered: '#93c5fd',
  unknown: '#9ca3af',
}

export const CONDITION_WEIGHT: Record<RoadStatus, number> = {
  open: 3,
  slippery: 4,
  difficult: 4,
  closed: 5,
  snowCovered: 4,
  unknown: 2,
}

export const CONDITION_LABELS_EN: Record<RoadStatus, string> = {
  open: 'Open',
  slippery: 'Slippery',
  difficult: 'Difficult',
  closed: 'Closed',
  snowCovered: 'Snow-covered',
  unknown: 'Unknown',
}

export const CONDITION_LABELS_IS: Record<RoadStatus, string> = {
  open: 'Opið',
  slippery: 'Sleipilegt',
  difficult: 'Erfitt',
  closed: 'Lokað',
  snowCovered: 'Snjóþakið',
  unknown: 'Óþekkt',
}

/** Map Vegagerðin numeric condition codes to our RoadStatus enum */
export function codeToStatus(code: number | string): RoadStatus {
  const n = Number(code)
  switch (n) {
    case 1: return 'open'
    case 2: return 'slippery'
    case 3: return 'snowCovered'
    case 4: return 'difficult'
    case 5: return 'closed'
    default: return 'unknown'
  }
}

/** Map DATEX II condition text to RoadStatus */
export function datexConditionToStatus(text: string): RoadStatus {
  const t = text.toLowerCase()
  if (t.includes('closed') || t.includes('lokað') || t.includes('lokaður')) return 'closed'
  if (t.includes('difficult') || t.includes('erfit')) return 'difficult'
  if (t.includes('snow') || t.includes('snjó')) return 'snowCovered'
  if (t.includes('slippery') || t.includes('sleip') || t.includes('icy')) return 'slippery'
  if (t.includes('open') || t.includes('opið') || t.includes('opinn')) return 'open'
  return 'unknown'
}

export function statusBadgeClass(status: RoadStatus): string {
  const map: Record<RoadStatus, string> = {
    open: 'status-open',
    slippery: 'status-slippery',
    difficult: 'status-difficult',
    closed: 'status-closed',
    snowCovered: 'bg-blue-100 text-blue-800',
    unknown: 'status-unknown',
  }
  return map[status]
}
