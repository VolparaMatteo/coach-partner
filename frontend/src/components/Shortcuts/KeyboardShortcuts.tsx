import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'

const shortcuts = [
  { keys: ['G', 'H'], desc: 'Vai alla Home', action: '/' },
  { keys: ['G', 'A'], desc: 'Vai ad Atleti', action: '/athletes' },
  { keys: ['G', 'T'], desc: 'Vai ad Allenamenti', action: '/trainings' },
  { keys: ['G', 'M'], desc: 'Vai a Gare', action: '/matches' },
  { keys: ['G', 'I'], desc: 'Vai a Insights', action: '/insights' },
  { keys: ['G', 'S'], desc: 'Vai a Impostazioni', action: '/settings' },
  { keys: ['⌘', 'K'], desc: 'Ricerca globale', action: 'search' },
  { keys: ['?'], desc: 'Mostra shortcuts', action: 'help' },
  { keys: ['Esc'], desc: 'Chiudi finestre', action: 'escape' },
]

interface Props {
  onSearch?: () => void
}

export default function KeyboardShortcuts({ onSearch }: Props) {
  const navigate = useNavigate()
  const [showHelp, setShowHelp] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    const handler = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

      const key = e.key.toUpperCase()

      // ? for help
      if (e.key === '?') {
        e.preventDefault()
        setShowHelp(prev => !prev)
        return
      }

      // Escape
      if (e.key === 'Escape') {
        setShowHelp(false)
        setPendingKey(null)
        return
      }

      // Cmd/Ctrl+K for search (already handled in Layout, but just in case)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onSearch?.()
        return
      }

      // G + key combos
      if (pendingKey === 'G') {
        e.preventDefault()
        setPendingKey(null)
        clearTimeout(timeout)
        switch (key) {
          case 'H': navigate('/'); break
          case 'A': navigate('/athletes'); break
          case 'T': navigate('/trainings'); break
          case 'M': navigate('/matches'); break
          case 'I': navigate('/insights'); break
          case 'S': navigate('/settings'); break
        }
        return
      }

      if (key === 'G') {
        setPendingKey('G')
        timeout = setTimeout(() => setPendingKey(null), 1000)
        return
      }
    }

    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      clearTimeout(timeout)
    }
  }, [pendingKey, navigate, onSearch])

  return (
    <>
      {/* Pending key indicator */}
      <AnimatePresence>
        {pendingKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-mono"
          >
            {pendingKey} + ...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="font-semibold flex items-center gap-2">
                  <Keyboard size={18} /> Scorciatoie da Tastiera
                </h2>
                <button onClick={() => setShowHelp(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {shortcuts.map(s => (
                  <div key={s.desc} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{s.desc}</span>
                    <div className="flex gap-1">
                      {s.keys.map(k => (
                        <kbd key={k} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-mono text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 min-w-[28px] text-center">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-400">Premi <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">?</kbd> per aprire/chiudere</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
