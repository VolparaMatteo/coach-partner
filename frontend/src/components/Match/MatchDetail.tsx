import { useState, useEffect } from 'react'
import api from '@/api/client'
import type { Match, Athlete, SportConfig } from '@/types'
import {
  ArrowLeft, Shield, Swords, Users, ClipboardList, Check,
  MapPin, Clock, Zap, Star, ChevronRight, Save, X
} from 'lucide-react'
import clsx from 'clsx'

interface Props {
  match: Match
  teamId: number
  sportConfig: SportConfig | null
  onBack: () => void
  onUpdate: (match: Match) => void
}

type Tab = 'plan' | 'opponent' | 'checklist' | 'roster' | 'result' | 'ratings'

export default function MatchDetail({ match, teamId, sportConfig, onBack, onUpdate }: Props) {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [activeTab, setActiveTab] = useState<Tab>(match.status === 'completed' ? 'result' : 'plan')
  const [loading, setLoading] = useState(true)

  // Game plan
  const [attackPrinciples, setAttackPrinciples] = useState('')
  const [defensePrinciples, setDefensePrinciples] = useState('')
  const [individualFocus, setIndividualFocus] = useState('')

  // Opponent analysis
  const [oppStrengths, setOppStrengths] = useState('')
  const [oppWeaknesses, setOppWeaknesses] = useState('')
  const [oppKeyPlayers, setOppKeyPlayers] = useState('')
  const [oppNotes, setOppNotes] = useState('')

  // Checklist
  const [checklist, setChecklist] = useState([
    { label: 'Logistica (trasporto, campo)', done: false },
    { label: 'Briefing pre-partita', done: false },
    { label: 'Warm-up pianificato', done: false },
    { label: 'Attrezzatura pronta', done: false },
    { label: 'Compiti staff assegnati', done: false },
  ])

  // Called up
  const [calledUp, setCalledUp] = useState<number[]>([])

  // Post-match
  const [scoreHome, setScoreHome] = useState(match.score_home?.toString() || '')
  const [scoreAway, setScoreAway] = useState(match.score_away?.toString() || '')
  const [postWhatWorked, setPostWhatWorked] = useState(match.what_worked || '')
  const [postWhatNot, setPostWhatNot] = useState(match.what_didnt_work || '')
  const [keyMoments, setKeyMoments] = useState(match.key_moments || '')

  // Quick player ratings
  const [playerRatings, setPlayerRatings] = useState<Record<number, number>>({})
  const [playerMinutes, setPlayerMinutes] = useState<Record<number, string>>({})

  const [generating, setGenerating] = useState(false)
  const [aiReport, setAiReport] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/athletes?team_id=${teamId}`).then(({ data }) => {
      setAthletes(data.athletes)
      setLoading(false)
    })
    // Parse existing data
    try {
      const gp = match.game_plan ? JSON.parse(match.game_plan) : {}
      setAttackPrinciples(gp.attack || '')
      setDefensePrinciples(gp.defense || '')
      setIndividualFocus(gp.individual || '')
    } catch {}
    try {
      const oa = match.opponent_analysis ? JSON.parse(match.opponent_analysis) : {}
      setOppStrengths(oa.strengths || '')
      setOppWeaknesses(oa.weaknesses || '')
      setOppKeyPlayers(oa.key_players || '')
      setOppNotes(oa.notes || '')
    } catch {}
    try {
      const cu = match.called_up ? JSON.parse(match.called_up) : []
      setCalledUp(cu)
    } catch {}
  }, [match, teamId])

  const saveGamePlan = async () => {
    const { data } = await api.patch(`/matches/${match.id}`, {
      game_plan: { attack: attackPrinciples, defense: defensePrinciples, individual: individualFocus },
      opponent_analysis: { strengths: oppStrengths, weaknesses: oppWeaknesses, key_players: oppKeyPlayers, notes: oppNotes },
      called_up: calledUp,
    })
    onUpdate(data.match)
  }

  const toggleCalledUp = (id: number) => {
    setCalledUp(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const toggleChecklist = (index: number) => {
    setChecklist(prev => prev.map((c, i) => i === index ? { ...c, done: !c.done } : c))
  }

  const savePostMatch = async () => {
    const sh = parseInt(scoreHome)
    const sa = parseInt(scoreAway)
    const result = !isNaN(sh) && !isNaN(sa) ? (sh > sa ? 'win' : sh < sa ? 'loss' : 'draw') : null

    const { data } = await api.patch(`/matches/${match.id}`, {
      status: 'completed',
      score_home: !isNaN(sh) ? sh : null,
      score_away: !isNaN(sa) ? sa : null,
      result,
      what_worked: postWhatWorked,
      what_didnt_work: postWhatNot,
      key_moments: keyMoments,
      minutes_played: playerMinutes,
    })

    // Save quick ratings as evaluations
    for (const [athleteId, rating] of Object.entries(playerRatings)) {
      await api.post('/evaluations', {
        athlete_id: parseInt(athleteId),
        match_id: match.id,
        date: match.date,
        overall: rating,
      })
    }

    onUpdate(data.match)
  }

  const generatePostMatchReport = async () => {
    setGenerating(true)
    try {
      const { data } = await api.post('/ai/generate/post-match', { match_id: match.id })
      setAiReport(data.report.content)
    } catch {
      setAiReport('AI non configurata.')
    }
    setGenerating(false)
  }

  const preTabs: { value: Tab; label: string; icon: any }[] = [
    { value: 'plan', label: 'Piano Gara', icon: Swords },
    { value: 'opponent', label: 'Avversario', icon: Shield },
    { value: 'roster', label: 'Convocati', icon: Users },
    { value: 'checklist', label: 'Checklist', icon: ClipboardList },
    { value: 'result', label: 'Risultato', icon: Star },
    { value: 'ratings', label: 'Valutazioni', icon: Zap },
  ]

  if (loading) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Torna alle gare
      </button>

      {/* Match header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">vs {match.opponent}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>{new Date(match.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              {match.venue && <span className="flex items-center gap-1"><MapPin size={14} /> {match.venue}</span>}
              <span>{match.home_away === 'home' ? 'Casa' : 'Trasferta'}</span>
            </div>
          </div>
          {match.status === 'completed' && match.score_home != null && (
            <div className={clsx('text-4xl font-bold',
              match.result === 'win' ? 'text-green-600' : match.result === 'loss' ? 'text-red-600' : 'text-gray-600'
            )}>
              {match.score_home} - {match.score_away}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {preTabs.map(t => (
          <button key={t.value} onClick={() => setActiveTab(t.value)}
            className={clsx('flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === t.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'plan' && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Piano Gara</h3>
          <div>
            <label className="label">Principi Attacco</label>
            <textarea className="input-field" rows={3} placeholder="Come vogliamo attaccare..."
              value={attackPrinciples} onChange={(e) => setAttackPrinciples(e.target.value)} />
          </div>
          <div>
            <label className="label">Principi Difesa</label>
            <textarea className="input-field" rows={3} placeholder="Come vogliamo difendere..."
              value={defensePrinciples} onChange={(e) => setDefensePrinciples(e.target.value)} />
          </div>
          <div>
            <label className="label">Focus Individuali</label>
            <textarea className="input-field" rows={2} placeholder="Compiti individuali specifici..."
              value={individualFocus} onChange={(e) => setIndividualFocus(e.target.value)} />
          </div>
          <button onClick={saveGamePlan} className="btn-primary flex items-center gap-2"><Save size={16} /> Salva Piano</button>
        </div>
      )}

      {activeTab === 'opponent' && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Analisi Avversario</h3>
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="label">Punti di Forza</label>
              <textarea className="input-field" rows={3} value={oppStrengths}
                onChange={(e) => setOppStrengths(e.target.value)} placeholder="Cosa fanno bene..." />
            </div>
            <div>
              <label className="label">Punti Deboli</label>
              <textarea className="input-field" rows={3} value={oppWeaknesses}
                onChange={(e) => setOppWeaknesses(e.target.value)} placeholder="Dove possiamo colpire..." />
            </div>
          </div>
          <div>
            <label className="label">Giocatori Chiave</label>
            <input className="input-field" value={oppKeyPlayers}
              onChange={(e) => setOppKeyPlayers(e.target.value)} placeholder="es. #10 play veloce, #5 pivot fisico" />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input-field" rows={2} value={oppNotes}
              onChange={(e) => setOppNotes(e.target.value)} placeholder="Altre osservazioni..." />
          </div>
          <button onClick={saveGamePlan} className="btn-primary flex items-center gap-2"><Save size={16} /> Salva</button>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Convocati ({calledUp.length}/{athletes.length})</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {athletes.map(a => (
              <button key={a.id} onClick={() => toggleCalledUp(a.id)}
                className={clsx('flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left',
                  calledUp.includes(a.id) ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                )}>
                <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  calledUp.includes(a.id) ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
                )}>
                  {calledUp.includes(a.id) ? <Check size={14} /> : a.jersey_number || '?'}
                </div>
                <div>
                  <p className="font-medium text-sm">{a.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {sportConfig?.positions.find(p => p.value === a.position)?.label || ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={saveGamePlan} className="btn-primary mt-4 flex items-center gap-2"><Save size={16} /> Salva Convocati</button>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Checklist Pre-Partita</h3>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <button key={i} onClick={() => toggleChecklist(i)}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <div className={clsx('w-6 h-6 rounded-lg flex items-center justify-center border-2',
                  item.done ? 'bg-brand-600 border-brand-600' : 'border-gray-300'
                )}>
                  {item.done && <Check size={14} className="text-white" />}
                </div>
                <span className={clsx('text-sm', item.done && 'line-through text-gray-400')}>{item.label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-4">
            {checklist.filter(c => c.done).length}/{checklist.length} completati
          </p>
        </div>
      )}

      {activeTab === 'result' && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Risultato e Note Post-Gara</h3>
          <div className="flex items-center gap-4 justify-center py-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Noi</p>
              <input type="number" className="input-field w-20 text-3xl font-bold text-center" value={scoreHome}
                onChange={(e) => setScoreHome(e.target.value)} />
            </div>
            <span className="text-3xl text-gray-300 font-bold">-</span>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{match.opponent}</p>
              <input type="number" className="input-field w-20 text-3xl font-bold text-center" value={scoreAway}
                onChange={(e) => setScoreAway(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Cosa ha funzionato</label>
            <textarea className="input-field" rows={3} value={postWhatWorked}
              onChange={(e) => setPostWhatWorked(e.target.value)} />
          </div>
          <div>
            <label className="label">Cosa non ha funzionato</label>
            <textarea className="input-field" rows={3} value={postWhatNot}
              onChange={(e) => setPostWhatNot(e.target.value)} />
          </div>
          <div>
            <label className="label">Momenti chiave</label>
            <textarea className="input-field" rows={2} value={keyMoments}
              onChange={(e) => setKeyMoments(e.target.value)} />
          </div>
          <button onClick={savePostMatch} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save size={16} /> Salva Risultato
          </button>
          {match.status === 'completed' && (
            <div className="border-t pt-4">
              {!aiReport && !generating ? (
                <button onClick={generatePostMatchReport} className="btn-secondary w-full flex items-center justify-center gap-2">
                  <Zap size={16} /> Genera Report AI Post-Gara
                </button>
              ) : generating ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-sm">{aiReport}</div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ratings' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Valutazioni Rapide & Minuti</h3>
          <div className="space-y-2 max-h-[500px] overflow-auto">
            {athletes.filter(a => calledUp.length === 0 || calledUp.includes(a.id)).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="font-medium text-sm w-32 truncate">{a.full_name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 mr-1">Voto:</span>
                  {[4,5,6,7,8,9,10].map(v => (
                    <button key={v} onClick={() => setPlayerRatings(prev => ({ ...prev, [a.id]: v }))}
                      className={clsx('w-7 h-7 rounded-lg text-xs font-bold',
                        playerRatings[a.id] === v ? (v >= 7 ? 'bg-green-600 text-white' : v >= 6 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white')
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
                      )}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <Clock size={14} className="text-gray-400" />
                  <input type="number" className="input-field w-16 text-sm py-1 px-2" placeholder="min"
                    value={playerMinutes[a.id] || ''}
                    onChange={(e) => setPlayerMinutes(prev => ({ ...prev, [a.id]: e.target.value }))} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={savePostMatch} className="btn-primary w-full mt-4">
            <Save className="inline mr-2" size={16} /> Salva Valutazioni
          </button>
        </div>
      )}
    </div>
  )
}
