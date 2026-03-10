import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export interface SaveAsTemplateDialogProps {
  open: boolean
  onClose: () => void
  backgroundImagePath: string
  format: 'feed' | 'story'
  onSaved: (templateId: number) => void
}

export function SaveAsTemplateDialog({
  open,
  onClose,
  backgroundImagePath,
  format,
  onSaved
}: SaveAsTemplateDialogProps) {
  const [templateName, setTemplateName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    setSaving(true)
    try {
      // Create template with background image and empty zones
      const templateId = await window.api.templates.create({
        name: templateName.trim(),
        background_type: 'image',
        background_value: backgroundImagePath,
        overlay_color: '#000000',
        overlay_opacity: 50,
        overlay_enabled: true,
        format,
        zones_config: JSON.stringify([]) // Empty zones initially
      })

      // Ask if user wants to add zones now
      const addZonesNow = window.confirm(
        'Template saved! Would you like to add zones now?'
      )

      onSaved(templateId)

      if (addZonesNow) {
        // The parent component should handle navigation to TemplateBuilder
        // For now, just notify via the onSaved callback
        console.log('User wants to add zones for template:', templateId)
      }

      setTemplateName('')
      onClose()
    } catch (err) {
      console.error('Failed to save template:', err)
      alert('Failed to save template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    setTemplateName('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template?</DialogTitle>
          <DialogDescription>
            Would you like to save this background as a reusable template?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="My Template"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <div className="px-3 py-2 bg-slate-700 rounded text-sm text-slate-300">
              {format === 'feed' ? 'Feed (4:5)' : 'Story (9:16)'}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip} disabled={saving}>
            Skip
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save as Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
