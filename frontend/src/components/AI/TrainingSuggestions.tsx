import { useEffect, useState } from 'react'
import api from '@/api/client'
import { useTeamStore } from '@/store/team'
import { Brain, Zap, Clock, Target, AlertTriangle, Heart, Activity, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

interface Suggestions {
  intensity: 'low' | 'medium' | 'high'
  intensity_reason: string
  suggested_duration: number
  focus_areas: string[]
  warnings: string[]
  recovery_score: number
  readiness_score: number
  metrics: {
    avg_energy: number
    avg_stress: number
    injury_count: number
    sessions_this_week: number
    avg_rpe: number | null
  }
}

export default function TrainingSuggestions() {
  const { activeTeamId } = useTeamStore()
  const [data, setData] = useState<Suggestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!activeTeamId) return
    setLoading(true)
    api.get(`/dashboard/suggestions/${activeTeamId}`)
      .then(({ data }) => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeTeamId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
        <Brain size={24} className="mx-auto mb-2 opacity-50" />
        Dati insufficienti per i suggerimenti
      </div>
    )
  }

  const intensityConfig = {
    low: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Bassa', barColor: 'bg-green-500' },
    medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Media', barColor: 'bg-yellow-500' },
    high: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Alta', barColor: 'bg-red-500' },
  }

  const ic = intensityConfig[data.intensity]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain size={18} className="text-purple-600 dark:text-purple-400" /> Suggerimenti AI
        </h3>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
          {expanded ? 'Riduci' : 'Dettagli'}
        </button>
      </div>

      {/* Main suggestion cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <Zap size={20} className="mx-auto mb-1 text-orange-500" />
          <span className={clsx('inline-block px-2 py-0.5 rounded-lg text-xs font-bold', ic.color)}>
            {ic.label}
          </span>
          <p className="text-[10px] text-gray-400 mt-1">Intensità</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <Clock size={20} className="mx-auto mb-1 text-blue-500" />
          <p className="text-lg font-bold">{data.suggested_duration}'</p>
          <p className="text-[10px] text-gray-400">Durata</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart size={16} className="text-red-500" />
            <Activity size={16} className="text-green-500" />
          </div>
          <p className="text-sm font-bold">{data.recovery_score}/{data.readiness_score}</p>
          <p className="text-[10px] text-gray-400">Rec./Pront.</p>
        </div>
      </div>

      {/* Reason */}
      <p className="text-sm text-gray-600 dark:text-gray-400 italic">{data.intensity_reason}</p>

      {/* Focus areas */}
      {data.focus_areas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Target size={14} className="text-brand-500 mt-0.5" />
          {data.focus_areas.map((area, i) => (
            <span key={i} className="px-2 py-0.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-lg text-xs font-medium">
              {area}
            </span>
          ))}
        </div>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="space-y-1">
          {data.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {w}
            </div>
          ))}
        </div>
      )}

      {/* Expanded metrics */}
      {expanded && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Energia media:</span>{' '}
            <span className="font-medium">{data.metrics.avg_energy.toFixed(1)}/10</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Stress medio:</span>{' '}
            <span className="font-medium">{data.metrics.avg_stress.toFixed(1)}/10</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Infortuni attivi:</span>{' '}
            <span className="font-medium">{data.metrics.injury_count}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Sessioni 7gg:</span>{' '}
            <span className="font-medium">{data.metrics.sessions_this_week}</span>
          </div>
          {data.metrics.avg_rpe != null && (
            <div className="text-sm col-span-2">
              <span className="text-gray-500 dark:text-gray-400">RPE medio:</span>{' '}
              <span className="font-medium">{data.metrics.avg_rpe.toFixed(1)}</span>
            </div>
          )}

          {/* Score bars */}
          <div className="col-span-2 space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Recupero</span>
                <span className="font-medium">{data.recovery_score}/10</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${data.recovery_score * 10}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Prontezza</span>
                <span className="font-medium">{data.readiness_score}/10</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${data.readiness_score * 10}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
