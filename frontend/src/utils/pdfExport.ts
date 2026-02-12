import jsPDF from 'jspdf'
import type { AIReport, Athlete } from '@/types'

export function exportReportPDF(report: AIReport) {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - margin * 2

  // Header
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Coach Partner — Report AI', margin, 15)
  doc.text(new Date(report.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - margin, 15, { align: 'right' })

  // Divider
  doc.setDrawColor(200)
  doc.line(margin, 20, pageWidth - margin, 20)

  // Type badge
  doc.setFontSize(9)
  doc.setTextColor(80)
  const typeLabels: Record<string, string> = {
    post_training: 'Post Allenamento',
    post_match: 'Post Gara',
    athlete_weekly: 'Sintesi Atleta',
    focus_suggestion: 'Suggerimenti',
  }
  doc.text(typeLabels[report.report_type] || report.report_type, margin, 28)

  // Title
  doc.setFontSize(16)
  doc.setTextColor(30)
  doc.text(report.title || 'Report', margin, 38)

  // Content
  doc.setFontSize(11)
  doc.setTextColor(50)
  const lines = doc.splitTextToSize(report.content, maxWidth)
  let y = 48
  for (const line of lines) {
    if (y > 280) {
      doc.addPage()
      y = 20
    }
    doc.text(line, margin, y)
    y += 6
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Generato da Coach Partner AI Copilot', margin, 290)

  doc.save(`report-${report.id}.pdf`)
}

export function exportAthletePDF(athlete: Athlete, stats: { attendance_pct: number; weekly_load: number }) {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Coach Partner — Scheda Atleta', margin, 15)
  doc.text(new Date().toLocaleDateString('it-IT'), pageWidth - margin, 15, { align: 'right' })

  doc.setDrawColor(200)
  doc.line(margin, 20, pageWidth - margin, 20)

  // Name
  doc.setFontSize(20)
  doc.setTextColor(30)
  doc.text(athlete.full_name, margin, 35)

  // Info
  doc.setFontSize(11)
  doc.setTextColor(70)
  let y = 45
  if (athlete.jersey_number) { doc.text(`Numero: ${athlete.jersey_number}`, margin, y); y += 7 }
  if (athlete.position) { doc.text(`Ruolo: ${athlete.position}`, margin, y); y += 7 }
  if (athlete.birth_date) { doc.text(`Data di nascita: ${new Date(athlete.birth_date).toLocaleDateString('it-IT')}`, margin, y); y += 7 }
  if (athlete.height_cm) { doc.text(`Altezza: ${athlete.height_cm} cm`, margin, y); y += 7 }
  if (athlete.weight_kg) { doc.text(`Peso: ${athlete.weight_kg} kg`, margin, y); y += 7 }

  y += 5
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Stats
  doc.setFontSize(14)
  doc.setTextColor(30)
  doc.text('Statistiche', margin, y)
  y += 10

  doc.setFontSize(11)
  doc.setTextColor(70)
  doc.text(`Presenze: ${stats.attendance_pct}%`, margin, y); y += 7
  doc.text(`Carico settimanale: ${stats.weekly_load} AU`, margin, y); y += 7

  const statusLabels: Record<string, string> = { available: 'Disponibile', attention: 'Attenzione', unavailable: 'Indisponibile' }
  doc.text(`Stato: ${statusLabels[athlete.status] || athlete.status}`, margin, y)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Coach Partner — Scheda Atleta', margin, 290)

  doc.save(`atleta-${athlete.last_name}-${athlete.first_name}.pdf`)
}
