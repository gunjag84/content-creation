import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { TemplateList } from '../templates/TemplateList'
import { TemplateBuilder } from '../templates/TemplateBuilder'
import type { Template } from '../../../../preload/types'

interface TemplateSectionProps {
  pendingBackgroundImage?: string | null
  onTemplateSaveAndReturn?: (templateId: number) => void
}

export function TemplateSection({ pendingBackgroundImage, onTemplateSaveAndReturn }: TemplateSectionProps) {
  const [view, setView] = useState<'list' | 'builder'>('list')
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [initialBgPath, setInitialBgPath] = useState<string | undefined>(undefined)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  // Auto-open builder when pending image is set
  useEffect(() => {
    if (pendingBackgroundImage) {
      setEditingTemplateId(null)
      setInitialBgPath(pendingBackgroundImage)
      setView('builder')
    }
  }, [pendingBackgroundImage])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const allTemplates = await window.api.templates.list()
      setTemplates(allTemplates)
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplateId(null)
    setInitialBgPath(undefined)
    setView('builder')
  }

  const handleEditTemplate = (id: number) => {
    setEditingTemplateId(id)
    setInitialBgPath(undefined)
    setView('builder')
  }

  const handleDeleteTemplate = async (id: number) => {
    try {
      await window.api.templates.delete(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Failed to delete template:', err)
      alert('Failed to delete template. Please try again.')
    }
  }

  const handleDuplicateTemplate = async (id: number) => {
    const template = templates.find((t) => t.id === id)
    if (!template) return

    const newName = window.prompt(
      'Enter a name for the duplicated template:',
      `${template.name} (Copy)`
    )
    if (!newName || !newName.trim()) return

    try {
      await window.api.templates.duplicate(id, newName.trim())
      loadTemplates()
    } catch (err) {
      console.error('Failed to duplicate template:', err)
      alert('Failed to duplicate template. Please try again.')
    }
  }

  const handleBuilderSave = (templateId: number) => {
    setView('list')
    setEditingTemplateId(null)
    setInitialBgPath(undefined)
    loadTemplates()

    // If we came from create flow, navigate back
    if (onTemplateSaveAndReturn) {
      onTemplateSaveAndReturn(templateId)
    }
  }

  const handleBuilderCancel = () => {
    setView('list')
    setEditingTemplateId(null)
    setInitialBgPath(undefined)
  }

  // List view
  if (view === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Templates</h2>
            <p className="text-slate-400 mt-1">
              Manage your visual templates with custom backgrounds, overlays, and zones
            </p>
          </div>
          <Button onClick={handleCreateTemplate}>Create Template</Button>
        </div>

        {!loading && templates.length > 0 && (
          <div className="text-sm text-slate-400">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </div>
        )}

        <TemplateList
          templates={templates}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
          onDuplicate={handleDuplicateTemplate}
          loading={loading}
        />
      </div>
    )
  }

  // Builder view - render full height (no -my-6 to avoid hiding behind Settings header)
  return (
    <div className="-mx-6 -mb-6 h-[calc(100vh-180px)] pr-4 min-w-0">
      <TemplateBuilder
        templateId={editingTemplateId || undefined}
        initialBackgroundPath={initialBgPath}
        onSave={handleBuilderSave}
        onCancel={handleBuilderCancel}
      />
    </div>
  )
}
