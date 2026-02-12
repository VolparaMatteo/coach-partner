import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import api from '@/api/client'
import type { Team, TrainingSession, Match } from '@/types'
import {
  Calendar, Trophy, Users, Plus, AlertTriangle,
  ChevronRight, Clock, Zap
} from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

export default function HomePage() {
  const { user } = useAuthStore()
  const [teams, setTeams] = useState<Team[]>([])
  const [todaySessions, setTodaySessions] = useState<TrainingSession[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: teamsData } = await api.get('/teams')
        setTeams(teamsData.teams)

        if (teamsData.teams.length > 0) {
          const teamId = teamsData.teams[0].id
          const [sessions, matches] = await Promise.all([
            api.get(`/trainings?team_id=${teamId}`),
            api.get(`/matches?team_id=${teamId}`),
          ])
          setTodaySessions(sessions.data.sessions?.slice(0, 3) || [])
          setUpcomingMatches(matches.data.matches?.filter((m: Match) => m.status === 'upcoming').slice(0, 3) || [])
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Oggi'
    if (isTomorrow(date)) return 'Domani'
    return format(date, 'd MMM', { locale: it })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Ciao, {user?.first_name}!
        </h1>
        <p className="text-gray-500">La tua cabina di regia</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/trainings" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Plus size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">Crea Allenamento</p>
            <p className="text-xs text-gray-400">Nuovo piano</p>
          </div>
        </Link>
        <Link to="/matches" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Trophy size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">Crea Gara</p>
            <p className="text-xs text-gray-400">Nuova partita</p>
          </div>
        </Link>
        <Link to="/athletes" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Users size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">Atleti</p>
            <p className="text-xs text-gray-400">{teams[0]?.athletes_count || 0} nella rosa</p>
          </div>
        </Link>
        <Link to="/insights" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Zap size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI Insights</p>
            <p className="text-xs text-gray-400">Report e analisi</p>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-brand-600" />
              Prossimi Allenamenti
            </h2>
            <Link to="/trainings" className="text-sm text-brand-600 hover:underline">
              Tutti <ChevronRight size={14} className="inline" />
            </Link>
          </div>
          {todaySessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun allenamento programmato</p>
              <Link to="/trainings" className="text-brand-600 text-sm font-medium hover:underline mt-2 block">
                Crea il primo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{session.title || 'Allenamento'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {formatDate(session.date)}
                      {session.duration_minutes && ` - ${session.duration_minutes} min`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    session.status === 'completed' ? 'bg-green-100 text-green-700' :
                    session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {session.status === 'completed' ? 'Completato' :
                     session.status === 'in_progress' ? 'In corso' : 'Pianificato'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Matches */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Trophy size={18} className="text-orange-600" />
              Prossime Gare
            </h2>
            <Link to="/matches" className="text-sm text-brand-600 hover:underline">
              Tutte <ChevronRight size={14} className="inline" />
            </Link>
          </div>
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Trophy size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessuna gara in programma</p>
              <Link to="/matches" className="text-brand-600 text-sm font-medium hover:underline mt-2 block">
                Aggiungi gara
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map(match => (
                <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">vs {match.opponent}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(match.date)} - {match.home_away === 'home' ? 'Casa' : 'Trasferta'}
                    </p>
                  </div>
                  {match.competition && (
                    <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs">
                      {match.competition}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Overview */}
      {teams.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-green-600" />
            Le tue Squadre
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team.id} className="p-4 bg-gray-50 rounded-xl">
                <p className="font-semibold">{team.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {team.category || team.sport} - {team.athletes_count} atleti
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
