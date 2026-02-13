import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { TrainingLoadData } from '@/types'
import { useTeamStore } from '@/store/team'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Activity, AlertTriangle, TrendingUp, Users, Gauge } from 'lucide-react'
import clsx from 'clsx'

const riskStyles: Record<string, { bg: string; text: string; border: string }> = {
  undertraining: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  optimal: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  caution: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  danger: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
}

export default function TrainingLoadMonitor() {
  const { activeTeamId } = useTeamStore()
  const [data, setData] = useState<TrainingLoadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAthletes, setShowAthletes] = useState(false)

  useEffect(() => {
    if (!activeTeamId) return
    setLoading(true)
    api.get(`/dashboard/training-load/${activeTeamId}`)
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeTeamId])

  if (loading) return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  )

  if (!data) return null

  const risk = riskStyles[data.risk] || riskStyles.optimal

  // ACWR gauge position (0-2 range mapped to 0-100%)
  const acwrPct = Math.min(Math.max((data.acwr / 2) * 100, 0), 100)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Activity size={18} /> Training Load
      </h3>

      {/* ACWR Gauge + Risk */}
      <div className={clsx('rounded-xl border p-4', risk.bg, risk.border)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">ACWR (Acute:Chronic)</p>
            <p className={clsx('text-3xl font-bold', risk.text)}>{data.acwr}</p>
          </div>
          <div className="text-right">
            <div className={clsx('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium', risk.bg, risk.text)}>
              {data.risk === 'danger' && <AlertTriangle size={14} />}
              {data.risk_label}
            </div>
          </div>
        </div>

        {/* ACWR visual bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-[40%] w-[25%] bg-green-200 dark:bg-green-800/50" />
          <div className="absolute inset-y-0 left-[65%] w-[10%] bg-yellow-200 dark:bg-yellow-800/50" />
          <div className="absolute inset-y-0 left-[75%] bg-red-200 dark:bg-red-800/50 right-0" />
          <div
            className="absolute top-0 w-1 h-full bg-gray-900 dark:bg-white rounded-full"
            style={{ left: `${acwrPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>0</span>
          <span>0.8</span>
          <span>1.3</span>
          <span>1.5</span>
          <span>2.0</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Carico Acuto (7g)</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{data.acute_load}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Carico Cronico (28g)</p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{data.chronic_load}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Monotonia</p>
          <p className={clsx('text-xl font-bold', data.monotony > 2 ? 'text-red-600' : data.monotony > 1.5 ? 'text-yellow-600' : 'text-green-600')}>
            {data.monotony}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Strain</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.strain}</p>
        </div>
      </div>

      {/* Weekly trend chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <TrendingUp size={14} /> Trend Settimanale
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weekly_trend}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="load" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-athlete loads */}
      {data.athlete_loads.length > 0 && (
        <div>
          <button
            onClick={() => setShowAthletes(!showAthletes)}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5 hover:text-brand-600"
          >
            <Users size={14} /> Carico per Atleta {showAthletes ? '▾' : '▸'}
          </button>
          {showAthletes && (
            <div className="mt-2 space-y-1.5">
              {data.athlete_loads.map(a => {
                const maxLoad = Math.max(...data.athlete_loads.map(x => x.load), 1)
                const pct = Math.round((a.load / maxLoad) * 100)
                return (
                  <div key={a.athlete_id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-32 truncate">{a.name}</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all', pct > 80 ? 'bg-red-400' : pct > 60 ? 'bg-orange-400' : 'bg-blue-400')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-16 text-right">
                      {a.load} ({a.sessions}s)
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
