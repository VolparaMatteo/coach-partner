import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Season } from '@/types'
import { useToastStore } from '@/store/toast'
import { Calendar, Plus, X, Check, Archive, Trash2, Edit3 } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onSeasonChange?: () => void
}

export default function SeasonManager({ onSeasonChange }: Props) {
  const toast = useToastStore()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    notes: '',
  })

  const load = async () => {
    try {
      const { data } = await api.get('/seasons')
      setSeasons(data.seasons)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({ name: '', start_date: '', end_date: '', notes: '' })
    setShowCreate(false)
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!form.name || !form.start_date || !form.end_date) return
    try {
      await api.post('/seasons', { ...form, is_active: true })
      toast.success('Stagione creata!')
      resetForm()
      load()
      onSeasonChange?.()
    } catch {
      toast.error('Errore nella creazione')
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !form.name) return
    try {
      await api.put(`/seasons/${editingId}`, form)
      toast.success('Stagione aggiornata!')
      resetForm()
      load()
    } catch {
      toast.error('Errore nell\'aggiornamento')
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await api.post(`/seasons/${id}/activate`)
      toast.success('Stagione attivata!')
      load()
      onSeasonChange?.()
    } catch {
      toast.error('Errore nell\'attivazione')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questa stagione?')) return
    try {
      await api.delete(`/seasons/${id}`)
      toast.success('Stagione eliminata!')
      load()
    } catch {
      toast.error('Non è possibile eliminare una stagione con squadre associate')
    }
  }

  const startEdit = (season: Season) => {
    setEditingId(season.id)
    setForm({
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
      notes: season.notes || '',
    })
    setShowCreate(true)
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Calendar size={18} /> Gestione Stagioni
        </h2>
        <button onClick={() => { resetForm(); setShowCreate(true) }} className="btn-primary text-sm py-2 px-3 flex items-center gap-2">
          <Plus size={14} /> Nuova Stagione
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm">{editingId ? 'Modifica Stagione' : 'Nuova Stagione'}</h3>
            <button onClick={resetForm}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input className="input-field text-sm" placeholder="es. 2025-2026" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input type="date" className="input-field text-sm" value={form.start_date}
              onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
            <input type="date" className="input-field text-sm" value={form.end_date}
              onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
          </div>
          <input className="input-field text-sm" placeholder="Note (opzionale)" value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          <button onClick={editingId ? handleUpdate : handleCreate} className="btn-primary text-sm py-2 px-4">
            {editingId ? 'Aggiorna' : 'Crea Stagione'}
          </button>
        </div>
      )}

      {seasons.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">Nessuna stagione. Creane una!</p>
      ) : (
        <div className="space-y-2">
          {seasons.map(season => (
            <div key={season.id} className={clsx(
              'flex items-center justify-between p-4 rounded-xl border transition-colors',
              season.is_active
                ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
            )}>
              <div className="flex items-center gap-3">
                {season.is_active && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                )}
                <div>
                  <p className="font-medium">{season.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(season.start_date).toLocaleDateString('it-IT')} — {new Date(season.end_date).toLocaleDateString('it-IT')}
                  </p>
                  {season.notes && <p className="text-xs text-gray-400 mt-0.5">{season.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!season.is_active && (
                  <button onClick={() => handleActivate(season.id)} className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400" title="Attiva">
                    <Check size={16} />
                  </button>
                )}
                <button onClick={() => startEdit(season)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" title="Modifica">
                  <Edit3 size={16} />
                </button>
                {!season.is_active && (
                  <button onClick={() => handleDelete(season.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Elimina">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
