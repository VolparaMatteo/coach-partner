import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { TrainingSession, Match } from '@/types'
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Trophy, Plus, Dumbbell } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  teamId: number
  onCreateSession: (date: string) => void
  onSelectSession: (session: TrainingSession) => void
  onSelectMatch: (match: Match) => void
}

export default function WeeklyPlanner({ teamId, onCreateSession, onSelectSession, onSelectMatch }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/trainings?team_id=${teamId}`),
      api.get(`/matches?team_id=${teamId}`),
    ]).then(([sessRes, matchRes]) => {
      setSessions(sessRes.data.sessions || [])
      setMatches(matchRes.data.matches || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [teamId])

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  const prevWeek = () => setWeekStart(addDays(weekStart, -7))
  const nextWeek = () => setWeekStart(addDays(weekStart, 7))
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const sessionsForDay = (day: Date) =>
    sessions.filter(s => isSameDay(parseISO(s.date), day))

  const matchesForDay = (day: Date) =>
    matches.filter(m => isSameDay(parseISO(m.date), day))

  // Weekly load: sum of session durations
  const weeklyLoad = days.reduce((sum, day) => {
    return sum + sessionsForDay(day).reduce((s, sess) => s + (sess.duration_minutes || 0), 0)
  }, 0)

  const weekLabel = `${format(days[0], 'd MMM', { locale: it })} - ${format(days[6], 'd MMM yyyy', { locale: it })}`

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
      case 'in_progress': return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  if (loading) return <div className="text-center py-8 text-gray-400">Caricamento...</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-semibold text-lg">{weekLabel}</h3>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronRight size={18} />
          </button>
          <button onClick={goToday} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
            Oggi
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            <Dumbbell size={14} className="inline mr-1" />
            Carico: <strong className="text-brand-600 dark:text-brand-400">{weeklyLoad} min</strong>
          </span>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const isToday = isSameDay(day, today)
          const daySessions = sessionsForDay(day)
          const dayMatches = matchesForDay(day)
          const dateStr = format(day, 'yyyy-MM-dd')

          return (
            <div
              key={dateStr}
              className={clsx(
                'rounded-xl border p-3 min-h-[160px] transition-colors',
                isToday
                  ? 'border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
              )}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    {format(day, 'EEE', { locale: it })}
                  </p>
                  <p className={clsx('text-lg font-bold', isToday ? 'text-brand-600 dark:text-brand-400' : '')}>
                    {format(day, 'd')}
                  </p>
                </div>
                <button
                  onClick={() => onCreateSession(dateStr)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-brand-600"
                  title="Aggiungi allenamento"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Events */}
              <div className="space-y-1.5">
                {daySessions.map(s => (
                  <button
                    key={`s-${s.id}`}
                    onClick={() => onSelectSession(s)}
                    className={clsx(
                      'w-full text-left px-2 py-1.5 rounded-lg border text-xs transition-colors hover:shadow-sm',
                      statusColor(s.status)
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar size={10} className="text-blue-500 shrink-0" />
                      <span className="font-medium truncate">{s.title || 'Allenamento'}</span>
                    </div>
                    {s.duration_minutes && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{s.duration_minutes} min</span>
                    )}
                  </button>
                ))}
                {dayMatches.map(m => (
                  <button
                    key={`m-${m.id}`}
                    onClick={() => onSelectMatch(m)}
                    className="w-full text-left px-2 py-1.5 rounded-lg border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-xs hover:shadow-sm transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <Trophy size={10} className="text-orange-500 shrink-0" />
                      <span className="font-medium truncate">vs {m.opponent}</span>
                    </div>
                    {m.competition && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{m.competition}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700" /> Pianificato</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700" /> In corso</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" /> Completato</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" /> Gara</span>
      </div>
    </div>
  )
}
