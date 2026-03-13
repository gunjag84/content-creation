import { contextBridge, ipcRenderer } from 'electron'
import type { IElectronAPI } from './types'

const api: IElectronAPI = {
  // Settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // Templates
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    create: (template) => ipcRenderer.invoke('templates:create', template),
    get: (id) => ipcRenderer.invoke('templates:get', id),
    update: (id, data) => ipcRenderer.invoke('templates:update', id, data),
    delete: (id) => ipcRenderer.invoke('templates:delete', id),
    duplicate: (id, newName) => ipcRenderer.invoke('templates:duplicate', id, newName),
    uploadBackground: () => ipcRenderer.invoke('templates:upload-background')
  },

  // Fonts
  fonts: {
    upload: () => ipcRenderer.invoke('fonts:upload'),
    list: () => ipcRenderer.invoke('fonts:list')
  },

  // Logo
  logo: {
    upload: () => ipcRenderer.invoke('logo:upload')
  },

  // Settings Versions
  settingsVersions: {
    list: () => ipcRenderer.invoke('settings-versions:list'),
    forPost: (postId) => ipcRenderer.invoke('settings-versions:for-post', postId)
  },

  // Database
  getDbStatus: () => ipcRenderer.invoke('db:status'),

  // Rendering
  renderToPNG: (html, dimensions) => ipcRenderer.invoke('render:to-png', html, dimensions),

  // Security
  saveAPIKey: (key) => ipcRenderer.invoke('security:save-key', key),
  loadAPIKey: () => ipcRenderer.invoke('security:load-key'),
  deleteAPIKey: () => ipcRenderer.invoke('security:delete-key'),

  // App
  getAppInfo: () => ipcRenderer.invoke('app:info'),

  // File utilities
  readFileAsDataUrl: (path) => ipcRenderer.invoke('file:read-as-data-url', path),

  // Generation
  generation: {
    streamContent: (prompt) => ipcRenderer.invoke('generate:content', { prompt }),
    streamHooks: (args) => ipcRenderer.invoke('generate:hooks', args),
    streamStories: (prompt) => ipcRenderer.invoke('generate:stories', { prompt }),
    onToken: (callback) => {
      const listener = (_event: any, token: string) => callback(token)
      ipcRenderer.on('generate:token', listener)
      return () => ipcRenderer.removeListener('generate:token', listener)
    },
    onComplete: (callback) => {
      const listener = (_event: any, result: any) => callback(result)
      ipcRenderer.on('generate:complete', listener)
      return () => ipcRenderer.removeListener('generate:complete', listener)
    },
    onHooksComplete: (callback) => {
      const listener = (_event: any, result: any) => callback(result)
      ipcRenderer.on('generate:hooks-complete', listener)
      return () => ipcRenderer.removeListener('generate:hooks-complete', listener)
    },
    onStoriesComplete: (callback) => {
      const listener = (_event: any, result: any) => callback(result)
      ipcRenderer.on('generate:stories-complete', listener)
      return () => ipcRenderer.removeListener('generate:stories-complete', listener)
    },
    onError: (callback) => {
      const listener = (_event: any, error: any) => callback(error)
      ipcRenderer.on('generate:error', listener)
      return () => ipcRenderer.removeListener('generate:error', listener)
    }
  },

  // Export
  export: {
    selectFolder: () => ipcRenderer.invoke('export:select-folder'),
    saveFiles: (folderPath, files) => ipcRenderer.invoke('export:save-files', { folderPath, files })
  }
}

contextBridge.exposeInMainWorld('api', api)
