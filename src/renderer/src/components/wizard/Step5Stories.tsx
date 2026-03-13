import { useState, useEffect } from 'react'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Loader2, Check, X, Edit2, RefreshCw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import type { Settings } from '../../../../shared/types/settings'
import type { StoryProposal } from '../../../../shared/types/generation'

interface EditableStory extends StoryProposal {
  isEditing?: boolean
  isApproved?: boolean
  isRejected?: boolean
}

export function Step5Stories() {
  const {
    generatedSlides,
    caption,
    selectedPillar,
    selectedTheme,
    selectedMechanic,
    storyProposals,
    exportFolder,
    setStoryProposals,
    setStep,
    reset
  } = useCreatePostStore()

  const [settings, setSettings] = useState<Settings | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [stories, setStories] = useState<EditableStory[]>([])
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await window.api.loadSettings()
        setSettings(settingsData)
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    loadSettings()
  }, [])

  // Auto-generate stories on mount
  useEffect(() => {
    if (storyProposals.length === 0 && !isGenerating) {
      generateStories()
    } else {
      setStories(storyProposals.map(p => ({ ...p, isApproved: false, isRejected: false })))
    }
  }, [])

  const generateStories = async () => {
    if (!settings) return

    setIsGenerating(true)

    try {
      // Build prompt using story-generator service (imported on main process)
      // For now, build it here to avoid circular imports
      const prompt = buildStoryPromptLocal()

      // Register completion listener
      const cleanup = window.api.generation.onStoriesComplete((result) => {
        setStoryProposals(result.proposals)
        setStories(result.proposals.map(p => ({ ...p, isApproved: false, isRejected: false })))
        setIsGenerating(false)
        cleanup()
      })

      // Start generation
      await window.api.generation.streamStories(prompt)
    } catch (error) {
      console.error('Failed to generate stories:', error)
      setIsGenerating(false)
    }
  }

  const buildStoryPromptLocal = (): string => {
    if (!settings) return ''

    const slideTexts = generatedSlides
      .map((slide, idx) => {
        return `Slide ${idx + 1} (${slide.slide_type}):
Hook: ${slide.hook_text}
Body: ${slide.body_text}
CTA: ${slide.cta_text}`
      })
      .join('\n\n')

    const activeTools = settings.storyTools?.tools.filter((t) => t.active) || []
    const toolsCatalog = activeTools
      .map((tool) => {
        return `- ${tool.name}: ${tool.description}
  Engagement: ${tool.engagementType || 'N/A'}
  Best for mechanics: ${tool.mechanicRecommendations?.join(', ') || 'Any'}`
      })
      .join('\n')

    return `You are a social media strategist creating Instagram story proposals to support a feed post.

## Feed Post Context

**Pillar:** ${selectedPillar}
**Theme:** ${selectedTheme}
**Mechanic:** ${selectedMechanic}

**Caption:**
${caption}

**Slides:**
${slideTexts}

## Story Types to Generate

Generate 2-4 story proposals using these types:

1. **Teaser** - Posted BEFORE the feed post to build anticipation
2. **Reference** - Posted AFTER the feed post to drive engagement
3. **Deepening** - Posted AFTER to expand on post content
4. **Behind the Scenes** - Posted AFTER to add personality

## Available Story Tools

${toolsCatalog}

## Output Format

Return ONLY valid JSON (no markdown, no explanation) in this format:

[
  {
    "story_type": "teaser" | "reference" | "deepening" | "behind_the_scenes",
    "tool_type": "poll" | "quiz" | "question" | "countdown" | "link",
    "tool_content": "{\\"question\\": \\"What's your biggest challenge?\\", \\"options\\": [\\"Time\\", \\"Money\\", \\"Focus\\"]}",
    "timing": "before" | "after",
    "source_slide_index": 0,
    "text_content": "Story text that appears on screen",
    "rationale": "Why this story supports the feed post"
  }
]

Generate the stories now.`
  }

  const handleApprove = (index: number) => {
    setStories(prev => prev.map((s, idx) =>
      idx === index ? { ...s, isApproved: true, isRejected: false } : s
    ))
  }

  const handleReject = (index: number) => {
    setStories(prev => prev.map((s, idx) =>
      idx === index ? { ...s, isRejected: true, isApproved: false } : s
    ))
  }

  const handleRestore = (index: number) => {
    setStories(prev => prev.map((s, idx) =>
      idx === index ? { ...s, isRejected: false } : s
    ))
  }

  const handleEdit = (index: number) => {
    setStories(prev => prev.map((s, idx) =>
      idx === index ? { ...s, isEditing: !s.isEditing } : s
    ))
  }

  const handleUpdateStory = (index: number, field: keyof StoryProposal, value: any) => {
    setStories(prev => prev.map((s, idx) =>
      idx === index ? { ...s, [field]: value } : s
    ))
  }

  const handleExportStories = async () => {
    const approvedStories = stories.filter(s => s.isApproved && !s.isRejected)
    if (approvedStories.length === 0) return

    setIsExporting(true)

    try {
      // Determine export folder
      let folderPath = exportFolder
      if (!folderPath) {
        const folderResult = await window.api.export.selectFolder()
        if (folderResult.canceled || !folderResult.path) {
          setIsExporting(false)
          return
        }
        folderPath = folderResult.path
      }

      // Render each approved story
      const date = new Date().toISOString().split('T')[0]
      const themeSlug = buildThemeSlug(selectedTheme)
      const storyFiles = []

      for (let i = 0; i < approvedStories.length; i++) {
        const story = approvedStories[i]
        const sourceSlide = generatedSlides[story.source_slide_index]

        // Build story HTML (simple reformatted version for 9:16)
        const storyHTML = buildStoryHTML(story, sourceSlide)

        // Render at 1080x1920
        const dataUrl = await window.api.renderToPNG(storyHTML, { width: 1080, height: 1920 })

        storyFiles.push({
          name: `${date}_${themeSlug}_story-${String(i + 1).padStart(2, '0')}.png`,
          content: dataUrl
        })
      }

      // Export files
      const saveResult = await window.api.export.saveFiles(folderPath, storyFiles)

      if (!saveResult.success) {
        console.error('Story export failed:', saveResult.error)
        setIsExporting(false)
        return
      }

      // Show success and navigate
      setTimeout(() => {
        reset()
        setStep(1)
      }, 2000)
    } catch (error) {
      console.error('Story export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const buildThemeSlug = (theme: string): string => {
    return theme
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const buildStoryHTML = (story: StoryProposal, sourceSlide: any): string => {
    // Simple story template (9:16 format with brand colors)
    const primaryColor = settings?.visualGuidance?.primaryColor || '#000000'
    const bgColor = settings?.visualGuidance?.backgroundColor || '#ffffff'

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1920px;
      background: ${bgColor};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px;
      font-family: Arial, sans-serif;
    }
    .story-text {
      font-size: 64px;
      line-height: 1.4;
      color: ${primaryColor};
      text-align: center;
      font-weight: bold;
    }
    .story-type {
      position: absolute;
      top: 40px;
      left: 40px;
      font-size: 24px;
      color: ${primaryColor};
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="story-type">${story.story_type.toUpperCase()}</div>
  <div class="story-text">${story.text_content}</div>
</body>
</html>
    `
  }

  const handleSkipStories = () => {
    reset()
    setStep(1)
  }

  const handleCreateAnother = () => {
    reset()
    setStep(1)
  }

  const approvedCount = stories.filter(s => s.isApproved && !s.isRejected).length

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-blue-600" size={48} />
          <p className="text-slate-400">Generating story proposals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Story Proposals</CardTitle>
          <p className="text-sm text-slate-400">
            {stories.length} stories generated - Approve the ones you want to use
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {stories.map((story, idx) => (
            <Card
              key={idx}
              className={`border ${
                story.isApproved
                  ? 'border-green-600 bg-green-950/20'
                  : story.isRejected
                    ? 'border-slate-600 bg-slate-900/50 opacity-50'
                    : 'border-slate-700 bg-slate-900'
              }`}
            >
              <CardContent className="p-4">
                {story.isEditing ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Story Type</Label>
                        <Select
                          value={story.story_type}
                          onValueChange={(val: any) => handleUpdateStory(idx, 'story_type', val)}
                        >
                          <SelectTrigger className="border-slate-600 bg-slate-800 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-slate-600 bg-slate-900">
                            <SelectItem value="teaser">Teaser</SelectItem>
                            <SelectItem value="reference">Reference</SelectItem>
                            <SelectItem value="deepening">Deepening</SelectItem>
                            <SelectItem value="behind_the_scenes">Behind the Scenes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Timing</Label>
                        <Select
                          value={story.timing}
                          onValueChange={(val: any) => handleUpdateStory(idx, 'timing', val)}
                        >
                          <SelectTrigger className="border-slate-600 bg-slate-800 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-slate-600 bg-slate-900">
                            <SelectItem value="before">Before Post</SelectItem>
                            <SelectItem value="after">After Post</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Story Text</Label>
                      <Textarea
                        value={story.text_content}
                        onChange={(e) => handleUpdateStory(idx, 'text_content', e.target.value)}
                        className="border-slate-600 bg-slate-800 text-slate-100"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(idx)}>
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2">
                        <Badge variant={story.timing === 'before' ? 'default' : 'secondary'}>
                          {story.timing === 'before' ? 'Before Post' : 'After Post'}
                        </Badge>
                        <Badge variant="outline">{story.story_type.replace('_', ' ')}</Badge>
                        <Badge variant="outline">{story.tool_type}</Badge>
                      </div>
                      {story.isApproved && <Check className="text-green-600" size={24} />}
                    </div>

                    <div className="text-sm text-slate-300">
                      <strong>Text:</strong> {story.text_content}
                    </div>

                    <div className="text-xs text-slate-500">
                      Based on slide {story.source_slide_index + 1}:{' '}
                      {generatedSlides[story.source_slide_index]?.slide_type}
                    </div>

                    <div className="text-xs text-slate-400 italic">{story.rationale}</div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!story.isRejected ? (
                        <>
                          <Button
                            size="sm"
                            variant={story.isApproved ? 'default' : 'outline'}
                            onClick={() => handleApprove(idx)}
                            className={story.isApproved ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            <Check size={16} className="mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(idx)}>
                            <X size={16} className="mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(idx)}>
                            <Edit2 size={16} className="mr-1" />
                            Edit
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleRestore(idx)}>
                          <RefreshCw size={16} className="mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Export Button */}
          {approvedCount > 0 && (
            <div className="flex justify-end gap-2 pt-4">
              <Button
                size="lg"
                onClick={handleExportStories}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Exporting...
                  </>
                ) : (
                  `Render & Export ${approvedCount} ${approvedCount === 1 ? 'Story' : 'Stories'}`
                )}
              </Button>
            </div>
          )}

          {/* Skip or Create Another */}
          <div className="flex justify-between border-t border-slate-700 pt-4">
            <Button variant="outline" onClick={handleSkipStories}>
              Skip Stories
            </Button>
            <Button onClick={handleCreateAnother} className="bg-blue-600 hover:bg-blue-700">
              Create Another Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
