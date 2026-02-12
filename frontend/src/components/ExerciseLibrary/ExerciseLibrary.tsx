import { useState } from 'react'
import type { SportConfig } from '@/types'
import { BookOpen, Search, Plus, Check } from 'lucide-react'
import clsx from 'clsx'

// Built-in exercise library per sport
const EXERCISES: Record<string, { name: string; type: string; duration: number; intensity: string; description: string; equipment: string }[]> = {
  football: [
    { name: 'Rondo 4v2', type: 'technical', duration: 10, intensity: 'medium', description: 'Possesso palla in spazio ristretto. 4 giocatori mantengono il possesso contro 2 pressanti.', equipment: 'Coni, pallone' },
    { name: 'Possesso 5v5 + 2 jolly', type: 'tactical', duration: 15, intensity: 'high', description: 'Possesso palla con superiorita numerica grazie a 2 jolly. Focus su smarcamento e circolazione.', equipment: 'Casacche, coni, palloni' },
    { name: 'Partitella a tema', type: 'game', duration: 20, intensity: 'high', description: 'Partitella con vincoli specifici (es. max 2 tocchi, gol vale doppio da cross).', equipment: 'Porte, casacche' },
    { name: 'Pressing alto 3v3', type: 'tactical', duration: 12, intensity: 'very_high', description: 'Esercizio di pressing nella meta campo avversaria. Squadra in possesso deve uscire dalla pressione.', equipment: 'Coni, casacche' },
    { name: 'Cross e finalizzazione', type: 'technical', duration: 15, intensity: 'high', description: 'Lavoro sulle fasce con cross e attacco dell\'area. Rotazione attaccanti e crosser.', equipment: 'Palloni, porte' },
    { name: 'Circuito atletico', type: 'physical', duration: 15, intensity: 'very_high', description: 'Stazioni di lavoro atletico: sprint, cambio direzione, salti, core.', equipment: 'Coni, ostacoli, scala' },
    { name: 'Torello dinamico', type: 'warmup', duration: 8, intensity: 'low', description: 'Riscaldamento con palla. Cerchio di passaggi con 1-2 giocatori al centro.', equipment: 'Pallone' },
    { name: 'Calci piazzati', type: 'set_piece', duration: 15, intensity: 'medium', description: 'Lavoro su corner, punizioni dal limite, rimesse laterali. Schemi offensivi e difensivi.', equipment: 'Palloni, sagome' },
  ],
  basketball: [
    { name: '3-man weave', type: 'warmup', duration: 8, intensity: 'low', description: 'Tre giocatori in transizione con passaggi incrociati fino a canestro.', equipment: 'Palloni' },
    { name: 'Shell drill difensivo', type: 'tactical', duration: 12, intensity: 'medium', description: '4v4 difensivo. Focus su closeout, help, rotazioni e recupero.', equipment: 'Casacche' },
    { name: 'Pick and roll 2v2', type: 'tactical', duration: 15, intensity: 'high', description: 'Lavoro specifico su blocco e taglio. Letture del portatore e del bloccante.', equipment: '' },
    { name: 'Shooting drill: spot up', type: 'shooting', duration: 10, intensity: 'medium', description: 'Tiro da fermo da 5 posizioni. Passaggio dal playmaker, piedi pronti, tiro rapido.', equipment: 'Palloni' },
    { name: '5v5 transizione', type: 'game', duration: 20, intensity: 'very_high', description: 'Gioco 5v5 con enfasi sulla transizione rapida. Regola: entro 7 secondi dalla rimessa.', equipment: '' },
    { name: 'Fast break 3v2 -> 2v1', type: 'tactical', duration: 12, intensity: 'high', description: 'Contropiede in superiorita numerica con continuita.', equipment: '' },
    { name: 'Suicidi / Navette', type: 'physical', duration: 8, intensity: 'very_high', description: 'Corsa ad alta intensita con cambi di direzione. Lavoro sulla resistenza e mentalita.', equipment: '' },
    { name: 'Tiri liberi sotto fatica', type: 'shooting', duration: 10, intensity: 'medium', description: 'Serie di tiri liberi dopo sprint o esercizi atletici. Simulazione game-like.', equipment: 'Palloni' },
  ],
  volleyball: [
    { name: 'Ricezione a 3', type: 'reception', duration: 12, intensity: 'medium', description: 'Ricezione su battuta float e spin. Rotazione dei ricettori. Focus sulla qualita del primo tocco.', equipment: 'Palloni' },
    { name: 'Attacco da zona 4', type: 'technical', duration: 15, intensity: 'high', description: 'Alzata in zona 4, attacco in diagonale e lungolinea. Rotazione attaccanti.', equipment: 'Palloni' },
    { name: 'Muro a 2', type: 'tactical', duration: 12, intensity: 'high', description: 'Lavoro sul muro a due. Lettura dell\'alzata, spostamento laterale, timing del salto.', equipment: '' },
    { name: 'Difesa e ricostruzione', type: 'tactical', duration: 15, intensity: 'very_high', description: '6v6: un lato attacca, l\'altro difende e ricostruisce. Focus sulla copertura d\'attacco.', equipment: 'Palloni, rete' },
    { name: 'Battuta tattica', type: 'serve', duration: 10, intensity: 'medium', description: 'Battuta mirata su zone specifiche del campo. Variazione float e spin.', equipment: 'Palloni' },
    { name: 'Set giocato con vincoli', type: 'game', duration: 20, intensity: 'high', description: 'Set con regole speciali (es. solo parallela, pallonetto vietato, set da zona 2).', equipment: '' },
    { name: 'Corsa + pliometria', type: 'physical', duration: 10, intensity: 'very_high', description: 'Circuit training: skip, balzi, squat jump, block jump. Lavoro esplosivita.', equipment: 'Tappetini, ostacoli' },
    { name: 'Palleggio di precisione', type: 'technical', duration: 10, intensity: 'low', description: 'Lavoro tecnico sul palleggio. A coppie, al muro, con target. Focus sulla pulizia del gesto.', equipment: 'Palloni' },
  ],
}

