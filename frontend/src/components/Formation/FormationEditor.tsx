import { useState, useRef, type ReactNode } from 'react'
import type { Athlete } from '@/types'
import { Save, RotateCcw, UserCircle } from 'lucide-react'
import clsx from 'clsx'

interface PlacedPlayer {
  athleteId: number
  x: number // percentage 0-100
  y: number // percentage 0-100
}

interface Props {
  athletes: Athlete[]
  sport: string
  initialFormation?: PlacedPlayer[]
  onSave: (formation: PlacedPlayer[]) => void
}

const FIELD_CONFIGS: Record<string, { bg: string; lines: ReactNode }> = {
  football: {
    bg: 'bg-green-700',
    lines: (
      <g stroke="white" strokeWidth="1" fill="none" opacity="0.4">
        <rect x="0" y="0" width="100" height="100" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <circle cx="50" cy="50" r="10" />
        <rect x="20" y="0" width="60" height="18" />
        <rect x="20" y="82" width="60" height="18" />
        <rect x="30" y="0" width="40" height="7" />
        <rect x="30" y="93" width="40" height="7" />
      </g>
    ),
  },
  basketball: {
    bg: 'bg-orange-800',
    lines: (
      <g stroke="white" strokeWidth="1" fill="none" opacity="0.4">
        <rect x="0" y="0" width="100" height="100" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <circle cx="50" cy="50" r="10" />
        <rect x="20" y="0" width="60" height="20" rx="3" />
        <rect x="20" y="80" width="60" height="20" rx="3" />
        <circle cx="50" cy="12" r="8" />
        <circle cx="50" cy="88" r="8" />
      </g>
    ),
  },
  volleyball: {
    bg: 'bg-amber-700',
    lines: (
      <g stroke="white" strokeWidth="1" fill="none" opacity="0.4">
        <rect x="0" y="0" width="100" height="100" />
        <line x1="0" y1="50" x2="100" y2="50" strokeWidth="2" />
        <line x1="0" y1="33" x2="100" y2="33" strokeDasharray="3" />
        <line x1="0" y1="67" x2="100" y2="67" strokeDasharray="3" />
      </g>
    ),
  },
}

export default function FormationEditor({ athletes, sport, initialFormation = [], onSave }: Props) {
  const [placed, setPlaced] = useState<PlacedPlayer[]>(initialFormation)
  const [dragging, setDragging] = useState<number | null>(null)
  const fieldRef = useRef<HTMLDivElement>(null)

  const config = FIELD_CONFIGS[sport] || FIELD_CONFIGS.football

  const available = athletes.filter(a => !placed.some(p => p.athleteId === a.id))

  const getFieldPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if (!fieldRef.current) return null
    const rect = fieldRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
  }

  const handleFieldClick = (e: React.MouseEvent) => {
    if (dragging !== null) {
      const pos = getFieldPosition(e)
      if (!pos) return
      setPlaced(prev => prev.map(p => p.athleteId === dragging ? { ...p, ...pos } : p))
      setDragging(null)
    }
  }

  const handleFieldMove = (e: React.MouseEvent) => {
    if (dragging !== null) {
      const pos = getFieldPosition(e)
      if (!pos) return
      setPlaced(prev => prev.map(p => p.athleteId === dragging ? { ...p, ...pos } : p))
    }
  }

  const addToField = (athleteId: number) => {
    // Place in center area
    const centerX = 50 + (Math.random() - 0.5) * 40
    const centerY = 30 + (Math.random()) * 40
    setPlaced(prev => [...prev, { athleteId, x: centerX, y: centerY }])
  }

  const removeFromField = (athleteId: number) => {
    setPlaced(prev => prev.filter(p => p.athleteId !== athleteId))
    if (dragging === athleteId) setDragging(null)
  }

  const reset = () => { setPlaced([]); setDragging(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Formazione</h3>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={() => onSave(placed)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <Save size={12} /> Salva
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_200px] gap-4">
        {/* Field */}
        <div
          ref={fieldRef}
          className={clsx('relative rounded-xl overflow-hidden aspect-[3/4] cursor-crosshair select-none', config.bg)}
          onClick={handleFieldClick}
          onMouseMove={handleFieldMove}
        >
          {/* Field lines */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {config.lines}
          </svg>

          {/* Players */}
          {placed.map(p => {
            const athlete = athletes.find(a => a.id === p.athleteId)
            if (!athlete) return null
            const isDragging = dragging === p.athleteId
            return (
              <div
                key={p.athleteId}
                className={clsx(
                  'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-shadow z-10',
                  isDragging && 'ring-2 ring-white scale-110'
                )}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onMouseDown={(e) => { e.stopPropagation(); setDragging(p.athleteId) }}
                onDoubleClick={(e) => { e.stopPropagation(); removeFromField(p.athleteId) }}
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-sm font-bold text-gray-800">
                  {athlete.jersey_number || '?'}
                </div>
                <p className="text-[10px] text-white font-medium text-center mt-0.5 text-shadow drop-shadow-md whitespace-nowrap">
                  {athlete.last_name}
                </p>
              </div>
            )
          })}

          {/* Instructions */}
          {placed.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white/50">
              <p className="text-sm">Aggiungi giocatori dalla lista</p>
            </div>
          )}
        </div>

        {/* Roster */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Rosa ({available.length})
          </p>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {available.map(a => (
              <button
                key={a.id}
                onClick={() => addToField(a.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors text-sm"
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold shrink-0">
                  {a.jersey_number || <UserCircle size={12} />}
                </div>
                <span className="truncate">{a.full_name}</span>
              </button>
            ))}
          </div>
          {placed.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
                In campo ({placed.length})
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Doppio click per rimuovere</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
