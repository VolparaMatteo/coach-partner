import { useEffect, useState } from 'react'
import api from '@/api/client'
import { useToastStore } from '@/store/toast'
import { BookMarked, Clock, Copy, Trash2 } from 'lucide-react'
import clsx from 'clsx'

interface Template {
  id: number
  name: string
  description: string | null
  sport: string | null
  duration_minutes: number | null
  usage_count: number
  created_at: string
}

interface Props {
  teamId: number
  onUseTemplate: (sessionId: number) => void
  onClose: () => void
}

export default function TemplatePicker({ teamId, onUseTemplate, onClose }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToastStore()

  useEffect(() => {
    api.get('/templates').then(({ data }) => {
      setTemplates(data.templates)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const useTemplate = async (templateId: number) => {
    try {
      const { data } = await api.post(`/templates/${templateId}/use`, {
        team_id: teamId,
        date: new Date().toISOString().split('T')[0],
      })
      toast.success('Sessione creata da template!')
      onUseTemplate(data.session.id)
    } catch {
      toast.error('Errore nel creare la sessione')
    }
  }

  const deleteTemplate = async (templateId: number) => {
    try {
      await api.delete(`/templates/${templateId}`)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast.success('Template eliminato')
    } catch {
      toast.error('Errore nell\'eliminazione')
    }
  }

  if (loading) return <div className="text-center py-8 text-gray-400">Caricamento...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <BookMarked size={18} /> Template Allenamenti
        </h3>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          Chiudi
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <BookMarked size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nessun template salvato.</p>
          <p className="text-xs mt-1">Crea un allenamento e salvalo come template dal Builder.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {templates.map(t => (
            <div key={t.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{t.name}</p>
                  {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>}
                </div>
                <button onClick={() => deleteTemplate(t.id)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {t.duration_minutes && (
                  <span className="flex items-center gap-1"><Clock size={12} /> {t.duration_minutes} min</span>
                )}
                <span className="flex items-center gap-1"><Copy size={12} /> Usato {t.usage_count}x</span>
              </div>
              <button
                onClick={() => useTemplate(t.id)}
                className="w-full btn-primary text-sm py-2"
              >
                Usa Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
