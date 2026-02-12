import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import api from '@/api/client'
import { Settings, User, Save, Check } from 'lucide-react'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    coaching_level: user?.coaching_level || '',
    years_experience: user?.years_experience?.toString() || '',
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data } = await api.patch('/auth/me', {
        ...form,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      })
      setUser(data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const sportLabel: Record<string, string> = {
    football: 'Calcio',
    basketball: 'Basket',
    volleyball: 'Pallavolo',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings size={24} /> Impostazioni
        </h1>
        <p className="text-gray-500 text-sm">Gestisci il tuo profilo Coach Partner</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <User size={18} /> Profilo Allenatore
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome</label>
              <input className="input-field" value={form.first_name}
                onChange={(e) => setForm(p => ({ ...p, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Cognome</label>
              <input className="input-field" value={form.last_name}
                onChange={(e) => setForm(p => ({ ...p, last_name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field bg-gray-50" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input className="input-field" placeholder="+39 333 1234567" value={form.phone}
              onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sport</label>
              <input className="input-field bg-gray-50"
                value={user?.sport ? sportLabel[user.sport] || user.sport : ''} disabled />
            </div>
            <div>
              <label className="label">Livello</label>
              <select className="input-field" value={form.coaching_level}
                onChange={(e) => setForm(p => ({ ...p, coaching_level: e.target.value }))}>
                <option value="">Seleziona</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzato</option>
                <option value="professional">Professionista</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Anni di esperienza</label>
            <input type="number" className="input-field w-32" value={form.years_experience}
              onChange={(e) => setForm(p => ({ ...p, years_experience: e.target.value }))} />
          </div>

          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {saved ? <><Check size={18} /> Salvato!</> : <><Save size={18} /> {loading ? 'Salvataggio...' : 'Salva Modifiche'}</>}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Informazioni</h2>
        <p className="text-sm text-gray-500">
          Coach Partner v1.0.0<br />
          Account creato il {user?.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : 'N/D'}
        </p>
      </div>
    </div>
  )
}
