import { Check } from "lucide-react"

const STEPS = [
  "Customer Details","Process Details","Volumetrics",
  "Activity Breakdown","GSDA Evaluation","AI Archetypes","Evaluation Summary"
]

export default function StepperBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full py-4">
      {STEPS.map((label, i) => {
        const step = i + 1
        const done    = step < current
        const active  = step === current
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                ${done   ? "bg-green-500 text-white"
                : active ? "bg-blue-600 text-white ring-4 ring-blue-100"
                :          "bg-slate-200 text-slate-400"}`}>
                {done ? <Check size={16}/> : step}
              </div>
              <span className={`text-xs mt-1 text-center w-20
                ${active ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mb-5 ${done ? "bg-green-400" : "bg-slate-200"}`}/>
            )}
          </div>
        )
      })}
    </div>
  )
}