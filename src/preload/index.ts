import { contextBridge, ipcRenderer } from 'electron'
import type { IElectronAPI } from './types'

const api: IElectronAPI = {
  // Settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // Database
  getDbStatus: () => ipcRenderer.invoke('db:status'),

  // Rendering
  renderToPNG: (html, dimensions) => ipcRenderer.invoke('render:to-png', html, dimensions),

  // Security
  saveAPIKey: (key) => ipcRenderer.invoke('security:save-key', key),
  loadAPIKey: () => ipcRenderer.invoke('security:load-key'),
  deleteAPIKey: () => ipcRenderer.invoke('security:delete-key'),

  // App
  getAppInfo: () => ipcRenderer.invoke('app:info')
}

contextBridge.exposeInMainWorld('api', api)
