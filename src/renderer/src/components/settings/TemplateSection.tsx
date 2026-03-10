import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { TemplateList } from '../templates/TemplateList'
import { TemplateBuilder } from '../templates/TemplateBuilder'
import type { Template } from '../../../../preload/types'

interface TemplateSectionProps {
  // Templates are managed separately from Settings object
}

export function TemplateSection(props: TemplateSectionProps) {
  const [view, setView] = useState<'list' | 'builder'>('list')
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

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
    setView('builder')
  }

  const handleEditTemplate = (id: number) => {
    setEditingTemplateId(id)
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
    // Return to list view and refresh
    setView('list')
    setEditingTemplateId(null)
    loadTemplates()
  }

  const handleBuilderCancel = () => {
    // Return to list view
    setView('list')
    setEditingTemplateId(null)
  }

  // List view
  if (view === 'list') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Templates</h2>
            <p className="text-slate-400 mt-1">
              Manage your visual templates with custom backgrounds, overlays, and zones
            </p>
          </div>
          <Button onClick={handleCreateTemplate}>Create Template</Button>
        </div>

        {/* Template count */}
        {!loading && templates.length > 0 && (
          <div className="text-sm text-slate-400">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Template list */}
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

  // Builder view
  return (
    <div>
      <TemplateBuilder
        templateId={editingTemplateId || undefined}
        onSave={handleBuilderSave}
        onCancel={handleBuilderCancel}
      />
    </div>
  )
}
