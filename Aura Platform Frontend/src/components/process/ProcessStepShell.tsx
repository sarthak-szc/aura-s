"use client"

import type { ReactNode } from "react"
import StepperBar from "@/components/process/StepperBar"
import ProcessStepHeader from "@/components/process/ProcessStepHeader"
import ProcessStepFooter from "@/components/process/ProcessStepFooter"

const COMPLETION: Record<number, number> = {
  1: 15,
  2: 30,
  3: 45,
  4: 57,
  5: 72,
  6: 86,
  7: 100,
}

interface ProcessStepShellProps {
  step: number
  children: ReactNode
  maxWidth?: string
  error?: string
  success?: string
  onCancel: () => void
  onPrevious: () => void
  onSave: () => void
  onNext: () => void
  loading?: boolean
  saving?: boolean
  nextDisabled?: boolean
  nextLabel?: string
  currency?: string
  showPrevious?: boolean
}

export default function ProcessStepShell({
  step,
  children,
  maxWidth = "w-full",
  error,
  success,
  onCancel,
  onPrevious,
  onSave,
  onNext,
  loading = false,
  saving = false,
  nextDisabled = false,
  nextLabel,
  currency = "INR",
  showPrevious,
}: ProcessStepShellProps) {
  const showPrev = showPrevious ?? step > 1
  return (
    <div className="min-h-full bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 lg:px-8 py-4">
        <ProcessStepHeader
          current={step}
          currency={currency}
          completionPct={COMPLETION[step]}
          onExit={onCancel}
        />
        <StepperBar current={step} />
      </div>

      <div className={`px-6 lg:px-8 py-5 pb-8 ${maxWidth}`}>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full">
          <div className="p-5 lg:p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">
                {success}
              </div>
            )}
            {children}
          </div>

          <ProcessStepFooter
            onCancel={onCancel}
            onPrevious={onPrevious}
            onSave={onSave}
            onNext={onNext}
            showPrevious={showPrev}
            loading={loading}
            saving={saving}
            nextDisabled={nextDisabled}
            nextLabel={nextLabel ?? (step === 7 ? "Mark Complete →" : "Next Step →")}
          />
        </div>
      </div>
    </div>
  )
}
