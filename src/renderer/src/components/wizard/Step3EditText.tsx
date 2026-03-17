import { useState, useEffect } from 'react'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import { SlideEditor } from './SlideEditor'
import { InteractiveSlideCanvas } from './InteractiveSlideCanvas'
import { SlideZoneOverrides } from './SlideZoneOverrides'
import { SlidePresetManager } from './SlidePresetManager'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Slider } from '../ui/slider'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Sparkles, RefreshCw, ArrowLeft, Undo2, Redo2 } from 'lucide-react'
import type { Slide } from '../../../../shared/types/generation'
import type { Template } from '../../../../preload/types'
import type { Settings } from '../../../../shared/types/settings'
import type { Zone } from '../templates/ZoneEditor'

interface SortableThumbnailProps {
  slide: Slide
  index: number
  isActive: boolean
  onClick: () => void
}

function SortableThumbnail({ slide, index, isActive, onClick }: SortableThumbnailProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: slide.uid
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        {...listeners}
        {...attributes}
        className="cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      <button
        onClick={onClick}
        className={`flex min-w-[80px] flex-col items-center rounded border p-2 text-xs transition-colors ${
          isActive
            ? 'border-blue-500 bg-blue-950 text-blue-300'
            : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        <div className="font-bold">{index + 1}</div>
        <div className="text-[10px] uppercase">{slide.slide_type}</div>
      </button>
    </div>
  )
}

export function Step3EditText() {
  const {
    generatedSlides,
    caption,
    postId,
    selectedPillar,
    selectedTheme,
    selectedMechanic,
    impulse,
    customBackgroundPath,
    setSlide,
    reorderSlides,
    setCaption,
    setStep,
    setPostId,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCreatePostStore()

  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'slides' | 'caption'>('slides')
  const [showHooksOverlay, setShowHooksOverlay] = useState(false)
  const [hookOptions, setHookOptions] = useState<string[]>([])
  const [isLoadingHooks, setIsLoadingHooks] = useState(false)
  const [showNewDraftConfirm, setShowNewDraftConfirm] = useState(false)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  // Template and zone state
  const [template, setTemplate] = useState<Template | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [bgDataUrl, setBgDataUrl] = useState<string | undefined>(undefined)

  // Load template and settings on mount
  useEffect(() => {
    const load = async () => {
      const settingsData = await window.api.loadSettings()
      setSettings(settingsData)
      const t = await window.api.templates.ensureDefault()
      if (t) {
        setTemplate(t)
        try {
          const parsed = JSON.parse(t.zones_config)
          if (parsed.length > 0) setZones(parsed)
        } catch { /* zones stays empty */ }
      }
    }
    load()
  }, [])

  // Load custom background as data URL
  useEffect(() => {
    if (!customBackgroundPath) { setBgDataUrl(undefined); return }
    window.api.readFileAsDataUrl(customBackgroundPath).then(setBgDataUrl).catch(() => setBgDataUrl(undefined))
  }, [customBackgroundPath])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useCreatePostStore.getState().undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        useCreatePostStore.getState().redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const activeSlide = generatedSlides[activeSlideIndex]

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = generatedSlides.findIndex(s => s.uid === active.id)
      const newIndex = generatedSlides.findIndex(s => s.uid === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSlides(oldIndex, newIndex)
        if (activeSlideIndex === oldIndex) {
          setActiveSlideIndex(newIndex)
        } else if (activeSlideIndex === newIndex) {
          setActiveSlideIndex(Math.max(0, oldIndex > newIndex ? activeSlideIndex + 1 : activeSlideIndex - 1))
        }
      }
    }
  }

  const handleSlideChange = (field: keyof Slide, value: string | number) => {
    setSlide(activeSlideIndex, field, value)
  }

  const handleRequestHooks = async () => {
    setIsLoadingHooks(true)
    setShowHooksOverlay(true)

    try {
      const cleanup = window.api.generation.onHooksComplete((result) => {
        setHookOptions(result.hooks)
        setIsLoadingHooks(false)
        cleanup()
        cleanupError()
      })

      const cleanupError = window.api.generation.onError((error) => {
        console.error('Hooks generation failed:', error.message)
        setIsLoadingHooks(false)
        setShowHooksOverlay(false)
        cleanup()
        cleanupError()
      })

      await window.api.generation.streamHooks({
        currentHook: activeSlide.hook_text,
        slideContext: `${activeSlide.body_text.substring(0, 200)}...`,
        prompt: ''
      })
    } catch (error) {
      console.error('Failed to request hooks:', error)
      setIsLoadingHooks(false)
      setShowHooksOverlay(false)
    }
  }

  const handleSelectHook = (hook: string) => {
    setSlide(activeSlideIndex, 'hook_text', hook)
    setShowHooksOverlay(false)
    setHookOptions([])
  }

  const handleNewDraft = async () => {
    if (!showNewDraftConfirm) {
      setShowNewDraftConfirm(true)
      return
    }
    setStep(2)
  }

  const handleApprove = async () => {
    try {
      const createResult = await window.api.posts.create({
        pillar: selectedPillar,
        theme: selectedTheme,
        mechanic: selectedMechanic,
        content_type: generatedSlides.length > 1 ? 'carousel' : 'single',
        impulse: impulse || '',
        status: 'draft',
        slide_count: generatedSlides.length
      })

      if (createResult.success && createResult.postId) {
        setPostId(createResult.postId)

        const slidesData = generatedSlides.map((slide) => ({
          post_id: createResult.postId!,
          slide_number: slide.slide_number,
          slide_type: slide.slide_type,
          hook_text: slide.hook_text,
          body_text: slide.body_text,
          cta_text: slide.cta_text,
          overlay_opacity: slide.overlay_opacity
        }))

        await window.api.posts.saveSlides(slidesData)
        setStep(4)
      } else {
        console.error('Failed to create post:', createResult.error)
      }
    } catch (error) {
      console.error('Failed to save post:', error)
    }
  }

  if (!activeSlide) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        No slides to edit
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Main Content: Two-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Text Editor (40%) */}
        <div className="w-2/5 overflow-y-auto border-r border-slate-700 bg-slate-900 p-6">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'slides' | 'caption')}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="slides" className="flex-1">
                Slides
              </TabsTrigger>
              <TabsTrigger value="caption" className="flex-1">
                Caption
              </TabsTrigger>
            </TabsList>

            {/* Slides Tab */}
            <TabsContent value="slides" className="space-y-6">
              {/* Undo / Redo Toolbar */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!canUndo()} onClick={undo}>
                  <Undo2 size={16} />
                </Button>
                <Button variant="outline" size="sm" disabled={!canRedo()} onClick={redo}>
                  <Redo2 size={16} />
                </Button>
              </div>

              {/* Thumbnail Strip with Drag & Drop */}
              <div className="space-y-3">
                <Label className="text-slate-300">Slide Order</Label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={generatedSlides.map(s => s.uid)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-wrap gap-2">
                      {generatedSlides.map((slide, idx) => (
                        <SortableThumbnail
                          key={slide.uid}
                          slide={slide}
                          index={idx}
                          isActive={idx === activeSlideIndex}
                          onClick={() => setActiveSlideIndex(idx)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Slide Editor */}
              <Card className="border-slate-700 bg-slate-800">
                <CardContent className="pt-6">
                  <SlideEditor
                    slide={activeSlide}
                    index={activeSlideIndex}
                    onChange={handleSlideChange}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleRequestHooks}
                  disabled={isLoadingHooks}
                  className="w-full gap-2"
                >
                  <Sparkles size={16} />
                  {isLoadingHooks ? 'Generating Hooks...' : 'Alternative Hooks'}
                </Button>

                {showNewDraftConfirm ? (
                  <div className="rounded-lg border border-amber-600 bg-amber-950 p-4">
                    <p className="mb-3 text-sm text-amber-200">
                      Overwrite current content? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowNewDraftConfirm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleNewDraft} className="flex-1 bg-red-600 hover:bg-red-700">
                        Confirm
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={handleNewDraft} className="w-full gap-2">
                    <RefreshCw size={16} />
                    New Draft
                  </Button>
                )}
              </div>

              {/* Overlay Opacity Slider */}
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Overlay Opacity ({Math.round((activeSlide.overlay_opacity || 0.5) * 100)}%)
                </Label>
                <Slider
                  value={[(activeSlide.overlay_opacity || 0.5) * 100]}
                  onValueChange={(val) => handleSlideChange('overlay_opacity', val[0] / 100)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Adjust background overlay darkness
                </p>
              </div>

              {/* Zone Overrides Panel */}
              {zones.length > 0 && (
                <SlideZoneOverrides
                  zones={zones}
                  slideIndex={activeSlideIndex}
                  settings={settings}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={setSelectedZoneId}
                />
              )}

              {/* Preset Manager */}
              {zones.length > 0 && (
                <SlidePresetManager
                  slideIndex={activeSlideIndex}
                  templateId={template?.id}
                />
              )}
            </TabsContent>

            {/* Caption Tab */}
            <TabsContent value="caption" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Instagram Caption</Label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write your caption here..."
                  className="min-h-[400px] resize-y border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{caption.length} characters</span>
                  <span>Max: 2,200</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Interactive Canvas (60%) */}
        <div className="w-3/5 bg-slate-950 p-4">
          <InteractiveSlideCanvas
            slide={activeSlide}
            slideIndex={activeSlideIndex}
            zones={zones}
            template={template}
            settings={settings}
            bgDataUrl={bgDataUrl}
            customBackgroundPath={customBackgroundPath}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
          />
        </div>
      </div>

      {/* Alternative Hooks Overlay */}
      {showHooksOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl border-slate-700 bg-slate-800">
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-100">Alternative Hooks</h3>

              {isLoadingHooks ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-400">Generating options...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hookOptions.map((hook, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectHook(hook)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 p-4 text-left text-sm text-slate-200 transition-colors hover:border-blue-500 hover:bg-slate-800"
                    >
                      {hook}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setShowHooksOverlay(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between border-t border-slate-700 bg-slate-900 p-4">
        <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button onClick={handleApprove} className="gap-2 bg-green-600 hover:bg-green-700">
          Approve & Render
        </Button>
      </div>
    </div>
  )
}
