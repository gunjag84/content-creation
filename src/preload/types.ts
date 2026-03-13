import type { Settings } from '../shared/types/settings'
import type { Template, TemplateInsert, SettingsVersion } from '../main/db/queries'
import type { GenerationResult, StoryProposal, ExportFile } from '../shared/types/generation'

export type { Settings, Template, TemplateInsert, SettingsVersion, GenerationResult, StoryProposal, ExportFile }

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

  // File utilities
  readFileAsDataUrl: (path: string) => Promise<string>

  // Generation
  generation: {
    streamContent: (prompt: string) => Promise<{ started: boolean }>
    streamHooks: (args: { currentHook: string; slideContext: string; prompt: string }) => Promise<{ started: boolean }>
    streamStories: (prompt: string) => Promise<{ started: boolean }>
    onToken: (callback: (token: string) => void) => () => void
    onComplete: (callback: (result: GenerationResult) => void) => () => void
    onHooksComplete: (callback: (result: { hooks: string[] }) => void) => () => void
    onStoriesComplete: (callback: (result: { proposals: StoryProposal[] }) => void) => () => void
    onError: (callback: (error: { message: string; partial?: string }) => void) => () => void
  }

  // Export
  export: {
    selectFolder: () => Promise<{ canceled: boolean; path?: string }>
    saveFiles: (folderPath: string, files: ExportFile[]) => Promise<{ success: boolean; error?: string }>
  }
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}
