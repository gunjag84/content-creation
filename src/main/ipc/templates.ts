import { ipcMain } from 'electron'
import {
  listTemplates,
  insertTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  type TemplateInsert
} from '../db/queries'

const DEFAULT_ZONES_CONFIG = JSON.stringify([
  { id: 'hook', type: 'hook', label: 'Hook', x: 90, y: 80, width: 900, height: 280, fontSize: 52, minFontSize: 28 },
  { id: 'body', type: 'body', label: 'Body', x: 90, y: 420, width: 900, height: 520, fontSize: 32, minFontSize: 18 },
  { id: 'cta', type: 'cta', label: 'CTA', x: 90, y: 1050, width: 900, height: 200, fontSize: 36, minFontSize: 22 }
])

export function registerTemplateIPC() {
  // Ensure at least one template exists (creates default on first run)
  ipcMain.handle('templates:ensure-default', async () => {
    const existing = listTemplates(1)
    if (existing.length > 0) return existing[0]
    const id = insertTemplate({
      brand_id: 1,
      name: 'Default Layout',
      background_type: 'solid_color',
      background_value: '#1a1a2e',
      overlay_color: '#000000',
      overlay_opacity: 0.5,
      overlay_enabled: true,
      format: 'feed',
      zones_config: DEFAULT_ZONES_CONFIG
    })
    return getTemplate(id)
  })

  ipcMain.handle('templates:list', async () => {
    return listTemplates(1) // Hardcoded brand_id=1
  })

  ipcMain.handle('templates:create', async (_event, template: TemplateInsert) => {
    return insertTemplate(template)
  })

  ipcMain.handle('templates:get', async (_event, id: number) => {
    return getTemplate(id)
  })

  ipcMain.handle('templates:update', async (_event, id: number, data: Partial<TemplateInsert>) => {
    updateTemplate(id, data)
  })

  ipcMain.handle('templates:delete', async (_event, id: number) => {
    deleteTemplate(id)
  })

  ipcMain.handle('templates:duplicate', async (_event, id: number, newName: string) => {
    return duplicateTemplate(id, newName)
  })
}
