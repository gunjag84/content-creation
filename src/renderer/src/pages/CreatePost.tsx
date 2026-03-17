import { useCreatePostStore } from '../stores/useCreatePostStore'
import { StepIndicator } from '../components/wizard/StepIndicator'
import { Step1Recommendation } from '../components/wizard/Step1Recommendation'
import { Step2Generation } from '../components/wizard/Step2Generation'
import { Step3EditText } from '../components/wizard/Step3EditText'
import { Step4RenderReview } from '../components/wizard/Step4RenderReview'
import { Step5Stories } from '../components/wizard/Step5Stories'
import { Button } from '../components/ui/button'
import { X } from 'lucide-react'
import type { NavItem } from '../components/layout/Sidebar'

interface CreatePostProps {
  onNavigate: (item: NavItem) => void
  onRequestTemplateBuilder?: (imagePath: string) => void
}

const STEP_LABELS = ['Recommendation', 'Generate', 'Edit', 'Render', 'Stories']

export function CreatePost({ onNavigate, onRequestTemplateBuilder }: CreatePostProps) {
  const { currentStep, reset } = useCreatePostStore()

  const handleExit = () => {
    reset()
    onNavigate('dashboard')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Recommendation onRequestTemplateBuilder={onRequestTemplateBuilder} />
      case 2:
        return <Step2Generation />
      case 3:
        return <Step3EditText />
      case 4:
        return <Step4RenderReview />
      case 5:
        return <Step5Stories />
      default:
        return null
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-100">Create Post</h1>
        <Button variant="ghost" size="sm" onClick={handleExit} className="gap-2">
          <X size={16} />
          Exit
        </Button>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} labels={STEP_LABELS} />

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>
    </div>
  )
}
