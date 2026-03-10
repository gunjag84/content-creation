import React from 'react'
import { TemplateCard } from './TemplateCard'
import type { Template } from '../../../../preload/types'

interface TemplateListProps {
  templates: Template[]
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onDuplicate: (id: number) => void
  loading: boolean
}

export function TemplateList({
  templates,
  onEdit,
  onDelete,
  onDuplicate,
  loading
}: TemplateListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 rounded-lg border border-slate-700 bg-slate-800/50 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="p-12 border-2 border-dashed border-slate-700 rounded-lg text-center">
        <p className="text-slate-400 text-lg">
          No templates yet. Create your first template to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={() => onEdit(template.id)}
          onDelete={() => onDelete(template.id)}
          onDuplicate={() => onDuplicate(template.id)}
        />
      ))}
    </div>
  )
}
