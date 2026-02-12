import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Athlete, Evaluation, WellnessEntry, Note, SportConfig } from '@/types'
import {
  ArrowLeft, UserCircle, Activity, Target, FileText,
  TrendingUp, TrendingDown, AlertTriangle, Heart, Brain,
  Zap, Shield, Plus, Send
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
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluations' | 'wellness' | 'notes'>('overview')

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
    // Refresh
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
    available: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Disponibile', icon: '✓' },
    attention: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Attenzione', icon: '!' },
    unavailable: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Indisponibile', icon: '✕' },
  }

  const st = statusConfig[athlete.status] || statusConfig.available

  // Wellness trend (last 3 days avg vs previous 3 days)
  const recentWellness = wellness.slice(0, 3)
  const olderWellness = wellness.slice(3, 6)
  const avgRecent = recentWellness.length > 0
    ? recentWellness.reduce((s, w) => s + (w.energy || 5), 0) / recentWellness.length
    : null
  const avgOlder = olderWellness.length > 0
    ? olderWellness.reduce((s, w) => s + (w.energy || 5), 0) / olderWellness.length
    : null
  const wellnessTrend = avgRecent && avgOlder ? (avgRecent > avgOlder ? 'up' : avgRecent < avgOlder ? 'down' : 'stable') : 'unknown'

  // Last evaluation averages
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
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Torna alla lista
      </button>

      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-3xl shrink-0">
            {athlete.jersey_number || <UserCircle size={40} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{athlete.full_name}</h1>
              <span className={clsx('px-3 py-1 rounded-lg text-sm font-medium border', st.color)}>
                {st.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              {sportConfig?.positions.find(p => p.value === athlete.position)?.label || athlete.position || 'N/D'}
              {athlete.secondary_position && ` / ${sportConfig?.positions.find(p => p.value === athlete.secondary_position)?.label || athlete.secondary_position}`}
            </p>
            {active_injuries.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertTriangle size={14} />
                {active_injuries.map(i => i.injury_type).join(', ')} — {active_injuries[0].body_part}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">{attendance_pct}%</p>
            <p className="text-xs text-gray-500 mt-1">Presenze</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{weekly_load}</p>
            <p className="text-xs text-gray-500 mt-1">Carico 7gg (AU)</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center flex flex-col items-center">
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold text-purple-600">{evalAvg || '-'}</p>
              <span className="text-sm text-gray-400">/10</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Ultima Valutazione</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center flex flex-col items-center">
            <div className="flex items-center gap-1">
              {wellnessTrend === 'up' && <TrendingUp size={24} className="text-green-600" />}
              {wellnessTrend === 'down' && <TrendingDown size={24} className="text-red-600" />}
              {wellnessTrend === 'stable' && <Activity size={24} className="text-yellow-600" />}
              {wellnessTrend === 'unknown' && <Activity size={24} className="text-gray-400" />}
            </div>
            <p className="text-xs text-gray-500 mt-1">Trend Wellness</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['overview', 'evaluations', 'wellness', 'notes'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={clsx('flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}>
            {tab === 'overview' ? 'Panoramica' : tab === 'evaluations' ? 'Valutazioni' : tab === 'wellness' ? 'Wellness' : 'Note'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Objectives */}
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Target size={18} /> Obiettivi</h3>
            {athlete.objectives ? (
              <div className="space-y-2 text-sm">
                {(() => {
                  try { const obj = JSON.parse(athlete.objectives); return Object.entries(obj).map(([k, v]) => (
                    <div key={k} className="flex gap-2"><span className="font-medium capitalize text-gray-600 w-20">{k}:</span><span>{String(v)}</span></div>
                  ))} catch { return <p className="text-gray-500">{athlete.objectives}</p> }
                })()}
              </div>
            ) : <p className="text-gray-400 text-sm">Nessun obiettivo impostato</p>}
          </div>

          {/* Physical info */}
          <div className="card">
            <h3 className="font-semibold mb-3">Info Fisiche</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {athlete.height_cm && <div><span className="text-gray-500">Altezza:</span> <span className="font-medium">{athlete.height_cm} cm</span></div>}
              {athlete.weight_kg && <div><span className="text-gray-500">Peso:</span> <span className="font-medium">{athlete.weight_kg} kg</span></div>}
              {athlete.dominant_foot && <div><span className="text-gray-500">Piede:</span> <span className="font-medium capitalize">{athlete.dominant_foot}</span></div>}
              {athlete.dominant_hand && <div><span className="text-gray-500">Mano:</span> <span className="font-medium capitalize">{athlete.dominant_hand}</span></div>}
              {athlete.birth_date && <div><span className="text-gray-500">Nato:</span> <span className="font-medium">{new Date(athlete.birth_date).toLocaleDateString('it-IT')}</span></div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={18} /> Ultime Valutazioni</h3>
          {evaluations.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">Nessuna valutazione</p>
          ) : (
            <div className="space-y-3">
              {evaluations.map(ev => (
                <div key={ev.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString('it-IT')}</span>
                    {ev.overall && <span className="font-bold text-lg text-brand-600">{ev.overall}/10</span>}
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
                  {ev.comment && <p className="text-sm text-gray-600 mt-2 italic">{ev.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wellness' && (
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Heart size={18} /> Wellness Ultimi 7 Giorni</h3>
          {wellness.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">Nessun dato wellness</p>
          ) : (
            <div className="space-y-3">
              {wellness.map(w => (
                <div key={w.id} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-2">{new Date(w.date).toLocaleDateString('it-IT')}</p>
                  <div className="grid grid-cols-5 gap-4">
                    {[
                      { label: 'Energia', value: w.energy },
                      { label: 'Sonno', value: w.sleep_quality },
                      { label: 'Stress', value: w.stress },
                      { label: 'DOMS', value: w.doms },
                      { label: 'Dolore', value: w.pain },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <p className="text-xs text-gray-400">{m.label}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={clsx('h-2 rounded-full', (m.value || 0) >= 7 ? 'bg-green-500' : (m.value || 0) >= 4 ? 'bg-yellow-500' : 'bg-red-500')}
                            style={{ width: `${((m.value || 0) / 10) * 100}%` }}
                          />
                        </div>
                        <p className="font-bold text-sm mt-1">{m.value || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <p className="text-gray-400 text-sm py-4 text-center">Nessuna nota</p>
          ) : (
            <div className="space-y-2">
              {notes.map(n => (
                <div key={n.id} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('it-IT')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
