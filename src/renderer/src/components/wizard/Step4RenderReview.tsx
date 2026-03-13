import { useState, useEffect } from 'react'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Slider } from '../ui/slider'
import { Label } from '../ui/label'
import { Loader2 } from 'lucide-react'
import type { Settings } from '../../../../shared/types/settings'
import type { Template } from '../../../../preload/types'

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

  const buildSlideHTML = (slideIndex: number): string => {
    if (!template) return ''

    const slide = generatedSlides[slideIndex]
    const zones = template.zones_config as any

    // Simple HTML template injection (in production, use proper template engine)
    let html = template.html_template || ''

    // Replace zone placeholders with actual content
    // Hook zone
    if (zones.hook) {
      html = html.replace('{{hook}}', slide.hook_text || '')
    }

    // Body zone
    if (zones.body) {
      html = html.replace('{{body}}', slide.body_text || '')
    }

    // CTA zone - apply POST-17 for last slide
    if (zones.cta) {
      let ctaText = slide.cta_text || ''

      // If this is the last slide and it's a CTA type, use standard CTA from visual guidance
      if (slideIndex === generatedSlides.length - 1 && slide.slide_type === 'cta') {
        if (settings?.visualGuidance?.standardCTA) {
          ctaText = settings.visualGuidance.standardCTA
        }
      }

      html = html.replace('{{cta}}', ctaText)
    }

    // Apply overlay opacity
    html = html.replace('{{overlay_opacity}}', slide.overlay_opacity.toString())

    // Apply brand colors if available
    if (settings?.visualGuidance) {
      html = html.replace(/{{primary_color}}/g, settings.visualGuidance.primaryColor || '#000000')
      html = html.replace(/{{secondary_color}}/g, settings.visualGuidance.secondaryColor || '#666666')
      html = html.replace(/{{background_color}}/g, settings.visualGuidance.backgroundColor || '#ffffff')
    }

    return html
  }

  const handleRenderPreviews = async () => {
    if (!template || generatedSlides.length === 0) return

    setIsRendering(true)
    setRenderProgress({ current: 0, total: generatedSlides.length })

    const pngs: string[] = []

    try {
      for (let i = 0; i < generatedSlides.length; i++) {
        const html = buildSlideHTML(i)
        const dataUrl = await window.api.renderToPNG(html, { width: 1080, height: 1350 })

        pngs.push(dataUrl)
        setPreviewPNGs([...pngs]) // Update preview incrementally
        setRenderProgress({ current: i + 1, total: generatedSlides.length })
      }

      setRenderedPNGs(pngs)
    } catch (error) {
      console.error('Failed to render slides:', error)
    } finally {
      setIsRendering(false)
    }
  }

  const handleOpacityChange = async (slideIndex: number, value: number[]) => {
    const newOpacity = value[0] / 100

    // Update store
    setSlide(slideIndex, 'overlay_opacity', newOpacity)

    // Re-render this specific slide
    try {
      const html = buildSlideHTML(slideIndex)
      const dataUrl = await window.api.renderToPNG(html, { width: 1080, height: 1350 })

      // Update preview and rendered PNGs
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
          {/* Render Button */}
          {!hasRendered && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleRenderPreviews}
                disabled={isRendering || generatedSlides.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRendering ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Rendering...
                  </>
                ) : (
                  'Render & Preview'
                )}
              </Button>
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
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                    <img src={dataUrl} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      Slide {idx + 1} - {generatedSlides[idx]?.slide_type}
                    </div>
                  </div>

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
    </div>
  )
}
