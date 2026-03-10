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

export function registerTemplateIPC() {
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
