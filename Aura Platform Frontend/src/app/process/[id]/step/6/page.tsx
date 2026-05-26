"use client"

import { useState, useEffect } from "react"
import { Pencil, Trash2 } from "lucide-react"
import ProcessStepShell from "@/components/process/ProcessStepShell"
import {
  StepSectionHeader,
  BtnPrimary,
  BtnPurple,
  SectionTitle,
  FormInput,
  FormSelect,
  FormTextarea,
  FieldLabel,
} from "@/components/process/processFormUi"
import { processAPI } from "@/lib/api"
import { useProcessWizard } from "@/hooks/useProcessWizard"

interface Archetype {
  archetype_name: string
  fit_score: number
  description: string
  recommended_tools: string[]
  implementation_complexity: "Low" | "Medium" | "High"
  is_selected: boolean
}

const DEFAULT_TECH = {
  document_ai: "",
  erp_integration: "",
  erp_automation: "",
  conversational: "",
  gen_ai: "",
  analytics: "",
}

const TECH_FIELDS: { key: keyof typeof DEFAULT_TECH; label: string }[] = [
  { key: "document_ai", label: "Document AI" },
  { key: "erp_integration", label: "ERP Integration" },
  { key: "erp_automation", label: "ERP Automation" },
  { key: "conversational", label: "Conversational AI" },
  { key: "gen_ai", label: "Gen AI / LLM" },
  { key: "analytics", label: "Analytics" },
]

