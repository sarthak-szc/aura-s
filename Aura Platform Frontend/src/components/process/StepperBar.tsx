import { Check } from "lucide-react"

const STEPS = [
  "Customer Details","Process Details","Volumetrics",
  "Activity Breakdown","GSDA Evaluation","AI Archetypes","Evaluation Summary"
]

export default function StepperBar({ current }: { current: number }) {
  return (
    <div className="flex items-center w-full pt-2 pb-1">
      {STEPS.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-[#1570ef] text-white ring-4 ring-blue-100"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? <Check size={14} /> : step}
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center leading-tight max-w-[72px]
                ${active ? "text-[#1570ef] font-semibold" : "text-slate-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-[2px] flex-1 mx-1 mb-6 ${done ? "bg-emerald-400" : "bg-slate-200"}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}