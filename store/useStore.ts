import { create } from 'zustand'

interface AppState {
    organizationId: string | null
    setOrganizationId: (id: string | null) => void
    // Add more global state here
}

export const useStore = create<AppState>((set) => ({
    organizationId: null,
    setOrganizationId: (id) => set({ organizationId: id }),
}))
