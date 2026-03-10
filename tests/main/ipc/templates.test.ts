import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  insertTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  type TemplateInsert
} from '../../../src/main/db/queries'
import { initDatabase, getDatabase, closeDatabase } from '../../../src/main/db/index'
import { createTempDbPath, cleanupTempDir } from '../../setup'

describe('Template Operations', () => {
  let dbPath: string

  beforeEach(() => {
    dbPath = createTempDbPath()
    initDatabase(dbPath)
  })

  afterEach(() => {
    closeDatabase()
    cleanupTempDir(dbPath)
  })

  it('should insert a template and return valid id', () => {
    const template: TemplateInsert = {
      name: 'Test Template',
      background_type: 'solid_color',
      background_value: '#000000',
      format: 'feed',
      zones_config: '[]'
    }

    const id = insertTemplate(template)
    expect(id).toBeGreaterThan(0)
  })

  it('should list inserted templates', () => {
    const template1: TemplateInsert = {
      name: 'Template 1',
      background_type: 'solid_color',
      background_value: '#000000',
      format: 'feed',
      zones_config: '[]'
    }

    const template2: TemplateInsert = {
      name: 'Template 2',
      background_type: 'gradient',
      background_value: 'linear-gradient(...)',
      format: 'story',
      zones_config: '[]'
    }

    insertTemplate(template1)
    insertTemplate(template2)

    const templates = listTemplates()
    expect(templates).toHaveLength(2)
    const names = templates.map(t => t.name).sort()
    expect(names).toEqual(['Template 1', 'Template 2'])
  })

  it('should get template by id', () => {
    const template: TemplateInsert = {
      name: 'Test Template',
      background_type: 'image',
      background_value: '/path/to/image.jpg',
      overlay_color: '#000000',
      overlay_opacity: 0.7,
      format: 'feed',
      zones_config: '[{"id":"hook","type":"text"}]'
    }

    const id = insertTemplate(template)
    const retrieved = getTemplate(id)

    expect(retrieved).toBeDefined()
    expect(retrieved?.name).toBe('Test Template')
    expect(retrieved?.background_type).toBe('image')
    expect(retrieved?.overlay_opacity).toBe(0.7)
  })

  it('should update template fields', () => {
    const template: TemplateInsert = {
      name: 'Original Name',
      background_type: 'solid_color',
      background_value: '#000000',
      format: 'feed',
      zones_config: '[]'
    }

    const id = insertTemplate(template)
    updateTemplate(id, {
      name: 'Updated Name',
      overlay_opacity: 0.5
    })

    const updated = getTemplate(id)
    expect(updated?.name).toBe('Updated Name')
    expect(updated?.overlay_opacity).toBe(0.5)
  })

  it('should delete template', () => {
    const template: TemplateInsert = {
      name: 'To Delete',
      background_type: 'solid_color',
      background_value: '#000000',
      format: 'feed',
      zones_config: '[]'
    }

    const id = insertTemplate(template)
    deleteTemplate(id)

    const retrieved = getTemplate(id)
    expect(retrieved).toBeUndefined()
  })

  it('should duplicate template with new name', () => {
    const template: TemplateInsert = {
      name: 'Original',
      background_type: 'image',
      background_value: '/path/to/image.jpg',
      overlay_color: '#FF0000',
      overlay_opacity: 0.8,
      format: 'feed',
      zones_config: '[{"zone":"test"}]'
    }

    const originalId = insertTemplate(template)
    const duplicateId = duplicateTemplate(originalId, 'Copy of Original')

    expect(duplicateId).not.toBe(originalId)

    const original = getTemplate(originalId)
    const copy = getTemplate(duplicateId)

    expect(copy).toBeDefined()
    expect(copy?.name).toBe('Copy of Original')
    expect(copy?.background_type).toBe(original?.background_type)
    expect(copy?.background_value).toBe(original?.background_value)
    expect(copy?.overlay_color).toBe(original?.overlay_color)
    expect(copy?.zones_config).toBe(original?.zones_config)
  })
})
