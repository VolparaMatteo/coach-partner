import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastState {
  toasts: Toast[]
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  dismiss: (id: string) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => {
  const add = (type: Toast['type'], message: string) => {
    const id = `toast-${++counter}`
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  }

  return {
    toasts: [],
    success: (message) => add('success', message),
    error: (message) => add('error', message),
    info: (message) => add('info', message),
    dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  }
})
