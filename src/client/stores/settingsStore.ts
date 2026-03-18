import { create } from 'zustand'
import type { Settings } from '@shared/types'
import { api } from '../lib/apiClient'

interface SettingsStore {
  settings: Settings | null
  loading: boolean
  saving: boolean
  error: string | null
  load: () => Promise<void>
  save: (settings: Settings) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: false,
  saving: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const settings = await api.get<Settings>('/settings')
      set({ settings, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  save: async (settings: Settings) => {
    set({ saving: true, error: null })
    try {
      const saved = await api.put<Settings>('/settings', settings)
      set({ settings: saved, saving: false })
    } catch (err) {
      set({ error: (err as Error).message, saving: false })
    }
  }
}))
