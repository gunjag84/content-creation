import { useCreatePostStore } from '../stores/useCreatePostStore'
import { StepIndicator } from '../components/wizard/StepIndicator'
import { Step1Recommendation } from '../components/wizard/Step1Recommendation'
import { Button } from '../components/ui/button'
import { X } from 'lucide-react'
import type { NavItem } from '../components/layout/Sidebar'

interface CreatePostProps {
  onNavigate: (item: NavItem) => void
}

const STEP_LABELS = ['Recommendation', 'Generate', 'Edit', 'Render', 'Stories']

export function CreatePost({ onNavigate }: CreatePostProps) {
  const { currentStep, reset } = useCreatePostStore()

  const handleExit = () => {
    reset()
    onNavigate('dashboard')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Recommendation />
      case 2:
        return (
          <div className="flex flex-col items-center justify-center p-12">
            <p className="text-slate-400">Step 2: Generate - Coming Soon</p>
            <p className="mt-2 text-sm text-slate-500">AI content generation will be implemented here</p>
          </div>
        )
      case 3:
        return (
          <div className="flex flex-col items-center justify-center p-12">
            <p className="text-slate-400">Step 3: Edit - Coming Soon</p>
            <p className="mt-2 text-sm text-slate-500">Slide editor will be implemented here</p>
          </div>
        )
      case 4:
        return (
          <div className="flex flex-col items-center justify-center p-12">
            <p className="text-slate-400">Step 4: Render - Coming Soon</p>
            <p className="mt-2 text-sm text-slate-500">Image rendering will be implemented here</p>
          </div>
        )
      case 5:
        return (
          <div className="flex flex-col items-center justify-center p-12">
            <p className="text-slate-400">Step 5: Stories - Coming Soon</p>
            <p className="mt-2 text-sm text-slate-500">Story proposals will be implemented here</p>
          </div>
        )
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