export default function AIArchetypes() {
  const w = useProcessWizard()
  const [archetypes, setArchetypes] = useState<Archetype[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [tech, setTech] = useState(DEFAULT_TECH)
  const [complexity, setComplexity] = useState({
    overall: "Medium - 8 to 12 weeks",
    timeline: "12",
    timelineUnit: "Weeks",
    risk: "Data Quality",
    notes:
      "SAP integration and change management are primary risks. Phased rollout recommended.",
  })
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        const p = await w.loadProcess()
        const list = p.steps_data?.step6?.archetypes
        const t = p.steps_data?.step6?.technology_stack
        const c = p.steps_data?.step6?.complexity
        if (t) setTech({ ...DEFAULT_TECH, ...t })
        if (c) {
          setComplexity((x) => ({
            ...x,
            ...c,
            overall: String(c.overall || x.overall).replace(/—/g, "-"),
            timelineUnit:
              c.timelineUnit === "weeks"
                ? "Weeks"
                : c.timelineUnit === "months"
                  ? "Months"
                  : c.timelineUnit || x.timelineUnit,
          }))
        }
        if (list?.length) {
          setArchetypes(list)
          const sel = new Set<number>()
          list.forEach((a: Archetype, i: number) => {
            if (a.is_selected) sel.add(i)
          })
          setSelected(sel.size ? sel : new Set(list.map((_: Archetype, i: number) => i)))
        } else {
          generateArchetypes()
        }
        const techEmpty =
          !t || !Object.values({ ...DEFAULT_TECH, ...t }).some((v) => String(v).trim())
        if (techEmpty) {
          const tr = await processAPI.generateTechStack(w.processId)
          setTech({ ...DEFAULT_TECH, ...(tr.data.technology_stack || {}) })
        }
      } catch {
        generateArchetypes()
      }
    }
    run()
  }, [w.processId])

  const generateArchetypes = async () => {
    setGenerating(true)
    w.setError("")
    try {
      const res = await processAPI.generateArchetypes(w.processId)
      const list = res.data.archetypes || []
      setArchetypes(list)
      setSelected(new Set(list.map((_: Archetype, i: number) => i)))
    } catch {
      w.setError("AI generation failed.")
    }
    setGenerating(false)
  }

  const toggleSelect = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setSelected(next.size ? next : new Set([i]))
  }

  const addArchetype = () => {
    const next = [
      ...archetypes,
      {
        archetype_name: "New AI Archetype",
        fit_score: 70,
        description: "",
        recommended_tools: [] as string[],
        implementation_complexity: "Medium" as const,
        is_selected: true,
      },
    ]
    setArchetypes(next)
    setSelected(new Set([...selected, next.length - 1]))
    setEditingIdx(next.length - 1)
  }

  const updateArchetype = (i: number, patch: Partial<Archetype>) => {
    setArchetypes(archetypes.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))
  }

  const deleteArchetype = (i: number) => {
    if (!confirm("Delete this archetype?")) return
    const next = archetypes.filter((_, idx) => idx !== i)
    setArchetypes(next)
    const sel = new Set<number>()
    selected.forEach((idx) => {
      if (idx < i) sel.add(idx)
      else if (idx > i) sel.add(idx - 1)
    })
    setSelected(sel.size ? sel : next.length ? new Set([0]) : new Set())
    if (editingIdx === i) setEditingIdx(null)
    else if (editingIdx !== null && editingIdx > i) setEditingIdx(editingIdx - 1)
  }

  const persist = async (advance = false) => {
    if (selected.size === 0) throw new Error("Select at least one archetype")
    const updated = archetypes.map((a, i) => ({ ...a, is_selected: selected.has(i) }))
    await processAPI.saveArchetypes(w.processId, {
      archetypes: updated,
      technology_stack: tech,
      complexity,
      ...(advance ? { advance: true } : {}),
    })
  }

  const handleSave = async () => {
    if (selected.size === 0) {
      w.setError("Select at least one archetype")
      return
    }
    w.setSaving(true)
    w.setError("")
    try {
      await persist()
      w.flashSuccess()
    } catch (e: unknown) {
      w.setError(e instanceof Error ? e.message : "Save failed")
    }
    w.setSaving(false)
  }

  const handleNext = async () => {
    w.setLoading(true)
    w.setError("")
    try {
      await persist(true)
      w.goNext(7)
    } catch (e: unknown) {
      w.setApiError(e, "Error")
    }
    w.setLoading(false)
  }

  return (
    <ProcessStepShell
      step={6}
      currency={w.currency}
      error={w.error}
      success={w.success}
      onCancel={w.onCancel}
      onPrevious={() => w.goPrevious(5)}
      onSave={handleSave}
      onNext={handleNext}
      loading={w.loading}
      saving={w.saving}
      nextDisabled={selected.size === 0}
    >
      <StepSectionHeader
        title="AI Archetypes"
        subtitle="Select AI patterns for this process. Use edit or delete to refine. Multiple selections allowed."
        action={
          <div className="flex shrink-0 gap-2">
            <BtnPurple onClick={generateArchetypes} disabled={generating}>
              {generating ? "Generating..." : "✨ Generate with AI"}
            </BtnPurple>
            <BtnPrimary onClick={addArchetype}>+ Add Archetype</BtnPrimary>
          </div>
        }
      />

      <div className="space-y-8">
        {/* Archetype cards */}
        <div>
          {generating && (
            <p className="py-8 text-center text-sm text-blue-600">Generating archetypes with AI...</p>
          )}
          {!generating && archetypes.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
              No archetypes yet. Click Generate with AI or Add Archetype.
            </p>
          )}
          {!generating && archetypes.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {archetypes.map((arch, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelect(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggleSelect(i)
                    }
                  }}
                  className={`relative flex min-h-[220px] cursor-pointer flex-col rounded-xl border-2 p-4 transition-all ${
                    selected.has(i)
                      ? "border-blue-500 bg-blue-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="text-2xl text-blue-500" aria-hidden>
                      ◆
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Edit"
                        className="rounded p-1 text-slate-400 hover:bg-white hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingIdx(editingIdx === i ? null : i)
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="rounded p-1 text-slate-400 hover:bg-white hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteArchetype(i)
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleSelect(i)}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-1 h-4 w-4 rounded border-slate-300"
                      />
                    </div>
                  </div>

                  {editingIdx === i ? (
                    <div
                      className="flex flex-1 flex-col gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FormInput
                        value={arch.archetype_name}
                        onChange={(e) =>
                          updateArchetype(i, { archetype_name: e.target.value })
                        }
                        placeholder="Archetype name"
                      />
                      <FormTextarea
                        rows={4}
                        value={arch.description}
                        onChange={(e) =>
                          updateArchetype(i, { description: e.target.value })
                        }
                        placeholder="Description"
                      />
                      <FormInput
                        type="number"
                        min={0}
                        max={100}
                        value={arch.fit_score}
                        onChange={(e) =>
                          updateArchetype(i, {
                            fit_score: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="Match %"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold leading-snug text-slate-900">
                        {arch.archetype_name}
                      </h3>
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">
                        {arch.description || "No description yet."}
                      </p>
                    </>
                  )}

                  <p className="mt-3 text-xs font-bold text-blue-600">
                    {arch.fit_score}% Match
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technology Stack */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle icon="⚙" title="Technology Stack" />
          <p className="-mt-2 mb-4 text-xs text-slate-500">
            Recommended platforms for selected archetypes. Edit as needed.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TECH_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <FieldLabel>{label}</FieldLabel>
                <FormTextarea
                  rows={3}
                  value={tech[key]}
                  onChange={(e) => setTech({ ...tech, [key]: e.target.value })}
                  placeholder={`Draft: ${label} recommendation`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Implementation Complexity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle icon="⏱" title="Implementation Complexity" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel>Overall Complexity</FieldLabel>
              <FormSelect
                value={complexity.overall}
                onChange={(e) => setComplexity({ ...complexity, overall: e.target.value })}
              >
                <option>Low - 4 to 6 weeks</option>
                <option>Medium - 8 to 12 weeks</option>
                <option>High - 12+ weeks</option>
              </FormSelect>
            </div>
            <div>
              <FieldLabel>Estimated Timeline</FieldLabel>
              <div className="flex overflow-hidden rounded-lg border border-slate-200">
                <FormInput
                  type="number"
                  className="border-0 rounded-none"
                  value={complexity.timeline}
                  onChange={(e) => setComplexity({ ...complexity, timeline: e.target.value })}
                />
                <select
                  className="border-l border-slate-200 bg-slate-50 px-3 text-xs text-slate-600"
                  value={complexity.timelineUnit}
                  onChange={(e) =>
                    setComplexity({ ...complexity, timelineUnit: e.target.value })
                  }
                >
                  <option>Weeks</option>
                  <option>Months</option>
                </select>
              </div>
            </div>
            <div>
              <FieldLabel>Key Risk Factor</FieldLabel>
              <FormSelect
                value={complexity.risk}
                onChange={(e) => setComplexity({ ...complexity, risk: e.target.value })}
              >
                <option>Data Quality</option>
                <option>Integration</option>
                <option>Change Management</option>
                <option>Compliance</option>
              </FormSelect>
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel>Complexity Notes</FieldLabel>
            <FormTextarea
              rows={4}
              value={complexity.notes}
              onChange={(e) => setComplexity({ ...complexity, notes: e.target.value })}
            />
          </div>
        </div>
      </div>
    </ProcessStepShell>
  )
}
