import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { AIReport, Team, TrainingSession, Match } from '@/types'
import TeamStatsDashboard from '@/components/Stats/TeamStatsDashboard'
import CalendarView from '@/components/Calendar/CalendarView'
import { BarChart3, Zap, FileText, ThumbsUp, ThumbsDown, Calendar } from 'lucide-react'
import clsx from 'clsx'

export default function InsightsPage() {
  const [reports, setReports] = useState<AIReport[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [activeTab, setActiveTab] = useState<'stats' | 'calendar' | 'reports'>('stats')
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [reportsRes, teamsRes] = await Promise.all([
          api.get('/ai/reports'),
          api.get('/teams'),
        ])
        setReports(reportsRes.data.reports)
        setTeams(teamsRes.data.teams)
        if (teamsRes.data.teams.length > 0) {
          const teamId = teamsRes.data.teams[0].id
          const [sessRes, matchRes] = await Promise.all([
            api.get(`/trainings?team_id=${teamId}`),
            api.get(`/matches?team_id=${teamId}`),
          ])
          setSessions(sessRes.data.sessions || [])
          setMatches(matchRes.data.matches || [])
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const handleFeedback = async (reportId: number, feedback: string) => {
    await api.post(`/ai/reports/${reportId}/feedback`, { feedback, saved: feedback === 'useful' })
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, feedback, saved: feedback === 'useful' } : r))
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'post_training': return 'Post Allenamento'
      case 'post_match': return 'Post Gara'
      case 'athlete_weekly': return 'Sintesi Atleta'
      case 'focus_suggestion': return 'Suggerimenti'
      default: return type
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'post_training': return 'bg-blue-100 text-blue-700'
      case 'post_match': return 'bg-orange-100 text-orange-700'
      case 'athlete_weekly': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
    </div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={24} /> Insights & Report AI
        </h1>
        <p className="text-gray-500 text-sm">I report generati dal tuo AI Copilot</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { value: 'stats' as const, label: 'Statistiche', icon: BarChart3 },
          { value: 'calendar' as const, label: 'Calendario', icon: Calendar },
          { value: 'reports' as const, label: 'Report AI', icon: Zap },
        ]).map(t => (
          <button key={t.value} onClick={() => setActiveTab(t.value)}
            className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === t.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && teams.length > 0 && (
        <TeamStatsDashboard teamId={teams[0].id} />
      )}

      {activeTab === 'calendar' && (
        <CalendarView sessions={sessions} matches={matches} />
      )}

      {activeTab === 'reports' && <>
      <div className="card bg-gradient-to-r from-brand-50 to-green-50 border-brand-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
            <Zap size={24} className="text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-800">AI Coach Copilot</h3>
            <p className="text-sm text-brand-700 mt-1">
              I report vengono generati automaticamente dopo ogni allenamento e gara.
              L'AI assiste ma non decide: tutti gli output sono modificabili.
            </p>
          </div>
        </div>
      </div>

      {selectedReport ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={clsx('px-2 py-1 rounded-lg text-xs font-medium', typeColor(selectedReport.report_type))}>
                {typeLabel(selectedReport.report_type)}
              </span>
              <h3 className="font-semibold text-lg mt-2">{selectedReport.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(selectedReport.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                {selectedReport.confidence && ` - Confidenza: ${selectedReport.confidence}`}
              </p>
            </div>
            <button onClick={() => setSelectedReport(null)} className="btn-secondary text-sm">
              Torna alla lista
            </button>
          </div>
          <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-6 whitespace-pre-wrap">
            {selectedReport.content}
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Questo report ti e stato utile?</span>
            <button
              onClick={() => handleFeedback(selectedReport.id, 'useful')}
              className={clsx('p-2 rounded-lg transition-colors',
                selectedReport.feedback === 'useful' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600'
              )}
            >
              <ThumbsUp size={18} />
            </button>
            <button
              onClick={() => handleFeedback(selectedReport.id, 'not_useful')}
              className={clsx('p-2 rounded-lg transition-colors',
                selectedReport.feedback === 'not_useful' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-600'
              )}
            >
              <ThumbsDown size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
                <span className={clsx('px-2 py-1 rounded-lg text-xs font-medium', typeColor(report.report_type))}>
                  {typeLabel(report.report_type)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {reports.length === 0 && !selectedReport && (
        <div className="text-center py-12 text-gray-400">
          <Zap size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nessun report ancora.</p>
          <p className="text-sm mt-1">Completa un allenamento o una gara per generare il primo insight.</p>
        </div>
      )}
      </>}
    </div>
  )
}