interface Props {
  sport: string
  sportConfig: SportConfig | null
  onSelectExercise?: (exercise: { name: string; block_type: string; duration_minutes: number; intensity: string; description: string; equipment: string }) => void
}

export default function ExerciseLibrary({ sport, sportConfig, onSelectExercise }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const exercises = EXERCISES[sport] || []

  const filtered = exercises.filter(e =>
    (search === '' || e.name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())) &&
    (filterType === '' || e.type === filterType)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={20} className="text-brand-600" />
        <h3 className="font-semibold text-lg">Libreria Esercizi</h3>
        <span className="text-sm text-gray-400">({exercises.length} esercizi)</span>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9 text-sm" placeholder="Cerca esercizio..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-40 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tutti i tipi</option>
          {sportConfig?.block_types.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-auto">
        {filtered.map((ex, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 uppercase">
                    {sportConfig?.block_types.find(t => t.value === ex.type)?.label || ex.type}
                  </span>
                  <span className="text-xs text-gray-400">{ex.duration} min</span>
                  <span className={clsx('px-2 py-0.5 rounded text-xs font-medium',
                    ex.intensity === 'low' ? 'bg-green-100 text-green-700' :
                    ex.intensity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    ex.intensity === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {ex.intensity === 'low' ? 'Bassa' : ex.intensity === 'medium' ? 'Media' : ex.intensity === 'high' ? 'Alta' : 'Max'}
                  </span>
                </div>
                <p className="font-semibold">{ex.name}</p>
                <p className="text-sm text-gray-500 mt-1">{ex.description}</p>
                {ex.equipment && <p className="text-xs text-gray-400 mt-1">Attrezzatura: {ex.equipment}</p>}
              </div>
              {onSelectExercise && (
                <button
                  onClick={() => onSelectExercise({
                    name: ex.name,
                    block_type: ex.type,
                    duration_minutes: ex.duration,
                    intensity: ex.intensity,
                    description: ex.description,
                    equipment: ex.equipment,
                  })}
                  className="ml-3 p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 shrink-0"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">Nessun esercizio trovato</p>
      )}
    </div>
  )
}
