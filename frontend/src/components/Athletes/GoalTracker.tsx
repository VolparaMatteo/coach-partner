import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Goal } from '@/types'
import { useToastStore } from '@/store/toast'
import { motion } from 'framer-motion'
import { Target, Plus, X, Check, Clock, AlertTriangle, Trash2, Edit3 } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  athleteId: number
}

export default function GoalTracker({ athleteId }: Props) {
  const toast = useToastStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', description: '', category: 'technical', deadline: '' })

  const load = () => {
    api.get(`/goals?athlete_id=${athleteId}`)
      .then(({ data }) => { setGoals(data.goals); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [athleteId])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    try {
      await api.post('/goals', { athlete_id: athleteId, ...form })
      toast.success('Obiettivo creato!')
      setForm({ title: '', description: '', category: 'technical', deadline: '' })
      setShowAdd(false)
      load()
    } catch { toast.error('Errore nella creazione') }
  }

  const handleUpdate = async (id: number, updates: Partial<Goal>) => {
    try {
      await api.put(`/goals/${id}`, updates)
      load()
    } catch { toast.error('Errore nell\'aggiornamento') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo obiettivo?')) return
    try {
      await api.delete(`/goals/${id}`)
      toast.success('Obiettivo eliminato')
      load()
    } catch { toast.error('Errore') }
  }

  const categoryColors: Record<string, string> = {
    technical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    tactical: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    physical: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    mental: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }

  const categoryLabels: Record<string, string> = {
    technical: 'Tecnico',
    tactical: 'Tattico',
    physical: 'Fisico',
    mental: 'Mentale',
    other: 'Altro',
  }

  if (loading) {
    return <div className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Target size={18} /> Obiettivi
        </h3>
        <button onClick={() => setShowAdd(true)} className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
          <Plus size={14} /> Nuovo
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Nuovo Obiettivo</h4>
            <button onClick={() => setShowAdd(false)}><X size={14} className="text-gray-400" /></button>
          </div>
          <input className="input-field text-sm" placeholder="Titolo obiettivo *" value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <input className="input-field text-sm" placeholder="Descrizione (opzionale)" value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-3">
            <select className="input-field text-sm flex-1" value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="technical">Tecnico</option>
              <option value="tactical">Tattico</option>
              <option value="physical">Fisico</option>
              <option value="mental">Mentale</option>
              <option value="other">Altro</option>
            </select>
            <input type="date" className="input-field text-sm flex-1" value={form.deadline}
              onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>
          <button onClick={handleCreate} className="btn-primary text-sm py-2 px-4">Crea Obiettivo</button>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length === 0 && !showAdd ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">Nessun obiettivo attivo</p>
      ) : (
        <div className="space-y-2">
          {activeGoals.map((goal, i) => (
            <motion.div key={goal.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-medium', categoryColors[goal.category || 'other'])}>
                      {categoryLabels[goal.category || 'other']}
                    </span>
                    {goal.deadline && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock size={10} /> {new Date(goal.deadline).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm">{goal.title}</p>
                  {goal.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{goal.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleUpdate(goal.id, { status: 'completed', progress: 100 })}
                    className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600" title="Completa">
                    <Check size={14} />
                  </button>
                  <button onClick={() => handleDelete(goal.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Elimina">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <input type="range" min="0" max="100" value={goal.progress}
                  onChange={e => handleUpdate(goal.id, { progress: parseInt(e.target.value) })}
                  className="w-16 h-1" />
                <span className="text-xs font-bold text-brand-600 w-8">{goal.progress}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase font-medium mb-2">Completati ({completedGoals.length})</p>
          <div className="space-y-1">
            {completedGoals.slice(0, 5).map(goal => (
              <div key={goal.id} className="flex items-center gap-2 text-sm text-gray-400 line-through">
                <Check size={14} className="text-green-500" />
                {goal.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
