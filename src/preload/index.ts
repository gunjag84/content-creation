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
    duplicate: (id, newName) => ipcRenderer.invoke('templates:duplicate', id, newName)
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
  getAppInfo: () => ipcRenderer.invoke('app:info')
}

contextBridge.exposeInMainWorld('api', api)
