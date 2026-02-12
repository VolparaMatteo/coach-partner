import { useTeamStore } from '@/store/team'
import { ChevronDown } from 'lucide-react'

export default function TeamSelector() {
  const { teams, activeTeamId, setActiveTeamId } = useTeamStore()

  if (teams.length <= 1) return null

  return (
    <div className="relative inline-flex items-center">
      <select
        value={activeTeamId ?? ''}
        onChange={(e) => setActiveTeamId(Number(e.target.value))}
        className="appearance-none bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border border-brand-200 dark:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
      >
        {teams.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2 pointer-events-none text-brand-500" />
    </div>
  )
}
