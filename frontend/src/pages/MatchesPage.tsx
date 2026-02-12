import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Team, Match } from '@/types'
import { Trophy, Plus, X, MapPin } from 'lucide-react'
import clsx from 'clsx'

export default function MatchesPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    opponent: '',
    competition: '',
    venue: '',
    home_away: 'home',
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/teams')
      setTeams(data.teams)
      if (data.teams.length > 0) setActiveTeamId(data.teams[0].id)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (activeTeamId) {
      api.get(`/matches?team_id=${activeTeamId}`).then(({ data }) => {
        setMatches(data.matches)
      })
    }
  }, [activeTeamId])

  const handleCreate = async () => {
    if (!activeTeamId || !form.opponent || !form.date) return
    const { data } = await api.post('/matches', {
      team_id: activeTeamId,
      ...form,
    })
    setMatches(prev => [data.match, ...prev])
    setForm({ date: new Date().toISOString().split('T')[0], opponent: '', competition: '', venue: '', home_away: 'home' })
    setShowCreate(false)
  }

  const resultBadge = (match: Match) => {
    if (match.status !== 'completed') return null
    const color = match.result === 'win' ? 'bg-green-100 text-green-700' :
                  match.result === 'loss' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
    return (
      <span className={clsx('px-2 py-1 rounded-lg text-sm font-bold', color)}>
        {match.score_home} - {match.score_away}
      </span>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
    </div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy size={24} /> Gare
          </h1>
          <p className="text-gray-500 text-sm">{matches.length} partite</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuova Gara
        </button>
      </div>

      {showCreate && (
        <div className="card border-brand-200 border-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Nuova Gara</h3>
            <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data *</label>
                <input type="date" className="input-field" value={form.date}
                  onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Avversario *</label>
                <input className="input-field" placeholder="es. AC Milan"
                  value={form.opponent} onChange={(e) => setForm(p => ({ ...p, opponent: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Competizione</label>
                <input className="input-field" placeholder="es. Campionato"
                  value={form.competition} onChange={(e) => setForm(p => ({ ...p, competition: e.target.value }))} />
              </div>
              <div>
                <label className="label">Luogo</label>
                <input className="input-field" placeholder="es. Stadio Comunale"
                  value={form.venue} onChange={(e) => setForm(p => ({ ...p, venue: e.target.value }))} />
              </div>
              <div>
                <label className="label">Casa/Trasferta</label>
                <select className="input-field" value={form.home_away}
                  onChange={(e) => setForm(p => ({ ...p, home_away: e.target.value }))}>
                  <option value="home">Casa</option>
                  <option value="away">Trasferta</option>
                  <option value="neutral">Neutro</option>
                </select>
              </div>
            </div>
            <button onClick={handleCreate} className="btn-primary">Crea Gara</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {matches.map(match => (
          <div key={match.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-orange-50 flex flex-col items-center justify-center">
                  <span className="text-xs text-orange-600 font-medium">
                    {new Date(match.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-orange-700">
                    {new Date(match.date + 'T00:00:00').getDate()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">vs {match.opponent}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    {match.competition && <span>{match.competition}</span>}
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {match.home_away === 'home' ? 'Casa' : match.home_away === 'away' ? 'Trasferta' : 'Neutro'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {resultBadge(match)}
                {match.status === 'upcoming' && (
                  <span className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">
                    In programma
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && !showCreate && (
        <div className="text-center py-12 text-gray-400">
          <Trophy size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nessuna gara. Aggiungine una!</p>
        </div>
      )}
    </div>
  )
}
