import React, { useEffect, useState } from 'react'
import api from '@/api/client'
import type { StaffMember, Team } from '@/types'
import { useToastStore } from '@/store/toast'
import { useTeamStore } from '@/store/team'
import { Users, Plus, X, Mail, Shield, Eye, Edit3, Trash2, Copy, Check } from 'lucide-react'
import clsx from 'clsx'

export default function StaffManager() {
  const toast = useToastStore()
  const { teams } = useTeamStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    email: '',
    name: '',
    role: 'viewer' as 'viewer' | 'editor' | 'admin',
    team_ids: [] as number[],
  })

  const load = async () => {
    try {
      const { data } = await api.get('/staff')
      setStaff(data.staff)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleInvite = async () => {
    if (!form.email) return
    try {
      await api.post('/staff', {
        ...form,
        team_ids: form.team_ids.length > 0 ? form.team_ids : null,
      })
      toast.success('Invito inviato!')
      setForm({ email: '', name: '', role: 'viewer', team_ids: [] })
      setShowInvite(false)
      load()
    } catch {
      toast.error('Errore nell\'invio dell\'invito')
    }
  }

  const handleUpdateRole = async (id: number, role: string) => {
    try {
      await api.put(`/staff/${id}`, { role })
      toast.success('Ruolo aggiornato!')
      load()
    } catch {
      toast.error('Errore nell\'aggiornamento')
    }
  }

  const handleRemove = async (id: number) => {
    if (!confirm('Rimuovere questo membro dello staff?')) return
    try {
      await api.delete(`/staff/${id}`)
      toast.success('Membro rimosso!')
      load()
    } catch {
      toast.error('Errore nella rimozione')
    }
  }

  const toggleTeam = (teamId: number) => {
    setForm(p => ({
      ...p,
      team_ids: p.team_ids.includes(teamId)
        ? p.team_ids.filter(id => id !== teamId)
        : [...p.team_ids, teamId],
    }))
  }

  const roleConfig = {
    viewer: { label: 'Visualizzatore', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
    editor: { label: 'Editor', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Edit3 },
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Shield },
  }

  const statusConfig = {
    pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    active: { label: 'Attivo', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    revoked: { label: 'Revocato', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Users size={18} /> Staff & Collaboratori
        </h2>
        <button onClick={() => setShowInvite(true)} className="btn-primary text-sm py-2 px-3 flex items-center gap-2">
          <Plus size={14} /> Invita
        </button>
      </div>

      {showInvite && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm">Invita Collaboratore</h3>
            <button onClick={() => setShowInvite(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Email *</label>
              <input className="input-field text-sm" placeholder="email@esempio.it" type="email"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">Nome</label>
              <input className="input-field text-sm" placeholder="Nome e cognome"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label text-xs">Ruolo</label>
            <div className="flex gap-2">
              {(['viewer', 'editor', 'admin'] as const).map(role => (
                <button key={role} onClick={() => setForm(p => ({ ...p, role }))}
                  className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    form.role === role ? roleConfig[role].color : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  )}>
                  {React.createElement(roleConfig[role].icon, { size: 14 })}
                  {roleConfig[role].label}
                </button>
              ))}
            </div>
          </div>
          {teams.length > 1 && (
            <div>
              <label className="label text-xs">Accesso squadre (vuoto = tutte)</label>
              <div className="flex flex-wrap gap-2">
                {teams.map(team => (
                  <button key={team.id} onClick={() => toggleTeam(team.id)}
                    className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      form.team_ids.includes(team.id)
                        ? 'bg-brand-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                    )}>
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleInvite} disabled={!form.email} className="btn-primary text-sm py-2 px-4">
            <Mail size={14} className="inline mr-1" /> Invia Invito
          </button>
        </div>
      )}

      {staff.filter(s => s.status !== 'revoked').length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">Nessun collaboratore. Invitane uno!</p>
      ) : (
        <div className="space-y-2">
          {staff.filter(s => s.status !== 'revoked').map(member => (
            <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">{member.name || member.email}</p>
                  {member.name && <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx('px-2 py-1 rounded-lg text-xs font-medium', statusConfig[member.status].color)}>
                  {statusConfig[member.status].label}
                </span>
                <select className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800"
                  value={member.role} onChange={e => handleUpdateRole(member.id, e.target.value)}>
                  <option value="viewer">Visualizzatore</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => handleRemove(member.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
