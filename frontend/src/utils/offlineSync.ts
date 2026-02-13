const DB_NAME = 'coach-partner-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending-actions'

interface PendingAction {
  id?: number
  method: string
  url: string
  body?: unknown
  timestamp: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function savePendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.add({ ...action, timestamp: Date.now() })
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const request = store.getAll()
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function removePendingAction(id: number): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function syncPendingActions(
  apiCall: (method: string, url: string, body?: unknown) => Promise<unknown>
): Promise<{ synced: number; failed: number }> {
  const actions = await getPendingActions()
  let synced = 0
  let failed = 0

  for (const action of actions) {
    try {
      await apiCall(action.method, action.url, action.body)
      if (action.id) await removePendingAction(action.id)
      synced++
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

export function isOnline(): boolean {
  return navigator.onLine
}
