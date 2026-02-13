import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Athlete, Evaluation, WellnessEntry, Note, SportConfig } from '@/types'
import InjuryManager from '@/components/Injuries/InjuryManager'
import WellnessDashboard from '@/components/Wellness/WellnessDashboard'
import PhotoUpload from '@/components/Athletes/PhotoUpload'
import AthleteCharts from '@/components/Athletes/AthleteCharts'
import ActivityTimeline from '@/components/Athletes/ActivityTimeline'
import GoalTracker from '@/components/Athletes/GoalTracker'
import { exportAthletePDF } from '@/utils/pdfExport'
import {
  ArrowLeft, UserCircle, Activity, Target, FileText,
  TrendingUp, TrendingDown, AlertTriangle, Heart, Brain,
  Zap, Shield, Plus, Send, Download
} from 'lucide-react'
import clsx from 'clsx'

interface AthleteData {
  athlete: Athlete
  wellness: WellnessEntry[]
  evaluations: Evaluation[]
  attendance_pct: number
  total_sessions: number
  sessions_attended: number
  active_injuries: any[]
  notes: Note[]
  weekly_load: number
}

interface Props {
  athleteId: number
  sportConfig: SportConfig | null
  onBack: () => void
}

export default function AthleteDetail({ athleteId, sportConfig, onBack }: Props) {
  const [data, setData] = useState<AthleteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluations' | 'wellness' | 'injuries' | 'notes' | 'goals' | 'timeline'>('overview')

  useEffect(() => {
    api.get(`/dashboard/athlete/${athleteId}`).then(({ data }) => {
      setData(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [athleteId])

  const addNote = async () => {
    if (!newNote.trim()) return
    await api.post('/notes', {
      entity_type: 'athlete',
      entity_id: athleteId,
      text: newNote.trim(),
      is_quick_note: true,
    })
    setNewNote('')
    const { data: refreshed } = await api.get(`/dashboard/athlete/${athleteId}`)
    setData(refreshed)
  }

  if (loading || !data) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
    </div>
  }

  const { athlete, wellness, evaluations, attendance_pct, active_injuries, notes, weekly_load } = data

  const statusConfig = {
    available: { color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700', label: 'Disponibile' },
    attention: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700', label: 'Attenzione' },
    unavailable: { color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700', label: 'Indisponibile' },
  }

  const st = statusConfig[athlete.status] || statusConfig.available

  const recentWellness = wellness.slice(0, 3)
  const olderWellness = wellness.slice(3, 6)
  const avgRecent = recentWellness.length > 0
    ? recentWellness.reduce((s, w) => s + (w.energy || 5), 0) / recentWellness.length
    : null
  const avgOlder = olderWellness.length > 0
    ? olderWellness.reduce((s, w) => s + (w.energy || 5), 0) / olderWellness.length
    : null
  const wellnessTrend = avgRecent && avgOlder ? (avgRecent > avgOlder ? 'up' : avgRecent < avgOlder ? 'down' : 'stable') : 'unknown'

  const lastEval = evaluations[0]
  const evalAvg = lastEval ? Math.round(
    ([lastEval.technical, lastEval.tactical, lastEval.physical, lastEval.mental]
      .filter(Boolean) as number[])
      .reduce((a, b) => a + b, 0) /
    [lastEval.technical, lastEval.tactical, lastEval.physical, lastEval.mental].filter(Boolean).length
  ) : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
          <ArrowLeft size={16} /> Torna alla lista
        </button>
        <button
          onClick={() => exportAthletePDF(athlete, { attendance_pct, weekly_load })}
          className="btn-secondary text-sm py-2 px-3 flex items-center gap-2"
        >
          <Download size={14} /> Esporta PDF
        </button>
      </div>

      <div className="card">
        <div className="flex items-start gap-4">
          <PhotoUpload
            athleteId={athlete.id}
            currentPhotoUrl={athlete.photo_url}
            onPhotoUpdated={(url) => setData(prev => prev ? { ...prev, athlete: { ...prev.athlete, photo_url: url } } : null)}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{athlete.full_name}</h1>
              <span className={clsx('px-3 py-1 rounded-lg text-sm font-medium border', st.color)}>
                {st.label}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {sportConfig?.positions.find(p => p.value === athlete.position)?.label || athlete.position || 'N/D'}
              {athlete.secondary_position && ` / ${sportConfig?.positions.find(p => p.value === athlete.secondary_position)?.label || athlete.secondary_position}`}
            </p>
            {active_injuries.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400 text-sm">
                <AlertTriangle size={14} />
                {active_injuries.map((i: any) => i.injury_type).join(', ')} — {active_injuries[0].body_part}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{attendance_pct}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Presenze</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{weekly_load}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Carico 7gg (AU)</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center flex flex-col items-center">
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{evalAvg || '-'}</p>
              <span className="text-sm text-gray-400">/10</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ultima Valutazione</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center flex flex-col items-center">
            <div className="flex items-center gap-1">
              {wellnessTrend === 'up' && <TrendingUp size={24} className="text-green-600" />}
              {wellnessTrend === 'down' && <TrendingDown size={24} className="text-red-600" />}
              {wellnessTrend === 'stable' && <Activity size={24} className="text-yellow-600" />}
              {wellnessTrend === 'unknown' && <Activity size={24} className="text-gray-400" />}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Trend Wellness</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'overview' as const, label: 'Panoramica' },
          { key: 'evaluations' as const, label: 'Valutazioni' },
          { key: 'wellness' as const, label: 'Wellness' },
          { key: 'goals' as const, label: 'Obiettivi' },
          { key: 'injuries' as const, label: 'Infortuni' },
          { key: 'notes' as const, label: 'Note' },
          { key: 'timeline' as const, label: 'Timeline' },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={clsx('flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap px-3',
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}>
            {tab.label}
            {tab.key === 'injuries' && active_injuries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs">
                {active_injuries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Target size={18} /> Obiettivi</h3>
            {athlete.objectives ? (
              <div className="space-y-2 text-sm">
                {(() => {
                  try { const obj = JSON.parse(athlete.objectives); return Object.entries(obj).map(([k, v]) => (
                    <div key={k} className="flex gap-2"><span className="font-medium capitalize text-gray-600 dark:text-gray-400 w-20">{k}:</span><span>{String(v)}</span></div>
                  ))} catch { return <p className="text-gray-500 dark:text-gray-400">{athlete.objectives}</p> }
                })()}
              </div>
            ) : <p className="text-gray-400 dark:text-gray-500 text-sm">Nessun obiettivo impostato</p>}
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Info Fisiche</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {athlete.height_cm && <div><span className="text-gray-500 dark:text-gray-400">Altezza:</span> <span className="font-medium">{athlete.height_cm} cm</span></div>}
              {athlete.weight_kg && <div><span className="text-gray-500 dark:text-gray-400">Peso:</span> <span className="font-medium">{athlete.weight_kg} kg</span></div>}
              {athlete.dominant_foot && <div><span className="text-gray-500 dark:text-gray-400">Piede:</span> <span className="font-medium capitalize">{athlete.dominant_foot}</span></div>}
              {athlete.dominant_hand && <div><span className="text-gray-500 dark:text-gray-400">Mano:</span> <span className="font-medium capitalize">{athlete.dominant_hand}</span></div>}
              {athlete.birth_date && <div><span className="text-gray-500 dark:text-gray-400">Nato:</span> <span className="font-medium">{new Date(athlete.birth_date).toLocaleDateString('it-IT')}</span></div>}
            </div>
          </div>
          {/* Charts */}
          <div className="card lg:col-span-2">
            <AthleteCharts
              evaluations={evaluations}
              wellness={wellness}
              attendancePct={attendance_pct}
              weeklyLoad={weekly_load}
            />
          </div>
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={18} /> Ultime Valutazioni</h3>
          {evaluations.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">Nessuna valutazione</p>
          ) : (
            <div className="space-y-3">
              {evaluations.map(ev => (
                <div key={ev.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(ev.date).toLocaleDateString('it-IT')}</span>
                    {ev.overall && <span className="font-bold text-lg text-brand-600 dark:text-brand-400">{ev.overall}/10</span>}
                  </div>
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      { label: 'Tecnica', value: ev.technical, icon: Target },
                      { label: 'Tattica', value: ev.tactical, icon: Shield },
                      { label: 'Fisico', value: ev.physical, icon: Zap },
                      { label: 'Mentale', value: ev.mental, icon: Brain },
                      { label: 'Disciplina', value: ev.discipline, icon: Heart },
                      { label: 'Forma', value: ev.form, icon: Activity },
                    ].map(m => m.value ? (
                      <div key={m.label} className="text-center">
                        <p className="text-xs text-gray-400">{m.label}</p>
                        <p className={clsx('font-bold text-lg', m.value >= 7 ? 'text-green-600' : m.value >= 5 ? 'text-yellow-600' : 'text-red-600')}>
                          {m.value}
                        </p>
                      </div>
                    ) : null)}
                  </div>
                  {ev.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">{ev.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wellness' && (
        <div className="card">
          <WellnessDashboard athleteId={athleteId} />
        </div>
      )}

      {activeTab === 'injuries' && (
        <div className="card">
          <InjuryManager athleteId={athleteId} />
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><FileText size={18} /> Note</h3>
          <div className="flex gap-2 mb-4">
            <input className="input-field flex-1" placeholder="Aggiungi una nota..."
              value={newNote} onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()} />
            <button onClick={addNote} className="btn-primary py-2 px-4"><Send size={16} /></button>
          </div>
          {notes.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">Nessuna nota</p>
          ) : (
            <div className="space-y-2">
              {notes.map(n => (
                <div key={n.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('it-IT')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="card">
          <GoalTracker athleteId={athleteId} />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card">
          <ActivityTimeline athleteId={athleteId} />
        </div>
      )}
    </div>
  )
}
