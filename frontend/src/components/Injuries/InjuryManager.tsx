import { useEffect, useState } from 'react'
import api from '@/api/client'
import { AlertTriangle, Plus, X, Calendar, Activity, Shield, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface Injury {
  id: number
  athlete_id: number
  injury_type: string
  body_part: string
  description: string | null
  date_occurred: string
  date_return: string | null
  status: 'active' | 'recovery' | 'cleared'
  severity: 'mild' | 'moderate' | 'severe'
  limitations: string | null
  protocol: string | null
  created_at: string
}

interface Props {
  athleteId: number
}

export default function InjuryManager({ athleteId }: Props) {
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [form, setForm] = useState({
    injury_type: '',
    body_part: '',
    description: '',
    date_occurred: new Date().toISOString().split('T')[0],
    severity: 'mild',
    limitations: '',
    protocol: '',
  })

  useEffect(() => {
    api.get(`/injuries?athlete_id=${athleteId}`).then(({ data }) => {
      setInjuries(data.injuries)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [athleteId])

  const handleCreate = async () => {
    if (!form.injury_type || !form.body_part) return
    const { data } = await api.post('/injuries', {
      athlete_id: athleteId,
      ...form,
    })
    setInjuries(prev => [data.injury, ...prev])
    setForm({ injury_type: '', body_part: '', description: '', date_occurred: new Date().toISOString().split('T')[0], severity: 'mild', limitations: '', protocol: '' })
    setShowCreate(false)
  }

  const updateStatus = async (injuryId: number, status: string, dateReturn?: string) => {
    const payload: Record<string, string> = { status }
    if (dateReturn) payload.date_return = dateReturn
    const { data } = await api.patch(`/injuries/${injuryId}`, payload)
    setInjuries(prev => prev.map(i => i.id === injuryId ? data.injury : i))
  }

  const severityConfig = {
    mild: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Lieve' },
    moderate: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Moderato' },
    severe: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Grave' },
  }

  const statusConfig = {
    active: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Attivo', icon: AlertTriangle },
    recovery: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Recupero', icon: Activity },
    cleared: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Guarito', icon: Shield },
  }

  if (loading) return <div className="text-center py-8 text-gray-400 dark:text-gray-500">Caricamento...</div>

  const active = injuries.filter(i => i.status !== 'cleared')
  const history = injuries.filter(i => i.status === 'cleared')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle size={18} /> Infortuni
        </h3>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          {showCreate ? 'Annulla' : 'Registra'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo infortunio *</label>
              <input className="input-field" placeholder="es. Distorsione" value={form.injury_type}
                onChange={e => setForm(p => ({ ...p, injury_type: e.target.value }))} />
            </div>
            <div>
              <label className="label">Zona corporea *</label>
              <input className="input-field" placeholder="es. Caviglia destra" value={form.body_part}
                onChange={e => setForm(p => ({ ...p, body_part: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data</label>
              <input type="date" className="input-field" value={form.date_occurred}
                onChange={e => setForm(p => ({ ...p, date_occurred: e.target.value }))} />
            </div>
            <div>
              <label className="label">Gravità</label>
              <select className="input-field" value={form.severity}
                onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                <option value="mild">Lieve</option>
                <option value="moderate">Moderato</option>
                <option value="severe">Grave</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrizione</label>
            <textarea className="input-field" rows={2} placeholder="Dettagli sull'infortunio..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Limitazioni</label>
            <input className="input-field" placeholder="es. No corsa, no salti"
              value={form.limitations} onChange={e => setForm(p => ({ ...p, limitations: e.target.value }))} />
          </div>
          <div>
            <label className="label">Protocollo recupero</label>
            <textarea className="input-field" rows={2} placeholder="Programma di recupero..."
              value={form.protocol} onChange={e => setForm(p => ({ ...p, protocol: e.target.value }))} />
          </div>
          <button onClick={handleCreate} className="btn-primary text-sm">Registra Infortunio</button>
        </div>
      )}

      {/* Active injuries */}
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Infortuni Attivi</p>
          {active.map(injury => {
            const sev = severityConfig[injury.severity] || severityConfig.mild
            const st = statusConfig[injury.status] || statusConfig.active
            const expanded = expandedId === injury.id
            return (
              <div key={injury.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <div
                  onClick={() => setExpandedId(expanded ? null : injury.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', st.color)}>
                      <st.icon size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{injury.injury_type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{injury.body_part}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx('px-2 py-1 rounded-lg text-xs font-medium', sev.color)}>{sev.label}</span>
                    <span className={clsx('px-2 py-1 rounded-lg text-xs font-medium', st.color)}>{st.label}</span>
                    <ChevronRight size={16} className={clsx('text-gray-400 transition-transform', expanded && 'rotate-90')} />
                  </div>
                </div>
                {expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Data infortunio:</span>{' '}
                        <span className="font-medium">{new Date(injury.date_occurred).toLocaleDateString('it-IT')}</span>
                      </div>
                      {injury.date_return && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Rientro previsto:</span>{' '}
                          <span className="font-medium">{new Date(injury.date_return).toLocaleDateString('it-IT')}</span>
                        </div>
                      )}
                    </div>
                    {injury.description && (
                      <div className="text-sm">
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Descrizione</p>
                        <p>{injury.description}</p>
                      </div>
                    )}
                    {injury.limitations && (
                      <div className="text-sm">
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Limitazioni</p>
                        <p className="text-red-600 dark:text-red-400">{injury.limitations}</p>
                      </div>
                    )}
                    {injury.protocol && (
                      <div className="text-sm">
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Protocollo</p>
                        <p>{injury.protocol}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {injury.status === 'active' && (
                        <button onClick={() => updateStatus(injury.id, 'recovery')}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                          <Activity size={14} /> Passa a Recupero
                        </button>
                      )}
                      {(injury.status === 'active' || injury.status === 'recovery') && (
                        <button onClick={() => updateStatus(injury.id, 'cleared', new Date().toISOString().split('T')[0])}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                          <Shield size={14} /> Segna Guarito
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Storico</p>
          {history.map(injury => (
            <div key={injury.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-green-500" />
                <div>
                  <p className="text-sm font-medium">{injury.injury_type} — {injury.body_part}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(injury.date_occurred).toLocaleDateString('it-IT')}
                    {injury.date_return && ` → ${new Date(injury.date_return).toLocaleDateString('it-IT')}`}
                  </p>
                </div>
              </div>
              <span className={clsx('px-2 py-1 rounded-lg text-xs font-medium', severityConfig[injury.severity]?.color)}>
                {severityConfig[injury.severity]?.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {injuries.length === 0 && !showCreate && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <Shield size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nessun infortunio registrato</p>
        </div>
      )}
    </div>
  )
}
