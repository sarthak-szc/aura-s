"use client"

const STEP_LABELS = [
  "Customer Details",
  "Process Details",
  "Volumetrics",
  "Activity Breakdown",
  "GSDA Evaluation",
  "AI Archetypes",
  "Evaluation Summary",
]

interface ProcessStepHeaderProps {
  current: number
  currency?: string
  completionPct?: number
  onExit?: () => void
}

export default function ProcessStepHeader({
  current,
  currency = "INR",
  completionPct,
  onExit,
}: ProcessStepHeaderProps) {
  const pct = completionPct ?? Math.round((current / 7) * 100)
  const label = STEP_LABELS[current - 1] ?? ""

  return (
    <div className="flex items-start justify-between gap-4 mb-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Process Discovery Assessment</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Step {current} of 7 — <span className="font-semibold text-slate-800">{label}</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Step completion: {pct}% · Currency: {currency}
        </p>
      </div>
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
        >
          ✕ Exit
        </button>
      )}
    </div>
  )
}
