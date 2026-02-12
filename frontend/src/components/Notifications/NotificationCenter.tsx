import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore, type AppNotification } from '@/store/notifications'
import { Bell, Check, CheckCheck, Trash2, X, Calendar, Trophy, Clock, Info } from 'lucide-react'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

const TYPE_ICONS: Record<string, typeof Calendar> = {
  training: Calendar,
  match: Trophy,
  reminder: Clock,
  info: Info,
}

const TYPE_COLORS: Record<string, string> = {
  training: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  match: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  reminder: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  info: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function NotificationCenter() {
  const { notifications, unreadCount, markRead, markAllRead, remove, clearAll, requestPermission } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Request permission on first open
  useEffect(() => {
    if (open) requestPermission()
  }, [open])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleClick = (n: AppNotification) => {
    markRead(n.id)
    if (n.link) {
      navigate(n.link)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell size={20} className="text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-sm">Notifiche</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                  <CheckCheck size={12} /> Segna tutte lette
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <Bell size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] || Info
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                      !n.read && 'bg-brand-50/50 dark:bg-brand-900/10'
                    )}
                  >
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', TYPE_COLORS[n.type])}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx('text-sm', !n.read && 'font-semibold')}>{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: it })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
