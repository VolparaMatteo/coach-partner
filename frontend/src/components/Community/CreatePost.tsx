import { useState } from 'react'
import api from '@/api/client'
import type { CommunityPost, TrainingSession } from '@/types'
import { useTeamStore } from '@/store/team'
import { X, Image, Dumbbell, Calendar, Send } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onCreated: (post: CommunityPost) => void
  onClose: () => void
}

type PostType = 'text' | 'photo' | 'exercise' | 'training'

export default function CreatePost({ onCreated, onClose }: Props) {
  const { activeTeamId } = useTeamStore()
  const [postType, setPostType] = useState<PostType>('text')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [trainings, setTrainings] = useState<TrainingSession[]>([])
  const [selectedTraining, setSelectedTraining] = useState<number | null>(null)
  const [exercise, setExercise] = useState({ name: '', block_type: 'technical', duration_minutes: 15, intensity: 'medium', description: '', equipment: '' })

  const loadTrainings = async () => {
    if (!activeTeamId || trainings.length > 0) return
    const { data } = await api.get(`/trainings?team_id=${activeTeamId}`)
    setTrainings(data.sessions || [])
  }

  const handleSubmit = async () => {
    if (!content.trim() && postType === 'text') return
    setLoading(true)
    try {
      const payload: Record<string, unknown> = { post_type: postType, content: content || null }

      if (postType === 'photo') payload.image_url = imageUrl || null
      if (postType === 'exercise') payload.shared_exercise = exercise
      if (postType === 'training' && selectedTraining) {
        const { data: sessionData } = await api.get(`/trainings/${selectedTraining}`)
        const session = sessionData.session
        payload.shared_training_data = {
          title: session.title,
          duration_minutes: session.duration_minutes,
          objectives: session.objectives,
          blocks: session.blocks || [],
        }
      }

      const { data } = await api.post('/community/posts', payload)
      onCreated(data.post)
    } catch {
      // error
    }
    setLoading(false)
  }

  const tabs: { type: PostType; icon: typeof Send; label: string }[] = [
    { type: 'text', icon: Send, label: 'Testo' },
    { type: 'photo', icon: Image, label: 'Foto' },
    { type: 'exercise', icon: Dumbbell, label: 'Esercizio' },
    { type: 'training', icon: Calendar, label: 'Allenamento' },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-brand-200 dark:border-brand-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="font-semibold">Nuovo Post</h3>
        <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 px-4 pb-3">
        {tabs.map(({ type, icon: Icon, label }) => (
          <button key={type} onClick={() => { setPostType(type); if (type === 'training') loadTrainings() }}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              postType === type ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Content text */}
        <textarea className="input-field text-sm" rows={3} placeholder="Condividi con la community..."
          value={content} onChange={e => setContent(e.target.value)} />

        {/* Photo URL */}
        {postType === 'photo' && (
          <div>
            <label className="label">URL Immagine</label>
            <input className="input-field text-sm" placeholder="https://..." value={imageUrl}
              onChange={e => setImageUrl(e.target.value)} />
          </div>
        )}

        {/* Exercise form */}
        {postType === 'exercise' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input className="input-field text-sm" placeholder="Nome esercizio *" value={exercise.name}
                onChange={e => setExercise(p => ({ ...p, name: e.target.value }))} />
              <select className="input-field text-sm" value={exercise.block_type}
                onChange={e => setExercise(p => ({ ...p, block_type: e.target.value }))}>
                <option value="warmup">Riscaldamento</option>
                <option value="technical">Tecnico</option>
                <option value="tactical">Tattico</option>
                <option value="physical">Fisico</option>
                <option value="game">Gioco</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" className="input-field text-sm" placeholder="Durata (min)" value={exercise.duration_minutes}
                onChange={e => setExercise(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 15 }))} />
              <select className="input-field text-sm" value={exercise.intensity}
                onChange={e => setExercise(p => ({ ...p, intensity: e.target.value }))}>
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="very_high">Molto Alta</option>
              </select>
              <input className="input-field text-sm" placeholder="Attrezzatura" value={exercise.equipment}
                onChange={e => setExercise(p => ({ ...p, equipment: e.target.value }))} />
            </div>
            <textarea className="input-field text-sm" rows={2} placeholder="Descrizione esercizio..."
              value={exercise.description} onChange={e => setExercise(p => ({ ...p, description: e.target.value }))} />
          </div>
        )}

        {/* Training selector */}
        {postType === 'training' && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
            <label className="label">Seleziona allenamento da condividere</label>
            {trainings.length === 0 ? (
              <p className="text-xs text-gray-500 mt-1">Nessun allenamento trovato. Seleziona un team.</p>
            ) : (
              <select className="input-field text-sm mt-1" value={selectedTraining || ''}
                onChange={e => setSelectedTraining(parseInt(e.target.value) || null)}>
                <option value="">Scegli...</option>
                {trainings.map(t => (
                  <option key={t.id} value={t.id}>{t.title || 'Allenamento'} - {new Date(t.date + 'T00:00:00').toLocaleDateString('it-IT')}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          <Send size={16} /> {loading ? 'Pubblicando...' : 'Pubblica'}
        </button>
      </div>
    </div>
  )
}
