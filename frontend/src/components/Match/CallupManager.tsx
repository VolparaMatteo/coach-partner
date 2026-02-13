import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { Athlete, Match } from '@/types'
import { useToastStore } from '@/store/toast'
import { motion } from 'framer-motion'
import { Users, Plus, X, Check, Printer, Share2, BarChart3 } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  match: Match
  teamId: number
}

export default function CallupManager({ match, teamId }: Props) {
  const toast = useToastStore()
  const [calledUp, setCalledUp] = useState<Athlete[]>([])
  const [available, setAvailable] = useState<Athlete[]>([])
  const [history, setHistory] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const load = async () => {
    try {
      const [callupRes, historyRes] = await Promise.all([
        api.get(`/matches/${match.id}/callup`),
        api.get(`/matches/${match.id}/callup/history`),
      ])
      setCalledUp(callupRes.data.called_up)
      setAvailable(callupRes.data.available)
      setHistory(historyRes.data.athlete_callup_counts || {})
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [match.id])

  const togglePlayer = async (athlete: Athlete) => {
    const isAdded = calledUp.some(a => a.id === athlete.id)
    const newIds = isAdded
      ? calledUp.filter(a => a.id !== athlete.id).map(a => a.id)
      : [...calledUp.map(a => a.id), athlete.id]

    try {
      await api.put(`/matches/${match.id}/callup`, { athlete_ids: newIds })
      load()
    } catch {
      toast.error('Errore nell\'aggiornamento')
    }
  }

  const shareCallup = () => {
    const text = `Convocazione vs ${match.opponent} - ${new Date(match.date).toLocaleDateString('it-IT')}\n\n` +
      calledUp.map((a, i) => `${i + 1}. ${a.full_name} (${a.position || 'N/D'})`).join('\n') +
      `\n\nTotale: ${calledUp.length} convocati`

    if (navigator.share) {
      navigator.share({ title: `Convocazione vs ${match.opponent}`, text })
    } else {
      navigator.clipboard.writeText(text)
      toast.success('Lista copiata negli appunti!')
    }
  }

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
  }

  const allAthletes = [...new Map([...calledUp, ...available].map(a => [a.id, a])).values()]
    .sort((a, b) => a.last_name.localeCompare(b.last_name))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Users size={18} /> Convocazioni
          <span className="text-sm font-normal text-gray-500">({calledUp.length} convocati)</span>
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
            <BarChart3 size={12} /> Storico
          </button>
          <button onClick={shareCallup}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            <Share2 size={12} /> Condividi
          </button>
          <button onClick={() => window.print()}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 no-print">
            <Printer size={12} /> Stampa
          </button>
        </div>
      </div>

      {/* Player list */}
      <div className="grid sm:grid-cols-2 gap-2">
        {allAthletes.map((athlete, i) => {
          const isCalledUp = calledUp.some(a => a.id === athlete.id)
          const callupCount = history[athlete.id] || 0
          return (
            <motion.button key={athlete.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => togglePlayer(athlete)}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-xl text-left transition-all border',
                isCalledUp
                  ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                isCalledUp ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              )}>
                {isCalledUp ? <Check size={14} /> : athlete.jersey_number || '-'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{athlete.full_name}</p>
                <p className="text-[10px] text-gray-400">{athlete.position || 'N/D'}</p>
              </div>
              {showHistory && (
                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  {callupCount}/{Object.keys(history).length > 0 ? Math.max(...Object.values(history)) : 0}
                </span>
              )}
              {athlete.status === 'unavailable' && (
                <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">Indisponibile</span>
              )}
              {athlete.status === 'attention' && (
                <span className="text-[10px] text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded">Attenzione</span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
