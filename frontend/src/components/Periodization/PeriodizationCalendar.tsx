import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { PeriodizationCycle, TrainingSession, Match } from '@/types'
import { useTeamStore } from '@/store/team'
import { Plus, X, ChevronLeft, ChevronRight, Layers, Calendar as CalendarIcon } from 'lucide-react'
import clsx from 'clsx'

const cycleTypeLabels: Record<string, string> = {
  macro: 'Macrociclo',
  meso: 'Mesociclo',
  micro: 'Microciclo',
}

const loadLabels: Record<string, string> = {
  deload: 'Scarico',
  low: 'Basso',
  medium: 'Medio',
  high: 'Alto',
  very_high: 'Molto Alto',
}

const loadColors: Record<string, string> = {
  deload: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  very_high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const defaultColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444']

export default function PeriodizationCalendar() {
  const { activeTeamId } = useTeamStore()
  const [cycles, setCycles] = useState<PeriodizationCycle[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [weeklyLoads, setWeeklyLoads] = useState<Record<string, { sessions: number; total_minutes: number; avg_rpe: number | null; total_load: number }>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [viewWeeks, setViewWeeks] = useState(8)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1) // Monday
    d.setDate(d.getDate() - 7) // Start 1 week before
    return d.toISOString().split('T')[0]
  })
  const [form, setForm] = useState({
    name: '',
    cycle_type: 'meso' as string,
    start_date: '',
    end_date: '',
    objectives: '',
    planned_load: 'medium',
    notes: '',
    color: defaultColors[0],
  })

  const endDate = (() => {
    const d = new Date(startDate + 'T00:00:00')
    d.setDate(d.getDate() + viewWeeks * 7)
    return d.toISOString().split('T')[0]
  })()

  useEffect(() => {
    if (!activeTeamId) return
    api.get(`/periodization/calendar?team_id=${activeTeamId}&start=${startDate}&end=${endDate}`)
      .then(({ data }) => {
        setCycles(data.cycles)
        setSessions(data.sessions)
        setMatches(data.matches)
        setWeeklyLoads(data.weekly_loads)
      })
  }, [activeTeamId, startDate, endDate])

  const handleCreate = async () => {
    if (!activeTeamId || !form.name || !form.start_date || !form.end_date) return
    const { data } = await api.post('/periodization', { team_id: activeTeamId, ...form })
    setCycles(prev => [...prev, data.cycle].sort((a, b) => a.start_date.localeCompare(b.start_date)))
    setForm({ name: '', cycle_type: 'meso', start_date: '', end_date: '', objectives: '', planned_load: 'medium', notes: '', color: defaultColors[cycles.length % defaultColors.length] })
    setShowCreate(false)
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/periodization/${id}`)
    setCycles(prev => prev.filter(c => c.id !== id))
  }

  const navigate = (dir: number) => {
    const d = new Date(startDate + 'T00:00:00')
    d.setDate(d.getDate() + dir * 7 * 4)
    setStartDate(d.toISOString().split('T')[0])
  }

  // Generate weeks array
  const weeks: { start: Date; end: Date; key: string; label: string }[] = []
  for (let w = 0; w < viewWeeks; w++) {
    const ws = new Date(startDate + 'T00:00:00')
    ws.setDate(ws.getDate() + w * 7)
    const we = new Date(ws)
    we.setDate(we.getDate() + 6)
    const iso = ws.toISOString().split('T')[0]
    const isoYear = ws.getFullYear()
    const jan1 = new Date(isoYear, 0, 1)
    const dayOfYear = Math.floor((ws.getTime() - jan1.getTime()) / 86400000)
    const weekNum = Math.ceil((dayOfYear + jan1.getDay() + 1) / 7)
    weeks.push({
      start: ws,
      end: we,
      key: `${isoYear}-W${String(weekNum).padStart(2, '0')}`,
      label: `${ws.getDate()}/${ws.getMonth() + 1}`,
    })
  }

  // Check if a cycle overlaps a week
  const cycleInWeek = (cycle: PeriodizationCycle, week: { start: Date; end: Date }) => {
    const cs = new Date(cycle.start_date + 'T00:00:00')
    const ce = new Date(cycle.end_date + 'T00:00:00')
    return cs <= week.end && ce >= week.start
  }

  // Count sessions in a week
  const sessionsInWeek = (week: { start: Date; end: Date }) => {
    return sessions.filter(s => {
      const d = new Date(s.date + 'T00:00:00')
      return d >= week.start && d <= week.end
    })
  }

  const matchesInWeek = (week: { start: Date; end: Date }) => {
    return matches.filter(m => {
      const d = new Date(m.date + 'T00:00:00')
      return d >= week.start && d <= week.end
    })
  }

  // Group cycles by type for layered display
  const macros = cycles.filter(c => c.cycle_type === 'macro')
  const mesos = cycles.filter(c => c.cycle_type === 'meso')
  const micros = cycles.filter(c => c.cycle_type === 'micro')

  const renderCycleRow = (cycleList: PeriodizationCycle[], label: string) => (
    <tr>
      <td className="text-xs font-medium text-gray-500 dark:text-gray-400 py-2 pr-3 whitespace-nowrap">{label}</td>
      {weeks.map(week => {
        const active = cycleList.filter(c => cycleInWeek(c, week))
        return (
          <td key={week.key} className="py-1 px-0.5">
            {active.map(c => (
              <div
                key={c.id}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 mb-0.5"
                style={{ backgroundColor: (c.color || '#3B82F6') + '20', color: c.color || '#3B82F6', borderLeft: `3px solid ${c.color || '#3B82F6'}` }}
                title={`${c.name} (${loadLabels[c.planned_load || ''] || ''})\n${c.objectives || ''}`}
                onClick={() => handleDelete(c.id)}
              >
                {c.name}
              </div>
            ))}
          </td>
        )
      })}
    </tr>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Layers size={18} /> Periodizzazione
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(startDate + 'T00:00:00').toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronRight size={18} />
          </button>
          <select className="input-field text-xs py-1 px-2 w-20" value={viewWeeks} onChange={e => setViewWeeks(parseInt(e.target.value))}>
            <option value={4}>4 sett</option>
            <option value={8}>8 sett</option>
            <option value={12}>12 sett</option>
          </select>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <Plus size={14} /> Ciclo
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="border-2 border-brand-200 dark:border-brand-700 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Nuovo Ciclo</h4>
            <button onClick={() => setShowCreate(false)}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="label">Nome *</label>
              <input className="input-field text-sm" placeholder="es. Preparazione" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select className="input-field text-sm" value={form.cycle_type}
                onChange={e => setForm(p => ({ ...p, cycle_type: e.target.value }))}>
                <option value="macro">Macrociclo</option>
                <option value="meso">Mesociclo</option>
                <option value="micro">Microciclo</option>
              </select>
            </div>
            <div>
              <label className="label">Inizio *</label>
              <input type="date" className="input-field text-sm" value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fine *</label>
              <input type="date" className="input-field text-sm" value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Carico Pianificato</label>
              <select className="input-field text-sm" value={form.planned_load}
                onChange={e => setForm(p => ({ ...p, planned_load: e.target.value }))}>
                <option value="deload">Scarico</option>
                <option value="low">Basso</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
                <option value="very_high">Molto Alto</option>
              </select>
            </div>
            <div>
              <label className="label">Obiettivi</label>
              <input className="input-field text-sm" placeholder="es. Fase offensiva" value={form.objectives}
                onChange={e => setForm(p => ({ ...p, objectives: e.target.value }))} />
            </div>
            <div>
              <label className="label">Colore</label>
              <div className="flex gap-1.5 mt-1">
                {defaultColors.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={clsx('w-6 h-6 rounded-full border-2 transition-transform', form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleCreate} className="btn-primary text-sm">Crea Ciclo</button>
        </div>
      )}

      {/* Timeline table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left text-xs text-gray-400 dark:text-gray-500 pb-2 pr-3 w-24"></th>
              {weeks.map(week => (
                <th key={week.key} className="text-center text-xs text-gray-500 dark:text-gray-400 pb-2 px-0.5 font-medium">
                  {week.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="border-t border-gray-200 dark:border-gray-700">
            {macros.length > 0 && renderCycleRow(macros, 'Macro')}
            {mesos.length > 0 && renderCycleRow(mesos, 'Meso')}
            {micros.length > 0 && renderCycleRow(micros, 'Micro')}

            {/* Sessions row */}
            <tr className="border-t border-gray-100 dark:border-gray-800">
              <td className="text-xs font-medium text-gray-500 dark:text-gray-400 py-2 pr-3">Sessioni</td>
              {weeks.map(week => {
                const ws = sessionsInWeek(week)
                const wm = matchesInWeek(week)
                return (
                  <td key={week.key} className="text-center py-2 px-0.5">
                    {ws.length > 0 && (
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{ws.length}</div>
                    )}
                    {wm.length > 0 && (
                      <div className="text-[10px] font-medium text-orange-600 dark:text-orange-400">{wm.length} gara</div>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Load row */}
            <tr className="border-t border-gray-100 dark:border-gray-800">
              <td className="text-xs font-medium text-gray-500 dark:text-gray-400 py-2 pr-3">Carico</td>
              {weeks.map(week => {
                const wl = weeklyLoads[week.key]
                if (!wl) return <td key={week.key} className="py-2 px-0.5"></td>
                const maxLoad = Math.max(...Object.values(weeklyLoads).map(w => w.total_load || 0), 1)
                const pct = Math.round((wl.total_load / maxLoad) * 100)
                return (
                  <td key={week.key} className="py-2 px-1">
                    <div className="h-8 flex items-end justify-center">
                      <div
                        className={clsx('w-full rounded-t', pct > 75 ? 'bg-red-400' : pct > 50 ? 'bg-orange-400' : pct > 25 ? 'bg-yellow-400' : 'bg-green-400')}
                        style={{ height: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                    {wl.avg_rpe && <div className="text-[10px] text-center text-gray-400 mt-0.5">RPE {wl.avg_rpe}</div>}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {cycles.length === 0 && !showCreate && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          Nessun ciclo di periodizzazione. Crea il primo per pianificare la stagione!
        </p>
      )}
    </div>
  )
}
