import { useState } from 'react'
import api from '@/api/client'
import { useToastStore } from '@/store/toast'
import { CheckSquare, UserX, UserCheck, AlertTriangle, FileText, Target, X, Send } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  selectedIds: number[]
  onDone: () => void
  onClearSelection: () => void
}

type BulkAction = 'status' | 'evaluate' | 'note' | 'objectives' | null

export default function BulkActions({ selectedIds, onDone, onClearSelection }: Props) {
  const toast = useToastStore()
  const [action, setAction] = useState<BulkAction>(null)
  const [loading, setLoading] = useState(false)

  // Status form
  const [status, setStatus] = useState('available')

  // Evaluate form
  const [evalForm, setEvalForm] = useState({
    technical: 6, tactical: 6, physical: 6, mental: 6, comment: '',
  })

  // Note form
  const [noteText, setNoteText] = useState('')

  // Objectives form
  const [objectives, setObjectives] = useState({ short: '', medium: '', long: '' })

  const execute = async () => {
    if (selectedIds.length === 0) return
    setLoading(true)
    try {
      switch (action) {
        case 'status':
          await api.post('/athletes/bulk/status', { athlete_ids: selectedIds, status })
          toast.success(`Status aggiornato per ${selectedIds.length} atleti`)
          break
        case 'evaluate':
          await api.post('/athletes/bulk/evaluate', { athlete_ids: selectedIds, ...evalForm })
          toast.success(`Valutazione creata per ${selectedIds.length} atleti`)
          break
        case 'note':
          if (!noteText.trim()) { setLoading(false); return }
          await api.post('/athletes/bulk/notes', { athlete_ids: selectedIds, text: noteText.trim(), is_quick_note: true })
          toast.success(`Nota aggiunta a ${selectedIds.length} atleti`)
          break
        case 'objectives':
          const obj = JSON.stringify(Object.fromEntries(Object.entries(objectives).filter(([, v]) => v.trim())))
          await api.post('/athletes/bulk/objectives', { athlete_ids: selectedIds, objectives: obj })
          toast.success(`Obiettivi assegnati a ${selectedIds.length} atleti`)
          break
      }
      setAction(null)
      onDone()
    } catch {
      toast.error('Errore nell\'operazione')
    }
    setLoading(false)
  }

  return (
    <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} className="text-brand-600 dark:text-brand-400" />
          <span className="font-medium text-sm">{selectedIds.length} atleti selezionati</span>
        </div>
        <button onClick={onClearSelection} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={18} />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'status' as const, label: 'Cambia Status', icon: UserCheck },
          { key: 'evaluate' as const, label: 'Valutazione Rapida', icon: Target },
          { key: 'note' as const, label: 'Aggiungi Nota', icon: FileText },
          { key: 'objectives' as const, label: 'Assegna Obiettivi', icon: Target },
        ]).map(a => (
          <button key={a.key} onClick={() => setAction(action === a.key ? null : a.key)}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              action === a.key
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
            )}>
            <a.icon size={14} /> {a.label}
          </button>
        ))}
      </div>

      {/* Status form */}
      {action === 'status' && (
        <div className="flex items-center gap-3">
          <select className="input-field text-sm flex-1" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="available">Disponibile</option>
            <option value="attention">Attenzione</option>
            <option value="unavailable">Indisponibile</option>
          </select>
          <button onClick={execute} disabled={loading} className="btn-primary text-sm py-2 px-4">
            Applica
          </button>
        </div>
      )}

      {/* Evaluate form */}
      {action === 'evaluate' && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            {(['technical', 'tactical', 'physical', 'mental'] as const).map(key => (
              <div key={key}>
                <label className="text-xs text-gray-500 dark:text-gray-400 capitalize">{
                  key === 'technical' ? 'Tecnica' : key === 'tactical' ? 'Tattica' : key === 'physical' ? 'Fisico' : 'Mentale'
                }</label>
                <input type="range" min="1" max="10" className="w-full" value={evalForm[key]}
                  onChange={e => setEvalForm(p => ({ ...p, [key]: parseInt(e.target.value) }))} />
                <span className="text-xs font-bold text-center block">{evalForm[key]}/10</span>
              </div>
            ))}
          </div>
          <input className="input-field text-sm" placeholder="Commento (opzionale)" value={evalForm.comment}
            onChange={e => setEvalForm(p => ({ ...p, comment: e.target.value }))} />
          <button onClick={execute} disabled={loading} className="btn-primary text-sm py-2 px-4">
            Crea Valutazioni
          </button>
        </div>
      )}

      {/* Note form */}
      {action === 'note' && (
        <div className="flex gap-2">
          <input className="input-field text-sm flex-1" placeholder="Scrivi la nota..."
            value={noteText} onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && execute()} />
          <button onClick={execute} disabled={loading || !noteText.trim()} className="btn-primary text-sm py-2 px-4">
            <Send size={14} />
          </button>
        </div>
      )}

      {/* Objectives form */}
      {action === 'objectives' && (
        <div className="space-y-2">
          <input className="input-field text-sm" placeholder="Obiettivo breve termine"
            value={objectives.short} onChange={e => setObjectives(p => ({ ...p, short: e.target.value }))} />
          <input className="input-field text-sm" placeholder="Obiettivo medio termine"
            value={objectives.medium} onChange={e => setObjectives(p => ({ ...p, medium: e.target.value }))} />
          <input className="input-field text-sm" placeholder="Obiettivo lungo termine"
            value={objectives.long} onChange={e => setObjectives(p => ({ ...p, long: e.target.value }))} />
          <button onClick={execute} disabled={loading} className="btn-primary text-sm py-2 px-4">
            Assegna Obiettivi
          </button>
        </div>
      )}
    </div>
  )
}
