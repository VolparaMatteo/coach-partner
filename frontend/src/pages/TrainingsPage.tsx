import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { TrainingSession, TrainingBlock, SportConfig } from '@/types'
import { useAuthStore } from '@/store/auth'
import { useTeamStore } from '@/store/team'
import { useToastStore } from '@/store/toast'
import TrainingBuilder from '@/components/TrainingBuilder/TrainingBuilder'
import AttendanceTracker from '@/components/Attendance/AttendanceTracker'
import FieldMode from '@/components/FieldMode/FieldMode'
import PostTrainingFlow from '@/components/PostTraining/PostTrainingFlow'
import ExerciseLibrary from '@/components/ExerciseLibrary/ExerciseLibrary'
import TeamSelector from '@/components/TeamSelector/TeamSelector'
import TemplatePicker from '@/components/Templates/TemplatePicker'
import WeeklyPlanner from '@/components/Planner/WeeklyPlanner'
import { Calendar, Plus, X, Clock, Target, BookOpen, ClipboardCheck, BookMarked, CalendarDays, List, Save } from 'lucide-react'
import { PageSkeleton } from '@/components/Skeleton/Skeleton'
import clsx from 'clsx'

export default function TrainingsPage() {
  const { user } = useAuthStore()
  const { activeTeamId, setTeams } = useTeamStore()
  const toast = useToastStore()
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [sportConfig, setSportConfig] = useState<SportConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null)
  const [builderBlocks, setBuilderBlocks] = useState<TrainingBlock[]>([])
  const [fieldModeSession, setFieldModeSession] = useState<TrainingSession | null>(null)
  const [postTrainingSession, setPostTrainingSession] = useState<TrainingSession | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list')
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    duration_minutes: '90',
    objectives: [] as string[],
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/teams')
      setTeams(data.teams)
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
      api.get(`/trainings?team_id=${activeTeamId}`).then(({ data }) => {
        setSessions(data.sessions)
      })
    }
  }, [activeTeamId])

  const handleCreate = async () => {
    if (!activeTeamId || !form.date) return
    const { data } = await api.post('/trainings', {
      team_id: activeTeamId,
      date: form.date,
      title: form.title || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      objectives: form.objectives,
    })
    setSessions(prev => [data.session, ...prev])
    setForm({ date: new Date().toISOString().split('T')[0], title: '', duration_minutes: '90', objectives: [] })
    setShowCreate(false)
    toast.success('Allenamento creato!')
  }

  const toggleObjective = (obj: string) => {
    setForm(prev => ({
      ...prev,
      objectives: prev.objectives.includes(obj)
        ? prev.objectives.filter(o => o !== obj)
        : [...prev.objectives, obj],
    }))
  }

  const openBuilder = async (session: TrainingSession) => {
    const { data } = await api.get(`/trainings/${session.id}`)
    setEditingSession(data.session)
    setBuilderBlocks(data.session.blocks || [])
  }

  const saveBuilder = async () => {
    if (!editingSession) return
    for (const block of builderBlocks) {
      if (block.id && block.id > 1000000000) {
        await api.post(`/trainings/${editingSession.id}/blocks`, block)
      } else if (block.id) {
        await api.patch(`/trainings/${editingSession.id}/blocks/${block.id}`, block)
      }
    }
    toast.success('Blocchi salvati!')
    setEditingSession(null)
    setBuilderBlocks([])
    if (activeTeamId) {
      const { data } = await api.get(`/trainings?team_id=${activeTeamId}`)
      setSessions(data.sessions)
    }
  }

  const saveAsTemplate = async () => {
    if (!editingSession) return
    const name = prompt('Nome del template:')
    if (!name) return
    try {
      await api.post('/templates', { session_id: editingSession.id, name, description: '' })
      toast.success('Template salvato!')
    } catch {
      toast.error('Errore nel salvataggio del template')
    }
  }

  const addExerciseToBuilder = (exercise: { name: string; block_type: string; duration_minutes: number; intensity: string; description: string; equipment: string }) => {
    setBuilderBlocks(prev => [...prev, {
      id: Date.now(),
      session_id: editingSession?.id || 0,
      order: prev.length,
      block_type: exercise.block_type,
      name: exercise.name,
      objective: null,
      duration_minutes: exercise.duration_minutes,
      intensity: exercise.intensity,
      description: exercise.description,
      coaching_points: null,
      variations: null,
      equipment: exercise.equipment,
      space: null,
      num_players: null,
      rules: null,
      tags: null,
      completed: false,
      actual_rpe: null,
      notes: null,
    }])
    setShowLibrary(false)
  }

  if (loading) return <PageSkeleton />

  // Field mode
  if (fieldModeSession) {
    return <FieldMode
      blocks={builderBlocks.length > 0 ? builderBlocks : []}
      sessionTitle={fieldModeSession.title || 'Allenamento'}
      onClose={() => setFieldModeSession(null)}
      onBlockComplete={(i, rpe, notes) => {
        setBuilderBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, completed: true, actual_rpe: rpe, notes } : b))
      }}
      onQuickNote={(text) => {
        api.post('/notes', { text, entity_type: 'training', entity_id: fieldModeSession.id, is_quick_note: true, tags: [] })
      }}
    />
  }

  // Post-training flow
  if (postTrainingSession && activeTeamId) {
    return <PostTrainingFlow
      session={postTrainingSession}
      teamId={activeTeamId}
      onClose={() => setPostTrainingSession(null)}
      onComplete={() => {
        setPostTrainingSession(null)
        toast.success('Post-allenamento completato!')
        if (activeTeamId) api.get(`/trainings?team_id=${activeTeamId}`).then(({ data }) => setSessions(data.sessions))
      }}
    />
  }

  // Builder view
  if (editingSession) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => { setEditingSession(null); setBuilderBlocks([]) }} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-1">
              ← Torna alla lista
            </button>
            <h1 className="text-2xl font-bold">{editingSession.title || 'Allenamento'} - Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={saveAsTemplate} className="btn-secondary flex items-center gap-2 text-sm">
              <Save size={14} /> Salva come Template
            </button>
            <button onClick={() => setShowLibrary(!showLibrary)} className="btn-secondary flex items-center gap-2 text-sm">
              <BookOpen size={16} /> Libreria
            </button>
          </div>
        </div>
        {showLibrary && user?.sport && (
          <div className="card">
            <ExerciseLibrary sport={user.sport} sportConfig={sportConfig} onSelectExercise={addExerciseToBuilder} />
          </div>
        )}
        <TrainingBuilder
          blocks={builderBlocks}
          sportConfig={sportConfig}
          onChange={setBuilderBlocks}
          onSave={saveBuilder}
          onStartFieldMode={() => setFieldModeSession(editingSession)}
        />
        {activeTeamId && (
          <div className="card">
            <AttendanceTracker sessionId={editingSession.id} teamId={activeTeamId} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar size={24} /> Allenamenti
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{sessions.length} sessioni</p>
        </div>
        <div className="flex items-center gap-2">
          <TeamSelector />
          <button onClick={() => setShowTemplates(!showTemplates)} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
            <BookMarked size={14} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nuovo
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 max-w-xs">
        <button onClick={() => setViewMode('list')}
          className={clsx('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
            viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400')}>
          <List size={14} /> Lista
        </button>
        <button onClick={() => setViewMode('week')}
          className={clsx('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
            viewMode === 'week' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400')}>
          <CalendarDays size={14} /> Settimana
        </button>
      </div>

      {/* Template picker */}
      {showTemplates && activeTeamId && (
        <div className="card">
          <TemplatePicker
            teamId={activeTeamId}
            onUseTemplate={(sessionId) => {
              setShowTemplates(false)
              if (activeTeamId) api.get(`/trainings?team_id=${activeTeamId}`).then(({ data }) => setSessions(data.sessions))
            }}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="card border-brand-200 dark:border-brand-700 border-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Nuova Sessione</h3>
            <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Data *</label>
                <input type="date" className="input-field" value={form.date}
                  onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Titolo</label>
                <input className="input-field" placeholder="es. Tattico difesa"
                  value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Durata (min)</label>
                <input type="number" className="input-field" value={form.duration_minutes}
                  onChange={(e) => setForm(p => ({ ...p, duration_minutes: e.target.value }))} />
              </div>
            </div>
            {sportConfig?.session_objectives && (
              <div>
                <label className="label">Obiettivi sessione</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {sportConfig.session_objectives.map(obj => (
                    <button
                      key={obj}
                      onClick={() => toggleObjective(obj)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        form.objectives.includes(obj)
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      {obj}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleCreate} className="btn-primary">Crea Allenamento</button>
          </div>
        </div>
      )}

      {/* Weekly planner view */}
      {viewMode === 'week' && activeTeamId && (
        <div className="card">
          <WeeklyPlanner
            teamId={activeTeamId}
            onCreateSession={(date) => {
              setForm(p => ({ ...p, date }))
              setShowCreate(true)
            }}
            onSelectSession={openBuilder}
            onSelectMatch={() => {}}
          />
        </div>
      )}

      {/* Sessions list */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {new Date(session.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {new Date(session.date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{session.title || 'Allenamento'}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {session.duration_minutes && (
                        <span className="flex items-center gap-1"><Clock size={14} /> {session.duration_minutes} min</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Target size={14} /> {session.blocks_count} blocchi
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openBuilder(session)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-medium">
                    Builder
                  </button>
                  {session.status !== 'completed' && (
                    <button onClick={() => setPostTrainingSession(session)} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40">
                      <ClipboardCheck size={16} />
                    </button>
                  )}
                  <span className={clsx('px-3 py-1 rounded-lg text-xs font-medium',
                    session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  )}>
                    {session.status === 'completed' ? 'Completato' :
                     session.status === 'in_progress' ? 'In corso' : 'Pianificato'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length === 0 && !showCreate && viewMode === 'list' && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Calendar size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nessun allenamento. Crea il primo!</p>
        </div>
      )}
    </div>
  )
}
