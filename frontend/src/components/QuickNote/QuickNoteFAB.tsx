import { useState } from 'react'
import api from '@/api/client'
import { MessageSquarePlus, Send, X, Tag } from 'lucide-react'
import clsx from 'clsx'

const defaultTags = [
  'tattica', 'tecnica', 'fisico', 'mentale', 'disciplina',
  'pressing', 'transizione', 'set piece', 'atteggiamento', 'miglioramento',
]

export default function QuickNoteFAB() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    await api.post('/notes', {
      text: text.trim(),
      tags: selectedTags,
      is_quick_note: true,
      entity_type: 'general',
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setText('')
      setSelectedTags([])
      setSaved(false)
      setOpen(false)
    }, 1000)
  }

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          'fixed bottom-20 lg:bottom-8 right-6 z-40 w-14 h-14 rounded-full shadow-lg',
          'bg-brand-600 text-white hover:bg-brand-700 transition-all',
          'flex items-center justify-center',
          open && 'hidden'
        )}
      >
        <MessageSquarePlus size={24} />
      </button>

      {/* Note panel */}
      {open && (
        <div className="fixed bottom-20 lg:bottom-8 right-6 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquarePlus size={16} className="text-brand-600" /> Nota Rapida
            </h4>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-200 rounded">
              <X size={16} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              autoFocus
              className="input-field text-sm"
              rows={3}
              placeholder="Scrivi una nota veloce..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.metaKey && handleSave()}
            />
            <div>
              <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Tag size={12} /> Tag</p>
              <div className="flex flex-wrap gap-1.5">
                {defaultTags.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={clsx('px-2 py-1 rounded-lg text-xs transition-colors',
                      selectedTags.includes(tag) ? 'bg-brand-100 text-brand-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} disabled={!text.trim() || saving}
              className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2">
              {saved ? '✓ Salvata!' : saving ? 'Salvataggio...' : <><Send size={14} /> Salva Nota</>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
