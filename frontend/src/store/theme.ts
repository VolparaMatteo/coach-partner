import { create } from 'zustand'

interface ThemeState {
  dark: boolean
  toggle: () => void
  init: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  dark: false,
  toggle: () => set((state) => {
    const next = !state.dark
    localStorage.setItem('cp-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
    return { dark: next }
  }),
  init: () => {
    const saved = localStorage.getItem('cp-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved ? saved === 'dark' : prefersDark
    document.documentElement.classList.toggle('dark', dark)
    set({ dark })
  },
}))
