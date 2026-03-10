import type { Settings } from '../../../../shared/types/settings'
import { Label } from '../ui/label'
import { Input } from '../ui/input'

interface ContentDefaultsSectionProps {
  settings: Settings
  onUpdate: (section: 'contentDefaults', value: Settings['contentDefaults']) => Promise<void>
}

export function ContentDefaultsSection({ settings, onUpdate }: ContentDefaultsSectionProps) {
  const defaults = settings.contentDefaults

  const handleFieldChange = (field: keyof Settings['contentDefaults'], value: number) => {
    onUpdate('contentDefaults', { ...defaults, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Content Defaults</h2>
        <p className="text-slate-400">Default values for content generation</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label htmlFor="carouselSlideMin" className="text-slate-200">
            Carousel Slide Min
          </Label>
          <Input
            id="carouselSlideMin"
            type="number"
            min={1}
            max={20}
            value={defaults.carouselSlideMin}
            onChange={(e) => handleFieldChange('carouselSlideMin', parseInt(e.target.value) || 1)}
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        <div>
          <Label htmlFor="carouselSlideMax" className="text-slate-200">
            Carousel Slide Max
          </Label>
          <Input
            id="carouselSlideMax"
            type="number"
            min={defaults.carouselSlideMin}
            max={20}
            value={defaults.carouselSlideMax}
            onChange={(e) => handleFieldChange('carouselSlideMax', parseInt(e.target.value) || 10)}
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        <div>
          <Label htmlFor="captionMaxChars" className="text-slate-200">
            Caption Max Characters
          </Label>
          <Input
            id="captionMaxChars"
            type="number"
            min={100}
            max={5000}
            value={defaults.captionMaxChars}
            onChange={(e) => handleFieldChange('captionMaxChars', parseInt(e.target.value) || 2200)}
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        <div>
          <Label htmlFor="hashtagMin" className="text-slate-200">
            Hashtag Min
          </Label>
          <Input
            id="hashtagMin"
            type="number"
            min={0}
            max={30}
            value={defaults.hashtagMin}
            onChange={(e) => handleFieldChange('hashtagMin', parseInt(e.target.value) || 0)}
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        <div>
          <Label htmlFor="hashtagMax" className="text-slate-200">
            Hashtag Max
          </Label>
          <Input
            id="hashtagMax"
            type="number"
            min={defaults.hashtagMin}
            max={30}
            value={defaults.hashtagMax}
            onChange={(e) => handleFieldChange('hashtagMax', parseInt(e.target.value) || 30)}
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        <div>
          <Label htmlFor="storiesPerPost" className="text-slate-200">
            Stories Per Post
          </Label>
          <Input
            id="storiesPerPost"
            type="number"
            min={0}
            max={10}
            value={defaults.storiesPerPost}
            onChange={(e) => handleFieldChange('storiesPerPost', parseInt(e.target.value) || 0)}
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>
      </div>
    </div>
  )
}
