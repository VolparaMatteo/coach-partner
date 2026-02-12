import { useEffect, useRef } from 'react'
import api from '@/api/client'
import { useNotificationStore } from '@/store/notifications'
import { useTeamStore } from '@/store/team'
import { isToday, isTomorrow, parseISO } from 'date-fns'

/**
 * Checks for upcoming trainings and matches and sends reminders.
 * Runs every 30 minutes and on first mount.
 */
export function useReminders() {
  const { add, notifications } = useNotificationStore()
  const { activeTeamId } = useTeamStore()
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!activeTeamId || checkedRef.current) return
    checkedRef.current = true

    const check = async () => {
      try {
        const [sessionsRes, matchesRes] = await Promise.all([
          api.get(`/trainings?team_id=${activeTeamId}`),
          api.get(`/matches?team_id=${activeTeamId}`),
        ])

        const today = new Date().toISOString().split('T')[0]
        const sessions = sessionsRes.data.sessions || []
        const matches = matchesRes.data.matches || []

        // Check today's trainings
        const todaySessions = sessions.filter((s: any) => s.date === today && s.status !== 'completed')
        for (const session of todaySessions) {
          const alreadyNotified = notifications.some(n =>
            n.type === 'training' && n.title.includes(session.title || 'Allenamento') && Date.now() - n.timestamp < 12 * 60 * 60 * 1000
          )
          if (!alreadyNotified) {
            add({
              title: `Allenamento oggi: ${session.title || 'Allenamento'}`,
              body: session.duration_minutes ? `Durata prevista: ${session.duration_minutes} min` : 'Verifica il piano prima di iniziare',
              type: 'training',
              link: '/trainings',
            })
          }
        }

        // Check tomorrow's matches
        const upcomingMatches = matches.filter((m: any) => {
          const d = parseISO(m.date)
          return (isToday(d) || isTomorrow(d)) && m.status === 'upcoming'
        })
        for (const match of upcomingMatches) {
          const isMatchToday = match.date === today
          const alreadyNotified = notifications.some(n =>
            n.type === 'match' && n.title.includes(match.opponent) && Date.now() - n.timestamp < 12 * 60 * 60 * 1000
          )
          if (!alreadyNotified) {
            add({
              title: `${isMatchToday ? 'Partita oggi' : 'Partita domani'}: vs ${match.opponent}`,
              body: `${match.competition || ''} - ${match.home_away === 'home' ? 'Casa' : 'Trasferta'}`.trim(),
              type: 'match',
              link: '/matches',
            })
          }
        }
      } catch {}
    }

    check()

    // Recheck every 30 minutes
    const interval = setInterval(() => {
      checkedRef.current = false
      check()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [activeTeamId])
}
