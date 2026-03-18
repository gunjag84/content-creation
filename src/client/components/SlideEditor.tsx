import { useRef, useState, useCallback } from 'react'
import type { Slide, ZoneOverride, Settings, ImageLibraryEntry } from '@shared/types'
import { fileUrl } from '@shared/fontResolver'
import { ZoneToolbar } from './ZoneToolbar'
import { RichTextEditor } from './RichTextEditor'

interface SlideEditorProps {
  slide: Slide
  index: number
  settings: Settings | null
  onChange: (index: number, field: keyof Slide, value: string | number) => void
  onUploadBackground: (file: File) => Promise<void>
  onEnterPanMode: () => void
  uploadingBg?: boolean
  activeZoneId: string
  onActiveZoneChange: (zoneId: string) => void
  onZoneOverrideChange: (zoneId: string, override: ZoneOverride) => void
  onResetZonePosition: (zoneId: string) => void
  onApplyToAll: (zoneId: string, override: ZoneOverride) => void
  onSaveToLibrary?: () => void
  onSelectFromLibrary?: (entry: ImageLibraryEntry) => void
  onDeleteFromLibrary?: (id: string) => void
}

// Remove a specific CSS property from all style="..." attributes in an HTML string.
// Used to clear inline font-family marks when the zone-level font changes (reset overrides).
function stripInlineStyleProp(html: string, prop: string): string {
  if (!html) return html
  return html.replace(/style="([^"]*)"/g, (_, styles: string) => {
    const propLower = prop.toLowerCase()
    const remaining = styles
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => {
        if (!s) return false
        return s.split(':')[0].trim().toLowerCase() !== propLower
      })
      .join('; ')
    return remaining ? `style="${remaining}"` : ''
  })
}

// Compute the fully-resolved values for a zone:
// settings visual defaults merged with any stored overrides.
// The result is always fully populated - no undefined for visual fields.
function resolveZoneValues(
  zoneId: string,
  overrides: Record<string, ZoneOverride>,
  settings: Settings | null
): ZoneOverride {
  const v = settings?.visual
  const colors = v?.colors ?? ['#ffffff', '#cccccc', '#1a1a2e']
  const fontSizes = v?.fontSizes ?? { headline: 56, body: 38, cta: 48 }

  const defaults: Record<string, ZoneOverride> = {
    hook: { fontSize: fontSizes.headline, fontWeight: 'bold',   fontStyle: 'normal', color: colors[0] ?? '#ffffff', textAlign: 'center', lineHeight: 1.3, letterSpacing: 0 },
    body: { fontSize: fontSizes.body,     fontWeight: 'normal', fontStyle: 'normal', color: colors[1] ?? '#cccccc', textAlign: 'center', lineHeight: 1.3, letterSpacing: 0 },
    cta:  { fontSize: fontSizes.cta,      fontWeight: 'bold',   fontStyle: 'normal', color: colors[0] ?? '#ffffff', textAlign: 'center', lineHeight: 1.3, letterSpacing: 0 },
  }

  const def = defaults[zoneId] ?? defaults.body
  const stored = overrides[zoneId] ?? {}

  return {
    ...def,
    ...stored,
    // Position fields pass through as-is (undefined is fine for these)
    posTop: stored.posTop,
    posLeft: stored.posLeft,
    posWidth: stored.posWidth,
    posHeight: stored.posHeight,
  }
}

