import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { TimelineEvent } from '@/types'
import { motion } from 'framer-motion'
import { Clock, Target, FileText, AlertTriangle, CheckCircle, Heart, Activity } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  athleteId: number
}

const typeConfig: Record<string, { icon: typeof Clock; color: string; label: string; bg: string }> = {
  evaluation: { icon: Target, color: 'text-blue-600 dark:text-blue-400', label: 'Valutazione', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  note: { icon: FileText, color: 'text-green-600 dark:text-green-400', label: 'Nota', bg: 'bg-green-100 dark:bg-green-900/30' },
  injury: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', label: 'Infortunio', bg: 'bg-red-100 dark:bg-red-900/30' },
  attendance: { icon: CheckCircle, color: 'text-purple-600 dark:text-purple-400', label: 'Presenza', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  wellness: { icon: Heart, color: 'text-pink-600 dark:text-pink-400', label: 'Wellness', bg: 'bg-pink-100 dark:bg-pink-900/30' },
}

export default function ActivityTimeline({ athleteId }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/dashboard/activity/${athleteId}`)
      .then(({ data }) => { setEvents(data.timeline); setLoading(false) })
      .catch(() => setLoading(false))
  }, [athleteId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  const filtered = filter ? events.filter(e => e.type === filter) : events

  const renderEventContent = (event: TimelineEvent) => {
    const d = event.data
    switch (event.type) {
      case 'evaluation':
        return (
          <div>
            <span className="font-medium">Valutazione: {d.overall as number}/10</span>
            {d.comment ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{String(d.comment)}</p> : null}
          </div>
        )
      case 'note':
        return <p className="text-sm">{d.text as string}</p>
      case 'injury':
        return (
          <div>
            <span className="font-medium">{d.injury_type as string}</span>
            <span className="text-gray-400 mx-1">—</span>
            <span className="text-sm text-gray-500">{d.body_part as string}</span>
            <span className={clsx('ml-2 text-xs px-1.5 py-0.5 rounded',
              d.status === 'active' ? 'bg-red-100 text-red-600' : d.status === 'recovery' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
            )}>{d.status as string}</span>
          </div>
        )
      case 'attendance':
        const statusLabels: Record<string, string> = { present: 'Presente', absent: 'Assente', excused: 'Giustificato', injured: 'Infortunato' }
        return <span className="text-sm">{statusLabels[d.status as string] || d.status as string}</span>
      case 'wellness':
        return (
          <div className="flex items-center gap-3 text-sm">
            <span>Energia: <strong>{d.energy as number}/10</strong></span>
            {d.mood ? <span>Umore: <strong>{String(d.mood)}</strong></span> : null}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock size={18} /> Activity Log
        </h3>
        <div className="flex gap-1">
          <button onClick={() => setFilter(null)}
            className={clsx('px-2 py-1 rounded-lg text-xs font-medium', !filter ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
            Tutti
          </button>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilter(filter === key ? null : key)}
              className={clsx('px-2 py-1 rounded-lg text-xs font-medium', filter === key ? cfg.bg + ' ' + cfg.color : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">Nessun evento registrato</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {filtered.map((event, i) => {
              const cfg = typeConfig[event.type] || typeConfig.note
              const Icon = cfg.icon
              return (
                <motion.div key={`${event.type}-${event.date}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex gap-3 relative"
                >
                  <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10', cfg.bg)}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={clsx('text-[10px] font-medium uppercase', cfg.color)}>{cfg.label}</span>
                      <span className="text-[10px] text-gray-400">{new Date(event.date).toLocaleDateString('it-IT')}</span>
                    </div>
                    {renderEventContent(event)}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
