import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import { Mail, ArrowLeft, Check } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Errore nell\'invio. Riprova.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700 dark:text-brand-400">Coach Partner</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Recupera la tua password</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold">Email inviata!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Se l'indirizzo e corretto, riceverai un link per reimpostare la password.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2 mt-4">
                <ArrowLeft size={16} /> Torna al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="input-field pl-11"
                    placeholder="la-tua@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Invio...' : 'Invia link di recupero'}
              </button>

              <Link to="/login" className="block text-center text-sm text-brand-600 dark:text-brand-400 hover:underline mt-4">
                <ArrowLeft size={14} className="inline mr-1" /> Torna al login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