export function SlideEditor({
  slide,
  index,
  settings,
  onChange,
  onUploadBackground,
  onEnterPanMode,
  uploadingBg,
  activeZoneId,
  onActiveZoneChange,
  onZoneOverrideChange,
  onResetZonePosition,
  onApplyToAll,
  onSaveToLibrary,
  onSelectFromLibrary,
  onDeleteFromLibrary,
}: SlideEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)
  // Per-zone content version — bump when we strip inline marks so RichTextEditor reloads content
  const [zoneContentVersions, setZoneContentVersions] = useState<Record<string, number>>({})

  const fontLibrary = settings?.visual?.fontLibrary ?? []
  const imageLibrary = settings?.visual?.imageLibrary ?? []
  const baseUrl = window.location.origin
  const overlayColor = slide.overlay_color ?? 'dark'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    try {
      await onUploadBackground(file)
    } catch {
      setUploadError('Upload failed. Try again.')
    }
    e.target.value = ''
  }

  const overrides = slide.zone_overrides ?? {}
  // Fully resolved values for the active zone - reflects actual rendered appearance
  const activeValues = resolveZoneValues(activeZoneId, overrides, settings)

  const zones: Array<{ id: string; label: string; show: boolean }> = [
    { id: 'hook', label: 'Hook', show: slide.slide_type === 'cover' || slide.slide_type === 'content' },
    { id: 'body', label: 'Body', show: true },
    { id: 'cta',  label: 'CTA',  show: slide.slide_type === 'cta' || slide.slide_type === 'cover' },
  ]

  const textFieldMap: Record<string, keyof Slide> = {
    hook: 'hook_text',
    body: 'body_text',
    cta:  'cta_text',
  }

  // Zone font changed → strip inline font-family marks from HTML so zone font takes over.
  // Bumps contentVersion for that zone so RichTextEditor reloads the cleaned content.
  const handleZoneToolbarChange = useCallback((o: ZoneOverride) => {
    const textField = textFieldMap[activeZoneId]
    if (textField && o.fontFamily !== activeValues.fontFamily) {
      const html = (slide[textField] as string) ?? ''
      const stripped = stripInlineStyleProp(html, 'font-family')
      if (stripped !== html) {
        onChange(index, textField, stripped)
        setZoneContentVersions(prev => ({ ...prev, [activeZoneId]: (prev[activeZoneId] ?? 0) + 1 }))
      }
    }
    onZoneOverrideChange(activeZoneId, o)
  }, [activeZoneId, activeValues.fontFamily, slide, index, onChange, onZoneOverrideChange])

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Slide header + overlay */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-500">
          Slide {slide.slide_number} - {slide.slide_type}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button
            type="button"
            title={overlayColor === 'dark' ? 'Dark overlay (click for light)' : 'Light overlay (click for dark)'}
            onClick={() => onChange(index, 'overlay_color', overlayColor === 'dark' ? 'light' : 'dark')}
            className="px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-100 text-xs"
          >
            {overlayColor === 'dark' ? '⬛' : '⬜'}
          </button>
          Overlay
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={slide.overlay_opacity}
            onChange={(e) => onChange(index, 'overlay_opacity', parseFloat(e.target.value))}
            className="w-20"
          />
          <span>{Math.round(slide.overlay_opacity * 100)}%</span>
        </div>
      </div>

      {/* Zone Toolbar — shared, always shows fully-resolved values for active zone */}
      <div className="border rounded-lg p-3 bg-gray-50">
        <p className="text-xs text-gray-400 mb-2 font-medium">
          Formatting: <span className="text-gray-600 capitalize">{activeZoneId}</span>
        </p>
        <ZoneToolbar
          values={activeValues}
          onChange={handleZoneToolbarChange}
          fontLibrary={fontLibrary}
        />
      </div>

      {/* Zone editors */}
      {zones.filter(z => z.show).map(zone => {
        const textField = textFieldMap[zone.id] as keyof Slide
        const text = (slide[textField] as string) ?? ''
        const storedOverride = overrides[zone.id] ?? {}
        const zoneValues = resolveZoneValues(zone.id, overrides, settings)

        return (
          <div
            key={zone.id}
            className={`border rounded-lg p-3 space-y-2 transition-colors ${activeZoneId === zone.id ? 'border-blue-400 bg-blue-50/30' : ''}`}
          >
            {/* Zone header row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{zone.label}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Reset zone position"
                  onClick={() => onResetZonePosition(zone.id)}
                  title="Reset position"
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ↺
                </button>
                <button
                  type="button"
                  aria-label="Apply formatting to all slides"
                  onClick={() => onApplyToAll(zone.id, storedOverride)}
                  title="Apply to all slides"
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ≡
                </button>
              </div>
            </div>

            <RichTextEditor
              key={`${slide.uid}-${zone.id}`}
              content={text}
              onChange={(html) => onChange(index, textField, html)}
              onFocus={() => onActiveZoneChange(zone.id)}
              placeholder={`${zone.label} text...`}
              fontLibrary={fontLibrary}
              zoneFontSize={zoneValues.fontSize}
              contentVersion={zoneContentVersions[zone.id] ?? 0}
            />
          </div>
        )
      })}

      {/* Background image */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Background image</p>
          {imageLibrary.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLibrary(v => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showLibrary ? 'Hide library' : `Library (${imageLibrary.length})`}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {slide.custom_background_path ? (
            <button
              onClick={onEnterPanMode}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Reframe
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingBg}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {uploadingBg && <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />}
              {uploadingBg ? 'Uploading...' : 'Upload image'}
            </button>
          )}
          {slide.custom_background_path && onSaveToLibrary && (
            <button
              type="button"
              onClick={onSaveToLibrary}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Save to library
            </button>
          )}
        </div>
        {uploadError && (
          <p className="mt-1 text-xs text-red-600">{uploadError}</p>
        )}
        {/* Image library grid */}
        {showLibrary && imageLibrary.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {imageLibrary.map(entry => (
              <div key={entry.id} className="relative group aspect-[4/5]">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectFromLibrary) onSelectFromLibrary(entry)
                    setShowLibrary(false)
                  }}
                  title={entry.name ?? entry.path}
                  className="absolute inset-0 overflow-hidden rounded border border-gray-200 hover:border-blue-400 transition-colors"
                >
                  <img
                    src={fileUrl(entry.path, baseUrl)}
                    alt={entry.name ?? ''}
                    className="w-full h-full object-cover"
                  />
                </button>
                {onDeleteFromLibrary && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteFromLibrary(entry.id) }}
                    title="Remove from library"
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
