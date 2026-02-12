import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Le password non coincidono')
      return
    }
    if (form.password.length < 8) {
      setError('La password deve avere almeno 8 caratteri')
      return
    }

    setLoading(true)
    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      })
      navigate('/onboarding')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-green-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">Coach Partner</h1>
          <p className="text-gray-500 mt-2">Registrati gratuitamente come allenatore</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Crea il tuo account</h2>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nome</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mario"
                  value={form.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Cognome</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Rossi"
                  value={form.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="coach@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Minimo 8 caratteri"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Conferma Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Ripeti la password"
                value={form.confirm_password}
                onChange={(e) => update('confirm_password', e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creazione...' : 'Registrati Gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Hai gia un account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
