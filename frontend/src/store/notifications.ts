import { create } from 'zustand'

export interface AppNotification {
  id: string
  title: string
  body: string
  type: 'training' | 'match' | 'reminder' | 'info'
  read: boolean
  timestamp: number
  link?: string
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  add: (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  clearAll: () => void
  requestPermission: () => Promise<boolean>
  sendLocalNotification: (title: string, body: string) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: JSON.parse(localStorage.getItem('cp_notifications') || '[]'),
  unreadCount: JSON.parse(localStorage.getItem('cp_notifications') || '[]').filter((n: AppNotification) => !n.read).length,

  add: (n) => {
    const notification: AppNotification = {
      ...n,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      read: false,
      timestamp: Date.now(),
    }
    set(state => {
      const updated = [notification, ...state.notifications].slice(0, 50)
      localStorage.setItem('cp_notifications', JSON.stringify(updated))
      return { notifications: updated, unreadCount: updated.filter(n => !n.read).length }
    })
    // Also send browser notification if permitted
    get().sendLocalNotification(n.title, n.body)
  },

  markRead: (id) => set(state => {
    const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    localStorage.setItem('cp_notifications', JSON.stringify(updated))
    return { notifications: updated, unreadCount: updated.filter(n => !n.read).length }
  }),

  markAllRead: () => set(state => {
    const updated = state.notifications.map(n => ({ ...n, read: true }))
    localStorage.setItem('cp_notifications', JSON.stringify(updated))
    return { notifications: updated, unreadCount: 0 }
  }),

  remove: (id) => set(state => {
    const updated = state.notifications.filter(n => n.id !== id)
    localStorage.setItem('cp_notifications', JSON.stringify(updated))
    return { notifications: updated, unreadCount: updated.filter(n => !n.read).length }
  }),

  clearAll: () => {
    localStorage.setItem('cp_notifications', '[]')
    set({ notifications: [], unreadCount: 0 })
  },

  requestPermission: async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    const result = await Notification.requestPermission()
    return result === 'granted'
  },

  sendLocalNotification: (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      })
    }
  },
}))
