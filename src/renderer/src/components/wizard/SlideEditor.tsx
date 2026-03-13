import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import type { Slide } from '../../../../shared/types/generation'

interface SlideEditorProps {
  slide: Slide
  index: number
  onChange: (field: keyof Slide, value: string) => void
}

export function SlideEditor({ slide, onChange }: SlideEditorProps) {
  return (
    <div className="space-y-4">
      {/* Hook Text */}
      <div className="space-y-2">
        <Label className="text-slate-300">Hook</Label>
        <Textarea
          value={slide.hook_text}
          onChange={(e) => onChange('hook_text', e.target.value)}
          placeholder="Attention-grabbing opening line..."
          className="min-h-[80px] resize-y border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 hover:bg-slate-850"
        />
      </div>

      {/* Body Text */}
      <div className="space-y-2">
        <Label className="text-slate-300">Body</Label>
        <Textarea
          value={slide.body_text}
          onChange={(e) => onChange('body_text', e.target.value)}
          placeholder="Main content..."
          className="min-h-[120px] resize-y border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 hover:bg-slate-850"
        />
      </div>

      {/* CTA Text */}
      <div className="space-y-2">
        <Label className="text-slate-300">CTA</Label>
        <Textarea
          value={slide.cta_text}
          onChange={(e) => onChange('cta_text', e.target.value)}
          placeholder="Call to action..."
          className="min-h-[60px] resize-y border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 hover:bg-slate-850"
        />
      </div>
    </div>
  )
}
