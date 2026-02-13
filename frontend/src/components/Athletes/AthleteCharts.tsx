import { useMemo } from 'react'
import type { Evaluation, WellnessEntry } from '@/types'
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid
} from 'recharts'
import { TrendingUp, Activity, Target } from 'lucide-react'

interface Props {
  evaluations: Evaluation[]
  wellness: WellnessEntry[]
  attendancePct: number
  weeklyLoad: number
}

export default function AthleteCharts({ evaluations, wellness, attendancePct, weeklyLoad }: Props) {
  // Radar chart data from latest evaluation
  const radarData = useMemo(() => {
    const latest = evaluations[0]
    if (!latest) return null
    return [
      { subject: 'Tecnica', value: latest.technical || 0 },
      { subject: 'Tattica', value: latest.tactical || 0 },
      { subject: 'Fisico', value: latest.physical || 0 },
      { subject: 'Mentale', value: latest.mental || 0 },
      { subject: 'Disciplina', value: latest.discipline || 0 },
      { subject: 'Forma', value: latest.form || 0 },
    ].filter(d => d.value > 0)
  }, [evaluations])

  // Evaluation trend over time (last 10)
  const evalTrend = useMemo(() => {
    return evaluations.slice(0, 10).reverse().map(ev => ({
      date: new Date(ev.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      overall: ev.overall || 0,
      technical: ev.technical || 0,
      physical: ev.physical || 0,
    }))
  }, [evaluations])

  // Wellness trend (last 14 entries)
  const wellnessTrend = useMemo(() => {
    return wellness.slice(0, 14).reverse().map(w => ({
      date: new Date(w.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      energy: w.energy || 0,
      sleep: w.sleep_quality || 0,
      stress: w.stress || 0,
      doms: w.doms || 0,
    }))
  }, [wellness])

  if (evaluations.length === 0 && wellness.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
        <Activity size={32} className="mx-auto mb-2 opacity-50" />
        Dati insufficienti per i grafici
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Radar chart - competencies */}
      {radarData && radarData.length >= 3 && (
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
            <Target size={16} className="text-brand-500" /> Profilo Competenze
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Radar name="Valutazione" dataKey="value" stroke="#16a34a" fill="#16a34a" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Evaluation trend */}
      {evalTrend.length >= 2 && (
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-blue-500" /> Evoluzione Valutazioni
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                <Line type="monotone" dataKey="overall" stroke="#16a34a" strokeWidth={2} name="Complessivo" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="technical" stroke="#3b82f6" strokeWidth={1.5} name="Tecnica" dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="physical" stroke="#f59e0b" strokeWidth={1.5} name="Fisico" dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Wellness trend */}
      {wellnessTrend.length >= 2 && (
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
            <Activity size={16} className="text-purple-500" /> Trend Wellness
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wellnessTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                <Bar dataKey="energy" fill="#22c55e" name="Energia" radius={[2, 2, 0, 0]} />
                <Bar dataKey="sleep" fill="#3b82f6" name="Sonno" radius={[2, 2, 0, 0]} />
                <Bar dataKey="stress" fill="#ef4444" name="Stress" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
