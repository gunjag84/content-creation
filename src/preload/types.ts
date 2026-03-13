import type { Settings } from '../shared/types/settings'
import type { Template, TemplateInsert, SettingsVersion, PostInsert, SlideInsert, Post, Slide, BalanceEntry } from '../main/db/queries'
import type { GenerationResult, StoryProposal, ExportFile, BalanceWarning, BalanceDashboardData, BalanceRecommendation } from '../shared/types/generation'

export type { Settings, Template, TemplateInsert, SettingsVersion, GenerationResult, StoryProposal, ExportFile, PostInsert, SlideInsert, Post, Slide, BalanceEntry, BalanceWarning, BalanceDashboardData, BalanceRecommendation }

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

  // Posts
  posts: {
    create: (data: PostInsert) => Promise<{ success: boolean; postId?: number; error?: string }>
    saveSlides: (slides: SlideInsert[]) => Promise<{ success: boolean; slideIds?: number[]; error?: string }>
    updateStatus: (postId: number, status: 'draft' | 'approved' | 'exported') => Promise<{ success: boolean; error?: string }>
    getWithSlides: (postId: number) => Promise<{ success: boolean; data?: { post: Post; slides: Slide[] }; error?: string }>
    getRecommendationData: (brandId?: number, targetPercentages?: Record<string, number>) => Promise<{
      success: boolean
      data?: {
        balanceEntries: BalanceEntry[]
        warnings: BalanceWarning[]
        dashboardData: BalanceDashboardData
        recommendation: BalanceRecommendation | null
      }
      error?: string
    }>
    updateBalance: (brandId: number, variables: Array<{ type: string; value: string }>) => Promise<{ success: boolean; error?: string }>
  }
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}
