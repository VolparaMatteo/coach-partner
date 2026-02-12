import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { WellnessEntry } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Heart, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  athleteId: number
}

export default function WellnessDashboard({ athleteId }: Props) {
  const [entries, setEntries] = useState<WellnessEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/wellness?athlete_id=${athleteId}`).then(({ data }) => {
      setEntries(data.entries || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [athleteId])

  if (loading) return <div className="text-center py-8 text-gray-400 dark:text-gray-500">Caricamento...</div>

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        <Heart size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nessun dato wellness registrato</p>
      </div>
    )
  }

  // Reverse for chronological order in chart
  const chartData = [...entries].reverse().map(e => ({
    date: new Date(e.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
    Energia: e.energy,
    Sonno: e.sleep_quality,
    Stress: e.stress,
    DOMS: e.doms,
    Dolore: e.pain,
  }))

  // Averages
  const avg = (key: keyof WellnessEntry) => {
    const vals = entries.filter(e => e[key] != null).map(e => e[key] as number)
    return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
  }

  // Trend: compare last 3 vs previous 3
  const trend = (key: keyof WellnessEntry) => {
    const vals = entries.filter(e => e[key] != null).map(e => e[key] as number)
    if (vals.length < 4) return 'stable'
    const recent = vals.slice(0, 3).reduce((a, b) => a + b, 0) / 3
    const older = vals.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(vals.length - 3, 3)
    const diff = recent - older
    // For stress, DOMS, pain — lower is better (inverted)
    const inverted = key === 'stress' || key === 'doms' || key === 'pain'
    if (inverted) return diff < -0.5 ? 'up' : diff > 0.5 ? 'down' : 'stable'
    return diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable'
  }

  const metrics = [
    { key: 'energy' as keyof WellnessEntry, label: 'Energia', color: '#22c55e', good: 'high' },
    { key: 'sleep_quality' as keyof WellnessEntry, label: 'Sonno', color: '#6366f1', good: 'high' },
    { key: 'stress' as keyof WellnessEntry, label: 'Stress', color: '#ef4444', good: 'low' },
    { key: 'doms' as keyof WellnessEntry, label: 'DOMS', color: '#f59e0b', good: 'low' },
    { key: 'pain' as keyof WellnessEntry, label: 'Dolore', color: '#ec4899', good: 'low' },
  ]

  // Alert: any metric trending badly
  const alerts = metrics.filter(m => trend(m.key) === 'down')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Heart size={18} /> Wellness Dashboard
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">Ultimi {entries.length} rilevamenti</span>
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            Attenzione: trend negativo per {alerts.map(a => a.label.toLowerCase()).join(', ')}
          </p>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-5 gap-3">
        {metrics.map(m => {
          const val = avg(m.key)
          const t = trend(m.key)
          const isGood = m.good === 'high' ? (val ?? 0) >= 6 : (val ?? 10) <= 4
          return (
            <div key={m.key} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
              <p className="text-xl font-bold" style={{ color: m.color }}>{val ?? '-'}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {t === 'up' && <TrendingUp size={12} className="text-green-500" />}
                {t === 'down' && <TrendingDown size={12} className="text-red-500" />}
                {t === 'stable' && <span className="text-xs text-gray-400">—</span>}
                <span className={clsx('text-xs', t === 'up' ? 'text-green-600' : t === 'down' ? 'text-red-600' : 'text-gray-400')}>
                  {t === 'up' ? 'In salita' : t === 'down' ? 'In calo' : 'Stabile'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, white)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="Energia" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Sonno" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Stress" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="DOMS" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Dolore" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latest entry detail */}
      {entries[0] && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Ultimo rilevamento — {new Date(entries[0].date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="grid grid-cols-5 gap-4">
            {metrics.map(m => {
              const val = entries[0][m.key] as number | null
              return (
                <div key={m.key}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${((val || 0) / 10) * 100}%`, backgroundColor: m.color }} />
                  </div>
                  <p className="font-bold text-sm mt-0.5" style={{ color: m.color }}>{val ?? '-'}/10</p>
                </div>
              )
            })}
          </div>
          {entries[0].mood && (
            <p className="text-sm mt-2">
              Umore: <span className="font-medium">
                {entries[0].mood === 'great' ? 'Ottimo' : entries[0].mood === 'good' ? 'Buono' : entries[0].mood === 'neutral' ? 'Neutro' : entries[0].mood === 'low' ? 'Basso' : 'Pessimo'}
              </span>
            </p>
          )}
          {entries[0].notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">{entries[0].notes}</p>}
        </div>
      )}
    </div>
  )
}
