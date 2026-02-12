import { useState } from 'react'
import api from '@/api/client'
import { Heart, Save } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  athleteId: number
  onSaved: () => void
}

const moodOptions = [
  { value: 'great', label: 'Ottimo', emoji: '\uD83D\uDE04' },
  { value: 'good', label: 'Bene', emoji: '\uD83D\uDE42' },
  { value: 'neutral', label: 'Cosi cosi', emoji: '\uD83D\uDE10' },
  { value: 'low', label: 'Basso', emoji: '\uD83D\uDE1F' },
  { value: 'bad', label: 'Male', emoji: '\uD83D\uDE29' },
]

export default function WellnessForm({ athleteId, onSaved }: Props) {
  const [energy, setEnergy] = useState(5)
  const [sleepQuality, setSleepQuality] = useState(5)
  const [stress, setStress] = useState(5)
  const [doms, setDoms] = useState(5)
  const [pain, setPain] = useState(1)
  const [mood, setMood] = useState('good')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const sliderColor = (value: number, invert = false) => {
    const v = invert ? 11 - value : value
    if (v >= 7) return 'accent-green-500'
    if (v >= 4) return 'accent-yellow-500'
    return 'accent-red-500'
  }

  const handleSave = async () => {
    setSaving(true)
    await api.post('/wellness', {
      athlete_id: athleteId,
      date: new Date().toISOString().split('T')[0],
      energy, sleep_quality: sleepQuality, stress, doms, pain, mood,
      notes: notes || null,
    })
    setSaving(false)
    onSaved()
  }

  const SliderField = ({ label, value, onChange, invert = false, description }: {
    label: string; value: number; onChange: (v: number) => void; invert?: boolean; description: string
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className={clsx('text-lg font-bold',
          (invert ? 11 - value : value) >= 7 ? 'text-green-600' :
          (invert ? 11 - value : value) >= 4 ? 'text-yellow-600' : 'text-red-600'
        )}>
          {value}/10
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-2">{description}</p>
      <input type="range" min="1" max="10" value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={clsx('w-full h-2 rounded-lg appearance-none cursor-pointer', sliderColor(value, invert))}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Heart size={20} className="text-red-500" />
        <h3 className="font-semibold text-lg">Wellness Check</h3>
      </div>

      <SliderField label="Energia" value={energy} onChange={setEnergy}
        description="1 = esausto, 10 = pieno di energia" />

      <SliderField label="Qualita Sonno" value={sleepQuality} onChange={setSleepQuality}
        description="1 = pessimo, 10 = riposato perfettamente" />

      <SliderField label="Stress" value={stress} onChange={setStress} invert
        description="1 = rilassato, 10 = molto stressato" />

      <SliderField label="DOMS (indolenzimento)" value={doms} onChange={setDoms} invert
        description="1 = nessun dolore, 10 = molto indolenzito" />

      <SliderField label="Dolore" value={pain} onChange={setPain} invert
        description="1 = nessun dolore, 10 = dolore forte" />

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Umore</label>
        <div className="flex gap-2">
          {moodOptions.map(m => (
            <button key={m.value} onClick={() => setMood(m.value)}
              className={clsx('flex-1 py-3 rounded-xl text-center transition-colors border-2',
                mood === m.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
              )}>
              <span className="text-2xl">{m.emoji}</span>
              <p className="text-xs mt-1">{m.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Note (opzionale)</label>
        <input className="input-field" placeholder="Come ti senti oggi..."
          value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        <Save size={16} /> {saving ? 'Salvataggio...' : 'Salva Wellness'}
      </button>
    </div>
  )
}
