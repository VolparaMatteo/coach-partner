import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Athlete, SportConfig } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ArrowLeft, UserCircle, Plus, X } from 'lucide-react'
import clsx from 'clsx'

interface AthleteStats {
  athlete: Athlete
  wellness: { energy: number | null; sleep_quality: number | null; stress: number | null }[]
  evaluations: { technical: number | null; tactical: number | null; physical: number | null; mental: number | null }[]
  attendance_pct: number
  weekly_load: number
  active_injuries: any[]
}

interface Props {
  teamId: number
  sportConfig: SportConfig | null
  onBack: () => void
}

const COLORS = ['#22c55e', '#6366f1', '#f59e0b']

export default function AthleteComparison({ teamId, sportConfig, onBack }: Props) {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [stats, setStats] = useState<AthleteStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/athletes?team_id=${teamId}`).then(({ data }) => setAthletes(data.athletes))
  }, [teamId])

  useEffect(() => {
    if (selectedIds.length < 2) {
      setStats([])
      return
    }
    setLoading(true)
    Promise.all(
      selectedIds.map(id => api.get(`/dashboard/athlete/${id}`))
    ).then(responses => {
      setStats(responses.map(r => r.data))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedIds])

  const toggleAthlete = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  // Build evaluation comparison data
  const evalData = (() => {
    if (stats.length === 0) return []
    const metrics = ['technical', 'tactical', 'physical', 'mental'] as const
    const labels: Record<string, string> = { technical: 'Tecnica', tactical: 'Tattica', physical: 'Fisico', mental: 'Mentale' }
    return metrics.map(m => {
      const row: Record<string, any> = { metric: labels[m] }
      stats.forEach((s, i) => {
        const evals = s.evaluations.filter(e => e[m] != null).map(e => e[m] as number)
        row[s.athlete.full_name] = evals.length > 0 ? Math.round(evals.reduce((a, b) => a + b, 0) / evals.length * 10) / 10 : 0
      })
      return row
    })
  })()

  // Build wellness comparison
  const wellnessData = (() => {
    if (stats.length === 0) return []
    const metrics = ['energy', 'sleep_quality', 'stress'] as const
    const labels: Record<string, string> = { energy: 'Energia', sleep_quality: 'Sonno', stress: 'Stress' }
    return metrics.map(m => {
      const row: Record<string, any> = { metric: labels[m] }
      stats.forEach(s => {
        const vals = s.wellness.filter(w => w[m] != null).map(w => w[m] as number)
        row[s.athlete.full_name] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0
      })
      return row
    })
  })()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
        <ArrowLeft size={16} /> Torna alla lista
      </button>

      <div>
        <h2 className="text-2xl font-bold">Confronto Atleti</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Seleziona 2-3 atleti da confrontare</p>
      </div>

      {/* Athlete selector */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {athletes.map(a => {
            const selected = selectedIds.includes(a.id)
            const colorIdx = selectedIds.indexOf(a.id)
            return (
              <button
                key={a.id}
                onClick={() => toggleAthlete(a.id)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                  selected
                    ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                )}
              >
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                  selected ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                )} style={selected ? { backgroundColor: COLORS[colorIdx] || COLORS[0] } : {}}>
                  {a.jersey_number || <UserCircle size={14} />}
                </div>
                {a.full_name}
                {selected && <X size={14} className="text-gray-400" />}
              </button>
            )
          })}
        </div>
      </div>

      {selectedIds.length < 2 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <Plus size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Seleziona almeno 2 atleti per il confronto</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      )}

      {stats.length >= 2 && !loading && (
        <>
          {/* Key metrics */}
          <div className="card">
            <h3 className="font-semibold mb-4">Metriche Chiave</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">Metrica</th>
                    {stats.map((s, i) => (
                      <th key={s.athlete.id} className="text-center py-2 px-4 font-semibold" style={{ color: COLORS[i] }}>
                        {s.athlete.full_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">Presenze</td>
                    {stats.map(s => (
                      <td key={s.athlete.id} className="text-center font-bold">{s.attendance_pct}%</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">Carico 7gg</td>
                    {stats.map(s => (
                      <td key={s.athlete.id} className="text-center font-bold">{s.weekly_load} AU</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">Stato</td>
                    {stats.map(s => {
                      const labels: Record<string, string> = { available: 'Disponibile', attention: 'Attenzione', unavailable: 'Indisponibile' }
                      return <td key={s.athlete.id} className="text-center font-medium">{labels[s.athlete.status] || s.athlete.status}</td>
                    })}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">Infortuni attivi</td>
                    {stats.map(s => (
                      <td key={s.athlete.id} className={clsx('text-center font-bold', s.active_injuries.length > 0 ? 'text-red-600' : 'text-green-600')}>
                        {s.active_injuries.length}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Evaluation chart */}
          {evalData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Valutazioni (media)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={evalData} barGap={4}>
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip />
                  {stats.map((s, i) => (
                    <Bar key={s.athlete.id} dataKey={s.athlete.full_name} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Wellness chart */}
          {wellnessData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Wellness (media)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={wellnessData} barGap={4}>
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip />
                  {stats.map((s, i) => (
                    <Bar key={s.athlete.id} dataKey={s.athlete.full_name} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
