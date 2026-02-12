import { useEffect, useState } from 'react'
import api from '@/api/client'
import {
  BarChart3, Users, Calendar, Trophy, TrendingUp,
  CheckCircle, AlertTriangle, XCircle
} from 'lucide-react'
import clsx from 'clsx'

interface TeamStats {
  total_trainings: number
  recent_trainings: number
  total_matches: number
  match_record: { wins: number; draws: number; losses: number }
  athletes: { total: number; available: number; attention: number; unavailable: number }
  avg_attendance: number
  weekly_loads: { week: string; sessions: number; minutes: number }[]
}

interface Props {
  teamId: number
}

export default function TeamStatsDashboard({ teamId }: Props) {
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/dashboard/team/${teamId}/stats`).then(({ data }) => {
      setStats(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [teamId])

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
    </div>
  }

  const totalPlayed = stats.match_record.wins + stats.match_record.draws + stats.match_record.losses
  const winRate = totalPlayed > 0 ? Math.round((stats.match_record.wins / totalPlayed) * 100) : 0

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 size={22} /> Statistiche Squadra
      </h2>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <Calendar size={24} className="mx-auto text-blue-500 mb-2" />
          <p className="text-3xl font-bold">{stats.total_trainings}</p>
          <p className="text-sm text-gray-500">Allenamenti</p>
          <p className="text-xs text-gray-400">{stats.recent_trainings} ultimo mese</p>
        </div>
        <div className="card text-center">
          <Trophy size={24} className="mx-auto text-orange-500 mb-2" />
          <p className="text-3xl font-bold">{stats.total_matches}</p>
          <p className="text-sm text-gray-500">Gare</p>
          <p className="text-xs text-gray-400">
            {stats.match_record.wins}V {stats.match_record.draws}P {stats.match_record.losses}S
          </p>
        </div>
        <div className="card text-center">
          <Users size={24} className="mx-auto text-green-500 mb-2" />
          <p className="text-3xl font-bold">{stats.avg_attendance}%</p>
          <p className="text-sm text-gray-500">Presenze Medie</p>
        </div>
        <div className="card text-center">
          <TrendingUp size={24} className="mx-auto text-purple-500 mb-2" />
          <p className="text-3xl font-bold">{winRate}%</p>
          <p className="text-sm text-gray-500">Win Rate</p>
        </div>
      </div>

      {/* Athletes status */}
      <div className="card">
        <h3 className="font-semibold mb-4">Stato Rosa ({stats.athletes.total} atleti)</h3>
        <div className="flex gap-4">
          <div className="flex-1 bg-green-50 rounded-xl p-4 text-center">
            <CheckCircle size={20} className="mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold text-green-700">{stats.athletes.available}</p>
            <p className="text-xs text-green-600">Disponibili</p>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-xl p-4 text-center">
            <AlertTriangle size={20} className="mx-auto text-yellow-600 mb-1" />
            <p className="text-2xl font-bold text-yellow-700">{stats.athletes.attention}</p>
            <p className="text-xs text-yellow-600">Attenzione</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
            <XCircle size={20} className="mx-auto text-red-600 mb-1" />
            <p className="text-2xl font-bold text-red-700">{stats.athletes.unavailable}</p>
            <p className="text-xs text-red-600">Indisponibili</p>
          </div>
        </div>
      </div>

      {/* Weekly training load */}
      <div className="card">
        <h3 className="font-semibold mb-4">Carico Settimanale (ultime 4 settimane)</h3>
        <div className="flex items-end gap-3 h-32">
          {stats.weekly_loads.reverse().map((w, i) => {
            const maxMin = Math.max(...stats.weekly_loads.map(wl => wl.minutes), 1)
            const height = (w.minutes / maxMin) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium">{w.minutes}'</span>
                <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-brand-500 rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{w.week}</span>
                <span className="text-xs text-gray-400">{w.sessions} sess.</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
