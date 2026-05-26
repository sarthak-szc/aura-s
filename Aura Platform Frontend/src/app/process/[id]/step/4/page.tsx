"use client"

import { useState, useEffect } from "react"
import ProcessStepShell from "@/components/process/ProcessStepShell"
import {
  StepSectionHeader,
  BtnAIGenerate,
  InfoBanner,
  FormInput,
  FormTextarea,
  FormSelect,
} from "@/components/process/processFormUi"
import { processAPI } from "@/lib/api"
import { useProcessWizard } from "@/hooks/useProcessWizard"

interface Activity {
  activity_name: string
  description: string
  data_management: string
  source_system: string
  existing_automation_level: string
  data_needed?: string
  data_readiness?: string
  ai_automation_potential?: string
  integration_readiness?: string
  frequency?: string
}

const AUTOMATION_LEVELS = ["Fully Automated", "Semi-Automated", "Manual", "Not Applicable"]

const emptyRow = (): Activity => ({
  activity_name: "",
  description: "",
  data_management: "",
  source_system: "",
  existing_automation_level: "Manual",
})

function normalizeActivity(raw: Record<string, string>): Activity {
  return {
    activity_name: raw.activity_name || "",
    description: raw.description || raw.data_needed || "",
    data_management: raw.data_management || raw.integration_readiness || "",
    source_system: raw.source_system || "",
    existing_automation_level:
      raw.existing_automation_level || raw.ai_automation_potential || "Manual",
  }
}

function toPayload(activities: Activity[]) {
  return activities.map((a) => ({
    activity_name: a.activity_name,
    data_needed: a.description,
    description: a.description,
    data_management: a.data_management,
    source_system: a.source_system,
    existing_automation_level: a.existing_automation_level,
    integration_readiness: a.data_management,
    ai_automation_potential:
      a.existing_automation_level === "Fully Automated"
        ? "High"
        : a.existing_automation_level === "Semi-Automated"
          ? "Medium"
          : "Low",
    data_readiness: "Available",
    frequency: "Daily",
  }))
}

export default function ActivityBreakdown() {
  const w = useProcessWizard()
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle")
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const p = await w.loadProcess()
        const s4 = p.steps_data?.step4
        if (s4?.activities?.length) {
          if (!cancelled) {
            setActivities(s4.activities.map((a: Record<string, string>) => normalizeActivity(a)))
            setStatus("done")
          }
          return
        }
        if (!cancelled) setStatus("processing")
        const res = await processAPI.generateActivities(w.processId)
        if (!cancelled) {
          setActivities(
            (res.data.activities || []).map((a: Record<string, string>) => normalizeActivity(a))
          )
          setStatus("done")
        }
      } catch {
        if (!cancelled) setStatus("idle")
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [w.processId])

  const updateRow = (i: number, field: keyof Activity, value: string) => {
    const updated = [...activities]
    updated[i] = { ...updated[i], [field]: value }
    setActivities(updated)
  }

  const handleAIGenerate = async () => {
    setStatus("processing")
    w.setError("")
    try {
      const res = await processAPI.generateActivities(w.processId)
      setActivities(
        (res.data.activities || []).map((a: Record<string, string>) => normalizeActivity(a))
      )
      setStatus("done")
    } catch {
      w.setError("AI generation failed.")
      setStatus("idle")
    }
  }

  const persist = async () => {
    if (activities.length === 0) throw new Error("At least one activity is required")
    await processAPI.activityBreakdown(w.processId, { activities: toPayload(activities) })
  }

  const handleSave = async () => {
    if (activities.length === 0) {
      w.setError("Add at least one activity before saving")
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
    if (activities.length === 0) {
      w.setError("At least one activity is required")
      return
    }
    w.setLoading(true)
    w.setError("")
    try {
      await persist()
      w.goNext(5)
    } catch (e: unknown) {
      w.setApiError(e, "Error")
    }
    w.setLoading(false)
  }

  return (
    <ProcessStepShell
      step={4}
      currency={w.currency}
      error={w.error}
      success={w.success}
      onCancel={w.onCancel}
      onPrevious={() => w.goPrevious(3)}
      onSave={handleSave}
      onNext={handleNext}
      loading={w.loading}
      saving={w.saving}
      nextDisabled={activities.length === 0}
    >
      <StepSectionHeader
        title="Activity Breakdown — L3 Level"
        subtitle="Generated from process documents. Edit, add, or delete rows."
        action={
          <BtnAIGenerate onClick={handleAIGenerate} disabled={status === "processing"}>
            {status === "processing" ? "🤖 Generating..." : "✨ AI Generate"}
          </BtnAIGenerate>
        }
      />

      <InfoBanner variant="purple">
        Activity breakdown is generated from your process document and description. You can edit,
        add, or delete rows as needed.
      </InfoBanner>

      {status === "processing" && (
        <div className="border-2 border-dashed border-orange-200 rounded-xl p-10 text-center bg-orange-50">
          <p className="text-orange-600 font-medium">🤖 AI is extracting activities...</p>
          <p className="text-xs text-slate-400 mt-1">This may take 15–30 seconds</p>
        </div>
      )}

      {activities.length > 0 && status !== "processing" && (
        <div className="space-y-4">
          <div className="hidden lg:grid lg:grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wide text-white bg-[#1e3a5f] rounded-t-lg px-3 py-2.5">
            <span className="col-span-2">Activity Name</span>
            <span className="col-span-3">Description</span>
            <span className="col-span-2">Data Requirement</span>
            <span className="col-span-2">Source System</span>
            <span className="col-span-2">Current Automation</span>
            <span className="col-span-1" />
          </div>
          {activities.map((act, i) => (
            <div
              key={i}
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start border border-slate-100 rounded-lg p-3 bg-slate-50/50"
            >
              <div className="lg:col-span-2">
                <FormInput
                  placeholder="Activity name"
                  value={act.activity_name}
                  onChange={(e) => updateRow(i, "activity_name", e.target.value)}
                />
              </div>
              <div className="lg:col-span-3">
                <FormTextarea
                  rows={3}
                  placeholder="Description"
                  value={act.description}
                  onChange={(e) => updateRow(i, "description", e.target.value)}
                />
              </div>
              <div className="lg:col-span-2">
                <FormInput
                  placeholder="Data requirement"
                  value={act.data_management}
                  onChange={(e) => updateRow(i, "data_management", e.target.value)}
                />
              </div>
              <div className="lg:col-span-2">
                <FormInput
                  placeholder="Source system"
                  value={act.source_system}
                  onChange={(e) => updateRow(i, "source_system", e.target.value)}
                />
              </div>
              <div className="lg:col-span-2 flex gap-1">
                <FormSelect
                  value={act.existing_automation_level}
                  onChange={(e) => updateRow(i, "existing_automation_level", e.target.value)}
                >
                  {AUTOMATION_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </FormSelect>
                <button
                  type="button"
                  className="text-red-400 px-1 shrink-0"
                  onClick={() => setActivities(activities.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setActivities([...activities, emptyRow()])}
            className="text-[#1570ef] text-xs font-semibold hover:underline"
          >
            + ADD ACTIVITY ROW
          </button>
        </div>
      )}

      {activities.length === 0 && status !== "processing" && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
          Click <strong>✨ AI Generate</strong> to build the activity breakdown from your process data.
        </div>
      )}
    </ProcessStepShell>
  )
}
