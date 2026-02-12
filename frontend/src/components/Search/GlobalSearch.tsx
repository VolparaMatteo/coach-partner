import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import { Search, X, Users, Calendar, Trophy, FileText, Zap } from 'lucide-react'
import clsx from 'clsx'

interface SearchResults {
  athletes: { id: number; full_name: string; position: string | null; jersey_number: number | null }[]
  sessions: { id: number; title: string | null; date: string; team_id: number }[]
  matches: { id: number; opponent: string; date: string; competition: string | null }[]
  notes: { id: number; text: string; created_at: string }[]
  reports: { id: number; title: string | null; report_type: string; created_at: string }[]
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery('')
      setResults(null)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`)
        setResults(data)
      } catch {}
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const hasResults = results && (
    results.athletes.length > 0 || results.sessions.length > 0 ||
    results.matches.length > 0 || results.notes.length > 0 || results.reports.length > 0
  )

  const goTo = (path: string) => {
    navigate(path)
    onClose()
  }

  const categories = [
    {
      key: 'athletes', icon: Users, label: 'Atleti', color: 'text-green-600 dark:text-green-400',
      items: results?.athletes || [],
      render: (a: any) => ({ title: a.full_name, sub: a.position || `#${a.jersey_number}`, action: () => goTo('/athletes') }),
    },
    {
      key: 'sessions', icon: Calendar, label: 'Allenamenti', color: 'text-blue-600 dark:text-blue-400',
      items: results?.sessions || [],
      render: (s: any) => ({ title: s.title || 'Allenamento', sub: new Date(s.date).toLocaleDateString('it-IT'), action: () => goTo('/trainings') }),
    },
    {
      key: 'matches', icon: Trophy, label: 'Gare', color: 'text-orange-600 dark:text-orange-400',
      items: results?.matches || [],
      render: (m: any) => ({ title: `vs ${m.opponent}`, sub: `${new Date(m.date).toLocaleDateString('it-IT')} ${m.competition || ''}`, action: () => goTo('/matches') }),
    },
    {
      key: 'notes', icon: FileText, label: 'Note', color: 'text-purple-600 dark:text-purple-400',
      items: results?.notes || [],
      render: (n: any) => ({ title: n.text.slice(0, 60) + (n.text.length > 60 ? '...' : ''), sub: new Date(n.created_at).toLocaleDateString('it-IT'), action: () => {} }),
    },
    {
      key: 'reports', icon: Zap, label: 'Report AI', color: 'text-brand-600 dark:text-brand-400',
      items: results?.reports || [],
      render: (r: any) => ({ title: r.title || r.report_type, sub: new Date(r.created_at).toLocaleDateString('it-IT'), action: () => goTo('/insights') }),
    },
  ]

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-start justify-center pt-[10vh]" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca atleti, allenamenti, gare, note..."
            className="flex-1 bg-transparent outline-none text-lg placeholder-gray-400 dark:text-gray-100"
          />
          <kbd className="hidden sm:block text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">ESC</kbd>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun risultato per "{query}"</p>
            </div>
          )}

          {!loading && hasResults && categories.map(cat => {
            if (cat.items.length === 0) return null
            const Icon = cat.icon
            return (
              <div key={cat.key}>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                  <p className={clsx('text-xs font-semibold uppercase tracking-wider flex items-center gap-2', cat.color)}>
                    <Icon size={14} /> {cat.label}
                  </p>
                </div>
                {cat.items.map((item: any) => {
                  const { title, sub, action } = cat.render(item)
                  return (
                    <button
                      key={item.id}
                      onClick={action}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}

          {!query && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p className="text-sm">Inizia a digitare per cercare...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
