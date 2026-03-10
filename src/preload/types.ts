export interface Settings {
  // Placeholder type - will be replaced with Zod-inferred type in Plan 02
  [key: string]: any
}

export interface IElectronAPI {
  // Settings
  loadSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>

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
