"use client"

interface ProcessStepFooterProps {
  onCancel: () => void
  onPrevious?: () => void
  onSave: () => void
  onNext: () => void
  showPrevious?: boolean
  loading?: boolean
  saving?: boolean
  nextDisabled?: boolean
  nextLabel?: string
}

export default function ProcessStepFooter({
  onCancel,
  onPrevious,
  onSave,
  onNext,
  showPrevious = true,
  loading = false,
  saving = false,
  nextDisabled = false,
  nextLabel = "Next Step →",
}: ProcessStepFooterProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 mt-6 rounded-b-xl">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-50"
      >
        Cancel
      </button>
      <div className="flex items-center gap-3">
        {showPrevious && onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={loading || saving}
            className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            ← Previous
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={loading || saving}
          className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
        >
          <span>💾</span>
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={loading || saving || nextDisabled}
          className="bg-[#1570ef] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#175cd3] disabled:opacity-50 shadow-sm"
        >
          {loading ? "Please wait..." : nextLabel}
        </button>
      </div>
    </div>
  )
}
