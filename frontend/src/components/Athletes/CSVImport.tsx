import { useState, useRef } from 'react'
import api from '@/api/client'
import { Upload, FileText, Check, AlertTriangle } from 'lucide-react'

interface Props {
  teamId: number
  onImported: () => void
}

interface ParsedRow {
  first_name: string
  last_name: string
  jersey_number: string
  position: string
}

export default function CSVImport({ teamId, onImported }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const header = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim())
    const fnIdx = header.findIndex(h => h.includes('nome') && !h.includes('cogn'))
    const lnIdx = header.findIndex(h => h.includes('cogn'))
    const numIdx = header.findIndex(h => h.includes('numer') || h.includes('maglia') || h === '#')
    const posIdx = header.findIndex(h => h.includes('ruol') || h.includes('posizi'))

    // Fallback: if no "cognome" column, try "name" split
    if (fnIdx === -1 && lnIdx === -1) {
      const nameIdx = header.findIndex(h => h.includes('nome') || h.includes('name'))
      if (nameIdx >= 0) {
        return lines.slice(1).map(line => {
          const cols = line.split(/[,;]/).map(c => c.trim())
          const parts = (cols[nameIdx] || '').split(' ')
          return {
            first_name: parts[0] || '',
            last_name: parts.slice(1).join(' ') || '',
            jersey_number: numIdx >= 0 ? cols[numIdx] || '' : '',
            position: posIdx >= 0 ? cols[posIdx] || '' : '',
          }
        }).filter(r => r.first_name)
      }
    }

    return lines.slice(1).map(line => {
      const cols = line.split(/[,;]/).map(c => c.trim())
      return {
        first_name: fnIdx >= 0 ? cols[fnIdx] || '' : '',
        last_name: lnIdx >= 0 ? cols[lnIdx] || '' : '',
        jersey_number: numIdx >= 0 ? cols[numIdx] || '' : '',
        position: posIdx >= 0 ? cols[posIdx] || '' : '',
      }
    }).filter(r => r.first_name || r.last_name)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError('Nessun atleta trovato nel CSV. Assicurati che ci siano colonne come: Nome, Cognome, Numero, Ruolo')
        return
      }
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const athletes = rows.map(r => ({
        first_name: r.first_name,
        last_name: r.last_name,
        jersey_number: r.jersey_number ? parseInt(r.jersey_number) : null,
        position: r.position || null,
      }))

      // Import via onboarding roster endpoint
      await api.post('/onboarding/step/roster', {
        team_id: teamId,
        athletes,
      })

      setResult(`${athletes.length} atleti importati con successo!`)
      setRows([])
      onImported()
    } catch {
      setError('Errore durante l\'importazione')
    }
    setImporting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Upload size={18} className="text-brand-600" />
        <h3 className="font-semibold">Importa Rosa da CSV</h3>
      </div>

      <p className="text-sm text-gray-500">
        Carica un file CSV con colonne: <strong>Nome, Cognome, Numero, Ruolo</strong>.<br />
        Separatori accettati: virgola o punto e virgola.
      </p>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors"
      >
        <FileText size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Clicca per selezionare il file CSV</p>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm flex items-center gap-2">
          <Check size={16} /> {result}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-auto">
            <p className="text-sm font-medium text-gray-600 mb-2">{rows.length} atleti trovati:</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-1">Nome</th>
                  <th className="pb-1">Cognome</th>
                  <th className="pb-1">#</th>
                  <th className="pb-1">Ruolo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="py-1">{r.first_name}</td>
                    <td className="py-1">{r.last_name}</td>
                    <td className="py-1">{r.jersey_number}</td>
                    <td className="py-1">{r.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleImport} disabled={importing} className="btn-primary w-full">
            {importing ? 'Importazione...' : `Importa ${rows.length} Atleti`}
          </button>
        </>
      )}
    </div>
  )
}
