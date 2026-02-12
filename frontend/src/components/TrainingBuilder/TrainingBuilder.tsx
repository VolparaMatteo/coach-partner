import { useState } from 'react'
import type { TrainingBlock, SportConfig } from '@/types'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Plus, Trash2, ChevronDown, ChevronUp,
  Clock, Flame, Target, Save, Play
} from 'lucide-react'
import clsx from 'clsx'

interface Props {
  blocks: TrainingBlock[]
  sportConfig: SportConfig | null
  onChange: (blocks: TrainingBlock[]) => void
  onSave?: () => void
  onStartFieldMode?: () => void
}

const intensityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  high: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
  very_high: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
}

const intensityLabels: Record<string, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  very_high: 'Molto Alta',
}

const blockTypeColors: Record<string, string> = {
  warmup: 'border-l-amber-400',
  technical: 'border-l-blue-400',
  tactical: 'border-l-purple-400',
  physical: 'border-l-red-400',
  game: 'border-l-green-400',
  shooting: 'border-l-orange-400',
  serve: 'border-l-cyan-400',
  reception: 'border-l-teal-400',
  set_piece: 'border-l-indigo-400',
  special: 'border-l-pink-400',
  cooldown: 'border-l-gray-400',
}

interface SortableBlockProps {
  block: TrainingBlock
  index: number
  expanded: boolean
  blockTypes: { value: string; label: string }[]
  onToggleExpand: () => void
  onUpdate: (updates: Partial<TrainingBlock>) => void
  onRemove: () => void
}

function SortableBlock({ block, index, expanded, blockTypes, onToggleExpand, onUpdate, onRemove }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id || index,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-xl border-l-4 border border-gray-200 dark:border-gray-700 transition-all',
        blockTypeColors[block.block_type] || 'border-l-gray-300',
        isDragging && 'opacity-50 shadow-lg z-50',
      )}
    >
      {/* Block header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggleExpand}>
        <div
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
              {blockTypes.find(t => t.value === block.block_type)?.label || block.block_type}
            </span>
            {block.intensity && (
              <span className={clsx('px-2 py-0.5 rounded text-xs font-medium border', intensityColors[block.intensity])}>
                {intensityLabels[block.intensity]}
              </span>
            )}
          </div>
          <p className="font-semibold text-sm mt-0.5 truncate">
            {block.name || 'Blocco senza nome'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {block.duration_minutes && (
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock size={14} /> {block.duration_minutes}'
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>

      {/* Block detail (expanded) */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="label">Nome *</label>
              <input className="input-field text-sm" placeholder="es. Rondo 4v2"
                value={block.name} onChange={(e) => onUpdate({ name: e.target.value })} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input-field text-sm" value={block.block_type}
                onChange={(e) => onUpdate({ block_type: e.target.value })}>
                {blockTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Durata (min)</label>
              <input type="number" className="input-field text-sm" value={block.duration_minutes || ''}
                onChange={(e) => onUpdate({ duration_minutes: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            <div>
              <label className="label">Intensita</label>
              <select className="input-field text-sm" value={block.intensity || ''}
                onChange={(e) => onUpdate({ intensity: e.target.value || null })}>
                <option value="">-</option>
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="very_high">Molto Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Obiettivo</label>
            <input className="input-field text-sm" placeholder="Obiettivo del blocco"
              value={block.objective || ''} onChange={(e) => onUpdate({ objective: e.target.value || null })} />
          </div>
          <div>
            <label className="label">Descrizione / Setup</label>
            <textarea className="input-field text-sm" rows={2} placeholder="Descrizione dell'esercizio..."
              value={block.description || ''} onChange={(e) => onUpdate({ description: e.target.value || null })} />
          </div>
          <div>
            <label className="label">Coaching Points</label>
            <textarea className="input-field text-sm" rows={2} placeholder="Punti chiave per il coach..."
              value={block.coaching_points || ''} onChange={(e) => onUpdate({ coaching_points: e.target.value || null })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Attrezzatura</label>
              <input className="input-field text-sm" placeholder="es. Coni, palloni"
                value={block.equipment || ''} onChange={(e) => onUpdate({ equipment: e.target.value || null })} />
            </div>
            <div>
              <label className="label">Spazio</label>
              <input className="input-field text-sm" placeholder="es. Meta campo"
                value={block.space || ''} onChange={(e) => onUpdate({ space: e.target.value || null })} />
            </div>
            <div>
              <label className="label">N. Giocatori</label>
              <input className="input-field text-sm" placeholder="es. 4v4+2"
                value={block.num_players || ''} onChange={(e) => onUpdate({ num_players: e.target.value || null })} />
            </div>
          </div>
          <div>
            <label className="label">Varianti</label>
            <input className="input-field text-sm" placeholder="Varianti e progressioni..."
              value={block.variations || ''} onChange={(e) => onUpdate({ variations: e.target.value || null })} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrainingBuilder({ blocks, sportConfig, onChange, onSave, onStartFieldMode }: Props) {
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const totalDuration = blocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0)

  const addBlock = () => {
    const newBlock: TrainingBlock = {
      id: Date.now(),
      session_id: 0,
      order: blocks.length,
      block_type: 'technical',
      name: '',
      objective: null,
      duration_minutes: 15,
      intensity: 'medium',
      description: null,
      coaching_points: null,
      variations: null,
      equipment: null,
      space: null,
      num_players: null,
      rules: null,
      tags: null,
      completed: false,
      actual_rpe: null,
      notes: null,
    }
    onChange([...blocks, newBlock])
    setExpandedBlock(blocks.length)
  }

  const updateBlock = (index: number, updates: Partial<TrainingBlock>) => {
    onChange(blocks.map((b, i) => i === index ? { ...b, ...updates } : b))
  }

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, order: i })))
    if (expandedBlock === index) setExpandedBlock(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex(b => (b.id || blocks.indexOf(b)) === active.id)
    const newIndex = blocks.findIndex(b => (b.id || blocks.indexOf(b)) === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }))
      onChange(newBlocks)
    }
  }

  const blockTypes = sportConfig?.block_types || [
    { value: 'warmup', label: 'Riscaldamento' },
    { value: 'technical', label: 'Tecnico' },
    { value: 'tactical', label: 'Tattico' },
    { value: 'physical', label: 'Fisico' },
    { value: 'game', label: 'Gioco' },
    { value: 'cooldown', label: 'Defaticamento' },
  ]

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Target size={16} className="text-brand-600" />
            <span className="font-medium">{blocks.length} blocchi</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-blue-600" />
            <span className="font-medium">{totalDuration} min totali</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onStartFieldMode && blocks.length > 0 && (
            <button onClick={onStartFieldMode} className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200">
              <Play size={16} /> Modalita Campo
            </button>
          )}
          {onSave && (
            <button onClick={onSave} className="btn-primary flex items-center gap-2 text-sm py-2">
              <Save size={16} /> Salva
            </button>
          )}
        </div>
      </div>

      {/* Blocks with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b, i) => b.id || i)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map((block, index) => (
              <SortableBlock
                key={block.id || index}
                block={block}
                index={index}
                expanded={expandedBlock === index}
                blockTypes={blockTypes}
                onToggleExpand={() => setExpandedBlock(expandedBlock === index ? null : index)}
                onUpdate={(updates) => updateBlock(index, updates)}
                onRemove={() => removeBlock(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add block button */}
      <button
        onClick={addBlock}
        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Plus size={20} /> Aggiungi Blocco
      </button>
    </div>
  )
}
