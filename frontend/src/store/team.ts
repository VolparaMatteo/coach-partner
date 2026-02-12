import { create } from 'zustand'
import type { Team } from '@/types'

interface TeamState {
  teams: Team[]
  activeTeamId: number | null
  setTeams: (teams: Team[]) => void
  setActiveTeamId: (id: number) => void
}

export const useTeamStore = create<TeamState>((set) => ({
  teams: [],
  activeTeamId: null,
  setTeams: (teams) => set((state) => ({
    teams,
    activeTeamId: state.activeTeamId ?? (teams.length > 0 ? teams[0].id : null),
  })),
  setActiveTeamId: (id) => set({ activeTeamId: id }),
}))
