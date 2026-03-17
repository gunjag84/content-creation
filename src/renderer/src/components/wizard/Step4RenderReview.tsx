import { useState, useEffect } from 'react'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Slider } from '../ui/slider'
import { Label } from '../ui/label'
import { Loader2 } from 'lucide-react'
import type { Settings } from '../../../../shared/types/settings'
import type { Template } from '../../../../preload/types'
import type { Zone } from '../templates/ZoneEditor'

export function Step4RenderReview() {
  const {
    generatedSlides,
    caption,
    renderedPNGs,
    postId,
    exportFolder,
    selectedPillar,
    selectedTheme,
    selectedMechanic,
    contentType,
    customBackgroundPath,
    setRenderedPNGs,
    setPostId,
    setExportFolder,
    setSlide,
    setStep
  } = useCreatePostStore()

  const [settings, setSettings] = useState<Settings | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState({ current: 0, total: 0 })
  const [isExporting, setIsExporting] = useState(false)
  const [previewPNGs, setPreviewPNGs] = useState<string[]>([])
  const [zoomIndex, setZoomIndex] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const settingsData = await window.api.loadSettings()
        setSettings(settingsData)

        // Load template (assume first template for now, in production get from user selection)
        const templates = await window.api.templates.list()
        if (templates.length > 0) {
          const templateData = await window.api.templates.get(templates[0].id)
          if (templateData) {
            setTemplate(templateData)
          }
        }
      } catch (error) {
        console.error('Failed to load settings/template:', error)
      }
    }

    loadData()
  }, [])

  const buildThemeSlug = (theme: string): string => {
    return theme
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const getLogoPositionStyle = (logo: NonNullable<NonNullable<Settings['visualGuidance']>['logo']>): string => {
    switch (logo.position) {
      case 'top-left': return 'top: 40px; left: 40px;'
      case 'top-center': return 'top: 40px; left: 50%; transform: translateX(-50%);'
      case 'top-right': return 'top: 40px; right: 40px;'
      case 'bottom-left': return 'bottom: 40px; left: 40px;'
      case 'bottom-center': return 'bottom: 40px; left: 50%; transform: translateX(-50%);'
      case 'bottom-right': return 'bottom: 40px; right: 40px;'
      default: return 'bottom: 40px; left: 50%; transform: translateX(-50%);'
    }
  }

  const buildSlideHTML = (slideIndex: number): string => {
    const slide = generatedSlides[slideIndex]
    const guidance = settings?.visualGuidance

    // Parse zones_config from template
    let zones: Zone[] = []
    if (template?.zones_config) {
      try { zones = JSON.parse(template.zones_config) } catch (_) { zones = [] }
    }

    // Font face declarations
    const fontStyles = [
      guidance?.headlineFont?.path ? `@font-face { font-family: 'CustomHeadline'; src: url('file://${guidance.headlineFont.path}'); }` : '',
      guidance?.bodyFont?.path ? `@font-face { font-family: 'CustomBody'; src: url('file://${guidance.bodyFont.path}'); }` : '',
      guidance?.ctaFont?.path ? `@font-face { font-family: 'CustomCTA'; src: url('file://${guidance.ctaFont.path}'); }` : ''
    ].filter(Boolean).join('\n')

    // Background CSS: custom upload > template > settings fallback
    let backgroundCSS = `background-color: ${guidance?.backgroundColor || '#1a1a2e'};`
    if (customBackgroundPath) {
      const bgUrl = customBackgroundPath.replace(/\\/g, '/')
      backgroundCSS = `background-image: url('file:///${bgUrl}'); background-size: cover; background-position: center;`
    } else if (template) {
      if (template.background_type === 'solid_color') {
        backgroundCSS = `background-color: ${template.background_value};`
      } else if (template.background_type === 'image') {
        backgroundCSS = `background-image: url('file://${template.background_value}'); background-size: cover; background-position: center;`
      } else if (template.background_type === 'gradient') {
        backgroundCSS = `background: ${template.background_value};`
      }
    }

    const overlayOpacity = slide.overlay_opacity ?? 0.5
    const overlayColor = template?.overlay_color || '#000000'
    const showOverlay = template?.overlay_enabled ?? true
    const primaryColor = guidance?.primaryColor || '#ffffff'
    const secondaryColor = guidance?.secondaryColor || '#cccccc'

    // CTA text: last slide uses standardCTA if available (POST-17)
    const ctaText = (slideIndex === generatedSlides.length - 1 && slide.slide_type === 'cta' && guidance?.standardCTA)
      ? guidance.standardCTA
      : (slide.cta_text || '')

    // Build zone divs from zones_config
    const zoneElements = zones.map(zone => {
      if (zone.type === 'no-text') return ''
      let text = ''
      let fontFamily = 'sans-serif'
      let color = primaryColor
      if (zone.type === 'hook') {
        text = slide.hook_text || ''
        fontFamily = guidance?.headlineFont ? "'CustomHeadline'" : 'sans-serif'
        color = primaryColor
      } else if (zone.type === 'body') {
        text = slide.body_text || ''
        fontFamily = guidance?.bodyFont ? "'CustomBody'" : 'sans-serif'
        color = secondaryColor
      } else if (zone.type === 'cta') {
        text = ctaText
        fontFamily = guidance?.ctaFont ? "'CustomCTA'" : 'sans-serif'
        color = primaryColor
      }
      return `<div style="position:absolute;left:${zone.x}px;top:${zone.y}px;width:${zone.width}px;height:${zone.height}px;font-family:${fontFamily};font-size:${zone.fontSize || 40}px;color:${color};overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.3;padding:8px;word-wrap:break-word;white-space:pre-wrap;">${text}</div>`
    }).filter(Boolean).join('\n')

    // Fallback layout when no zones defined: hook at top, body in middle, CTA at bottom
    const headlineFamily = guidance?.headlineFont ? "'CustomHeadline', sans-serif" : 'sans-serif'
    const bodyFamily = guidance?.bodyFont ? "'CustomBody', sans-serif" : 'sans-serif'
    const ctaFamily = guidance?.ctaFont ? "'CustomCTA', sans-serif" : 'sans-serif'
    const fallback = zones.length === 0 ? `
      <div style="position:absolute;top:0;left:0;right:0;height:340px;display:flex;align-items:center;justify-content:center;padding:60px 80px 30px;">
        ${slide.hook_text ? `<div style="font-family:${headlineFamily};font-size:56px;color:${primaryColor};text-align:center;line-height:1.25;font-weight:bold;">${slide.hook_text}</div>` : ''}
      </div>
      <div style="position:absolute;top:340px;left:0;right:0;bottom:240px;display:flex;align-items:center;justify-content:center;padding:0 80px;">
        ${slide.body_text ? `<div style="font-family:${bodyFamily};font-size:38px;color:${secondaryColor};text-align:center;line-height:1.6;">${slide.body_text}</div>` : ''}
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:240px;display:flex;align-items:center;justify-content:center;padding:30px 80px 60px;">
        ${ctaText ? `<div style="font-family:${ctaFamily};font-size:48px;color:${primaryColor};text-align:center;font-weight:bold;">${ctaText}</div>` : ''}
      </div>` : ''

    const logoSize = { small: 80, medium: 120, large: 160 }[guidance?.logo?.size || 'medium'] || 120
    const logoHtml = guidance?.logo?.path ? `<img src="file://${guidance.logo.path}" style="position:absolute;${getLogoPositionStyle(guidance.logo)};width:${logoSize}px;height:auto;object-fit:contain;" alt="" />` : ''
    const handleHtml = guidance?.instagramHandle ? `<div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);font-family:${guidance?.bodyFont ? "'CustomBody'" : 'sans-serif'};font-size:20px;color:${secondaryColor};">${guidance.instagramHandle}</div>` : ''

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; } ${fontStyles} body { width: 1080px; height: 1350px; position: relative; overflow: hidden; ${backgroundCSS} } .overlay { position: absolute; inset: 0; background-color: ${overlayColor}; opacity: ${overlayOpacity}; }</style></head><body>${showOverlay ? '<div class="overlay"></div>' : ''}${zoneElements}${fallback}${logoHtml}${handleHtml}</body></html>`
  }

  const handleRenderPreviews = async () => {
    if (generatedSlides.length === 0) return

    setIsRendering(true)
    setRenderProgress({ current: 0, total: generatedSlides.length })

    const pngs: string[] = []

    try {
      for (let i = 0; i < generatedSlides.length; i++) {
        const html = buildSlideHTML(i)
        const raw = await window.api.renderToPNG(html, { width: 1080, height: 1350 })
        const parsed = JSON.parse(raw)
        const dataUrl = parsed.dataUrl

        pngs.push(dataUrl)
        setPreviewPNGs([...pngs])
        setRenderProgress({ current: i + 1, total: generatedSlides.length })
      }

      setRenderedPNGs(pngs)
    } catch (error) {
      console.error('Failed to render slides:', error)
    } finally {
      setIsRendering(false)
    }
  }

  // Auto-render when settings and slides are ready
  useEffect(() => {
    if (settings && generatedSlides.length > 0 && previewPNGs.length === 0 && !isRendering) {
      handleRenderPreviews()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, generatedSlides.length])

  const handleOpacityChange = async (slideIndex: number, value: number[]) => {
    const newOpacity = value[0] / 100
    setSlide(slideIndex, 'overlay_opacity', newOpacity)

    try {
      const html = buildSlideHTML(slideIndex)
      const raw = await window.api.renderToPNG(html, { width: 1080, height: 1350 })
      const parsed = JSON.parse(raw)
      const dataUrl = parsed.dataUrl

      const newPNGs = [...previewPNGs]
      newPNGs[slideIndex] = dataUrl
      setPreviewPNGs(newPNGs)
      setRenderedPNGs(newPNGs)
    } catch (error) {
      console.error('Failed to re-render slide:', error)
    }
  }

  const handleExport = async () => {
    if (renderedPNGs.length === 0) return

    setIsExporting(true)

    try {
      // Select folder
      const folderResult = await window.api.export.selectFolder()
      if (folderResult.canceled || !folderResult.path) {
        setIsExporting(false)
        return
      }

      const folderPath = folderResult.path
      setExportFolder(folderPath)

      // Build file list
      const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const themeSlug = buildThemeSlug(selectedTheme)

      const files = renderedPNGs.map((dataUrl, idx) => ({
        name: `${date}_${themeSlug}_slide-${String(idx + 1).padStart(2, '0')}.png`,
        content: dataUrl
      }))

      // Add caption file
      files.push({
        name: `${date}_${themeSlug}_caption.txt`,
        content: caption
      })

      // Save files
      const saveResult = await window.api.export.saveFiles(folderPath, files)

      if (!saveResult.success) {
        console.error('Export failed:', saveResult.error)
        setIsExporting(false)
        return
      }

      // Save post to DB if not already saved
      let currentPostId = postId
      if (!currentPostId) {
        const postInsert = {
          brand_id: 1, // TODO: get from settings when multi-brand support added
          pillar: selectedPillar,
          theme: selectedTheme,
          mechanic: selectedMechanic,
          content_type: contentType,
          caption: caption,
          status: 'approved' as const,
          settings_version_id: null // TODO: implement settings versioning
        }

        const createResult = await window.api.posts.create(postInsert)
        if (!createResult.success || !createResult.postId) {
          console.error('Failed to create post:', createResult.error)
          setIsExporting(false)
          return
        }

        currentPostId = createResult.postId
        setPostId(currentPostId)

        // Save slides
        const slideInserts = generatedSlides.map((slide) => ({
          post_id: currentPostId!,
          slide_number: slide.slide_number,
          slide_type: slide.slide_type,
          hook_text: slide.hook_text,
          body_text: slide.body_text,
          cta_text: slide.cta_text,
          overlay_opacity: slide.overlay_opacity,
          custom_background_path: slide.custom_background_path || null
        }))

        await window.api.posts.saveSlides(slideInserts)
      } else {
        // Update status to approved
        await window.api.posts.updateStatus(currentPostId, 'approved')
      }

      // Update balance matrix
      await window.api.posts.updateBalance(1, [
        { type: 'pillar', value: selectedPillar },
        { type: 'theme', value: selectedTheme },
        { type: 'mechanic', value: selectedMechanic }
      ])

      // Show success and advance to Step 5
      setStep(5)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const hasRendered = previewPNGs.length > 0

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Render & Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loading state while waiting for settings/slides before auto-render begins */}
          {!hasRendered && !isRendering && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-3 text-slate-400">Loading settings...</span>
            </div>
          )}

          {/* Progress Indicator */}
          {isRendering && (
            <div className="space-y-2">
              <div className="text-center text-sm text-slate-400">
                Rendering slide {renderProgress.current} of {renderProgress.total}...
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(renderProgress.current / renderProgress.total) * 100}%` }}
                />
              </div>

              {/* Preview grid during rendering */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Array.from({ length: renderProgress.total }).map((_, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/5] overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
                  >
                    {previewPNGs[idx] ? (
                      <img src={previewPNGs[idx]} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="animate-spin text-slate-600" size={32} />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                      Slide {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Grid */}
          {hasRendered && !isRendering && (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              {previewPNGs.map((dataUrl, idx) => (
                <div key={idx} className="space-y-2">
                  <button
                    onClick={() => setZoomIndex(idx)}
                    className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <img src={dataUrl} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      Slide {idx + 1} - {generatedSlides[idx]?.slide_type}
                    </div>
                  </button>

                  {/* Overlay Opacity Slider */}
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Overlay Opacity</Label>
                    <Slider
                      value={[Math.round((generatedSlides[idx]?.overlay_opacity || 0.5) * 100)]}
                      onValueChange={(value) => handleOpacityChange(idx, value)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Export Button */}
          {hasRendered && (
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleExport}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Exporting...
                  </>
                ) : (
                  'Export Feed Post'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zoom Modal */}
      {zoomIndex !== null && previewPNGs[zoomIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
          onClick={() => setZoomIndex(null)}
        >
          <div className="relative max-h-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <img
              src={previewPNGs[zoomIndex]}
              alt={`Slide ${zoomIndex + 1} full size`}
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl"
            />
            <div className="mt-2 text-center text-sm text-slate-300">
              Slide {zoomIndex + 1} - {generatedSlides[zoomIndex]?.slide_type}
              <span className="ml-4 text-slate-500">Click outside to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
