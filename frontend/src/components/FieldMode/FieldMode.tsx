import { useState, useEffect, useCallback } from 'react'
import type { TrainingBlock } from '@/types'
import {
  X, Play, Pause, SkipForward, Check, ChevronLeft,
  ChevronRight, Clock, MessageSquarePlus, Send
} from 'lucide-react'
import clsx from 'clsx'

interface Props {
  blocks: TrainingBlock[]
  sessionTitle: string
  onClose: () => void
  onBlockComplete: (blockIndex: number, rpe: number | null, notes: string) => void
  onQuickNote: (text: string, tags: string[]) => void
}

export default function FieldMode({ blocks, sessionTitle, onClose, onBlockComplete, onQuickNote }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set())
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [blockNotes, setBlockNotes] = useState('')
  const [blockRpe, setBlockRpe] = useState<number | null>(null)

  const currentBlock = blocks[currentIndex]
  const targetSeconds = (currentBlock?.duration_minutes || 0) * 60

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  // Reset timer on block change
  useEffect(() => {
    setTimer(0)
    setIsRunning(false)
    setBlockNotes('')
    setBlockRpe(null)
  }, [currentIndex])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progress = targetSeconds > 0 ? Math.min((timer / targetSeconds) * 100, 100) : 0
  const isOvertime = timer > targetSeconds && targetSeconds > 0

  const completeBlock = useCallback(() => {
    onBlockComplete(currentIndex, blockRpe, blockNotes)
    setCompletedBlocks(prev => new Set([...prev, currentIndex]))
    if (currentIndex < blocks.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, blockRpe, blockNotes, blocks.length, onBlockComplete])

  const sendQuickNote = () => {
    if (noteText.trim()) {
      onQuickNote(noteText.trim(), [])
      setNoteText('')
      setShowNoteInput(false)
    }
  }

  const intensityLabel: Record<string, string> = {
    low: 'BASSA', medium: 'MEDIA', high: 'ALTA', very_high: 'MAX',
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 text-white flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div>
          <p className="text-gray-400 text-sm">{sessionTitle}</p>
          <p className="text-lg font-bold">
            Blocco {currentIndex + 1}/{blocks.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            {blocks.map((_, i) => (
              <div key={i} className={clsx(
                'w-3 h-3 rounded-full transition-colors',
                completedBlocks.has(i) ? 'bg-green-500' :
                i === currentIndex ? 'bg-brand-500' : 'bg-gray-700'
              )} />
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-auto">
        {/* Block type & intensity */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-4 py-1.5 bg-gray-800 rounded-full text-sm font-medium uppercase tracking-wide">
            {currentBlock?.block_type}
          </span>
          {currentBlock?.intensity && (
            <span className={clsx('px-4 py-1.5 rounded-full text-sm font-bold',
              currentBlock.intensity === 'low' ? 'bg-green-900 text-green-300' :
              currentBlock.intensity === 'medium' ? 'bg-yellow-900 text-yellow-300' :
              currentBlock.intensity === 'high' ? 'bg-orange-900 text-orange-300' :
              'bg-red-900 text-red-300'
            )}>
              {intensityLabel[currentBlock.intensity]}
            </span>
          )}
        </div>

        {/* Block name */}
        <h1 className="text-4xl lg:text-6xl font-bold text-center mb-4">
          {currentBlock?.name || 'Blocco'}
        </h1>

        {/* Objective */}
        {currentBlock?.objective && (
          <p className="text-xl text-gray-400 text-center mb-8 max-w-2xl">
            {currentBlock.objective}
          </p>
        )}

        {/* Timer circle */}
        <div className="relative w-64 h-64 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" strokeWidth="4" />
            <circle cx="50" cy="50" r="45" fill="none"
              stroke={isOvertime ? '#ef4444' : '#22c55e'}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('text-5xl font-mono font-bold', isOvertime && 'text-red-400')}>
              {formatTime(timer)}
            </span>
            {targetSeconds > 0 && (
              <span className="text-gray-500 text-lg">/ {formatTime(targetSeconds)}</span>
            )}
          </div>
        </div>

        {/* Timer controls */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={clsx('w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors',
              isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-brand-600 hover:bg-brand-700'
            )}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
        </div>

        {/* Coaching points */}
        {currentBlock?.coaching_points && (
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mb-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Coaching Points</h3>
            <p className="text-lg leading-relaxed">{currentBlock.coaching_points}</p>
          </div>
        )}

        {/* Description */}
        {currentBlock?.description && (
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mb-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Descrizione</h3>
            <p className="text-base leading-relaxed text-gray-300">{currentBlock.description}</p>
          </div>
        )}

        {/* Block RPE + notes before completing */}
        <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full">
          <h3 className="text-sm font-medium text-gray-400 uppercase mb-3">Chiudi Blocco</h3>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-gray-400">RPE:</span>
            {[1,2,3,4,5,6,7,8,9,10].map(v => (
              <button key={v} onClick={() => setBlockRpe(v)}
                className={clsx('w-8 h-8 rounded-lg text-sm font-bold transition-colors',
                  blockRpe === v ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}>
                {v}
              </button>
            ))}
          </div>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-3"
            placeholder="Note blocco (opzionale)..."
            value={blockNotes}
            onChange={(e) => setBlockNotes(e.target.value)}
          />
          <button onClick={completeBlock}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Check size={20} /> Completa Blocco
          </button>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-t border-gray-800">
        <button
          onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} /> Precedente
        </button>

        {/* Quick note */}
        {showNoteInput ? (
          <div className="flex items-center gap-2 flex-1 mx-4">
            <input
              autoFocus
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm"
              placeholder="Nota rapida..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendQuickNote()}
            />
            <button onClick={sendQuickNote} className="p-2 bg-brand-600 rounded-xl">
              <Send size={18} />
            </button>
            <button onClick={() => setShowNoteInput(false)} className="p-2 text-gray-400">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNoteInput(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl"
          >
            <MessageSquarePlus size={18} /> Nota Rapida
          </button>
        )}

        <button
          onClick={() => currentIndex < blocks.length - 1 && setCurrentIndex(currentIndex + 1)}
          disabled={currentIndex === blocks.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Successivo <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
