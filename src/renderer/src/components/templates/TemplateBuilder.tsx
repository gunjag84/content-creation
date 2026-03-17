import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ZoneEditor, type Zone } from './ZoneEditor'
import { ZonePopover } from './ZonePopover'
import { OverlayControls } from './OverlayControls'
import { BackgroundSelector } from './BackgroundSelector'
import { useSettingsStore } from '../../stores/settingsStore'
import type { TemplateInsert } from '../../../../preload/types'

interface TemplateBuilderProps {
  templateId?: number
  initialBackgroundPath?: string
  onSave: (templateId: number) => void
  onCancel: () => void
}

type VariantTab = 'cover' | 'content' | 'cta'

export function TemplateBuilder({ templateId, initialBackgroundPath, onSave, onCancel }: TemplateBuilderProps) {
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
  const [isCarousel, setIsCarousel] = useState(false)
  const [carouselVariants, setCarouselVariants] = useState<{ cover: Zone[]; content: Zone[]; cta: Zone[] }>({
    cover: [],
    content: [],
    cta: []
  })
  const [activeVariantTab, setActiveVariantTab] = useState<VariantTab>('cover')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

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

  // Handle initial background path from create flow
  useEffect(() => {
    if (initialBackgroundPath && !templateId) {
      setBackgroundType('image')
      setBackgroundValue(initialBackgroundPath)
      loadBackgroundImage(initialBackgroundPath)
    }
  }, [initialBackgroundPath, templateId])

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

        try {
          const parsedZones = JSON.parse(template.zones_config)

          if (parsedZones && typeof parsedZones === 'object' && !Array.isArray(parsedZones)) {
            if (parsedZones.type === 'carousel' && parsedZones.cover && parsedZones.content && parsedZones.cta) {
              setIsCarousel(true)
              setCarouselVariants({
                cover: parsedZones.cover,
                content: parsedZones.content,
                cta: parsedZones.cta
              })
            } else {
              setZones(parsedZones)
            }
          } else if (Array.isArray(parsedZones)) {
            setZones(parsedZones)
          }
        } catch (err) {
          console.error('Failed to parse zones config:', err)
        }

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

  const loadBackgroundImage = async (imagePath: string) => {
    try {
      const dataUrl = await window.api.readFileAsDataUrl(imagePath)
      const img = new Image()
      img.onload = () => setBackgroundImage(img)
      img.onerror = () => {
        console.error('Failed to load background image:', imagePath)
        setBackgroundImage(null)
      }
      img.src = dataUrl
    } catch (err) {
      console.error('Failed to load background image:', err)
      setBackgroundImage(null)
    }
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

  // Get the currently active zones (carousel vs single)
  const activeZones = isCarousel ? carouselVariants[activeVariantTab] : zones
  const setActiveZones = (newZones: Zone[]) => {
    if (isCarousel) {
      setCarouselVariants({ ...carouselVariants, [activeVariantTab]: newZones })
    } else {
      setZones(newZones)
    }
  }

  const handleZoneUpdate = (zoneId: string, updates: Partial<Zone>) => {
    const updatedZones = activeZones.map((zone) => {
      if (zone.id === zoneId) {
        const newZone = { ...zone, ...updates }
        if (updates.type && updates.type !== zone.type) {
          const getFontSizeForType = (type: Zone['type']): number => {
            if (!brandGuidance) return 24
            switch (type) {
              case 'hook': return brandGuidance.headlineFontSize || 48
              case 'body': return brandGuidance.bodyFontSize || 24
              case 'cta': return brandGuidance.ctaFontSize || 32
              case 'no-text': return 16
            }
          }
          newZone.fontSize = getFontSizeForType(updates.type)
        }
        return newZone
      }
      return zone
    })
    setActiveZones(updatedZones)
  }

  const handleZoneDelete = (zoneId: string) => {
    setActiveZones(activeZones.filter((z) => z.id !== zoneId))
    setSelectedZoneId(null)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name')
      return
    }

    const hasZones = isCarousel
      ? carouselVariants.cover.length > 0 || carouselVariants.content.length > 0 || carouselVariants.cta.length > 0
      : zones.length > 0

    if (!hasZones) {
      const confirmed = window.confirm(
        'This template has no zones defined. Save anyway?'
      )
      if (!confirmed) return
    }

    setSaving(true)
    try {
      const zonesConfig = isCarousel
        ? JSON.stringify({
            type: 'carousel',
            cover: carouselVariants.cover,
            content: carouselVariants.content,
            cta: carouselVariants.cta
          })
        : JSON.stringify(zones)

      const templateData: TemplateInsert = {
        name: name.trim(),
        background_type: backgroundType,
        background_value: backgroundValue,
        overlay_color: overlayColor,
        overlay_opacity: overlayOpacity,
        overlay_enabled: overlayEnabled,
        format,
        zones_config: zonesConfig
      }

      let resultId: number
      if (templateId) {
        await window.api.templates.update(templateId, templateData)
        resultId = templateId
      } else {
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

  const selectedZone = activeZones.find((z) => z.id === selectedZoneId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading template...</div>
      </div>
    )
  }

  const VARIANT_TABS: { key: VariantTab; label: string }[] = [
    { key: 'cover', label: 'Cover' },
    { key: 'content', label: 'Content' },
    { key: 'cta', label: 'CTA' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-100">
            {templateId ? 'Edit Template' : 'Create Template'}
          </h2>
          {/* Name */}
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            className="w-48 h-8 text-sm bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400"
          />
          {/* Format */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant={format === 'feed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFormatChange('feed')}
              className="h-8 text-xs"
            >
              Feed (4:5)
            </Button>
            <Button
              type="button"
              variant={format === 'story' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFormatChange('story')}
              className="h-8 text-xs"
            >
              Story (9:16)
            </Button>
          </div>
          {/* Carousel toggle */}
          {format === 'feed' && (
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCarousel}
                onChange={(e) => {
                  const newCarousel = e.target.checked
                  if (newCarousel && zones.length > 0) {
                    const confirmed = window.confirm('Switching to carousel mode will reset your zones. Continue?')
                    if (!confirmed) return
                    setZones([])
                  } else if (!newCarousel && (carouselVariants.cover.length > 0 || carouselVariants.content.length > 0 || carouselVariants.cta.length > 0)) {
                    const confirmed = window.confirm('Switching to single slide mode will reset your carousel zones. Continue?')
                    if (!confirmed) return
                    setCarouselVariants({ cover: [], content: [], cta: [] })
                  }
                  setIsCarousel(newCarousel)
                  setSelectedZoneId(null)
                }}
                className="w-3.5 h-3.5"
              />
              Carousel
            </label>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main content: side-by-side */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Panel - Controls */}
        <div className="w-[320px] shrink-0 min-w-0 overflow-y-auto overflow-x-hidden border-r border-slate-700 bg-slate-900 p-4 space-y-4 pr-2">
          {/* Background Selector */}
          <BackgroundSelector
            backgroundType={backgroundType}
            backgroundValue={backgroundValue}
            brandColors={brandColors}
            onTypeChange={handleBackgroundTypeChange}
            onImageUpload={handleImageUpload}
          />

          {/* Overlay Controls */}
          <OverlayControls
            enabled={overlayEnabled}
            color={overlayColor}
            opacity={overlayOpacity}
            onChange={handleOverlayChange}
          />

          {/* Zone Configuration Panel (docked) */}
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-sm text-slate-200 mb-3">Zone Configuration</h3>
            {selectedZone ? (
              <ZonePopover
                zone={selectedZone}
                onUpdate={(updates) => handleZoneUpdate(selectedZone.id, updates)}
                onDelete={() => handleZoneDelete(selectedZone.id)}
                brandGuidance={brandGuidance}
              />
            ) : (
              <p className="text-xs text-slate-500">
                Click a zone on the canvas to configure it
              </p>
            )}
          </div>
        </div>

        {/* Right Panel - Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0 bg-slate-950 p-4">
          {/* Carousel variant tabs above canvas */}
          {isCarousel && (
            <div className="flex gap-2 mb-3 shrink-0">
              {VARIANT_TABS.map((tab) => {
                const count = carouselVariants[tab.key].length
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveVariantTab(tab.key)
                      setSelectedZoneId(null)
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeVariantTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className="ml-1.5 text-xs opacity-70">({count})</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Zone Editor Canvas */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden pr-2">
            <ZoneEditor
              backgroundImage={backgroundImage}
              backgroundType={backgroundType}
              backgroundColor={backgroundValue}
              overlayColor={overlayColor}
              overlayOpacity={overlayOpacity}
              overlayEnabled={overlayEnabled}
              zones={activeZones}
              onZonesChange={setActiveZones}
              brandGuidance={brandGuidance}
              format={format}
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
