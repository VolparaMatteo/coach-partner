import { useState, useMemo } from 'react'
import type { TrainingSession, Match } from '@/types'
import { ChevronLeft, ChevronRight, Calendar, Trophy } from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { it } from 'date-fns/locale'
import clsx from 'clsx'

interface Props {
  sessions: TrainingSession[]
  matches: Match[]
  onDayClick?: (date: Date) => void
}

export default function CalendarView({ sessions, matches, onDayClick }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const daySessions = sessions.filter(s => s.date === dayStr)
    const dayMatches = matches.filter(m => m.date === dayStr)
    return { sessions: daySessions, matches: dayMatches }
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: it })}
        </h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const events = getEventsForDay(day)
          const hasEvents = events.sessions.length > 0 || events.matches.length > 0
          const inMonth = isSameMonth(day, currentMonth)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={clsx(
                'aspect-square p-1 rounded-lg flex flex-col items-center justify-start text-sm transition-colors',
                !inMonth && 'opacity-30',
                isToday(day) && 'ring-2 ring-brand-500',
                hasEvents && 'bg-gray-50 hover:bg-gray-100',
                !hasEvents && 'hover:bg-gray-50',
              )}
            >
              <span className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                isToday(day) ? 'bg-brand-600 text-white' : 'text-gray-700'
              )}>
                {format(day, 'd')}
              </span>
              {/* Event dots */}
              <div className="flex gap-0.5 mt-0.5">
                {events.sessions.map((_, i) => (
                  <div key={`s${i}`} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                ))}
                {events.matches.map((_, i) => (
                  <div key={`m${i}`} className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Allenamento
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Gara
        </div>
      </div>
    </div>
  )
}
