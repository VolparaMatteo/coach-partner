import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Team, Athlete, SportConfig } from '@/types'
import { useAuthStore } from '@/store/auth'
import { Users, Plus, Search, X, UserCircle } from 'lucide-react'
import clsx from 'clsx'

export default function AthletesPage() {
  const { user } = useAuthStore()
  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [sportConfig, setSportConfig] = useState<SportConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newAthlete, setNewAthlete] = useState({
    first_name: '', last_name: '', jersey_number: '', position: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/teams')
      setTeams(data.teams)
      if (data.teams.length > 0) {
        setActiveTeamId(data.teams[0].id)
      }
      if (user?.sport) {
        const { data: sc } = await api.get(`/onboarding/sport-config/${user.sport}`)
        setSportConfig(sc.config)
      }
      setLoading(false)
    }
    load()
  }, [user?.sport])

  useEffect(() => {
    if (activeTeamId) {
      api.get(`/athletes?team_id=${activeTeamId}`).then(({ data }) => {
        setAthletes(data.athletes)
      })
    }
  }, [activeTeamId])

  const handleAdd = async () => {
    if (!newAthlete.first_name || !newAthlete.last_name || !activeTeamId) return
    const { data } = await api.post('/athletes', {
      team_id: activeTeamId,
      ...newAthlete,
      jersey_number: newAthlete.jersey_number ? parseInt(newAthlete.jersey_number) : null,
    })
    setAthletes(prev => [...prev, data.athlete])
    setNewAthlete({ first_name: '', last_name: '', jersey_number: '', position: '' })
    setShowAdd(false)
  }

  const filteredAthletes = athletes.filter(a =>
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700'
      case 'attention': return 'bg-yellow-100 text-yellow-700'
      case 'unavailable': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponibile'
      case 'attention': return 'Attenzione'
      case 'unavailable': return 'Indisponibile'
      default: return status
    }
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
            <Users size={24} /> Atleti
          </h1>
          <p className="text-gray-500 text-sm">{athletes.length} atleti in rosa</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Aggiungi
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-11"
          placeholder="Cerca atleta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add athlete modal */}
      {showAdd && (
        <div className="card border-brand-200 border-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Nuovo Atleta</h3>
            <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <input className="input-field" placeholder="Nome *" value={newAthlete.first_name}
              onChange={(e) => setNewAthlete(p => ({ ...p, first_name: e.target.value }))} />
            <input className="input-field" placeholder="Cognome *" value={newAthlete.last_name}
              onChange={(e) => setNewAthlete(p => ({ ...p, last_name: e.target.value }))} />
            <input className="input-field" placeholder="Numero" value={newAthlete.jersey_number}
              onChange={(e) => setNewAthlete(p => ({ ...p, jersey_number: e.target.value }))} />
            <select className="input-field" value={newAthlete.position}
              onChange={(e) => setNewAthlete(p => ({ ...p, position: e.target.value }))}>
              <option value="">Ruolo</option>
              {sportConfig?.positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} className="btn-primary mt-4">Aggiungi Atleta</button>
        </div>
      )}

      {/* Athletes grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAthletes.map(athlete => (
          <div key={athlete.id} className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                {athlete.jersey_number || <UserCircle size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{athlete.full_name}</p>
                <p className="text-sm text-gray-500">
                  {sportConfig?.positions.find(p => p.value === athlete.position)?.label || athlete.position || 'Ruolo N/D'}
                </p>
                <span className={clsx('inline-block px-2 py-0.5 rounded-lg text-xs font-medium mt-2', statusColor(athlete.status))}>
                  {statusLabel(athlete.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAthletes.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>{search ? 'Nessun risultato' : 'Nessun atleta. Aggiungine uno!'}</p>
        </div>
      )}
    </div>
  )
}
