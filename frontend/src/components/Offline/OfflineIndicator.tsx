import { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { syncPendingActions, getPendingActions } from '@/utils/offlineSync'
import { useToastStore } from '@/store/toast'
import api from '@/api/client'
import clsx from 'clsx'

export default function OfflineIndicator() {
  const toast = useToastStore()
  const [online, setOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 3000)
      handleSync()
    }
    const goOffline = () => {
      setOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    // Check pending actions periodically
    const checkPending = async () => {
      try {
        const actions = await getPendingActions()
        setPendingCount(actions.length)
      } catch {}
    }
    checkPending()
    const interval = setInterval(checkPending, 10000)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      clearInterval(interval)
    }
  }, [])

  const handleSync = async () => {
    if (syncing || !navigator.onLine) return
    setSyncing(true)
    try {
      const apiCall = async (method: string, url: string, body?: unknown) => {
        if (method === 'POST') return api.post(url, body)
        if (method === 'PUT') return api.put(url, body)
        if (method === 'PATCH') return api.patch(url, body)
        if (method === 'DELETE') return api.delete(url)
        return api.get(url)
      }
      const { synced, failed } = await syncPendingActions(apiCall)
      if (synced > 0) {
        toast.success(`${synced} azioni sincronizzate`)
        setPendingCount(prev => Math.max(0, prev - synced))
      }
      if (failed > 0) {
        toast.error(`${failed} azioni non sincronizzate`)
      }
    } catch {}
    setSyncing(false)
  }

  if (!showBanner && pendingCount === 0) return null

  return (
    <>
      {/* Offline/Online banner */}
      {showBanner && (
        <div className={clsx(
          'fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium transition-all',
          online
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        )}>
          <div className="flex items-center justify-center gap-2">
            {online ? <Wifi size={16} /> : <WifiOff size={16} />}
            {online ? 'Connessione ristabilita' : 'Modalità offline — le modifiche verranno sincronizzate'}
          </div>
        </div>
      )}

      {/* Pending sync indicator */}
      {pendingCount > 0 && online && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="fixed bottom-20 left-4 z-40 flex items-center gap-2 bg-yellow-500 text-white px-3 py-2 rounded-xl shadow-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizzazione...' : `${pendingCount} azioni in attesa`}
        </button>
      )}
    </>
  )
}
