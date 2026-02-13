import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { useI18n } from '@/store/i18n'
import { useToastStore } from '@/store/toast'
import api from '@/api/client'
import SeasonManager from '@/components/Seasons/SeasonManager'
import StaffManager from '@/components/Staff/StaffManager'
import { AnimatedPage } from '@/components/Motion/AnimatedPage'
import { Settings, User, Save, Check, Moon, Sun, Palette, Globe, Download, Database } from 'lucide-react'
import type { Locale } from '@/i18n/translations'
import clsx from 'clsx'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const { locale, setLocale, t } = useI18n()
  const toast = useToastStore()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    coaching_level: user?.coaching_level || '',
    years_experience: user?.years_experience?.toString() || '',
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

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

  const handleBackup = async () => {
    setExporting(true)
    try {
      const { data } = await api.get('/backup')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `coach-partner-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Backup scaricato!')
    } catch {
      toast.error('Errore nel backup')
    }
    setExporting(false)
  }

  const sportLabel: Record<string, string> = {
    football: 'Calcio',
    basketball: 'Basket',
    volleyball: 'Pallavolo',
  }

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ]

  return (
    <AnimatedPage>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings size={24} /> {t('settings.title')}
          </h1>
          <p className="text-gray-500 text-sm">{t('settings.subtitle')}</p>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User size={18} /> {t('settings.profile')}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('settings.first_name')}</label>
                <input className="input-field" value={form.first_name}
                  onChange={(e) => setForm(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">{t('settings.last_name')}</label>
                <input className="input-field" value={form.last_name}
                  onChange={(e) => setForm(p => ({ ...p, last_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">{t('settings.email')}</label>
              <input className="input-field bg-gray-50" value={user?.email || ''} disabled />
            </div>
            <div>
              <label className="label">{t('settings.phone')}</label>
              <input className="input-field" placeholder="+39 333 1234567" value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('settings.sport')}</label>
                <input className="input-field bg-gray-50"
                  value={user?.sport ? sportLabel[user.sport] || user.sport : ''} disabled />
              </div>
              <div>
                <label className="label">{t('settings.level')}</label>
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
              <label className="label">{t('settings.experience')}</label>
              <input type="number" className="input-field w-32" value={form.years_experience}
                onChange={(e) => setForm(p => ({ ...p, years_experience: e.target.value }))} />
            </div>

            <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
              {saved ? <><Check size={18} /> {t('settings.saved')}</> : <><Save size={18} /> {loading ? t('settings.saving') : t('settings.save')}</>}
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Globe size={18} /> {t('settings.language')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('settings.language_desc')}</p>
          <div className="flex gap-2">
            {languages.map(lang => (
              <button key={lang.code} onClick={() => setLocale(lang.code)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border',
                  locale === lang.code
                    ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}>
                <span className="text-lg">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Palette size={18} /> {t('settings.appearance')}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{dark ? t('settings.dark_mode') : t('settings.light_mode')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.toggle_theme')}</p>
            </div>
            <button
              onClick={toggle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {dark ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-500" />}
              <span className="text-sm font-medium">{dark ? t('settings.to_light') : t('settings.to_dark')}</span>
            </button>
          </div>
        </div>

        <div className="card">
          <SeasonManager />
        </div>

        <div className="card">
          <StaffManager />
        </div>

        {/* Backup */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Database size={18} /> {t('settings.backup')}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.backup')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.backup_desc')}</p>
            </div>
            <button onClick={handleBackup} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
              <Download size={16} className={exporting ? 'animate-bounce' : ''} />
              {exporting ? 'Esportando...' : t('settings.backup_btn')}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">{t('settings.info')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Coach Partner v4.0.0<br />
            {t('settings.account_created')} {user?.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : 'N/D'}
          </p>
        </div>
      </div>
    </AnimatedPage>
  )
}
