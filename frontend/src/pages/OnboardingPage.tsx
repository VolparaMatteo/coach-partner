import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import api from '@/api/client'
import type { SportConfig } from '@/types'
import {
  Dribbble, CircleDot, Volleyball,
  ChevronRight, ChevronLeft, Check, Plus, Trash2
} from 'lucide-react'
import clsx from 'clsx'

const sportIcons: Record<string, any> = {
  football: Dribbble,
  basketball: CircleDot,
  volleyball: Volleyball,
}

const sportEmoji: Record<string, string> = {
  football: '\u26BD',
  basketball: '\uD83C\uDFC0',
  volleyball: '\uD83C\uDFD0',
}

interface RosterEntry {
  first_name: string
  last_name: string
  jersey_number: string
  position: string
}

export default function OnboardingPage() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(user?.onboarding_step || 0)
  const [loading, setLoading] = useState(false)

  // Step 1: Sport
  const [sport, setSport] = useState(user?.sport || '')
  const [sportConfig, setSportConfig] = useState<SportConfig | null>(null)

  // Step 2: Team
  const [teamForm, setTeamForm] = useState({
    name: '', category: '', level: 'amateur', gender: 'male',
    num_athletes: '', training_days: [] as string[], match_day: '',
  })
  const [teamId, setTeamId] = useState<number | null>(null)

  // Step 3: Philosophy
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [coachingLevel, setCoachingLevel] = useState('')
  const [yearsExp, setYearsExp] = useState('')

  // Step 4: Roster
  const [roster, setRoster] = useState<RosterEntry[]>([
    { first_name: '', last_name: '', jersey_number: '', position: '' },
  ])

  // Load sport config when sport changes
  useEffect(() => {
    if (sport) {
      api.get(`/onboarding/sport-config/${sport}`).then(({ data }) => {
        setSportConfig(data.config)
      })
    }
  }, [sport])

  const handleSportSelect = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/onboarding/step/sport', { sport })
      setUser(data.user)
      setStep(1)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleTeamCreate = async () => {
    if (!teamForm.name.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post('/onboarding/step/team', {
        ...teamForm,
        num_athletes: teamForm.num_athletes ? parseInt(teamForm.num_athletes) : null,
      })
      setUser(data.user || user)
      setTeamId(data.team.id)
      setStep(2)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handlePhilosophy = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/onboarding/step/philosophy', {
        focus_areas: focusAreas,
        coaching_level: coachingLevel,
        years_experience: yearsExp ? parseInt(yearsExp) : null,
      })
      setUser(data.user)
      setStep(3)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleRoster = async () => {
    const validAthletes = roster.filter(a => a.first_name && a.last_name)
    setLoading(true)
    try {
      if (validAthletes.length > 0 && teamId) {
        await api.post('/onboarding/step/roster', {
          team_id: teamId,
          athletes: validAthletes.map(a => ({
            ...a,
            jersey_number: a.jersey_number ? parseInt(a.jersey_number) : null,
          })),
        })
      }
      setStep(4)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/onboarding/complete')
      setUser(data.user)
      navigate('/')
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const days = ['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica']
  const dayValues = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const toggleDay = (day: string) => {
    setTeamForm(prev => ({
      ...prev,
      training_days: prev.training_days.includes(day)
        ? prev.training_days.filter(d => d !== day)
        : [...prev.training_days, day],
    }))
  }

  const toggleFocus = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const addRosterRow = () => {
    setRoster(prev => [...prev, { first_name: '', last_name: '', jersey_number: '', position: '' }])
  }

  const updateRosterRow = (index: number, field: keyof RosterEntry, value: string) => {
    setRoster(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const removeRosterRow = (index: number) => {
    setRoster(prev => prev.filter((_, i) => i !== index))
  }

  const steps = ['Sport', 'Squadra', 'Filosofia', 'Rosa', 'Pronto!']

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-green-50">
      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-brand-700">Coach Partner</h1>
            <span className="text-sm text-gray-500">Step {step + 1} di {steps.length}</span>
          </div>
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'h-2 rounded-full flex-1 transition-colors',
                  i <= step ? 'bg-brand-500' : 'bg-gray-200'
                )}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => (
              <span key={i} className={clsx('text-xs', i <= step ? 'text-brand-600 font-medium' : 'text-gray-400')}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* STEP 0: Sport Selection */}
        {step === 0 && (
          <div className="card text-center">
            <h2 className="text-2xl font-bold mb-2">Benvenuto, {user?.first_name}!</h2>
            <p className="text-gray-500 mb-8">Quale sport alleni?</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { value: 'football', label: 'Calcio' },
                { value: 'basketball', label: 'Basket' },
                { value: 'volleyball', label: 'Pallavolo' },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setSport(s.value)}
                  className={clsx(
                    'p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3',
                    sport === s.value
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <span className="text-4xl">{sportEmoji[s.value]}</span>
                  <span className="font-semibold">{s.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleSportSelect}
              disabled={!sport || loading}
              className="btn-primary"
            >
              {loading ? 'Salvataggio...' : 'Continua'} <ChevronRight className="inline ml-1" size={18} />
            </button>
          </div>
        )}

        {/* STEP 1: Team Profile */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-2">Profilo Squadra {sportEmoji[sport]}</h2>
            <p className="text-gray-500 mb-6">Configura la tua squadra</p>
            <div className="space-y-4">
              <div>
                <label className="label">Nome squadra *</label>
                <input
                  className="input-field"
                  placeholder="es. Juventus U16"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Categoria</label>
                  <select
                    className="input-field"
                    value={teamForm.category}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Seleziona</option>
                    {sportConfig?.categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Livello</label>
                  <select
                    className="input-field"
                    value={teamForm.level}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, level: e.target.value }))}
                  >
                    <option value="amateur">Amatoriale</option>
                    <option value="elite">Elite / Agonistico</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Genere</label>
                  <select
                    className="input-field"
                    value={teamForm.gender}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="male">Maschile</option>
                    <option value="female">Femminile</option>
                    <option value="mixed">Misto</option>
                  </select>
                </div>
                <div>
                  <label className="label">Numero atleti</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="es. 20"
                    value={teamForm.num_athletes}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, num_athletes: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Giorni allenamento</label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(dayValues[i])}
                      className={clsx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        teamForm.training_days.includes(dayValues[i])
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Giorno gara</label>
                <select
                  className="input-field"
                  value={teamForm.match_day}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, match_day: e.target.value }))}
                >
                  <option value="">Seleziona</option>
                  {days.map((day, i) => (
                    <option key={day} value={dayValues[i]}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(0)} className="btn-secondary">
                <ChevronLeft className="inline mr-1" size={18} /> Indietro
              </button>
              <button onClick={handleTeamCreate} disabled={!teamForm.name || loading} className="btn-primary flex-1">
                {loading ? 'Creazione...' : 'Continua'} <ChevronRight className="inline ml-1" size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Philosophy */}
        {step === 2 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-2">La tua Filosofia</h2>
            <p className="text-gray-500 mb-6">Quali sono i tuoi focus principali come allenatore?</p>
            <div className="space-y-4">
              <div>
                <label className="label">Focus principali (seleziona 1-3)</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { value: 'tactical', label: 'Tattica', desc: 'Sistemi di gioco, schemi' },
                    { value: 'technical', label: 'Tecnica', desc: 'Fondamentali, skill individuali' },
                    { value: 'physical', label: 'Fisico', desc: 'Preparazione atletica, carichi' },
                    { value: 'mental', label: 'Mentale', desc: 'Motivazione, concentrazione' },
                    { value: 'prevention', label: 'Prevenzione', desc: 'Infortuni, recupero' },
                  ].map(area => (
                    <button
                      key={area.value}
                      onClick={() => toggleFocus(area.value)}
                      className={clsx(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        focusAreas.includes(area.value)
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span className="font-semibold text-sm">{area.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{area.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Livello coaching</label>
                  <select
                    className="input-field"
                    value={coachingLevel}
                    onChange={(e) => setCoachingLevel(e.target.value)}
                  >
                    <option value="">Seleziona</option>
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzato</option>
                    <option value="professional">Professionista</option>
                  </select>
                </div>
                <div>
                  <label className="label">Anni di esperienza</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="es. 5"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ChevronLeft className="inline mr-1" size={18} /> Indietro
              </button>
              <button onClick={handlePhilosophy} disabled={focusAreas.length === 0 || loading} className="btn-primary flex-1">
                {loading ? 'Salvataggio...' : 'Continua'} <ChevronRight className="inline ml-1" size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Roster */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-2">Rosa Squadra</h2>
            <p className="text-gray-500 mb-6">Aggiungi i tuoi atleti (puoi farlo anche dopo)</p>

            <div className="space-y-3">
              {roster.map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    className="input-field flex-1"
                    placeholder="Nome"
                    value={r.first_name}
                    onChange={(e) => updateRosterRow(i, 'first_name', e.target.value)}
                  />
                  <input
                    className="input-field flex-1"
                    placeholder="Cognome"
                    value={r.last_name}
                    onChange={(e) => updateRosterRow(i, 'last_name', e.target.value)}
                  />
                  <input
                    className="input-field w-16"
                    placeholder="#"
                    value={r.jersey_number}
                    onChange={(e) => updateRosterRow(i, 'jersey_number', e.target.value)}
                  />
                  <select
                    className="input-field w-40"
                    value={r.position}
                    onChange={(e) => updateRosterRow(i, 'position', e.target.value)}
                  >
                    <option value="">Ruolo</option>
                    {sportConfig?.positions.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  {roster.length > 1 && (
                    <button onClick={() => removeRosterRow(i)} className="p-3 text-red-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addRosterRow} className="flex items-center gap-2 text-brand-600 font-medium text-sm mt-4 hover:underline">
              <Plus size={16} /> Aggiungi atleta
            </button>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(2)} className="btn-secondary">
                <ChevronLeft className="inline mr-1" size={18} /> Indietro
              </button>
              <button onClick={handleRoster} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Salvataggio...' : 'Continua'} <ChevronRight className="inline ml-1" size={18} />
              </button>
            </div>
            <button
              onClick={() => setStep(4)}
              className="text-sm text-gray-400 hover:text-gray-600 mt-3 w-full text-center"
            >
              Salta per ora
            </button>
          </div>
        )}

        {/* STEP 4: Complete! */}
        {step === 4 && (
          <div className="card text-center">
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-brand-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Tutto pronto!</h2>
            <p className="text-gray-500 mb-8">
              Il tuo spazio Coach Partner e configurato.<br />
              In meno di 30 secondi sarai operativo.
            </p>
            <div className="bg-brand-50 rounded-xl p-4 mb-8 text-left">
              <p className="font-medium text-brand-800 mb-2">Prossimi passi:</p>
              <ul className="space-y-2 text-sm text-brand-700">
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} /> Crea il tuo primo allenamento
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} /> Pianifica la prossima gara
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} /> Inizia a valutare i tuoi atleti
                </li>
              </ul>
            </div>
            <button onClick={handleComplete} disabled={loading} className="btn-primary text-lg px-10">
              {loading ? 'Caricamento...' : 'Entra in Coach Partner'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
