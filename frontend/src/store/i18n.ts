import { create } from 'zustand'
import { translations, type Locale } from '@/i18n/translations'

interface I18nState {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const savedLocale = (localStorage.getItem('locale') as Locale) || 'it'

export const useI18n = create<I18nState>((set, get) => ({
  locale: savedLocale,
  setLocale: (locale) => {
    localStorage.setItem('locale', locale)
    set({ locale })
  },
  t: (key, params) => {
    const { locale } = get()
    let text = translations[locale]?.[key] || translations.it[key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v))
      })
    }
    return text
  },
}))
