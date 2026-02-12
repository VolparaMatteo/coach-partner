import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-green-50 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">Coach Partner</h1>
          <p className="text-gray-500 mt-2">Il tuo assistente digitale per l'allenamento</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Accedi</h2>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="coach@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="La tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Accesso...' : 'Accedi'}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <Link to="/forgot-password" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400">
              Password dimenticata?
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Non hai un account?{' '}
              <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                Registrati gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
