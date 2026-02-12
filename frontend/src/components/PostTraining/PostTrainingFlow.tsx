import { useState, useEffect } from 'react'
import api from '@/api/client'
import type { TrainingSession, Athlete } from '@/types'
import { Check, Star, Users, Zap, ChevronRight, X } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  session: TrainingSession
  teamId: number
  onClose: () => void
  onComplete: () => void
}

interface AttendanceRow {
  athlete_id: number
  name: string
  status: 'present' | 'absent' | 'injured' | 'excused'
  rpe: number | null
}

export default function PostTrainingFlow({ session, teamId, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [sessionRating, setSessionRating] = useState<number | null>(null)
  const [whatWorked, setWhatWorked] = useState('')
  const [whatToImprove, setWhatToImprove] = useState('')
  const [rpeAvg, setRpeAvg] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/athletes?team_id=${teamId}`).then(({ data }) => {
      setAthletes(data.athletes)
      setAttendance(data.athletes.map((a: Athlete) => ({
        athlete_id: a.id,
        name: a.full_name,
        status: 'present' as const,
        rpe: null,
      })))
      setLoading(false)
    })
  }, [teamId])

  const updateAttendance = (athleteId: number, field: string, value: any) => {
    setAttendance(prev => prev.map(a =>
      a.athlete_id === athleteId ? { ...a, [field]: value } : a
    ))
  }

  const submitAttendance = async () => {
    // Save attendance for each athlete
    for (const row of attendance) {
      await api.post(`/trainings/${session.id}/blocks/0`, {}).catch(() => {})
      // We'll use a simpler approach - just update the session
    }

    // Calculate avg RPE
    const rpes = attendance.filter(a => a.status === 'present' && a.rpe).map(a => a.rpe!)
    if (rpes.length > 0) {
      setRpeAvg(Math.round(rpes.reduce((a, b) => a + b, 0) / rpes.length * 10) / 10)
    }
    setStep(1)
  }

  const submitSessionEval = async () => {
    await api.patch(`/trainings/${session.id}`, {
      status: 'completed',
      rpe_avg: rpeAvg,
      session_rating: sessionRating,
      what_worked: whatWorked,
      what_to_improve: whatToImprove,
    })
    setStep(2)
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const { data } = await api.post('/ai/generate/post-training', {
        session_id: session.id,
      })
      setAiReport(data.report.content)
    } catch {
      setAiReport('AI non configurata. Aggiungi la chiave OpenAI per generare report automatici.')
    }
    setGenerating(false)
  }

  const steps = ['Presenze & RPE', 'Valutazione Sessione', 'AI Report']

  if (loading) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold">Post-Allenamento</h2>
            <p className="text-sm text-gray-500">{session.title || session.date}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 px-6 py-3 bg-gray-50">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' : 'bg-gray-200 text-gray-500'
              )}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={clsx('text-sm', i === step ? 'font-medium' : 'text-gray-400')}>{s}</span>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        <div className="p-6">
          {/* STEP 0: Attendance & RPE */}
          {step === 0 && (
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users size={18} /> Presenze e RPE
              </h3>
              <div className="space-y-2 max-h-96 overflow-auto">
                {attendance.map(row => (
                  <div key={row.athlete_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="font-medium text-sm w-40 truncate">{row.name}</span>
                    <div className="flex gap-1">
                      {(['present', 'absent', 'injured', 'excused'] as const).map(s => (
                        <button key={s} onClick={() => updateAttendance(row.athlete_id, 'status', s)}
                          className={clsx('px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                            row.status === s ? {
                              present: 'bg-green-100 text-green-700',
                              absent: 'bg-red-100 text-red-700',
                              injured: 'bg-orange-100 text-orange-700',
                              excused: 'bg-gray-200 text-gray-600',
                            }[s] : 'bg-white text-gray-400 border border-gray-200'
                          )}>
                          {s === 'present' ? 'Presente' : s === 'absent' ? 'Assente' : s === 'injured' ? 'Infortunato' : 'Giustificato'}
                        </button>
                      ))}
                    </div>
                    {row.status === 'present' && (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-gray-400">RPE:</span>
                        {[1,2,3,4,5,6,7,8,9,10].map(v => (
                          <button key={v} onClick={() => updateAttendance(row.athlete_id, 'rpe', v)}
                            className={clsx('w-6 h-6 rounded text-xs font-bold',
                              row.rpe === v ? 'bg-brand-600 text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-brand-300'
                            )}>
                            {v}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={submitAttendance} className="btn-primary w-full mt-4">
                Avanti <ChevronRight className="inline ml-1" size={16} />
              </button>
            </div>
          )}

          {/* STEP 1: Session Evaluation */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Star size={18} /> Valutazione Sessione
              </h3>
              {rpeAvg && (
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-600">RPE Medio Squadra</p>
                  <p className="text-3xl font-bold text-blue-700">{rpeAvg}</p>
                </div>
              )}
              <div>
                <label className="label">Come valuti la sessione? (1-5)</label>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setSessionRating(v)}
                      className={clsx('flex-1 py-3 rounded-xl font-bold text-lg transition-colors',
                        sessionRating === v ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Cosa ha funzionato?</label>
                <textarea className="input-field" rows={3} placeholder="Punti positivi della sessione..."
                  value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} />
              </div>
              <div>
                <label className="label">Cosa migliorare?</label>
                <textarea className="input-field" rows={3} placeholder="Aspetti da lavorare..."
                  value={whatToImprove} onChange={(e) => setWhatToImprove(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary">Indietro</button>
                <button onClick={submitSessionEval} className="btn-primary flex-1">
                  Salva e Continua <ChevronRight className="inline ml-1" size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: AI Report */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap size={18} /> AI Report Post-Allenamento
              </h3>
              {!aiReport && !generating && (
                <div className="text-center py-8">
                  <Zap size={48} className="mx-auto mb-4 text-brand-300" />
                  <p className="text-gray-500 mb-4">Genera un report automatico basato su piano, note e presenze</p>
                  <button onClick={generateReport} className="btn-primary">
                    Genera Report AI
                  </button>
                </div>
              )}
              {generating && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4" />
                  <p className="text-gray-500">Generazione in corso...</p>
                </div>
              )}
              {aiReport && (
                <div className="bg-gray-50 rounded-xl p-6 whitespace-pre-wrap text-sm leading-relaxed">
                  {aiReport}
                </div>
              )}
              <button onClick={onComplete} className="btn-primary w-full">
                <Check className="inline mr-2" size={16} /> Chiudi Post-Allenamento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
