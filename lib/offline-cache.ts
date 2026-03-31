import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'seifur-cache'
const DB_VERSION = 1

interface CacheEntry {
  data: unknown
  cachedAt: number
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache')
        }
        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function cacheSet(key: string, data: unknown): Promise<void> {
  try {
    const db = await getDB()
    await db.put('cache', { data, cachedAt: Date.now() } as CacheEntry, key)
  } catch {
    // Silently fail if IndexedDB is unavailable
  }
}

export async function cacheGet<T>(key: string, maxAgeMs = 30 * 60 * 1000): Promise<T | null> {
  try {
    const db = await getDB()
    const entry = await db.get('cache', key) as CacheEntry | undefined
    if (!entry) return null
    if (Date.now() - entry.cachedAt > maxAgeMs) return null
    return entry.data as T
  } catch {
    return null
  }
}

export async function cacheGetStale<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB()
    const entry = await db.get('cache', key) as CacheEntry | undefined
    if (!entry) return null
    return entry.data as T
  } catch {
    return null
  }
}

export async function savedRoutesGet(): Promise<unknown[]> {
  try {
    const db = await getDB()
    return await db.getAll('routes')
  } catch {
    return []
  }
}

export async function savedRoutePut(route: object & { id: string }): Promise<void> {
  try {
    const db = await getDB()
    await db.put('routes', route)
  } catch {}
}

export async function savedRouteDelete(id: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('routes', id)
  } catch {}
}
