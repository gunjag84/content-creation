import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4 | 5
  labels: string[]
}

export function StepIndicator({ currentStep, labels }: StepIndicatorProps) {
  const steps = [1, 2, 3, 4, 5] as const

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {steps.map((step, idx) => {
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep
        const isPending = step > currentStep

        return (
          <div key={step} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold
                  ${isCurrent ? 'border-blue-500 bg-blue-500 text-white' : ''}
                  ${isCompleted ? 'border-green-500 bg-green-500 text-white' : ''}
                  ${isPending ? 'border-slate-600 bg-slate-800 text-slate-400' : ''}
                `}
              >
                {isCompleted ? <Check size={20} /> : step}
              </div>
              {/* Label */}
              <span
                className={`
                  mt-2 text-xs
                  ${isCurrent ? 'font-semibold text-blue-400' : ''}
                  ${isCompleted ? 'text-slate-400' : ''}
                  ${isPending ? 'text-slate-500' : ''}
                `}
              >
                {labels[idx]}
              </span>
            </div>

            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div
                className={`
                  mx-2 h-0.5 w-12
                  ${step < currentStep ? 'bg-green-500' : 'bg-slate-700'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
