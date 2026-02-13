import type { TrainingSession, Match } from '@/types'

function formatICSDate(dateStr: string, timeStr?: string | null): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (timeStr) {
    const [h, m] = timeStr.split(':')
    d.setHours(parseInt(h), parseInt(m))
  }
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,\n]/g, (match) => {
    if (match === '\n') return '\\n'
    return '\\' + match
  })
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@coachpartner`
}

export function exportTrainingToICS(session: TrainingSession): void {
  const dtStart = formatICSDate(session.date, session.start_time)
  const duration = session.duration_minutes || 90
  const endDate = new Date(session.date + 'T00:00:00')
  if (session.start_time) {
    const [h, m] = session.start_time.split(':')
    endDate.setHours(parseInt(h), parseInt(m))
  }
  endDate.setMinutes(endDate.getMinutes() + duration)
  const dtEnd = formatICSDate(
    endDate.toISOString().split('T')[0],
    `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  )

  const title = session.title || 'Allenamento'
  const description = session.objectives
    ? `Obiettivi: ${typeof session.objectives === 'string' ? session.objectives : JSON.stringify(session.objectives)}`
    : ''

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coach Partner//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(title)} tra 30 minuti`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  downloadICS(ics, `allenamento-${session.date}.ics`)
}

export function exportMatchToICS(match: Match): void {
  const dtStart = formatICSDate(match.date, match.time)
  const endDate = new Date(match.date + 'T00:00:00')
  if (match.time) {
    const [h, m] = match.time.split(':')
    endDate.setHours(parseInt(h), parseInt(m))
  }
  endDate.setMinutes(endDate.getMinutes() + 120) // 2h default for match
  const dtEnd = formatICSDate(
    endDate.toISOString().split('T')[0],
    `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  )

  const title = `vs ${match.opponent}`
  const location = match.venue || ''
  const description = [
    match.competition ? `Competizione: ${match.competition}` : '',
    match.home_away === 'home' ? 'Casa' : match.home_away === 'away' ? 'Trasferta' : 'Campo neutro',
  ].filter(Boolean).join('\\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coach Partner//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    location ? `LOCATION:${escapeICS(location)}` : '',
    description ? `DESCRIPTION:${description}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(title)} tra 1 ora`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  downloadICS(ics, `gara-${match.opponent}-${match.date}.ics`)
}

export function exportAllToICS(sessions: TrainingSession[], matches: Match[]): void {
  const events: string[] = []

  for (const session of sessions) {
    const dtStart = formatICSDate(session.date, session.start_time)
    const duration = session.duration_minutes || 90
    const endDate = new Date(session.date + 'T00:00:00')
    if (session.start_time) {
      const [h, m] = session.start_time.split(':')
      endDate.setHours(parseInt(h), parseInt(m))
    }
    endDate.setMinutes(endDate.getMinutes() + duration)
    const dtEnd = formatICSDate(
      endDate.toISOString().split('T')[0],
      `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
    )
    events.push([
      'BEGIN:VEVENT',
      `UID:${generateUID()}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(session.title || 'Allenamento')}`,
      'END:VEVENT',
    ].join('\r\n'))
  }

  for (const match of matches) {
    const dtStart = formatICSDate(match.date, match.time)
    const endDate = new Date(match.date + 'T00:00:00')
    if (match.time) {
      const [h, m] = match.time.split(':')
      endDate.setHours(parseInt(h), parseInt(m))
    }
    endDate.setMinutes(endDate.getMinutes() + 120)
    const dtEnd = formatICSDate(
      endDate.toISOString().split('T')[0],
      `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
    )
    events.push([
      'BEGIN:VEVENT',
      `UID:${generateUID()}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS('vs ' + match.opponent)}`,
      match.venue ? `LOCATION:${escapeICS(match.venue)}` : '',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n'))
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coach Partner//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Coach Partner',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  downloadICS(ics, 'coach-partner-calendario.ics')
}

function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
