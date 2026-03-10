import type { Settings } from '../shared/types/settings'
import type { Template, TemplateInsert, SettingsVersion } from '../main/db/queries'

export type { Settings, Template, TemplateInsert, SettingsVersion }

export interface IElectronAPI {
  // Settings
  loadSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>

  // Templates
  templates: {
    list: () => Promise<Template[]>
    create: (template: TemplateInsert) => Promise<number>
    get: (id: number) => Promise<Template | undefined>
    update: (id: number, data: Partial<TemplateInsert>) => Promise<void>
    delete: (id: number) => Promise<void>
    duplicate: (id: number, newName: string) => Promise<number>
    uploadBackground: () => Promise<string | null>
  }

  // Fonts
  fonts: {
    upload: () => Promise<{ filename: string; path: string; family: string } | null>
    list: () => Promise<{ filename: string; path: string }[]>
  }

  // Logo
  logo: {
    upload: () => Promise<{ filename: string; path: string } | null>
  }

  // Settings Versions
  settingsVersions: {
    list: () => Promise<SettingsVersion[]>
    forPost: (postId: number) => Promise<SettingsVersion | undefined>
  }

  // Database
  getDbStatus: () => Promise<{ ok: boolean; tables: number }>

  // Rendering
  renderToPNG: (html: string, dimensions: { width: number; height: number }) => Promise<string>

  // Security
  saveAPIKey: (key: string) => Promise<void>
  loadAPIKey: () => Promise<string | null>
  deleteAPIKey: () => Promise<void>

  // App
  getAppInfo: () => Promise<{ version: string; userData: string }>
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}
