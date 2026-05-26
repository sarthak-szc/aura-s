"use client"

import { FieldLabel } from "./processFormUi"

const QUADRANTS = [
  { key: "goals" as const, title: "Goals", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", dot: "bg-violet-500" },
  { key: "signals" as const, title: "Signals", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  { key: "decisions" as const, title: "Decisions", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  { key: "actions" as const, title: "Actions", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
]

export type GSDALists = {
  goals: string[]
  signals: string[]
  decisions: string[]
  actions: string[]
}

export function listsFromItems(
  items: { goal?: string; signal?: string; decision?: string; action?: string }[]
): GSDALists {
  const goals: string[] = []
  const signals: string[] = []
  const decisions: string[] = []
  const actions: string[] = []
  for (const it of items) {
    if (it.goal?.trim()) goals.push(it.goal.trim())
    if (it.signal?.trim()) signals.push(it.signal.trim())
    if (it.decision?.trim()) decisions.push(it.decision.trim())
    if (it.action?.trim()) actions.push(it.action.trim())
  }
  return {
    goals: goals.length ? goals : [""],
    signals: signals.length ? signals : [""],
    decisions: decisions.length ? decisions : [""],
    actions: actions.length ? actions : [""],
  }
}

export function itemsFromLists(lists: GSDALists) {
  const n = Math.max(
    lists.goals.length,
    lists.signals.length,
    lists.decisions.length,
    lists.actions.length,
    1
  )
  const out = []
  for (let i = 0; i < n; i++) {
    const goal = lists.goals[i]?.trim() || lists.goals[0]?.trim() || ""
    const signal = lists.signals[i]?.trim() || ""
    const decision = lists.decisions[i]?.trim() || ""
    const action = lists.actions[i]?.trim() || ""
    if (!goal && !signal && !decision && !action) continue
    out.push({
      goal: goal || "Process automation goal",
      signal: signal || "Process trigger event",
      decision: decision || "Business rule decision",
      action: action || "Automated action step",
      time_estimate: "5 min",
      system_involved: "ERP",
      data_type: "Structured",
      complexity: "Medium" as const,
      frequency: "Daily",
      ai_scope: "Partial",
    })
  }
  if (out.length) return out
  return [
    {
      goal: "Automate key process steps",
      signal: "Process trigger event",
      decision: "Business rule evaluation",
      action: "Execute automated workflow",
      time_estimate: "5 min",
      system_involved: "ERP",
      data_type: "Structured",
      complexity: "Medium" as const,
      frequency: "Daily",
      ai_scope: "Partial",
    },
  ]
}

function QuadrantList({
  title,
  color,
  bg,
  dot,
  items,
  onChange,
  addLabel,
}: {
  title: string
  color: string
  bg: string
  dot: string
  items: string[]
  onChange: (items: string[]) => void
  addLabel: string
}) {
  return (
    <div className={`border rounded-xl p-4 ${bg}`}>
      <h4 className={`text-sm font-bold ${color} mb-3`}>{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 bg-white/80 rounded-lg p-2 border border-white">
            <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${dot}`} />
            <input
              value={item}
              className="flex-1 text-xs border-0 bg-transparent focus:ring-0 p-0"
              onChange={(e) => {
                const u = [...items]
                u[i] = e.target.value
                onChange(u)
              }}
            />
            <button
              type="button"
              className="text-slate-400 hover:text-red-500 text-xs"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className={`text-xs font-medium mt-2 hover:underline ${color}`}
      >
        {addLabel}
      </button>
    </div>
  )
}

export default function GSDAQuadrants({
  lists,
  onChange,
}: {
  lists: GSDALists
  onChange: (lists: GSDALists) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QUADRANTS.map((q) => (
        <QuadrantList
          key={q.key}
          title={q.title}
          color={q.color}
          bg={q.bg}
          dot={q.dot}
          items={lists[q.key]}
          onChange={(items) => onChange({ ...lists, [q.key]: items })}
          addLabel={`+ Add ${q.title} Item`}
        />
      ))}
    </div>
  )
}

export function AutomationAssessment({
  canAutomate,
  automationPct,
  horizon,
  aiOpportunity,
  onChange,
}: {
  canAutomate: boolean
  automationPct: number
  horizon: string
  aiOpportunity: string
  onChange: (v: {
    canAutomate: boolean
    automationPct: number
    horizon: string
    aiOpportunity: string
  }) => void
}) {
  return (
    <div className="space-y-4 border-t border-slate-100 pt-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <FieldLabel>Can this process be automated?</FieldLabel>
          <div className="flex gap-2 mt-1">
            {["Yes", "No"].map((opt) => {
              const yes = opt === "Yes"
              const active = canAutomate === yes
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange({ canAutomate: yes, automationPct, horizon, aiOpportunity })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    active
                      ? yes
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-600 text-white border-slate-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <FieldLabel>Overall Automation Level Addressable</FieldLabel>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <input
              type="number"
              min={0}
              max={100}
              value={automationPct}
              className="flex-1 px-3 py-2.5 text-sm border-0"
              onChange={(e) =>
                onChange({
                  canAutomate,
                  automationPct: Number(e.target.value),
                  horizon,
                  aiOpportunity,
                })
              }
            />
            <span className="bg-slate-50 border-l px-3 py-2.5 text-xs text-slate-500">%</span>
          </div>
        </div>
        <div>
          <FieldLabel>Automation Horizon</FieldLabel>
          <select
            value={horizon}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            onChange={(e) =>
              onChange({ canAutomate, automationPct, horizon: e.target.value, aiOpportunity })
            }
          >
            <option>Immediate (0–12 months)</option>
            <option>Short-term (12–24 months)</option>
            <option>Long-term (24+ months)</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>AI Opportunity</FieldLabel>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex gap-1 border-b bg-slate-50 px-2 py-1 text-xs text-slate-500">
            <span className="px-2 font-bold">B</span>
            <span className="px-2 italic">I</span>
            <span className="px-2">•</span>
          </div>
          <textarea
            rows={4}
            className="w-full px-3 py-2 text-sm border-0 resize-y"
            value={aiOpportunity}
            onChange={(e) =>
              onChange({ canAutomate, automationPct, horizon, aiOpportunity: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  )
}
