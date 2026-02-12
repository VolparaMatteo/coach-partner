import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useTeamStore } from '@/store/team'
import api from '@/api/client'
import type { Team, TrainingSession, Match } from '@/types'
import { KPICardSkeleton } from '@/components/Skeleton/Skeleton'
import {
  Calendar, Trophy, Users, Plus, AlertTriangle,
  ChevronRight, Clock, Zap, Activity, TrendingUp,
  CheckCircle, Target, Heart, BarChart3
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, isToday, isTomorrow, parseISO, startOfWeek, addDays } from 'date-fns'
import { it } from 'date-fns/locale'
import clsx from 'clsx'

interface DashboardStats {
  kpis: {
    total_athletes: number
    total_sessions: number
    total_matches: number
    completed_sessions: number
    win_rate: number
    avg_session_duration: number
  }
  weekly_trend: { week: string; sessions: number; matches: number }[]
  team_health: {
    athletes_available: number
    athletes_attention: number
    athletes_unavailable: number
  }
}

export default function HomePage() {
  const { user } = useAuthStore()
  const { activeTeamId, setTeams } = useTeamStore()
  const [teams, setLocalTeams] = useState<Team[]>([])
  const [todaySessions, setTodaySessions] = useState<TrainingSession[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: teamsData } = await api.get('/teams')
        setLocalTeams(teamsData.teams)
        setTeams(teamsData.teams)

        if (teamsData.teams.length > 0) {
          const teamId = activeTeamId || teamsData.teams[0].id
          const [sessions, matches, statsRes] = await Promise.all([
            api.get(`/trainings?team_id=${teamId}`),
            api.get(`/matches?team_id=${teamId}`),
            api.get(`/dashboard/stats/${teamId}`).catch(() => ({ data: null })),
          ])
          setTodaySessions(sessions.data.sessions?.slice(0, 5) || [])
          setUpcomingMatches(matches.data.matches?.filter((m: Match) => m.status === 'upcoming').slice(0, 3) || [])
          if (statsRes.data) setStats(statsRes.data)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeTeamId])

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Oggi'
    if (isTomorrow(date)) return 'Domani'
    return format(date, 'd MMM', { locale: it })
  }

  // Week heatmap data
  const weekHeatmap = (() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const sessions = todaySessions.filter(s => s.date === dateStr).length
      const matches = upcomingMatches.filter(m => m.date === dateStr).length
      return {
        day: format(date, 'EEE', { locale: it }),
        date: format(date, 'd'),
        sessions,
        matches,
        total: sessions + matches,
        isToday: isToday(date),
      }
    })
    return days
  })()

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
      </div>
    )
  }

  const kpis = stats?.kpis
  const health = stats?.team_health
  const healthTotal = health ? health.athletes_available + health.athletes_attention + health.athletes_unavailable : 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Ciao, {user?.first_name}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">La tua cabina di regia</p>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Atleti</span>
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users size={16} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{kpis.total_athletes}</p>
            {health && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="text-green-600 dark:text-green-400">{health.athletes_available}</span> disponibili
              </p>
            )}
          </div>

          <div className="card group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allenamenti</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{kpis.total_sessions}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span className="text-blue-600 dark:text-blue-400">{kpis.completed_sessions}</span> completati
            </p>
          </div>

          <div className="card group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gare</span>
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Trophy size={16} className="text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{kpis.total_matches}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Win rate: <span className="text-orange-600 dark:text-orange-400 font-semibold">{kpis.win_rate}%</span>
            </p>
          </div>

          <div className="card group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durata Media</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Clock size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{kpis.avg_session_duration}'</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">per allenamento</p>
          </div>
        </div>
      )}

      {/* Week overview heatmap */}
      <div className="card">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Activity size={18} className="text-brand-600 dark:text-brand-400" />
          Questa Settimana
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {weekHeatmap.map(day => (
            <div key={day.day} className={clsx(
              'text-center p-3 rounded-xl transition-all',
              day.isToday ? 'bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-300 dark:ring-brand-700' : 'bg-gray-50 dark:bg-gray-800/50',
              day.total > 0 && 'shadow-sm'
            )}>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">{day.day}</p>
              <p className={clsx('text-lg font-bold mt-0.5', day.isToday ? 'text-brand-700 dark:text-brand-400' : '')}>{day.date}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {day.sessions > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" title={`${day.sessions} allenamenti`} />
                )}
                {day.matches > 0 && (
                  <span className="w-2 h-2 rounded-full bg-orange-500" title={`${day.matches} gare`} />
                )}
                {day.total === 0 && (
                  <span className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Allenamento</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Gara</span>
        </div>
      </div>

      {/* Team Health Bar */}
      {health && healthTotal > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Heart size={18} className="text-red-500" />
            Salute Squadra
          </h2>
          <div className="flex rounded-full h-4 overflow-hidden bg-gray-100 dark:bg-gray-800">
            {health.athletes_available > 0 && (
              <div className="bg-green-500 transition-all" style={{ width: `${(health.athletes_available / healthTotal) * 100}%` }} />
            )}
            {health.athletes_attention > 0 && (
              <div className="bg-yellow-500 transition-all" style={{ width: `${(health.athletes_attention / healthTotal) * 100}%` }} />
            )}
            {health.athletes_unavailable > 0 && (
              <div className="bg-red-500 transition-all" style={{ width: `${(health.athletes_unavailable / healthTotal) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Disponibili: <b>{health.athletes_available}</b></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">Attenzione: <b>{health.athletes_attention}</b></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Indisponibili: <b>{health.athletes_unavailable}</b></span>
            </span>
          </div>
        </div>
      )}

      {/* Weekly Trend Chart */}
      {stats?.weekly_trend && stats.weekly_trend.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-600 dark:text-brand-400" />
            Trend Settimanale
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.weekly_trend} barGap={2}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelFormatter={(label) => `Settimana ${label}`}
              />
              <Bar dataKey="sessions" name="Allenamenti" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="matches" name="Gare" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/trainings" className="card flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Crea Allenamento</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Nuovo piano</p>
          </div>
        </Link>
        <Link to="/matches" className="card flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Trophy size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Crea Gara</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Nuova partita</p>
          </div>
        </Link>
        <Link to="/athletes" className="card flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Atleti</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{teams[0]?.athletes_count || 0} nella rosa</p>
          </div>
        </Link>
        <Link to="/insights" className="card flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI Insights</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Report e analisi</p>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-brand-600 dark:text-brand-400" />
              Prossimi Allenamenti
            </h2>
            <Link to="/trainings" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
              Tutti <ChevronRight size={14} className="inline" />
            </Link>
          </div>
          {todaySessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun allenamento programmato</p>
              <Link to="/trainings" className="text-brand-600 dark:text-brand-400 text-sm font-medium hover:underline mt-2 block">
                Crea il primo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{session.title || 'Allenamento'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {formatDate(session.date)}
                      {session.duration_minutes && ` - ${session.duration_minutes} min`}
                    </p>
                  </div>
                  <span className={clsx('px-2 py-1 rounded-lg text-xs font-medium',
                    session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  )}>
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
              <Trophy size={18} className="text-orange-600 dark:text-orange-400" />
              Prossime Gare
            </h2>
            <Link to="/matches" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
              Tutte <ChevronRight size={14} className="inline" />
            </Link>
          </div>
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Trophy size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessuna gara in programma</p>
              <Link to="/matches" className="text-brand-600 dark:text-brand-400 text-sm font-medium hover:underline mt-2 block">
                Aggiungi gara
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map(match => (
                <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">vs {match.opponent}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(match.date)} - {match.home_away === 'home' ? 'Casa' : 'Trasferta'}
                    </p>
                  </div>
                  {match.competition && (
                    <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs">
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
            <Users size={18} className="text-green-600 dark:text-green-400" />
            Le tue Squadre
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="font-semibold">{team.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
