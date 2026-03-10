import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ZoneEditor, type Zone } from './ZoneEditor'
import { OverlayControls } from './OverlayControls'
import { BackgroundSelector } from './BackgroundSelector'
import { useSettingsStore } from '../../stores/settingsStore'
import type { TemplateInsert } from '../../../../preload/types'

interface TemplateBuilderProps {
  templateId?: number
  onSave: (templateId: number) => void
  onCancel: () => void
}

export function TemplateBuilder({ templateId, onSave, onCancel }: TemplateBuilderProps) {
  const { settings, loadSettings } = useSettingsStore()

  // Template state
  const [name, setName] = useState('')
  const [format, setFormat] = useState<'feed' | 'story'>('feed')
  const [backgroundType, setBackgroundType] = useState<'image' | 'solid_color' | 'gradient'>(
    'solid_color'
  )
  const [backgroundValue, setBackgroundValue] = useState('#ffffff')
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [overlayEnabled, setOverlayEnabled] = useState(true)
  const [overlayColor, setOverlayColor] = useState('#000000')
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [zones, setZones] = useState<Zone[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load settings on mount
  useEffect(() => {
    if (!settings) {
      loadSettings()
    }
  }, [settings, loadSettings])

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId)
    }
  }, [templateId])

  const loadTemplate = async (id: number) => {
    setLoading(true)
    try {
      const template = await window.api.templates.get(id)
      if (template) {
        setName(template.name)
        setFormat(template.format)
        setBackgroundType(template.background_type)
        setBackgroundValue(template.background_value)
        setOverlayEnabled(Boolean(template.overlay_enabled))
        setOverlayColor(template.overlay_color || '#000000')
        setOverlayOpacity(template.overlay_opacity || 50)

        // Parse zones from JSON
        try {
          const parsedZones = JSON.parse(template.zones_config)
          setZones(parsedZones)
        } catch (err) {
          console.error('Failed to parse zones config:', err)
        }

        // Load background image if type is image
        if (template.background_type === 'image' && template.background_value) {
          loadBackgroundImage(template.background_value)
        }
      }
    } catch (err) {
      console.error('Failed to load template:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadBackgroundImage = (imagePath: string) => {
    const img = new Image()
    img.onload = () => setBackgroundImage(img)
    img.onerror = () => {
      console.error('Failed to load background image:', imagePath)
      setBackgroundImage(null)
    }
    img.src = `file://${imagePath}`
  }

  const handleBackgroundTypeChange = (
    type: 'image' | 'solid_color' | 'gradient',
    value: string
  ) => {
    setBackgroundType(type)
    setBackgroundValue(value)

    if (type === 'image' && value) {
      loadBackgroundImage(value)
    } else {
      setBackgroundImage(null)
    }
  }

  const handleImageUpload = async (): Promise<string | null> => {
    const imagePath = await window.api.templates.uploadBackground()
    return imagePath
  }

  const handleOverlayChange = (updates: {
    enabled?: boolean
    color?: string
    opacity?: number
  }) => {
    if (updates.enabled !== undefined) setOverlayEnabled(updates.enabled)
    if (updates.color !== undefined) setOverlayColor(updates.color)
    if (updates.opacity !== undefined) setOverlayOpacity(updates.opacity)
  }

  const handleFormatChange = (newFormat: 'feed' | 'story') => {
    if (zones.length > 0) {
      const confirmed = window.confirm(
        'Changing format may affect existing zones. Continue?'
      )
      if (!confirmed) return
    }
    setFormat(newFormat)
  }

  const handleSave = async () => {
    // Validate
    if (!name.trim()) {
      alert('Please enter a template name')
      return
    }

    if (zones.length === 0) {
      const confirmed = window.confirm(
        'This template has no zones defined. Save anyway?'
      )
      if (!confirmed) return
    }

    setSaving(true)
    try {
      const templateData: TemplateInsert = {
        name: name.trim(),
        background_type: backgroundType,
        background_value: backgroundValue,
        overlay_color: overlayColor,
        overlay_opacity: overlayOpacity,
        overlay_enabled: overlayEnabled,
        format,
        zones_config: JSON.stringify(zones)
      }

      let resultId: number
      if (templateId) {
        // Update existing
        await window.api.templates.update(templateId, templateData)
        resultId = templateId
      } else {
        // Create new
        resultId = await window.api.templates.create(templateData)
      }

      onSave(resultId)
    } catch (err) {
      console.error('Failed to save template:', err)
      alert('Failed to save template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const brandGuidance = settings?.visualGuidance
  const brandColors = {
    primaryColor: brandGuidance?.primaryColor || '#000000',
    secondaryColor: brandGuidance?.secondaryColor || '#666666',
    backgroundColor: brandGuidance?.backgroundColor || '#ffffff'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading template...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {templateId ? 'Edit Template' : 'Create Template'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Name and Format */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Template"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Format</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={format === 'feed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFormatChange('feed')}
            >
              Feed (4:5)
            </Button>
            <Button
              type="button"
              variant={format === 'story' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFormatChange('story')}
            >
              Story (9:16)
            </Button>
          </div>
        </div>
      </div>

      {/* Background Selector */}
      <BackgroundSelector
        backgroundType={backgroundType}
        backgroundValue={backgroundValue}
        brandColors={brandColors}
        onTypeChange={handleBackgroundTypeChange}
        onImageUpload={handleImageUpload}
      />

      {/* Zone Editor */}
      <div className="space-y-2">
        <Label>Template Zones</Label>
        <ZoneEditor
          backgroundImage={backgroundImage}
          backgroundType={backgroundType}
          backgroundColor={backgroundValue}
          overlayColor={overlayColor}
          overlayOpacity={overlayOpacity}
          overlayEnabled={overlayEnabled}
          zones={zones}
          onZonesChange={setZones}
          brandGuidance={brandGuidance}
          format={format}
        />
      </div>

      {/* Overlay Controls */}
      <OverlayControls
        enabled={overlayEnabled}
        color={overlayColor}
        opacity={overlayOpacity}
        onChange={handleOverlayChange}
      />
    </div>
  )
}
