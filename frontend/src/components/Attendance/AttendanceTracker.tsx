import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Athlete } from '@/types'
import { useToastStore } from '@/store/toast'
import { Check, X, AlertTriangle, Heart, Save, UserCircle, Users } from 'lucide-react'
import clsx from 'clsx'

interface AttendanceRecord {
  athlete_id: number
  status: 'present' | 'absent' | 'excused' | 'injured'
  minutes_trained: number | null
  note: string
}

interface Props {
  sessionId: number
  teamId: number
}

const STATUS_CONFIG = {
  present: { icon: Check, label: 'Presente', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700' },
  absent: { icon: X, label: 'Assente', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700' },
  excused: { icon: AlertTriangle, label: 'Giustificato', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700' },
  injured: { icon: Heart, label: 'Infortunato', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700' },
} as const

export default function AttendanceTracker({ sessionId, teamId }: Props) {
  const toast = useToastStore()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [records, setRecords] = useState<Record<number, AttendanceRecord>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [athletesRes, attendanceRes] = await Promise.all([
        api.get(`/athletes?team_id=${teamId}`),
        api.get(`/attendance/${sessionId}`).catch(() => ({ data: { attendance: [] } })),
      ])
      setAthletes(athletesRes.data.athletes)

      const existing: Record<number, AttendanceRecord> = {}
      for (const a of athletesRes.data.athletes) {
        const found = attendanceRes.data.attendance?.find((r: any) => r.athlete_id === a.id)
        existing[a.id] = found || { athlete_id: a.id, status: 'present', minutes_trained: null, note: '' }
      }
      setRecords(existing)
      setLoading(false)
    }
    load()
  }, [sessionId, teamId])

  const setStatus = (athleteId: number, status: AttendanceRecord['status']) => {
    setRecords(prev => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], status },
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.post(`/attendance/${sessionId}`, {
        attendance: Object.values(records),
      })
      toast.success('Presenze salvate!')
    } catch {
      toast.error('Errore nel salvataggio presenze')
    }
    setSaving(false)
  }

  const markAll = (status: AttendanceRecord['status']) => {
    setRecords(prev => {
      const updated = { ...prev }
      for (const id of Object.keys(updated)) {
        updated[Number(id)] = { ...updated[Number(id)], status }
      }
      return updated
    })
  }

  const counts = Object.values(records).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Users size={18} /> Registro Presenze
          </h3>
          <div className="flex items-center gap-3 mt-1">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className="text-xs text-gray-500 dark:text-gray-400">
                {cfg.label}: <b>{counts[key] || 0}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => markAll('present')} className="text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100">
            Tutti presenti
          </button>
          <button onClick={save} disabled={saving} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1">
            <Save size={14} /> {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {athletes.map(athlete => {
          const record = records[athlete.id]
          if (!record) return null
          return (
            <div key={athlete.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold shrink-0">
                {athlete.jersey_number || <UserCircle size={14} />}
              </div>
              <span className="font-medium text-sm w-36 truncate">{athlete.full_name}</span>
              <div className="flex items-center gap-1 flex-1">
                {(Object.entries(STATUS_CONFIG) as [AttendanceRecord['status'], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  const active = record.status === key
                  return (
                    <button
                      key={key}
                      onClick={() => setStatus(athlete.id, key)}
                      className={clsx(
                        'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                        active ? cfg.color : 'border-transparent text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <Icon size={12} />
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
