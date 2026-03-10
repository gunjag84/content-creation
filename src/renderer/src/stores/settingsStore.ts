import { create } from 'zustand'
import type { Settings } from '../../../shared/types/settings'

interface SettingsStore {
  settings: Settings | null
  loading: boolean
  saving: boolean
  lastSaved: Date | null
  error: string | null

  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<Settings>) => Promise<void>
  updateSection: <K extends keyof Settings>(section: K, value: Settings[K]) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  saving: false,
  lastSaved: null,
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null })
    try {
      const settings = await window.api.loadSettings()
      set({ settings, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load settings',
        loading: false
      })
    }
  },

  updateSettings: async (partial: Partial<Settings>) => {
    const { settings } = get()
    if (!settings) return

    set({ saving: true, error: null })
    try {
      const merged = { ...settings, ...partial }
      await window.api.saveSettings(merged)
      set({ settings: merged, saving: false, lastSaved: new Date() })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to save settings',
        saving: false
      })
    }
  },

  updateSection: async <K extends keyof Settings>(section: K, value: Settings[K]) => {
    const { settings } = get()
    if (!settings) return

    set({ saving: true, error: null })
    try {
      const merged = { ...settings, [section]: value }
      await window.api.saveSettings(merged)
      set({ settings: merged, saving: false, lastSaved: new Date() })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to save settings',
        saving: false
      })
    }
  }
}))
