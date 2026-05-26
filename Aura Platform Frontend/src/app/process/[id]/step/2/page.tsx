"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import ProcessStepShell from "@/components/process/ProcessStepShell"
import {
  FieldLabel,
  StepSectionHeader,
  BtnAIGenerate,
  FormInput,
  FormSelect,
  FormTextarea,
  GoalList,
  TagInput,
  InfoBanner,
} from "@/components/process/processFormUi"
import { clientAPI, processAPI } from "@/lib/api"
import { useProcessWizard } from "@/hooks/useProcessWizard"

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Ad-hoc"]
const DATA_QUALITY = ["Accurate", "Mostly Accurate", "Partial", "Poor"]

const defaultForm = () => ({
  process_name: "",
  process_description: "",
  process_frequency: "",
  quality_of_data: "",
  goals: [""],
  existing_systems: "",
  process_summary: "",
})

type UploadedFile = { name: string; size: string }
type Step1Context = { customer_name: string; industry: string; currency: string }

export default function ProcessContext() {
  const w = useProcessWizard()
  const [form, setForm] = useState(defaultForm())
  const [systemTags, setSystemTags] = useState<string[]>([])
  const [uploaded, setUploaded] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiFilled, setAiFilled] = useState(false)
  const [hasUploads, setHasUploads] = useState(false)
  const [ctx, setCtx] = useState<Step1Context>({ customer_name: "", industry: "", currency: "INR" })

  useEffect(() => {
    w.loadProcess()
      .then(async (p) => {
        const s1 = p.steps_data?.step1 || {}
        const s2 = p.steps_data?.step2
        let customerName = ""
        if (s1.client_id) {
          try {
            const cRes = await clientAPI.getAll()
            const c = (cRes.data.clients || []).find((x: { _id: string }) => x._id === s1.client_id)
            customerName = c?.name || ""
          } catch {
            /* ignore */
          }
        }
        setCtx({
          customer_name: customerName,
          industry: s1.industry || "",
          currency: p.currency || s1.currency || "INR",
        })
        if (s2) {
          setForm({
            process_name: s2.process_name || "",
            process_description: s2.process_description || "",
            process_frequency: s2.process_frequency || "",
            quality_of_data: s2.quality_of_data || s2.maturity_level || "",
            goals: s2.goals?.filter(Boolean)?.length ? s2.goals.filter(Boolean) : [""],
            existing_systems: s2.existing_systems || "",
            process_summary: s2.process_summary || "",
          })
          if (s2.existing_systems) {
            setSystemTags(
              s2.existing_systems.split(",").map((s: string) => s.trim()).filter(Boolean)
            )
          }
          setAiFilled(!!s2.ai_generated)
          setHasUploads(!!s2.has_uploads || !!(s2.uploaded_files?.length))
          if (s2.uploaded_files?.length) {
            setUploaded(
              s2.uploaded_files.map((f: { file_name: string }) => ({
                name: f.file_name,
                size: "—",
              }))
            )
          }
        }
      })
      .catch(() => w.setError("Could not load saved data"))
  }, [w.processId])

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted[0]) return
      setUploading(true)
      w.setError("")
      const file = accepted[0]
      const fd = new FormData()
      fd.append("file", file)
      fd.append("doc_type", "process_flow")
      try {
        await processAPI.uploadContext(w.processId, fd)
        setUploaded((u) => [
          ...u,
          { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` },
        ])
        setHasUploads(true)
      } catch {
        w.setError("File upload failed")
      }
      setUploading(false)
    },
    [w.processId]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const handleAIGenerate = async () => {
    if (!hasUploads && uploaded.length === 0) {
      w.setError("Upload at least one document first")
      return
    }
    setGenerating(true)
    w.setError("")
    try {
      const res = await processAPI.generateProcessEntry(w.processId)
      const s2 = res.data.step2 || {}
      setForm({
        process_name: s2.process_name || "",
        process_description: s2.process_description || "",
        process_frequency: s2.process_frequency || "Daily",
        quality_of_data: s2.quality_of_data || s2.maturity_level || "Mostly Accurate",
        goals: s2.goals?.filter(Boolean)?.length ? s2.goals : [""],
        existing_systems: s2.existing_systems || "",
        process_summary: s2.process_summary || "",
      })
      if (s2.existing_systems) {
        setSystemTags(s2.existing_systems.split(",").map((s: string) => s.trim()).filter(Boolean))
      }
      setAiFilled(true)
      w.flashSuccess()
    } catch {
      w.setError("AI generation failed")
    }
    setGenerating(false)
  }

  const validate = () => {
    if (!form.process_name.trim()) {
      w.setError("Process name is required")
      return false
    }
    if (!form.quality_of_data) {
      w.setError("Quality of data is required")
      return false
    }
    return true
  }

  const buildPayload = () => ({
    ...form,
    goals: form.goals.filter(Boolean),
    existing_systems: systemTags.join(", "),
    maturity_level: form.quality_of_data,
    ai_generated: aiFilled,
    has_uploads: hasUploads,
  })

  const persist = async () => {
    await processAPI.processEntry(w.processId, buildPayload())
  }

  const handleSave = async () => {
    if (!validate()) return
    w.setSaving(true)
    w.setError("")
    try {
      await persist()
      w.flashSuccess()
    } catch (e: unknown) {
      w.setApiError(e, "Save failed")
    }
    w.setSaving(false)
  }

  const handleNext = async () => {
    if (!validate()) return
    w.setLoading(true)
    w.setError("")
    try {
      await persist()
      w.goNext(3)
    } catch (e: unknown) {
      w.setApiError(e, "Something went wrong")
    }
    w.setLoading(false)
  }

  const readOnlyCls = aiFilled ? "bg-slate-50 text-slate-600 cursor-not-allowed" : ""

  return (
    <ProcessStepShell
      step={2}
      currency={w.currency}
      error={w.error}
      success={w.success}
      onCancel={w.onCancel}
      onPrevious={() => w.goPrevious(1)}
      onSave={handleSave}
      onNext={handleNext}
      loading={w.loading}
      saving={w.saving}
    >
      <StepSectionHeader
        title="Process Information"
        subtitle="Upload documents, then AI Generate to fill this page. Only Process Name, Frequency, and Quality of Data remain editable."
        action={
          <BtnAIGenerate
            disabled={uploading || generating || (!hasUploads && uploaded.length === 0)}
            onClick={handleAIGenerate}
          >
            {generating ? "🤖 Generating..." : "✨ AI Generate"}
          </BtnAIGenerate>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
        <div>
          <FieldLabel>Customer (from Step 1)</FieldLabel>
          <FormInput value={ctx.customer_name} readOnly className="bg-white" />
        </div>
        <div>
          <FieldLabel>Industry (from Step 1)</FieldLabel>
          <FormInput value={ctx.industry} readOnly className="bg-white" />
        </div>
        <div>
          <FieldLabel>Currency (from Step 1)</FieldLabel>
          <FormInput value={ctx.currency} readOnly className="bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel required>Process Name</FieldLabel>
          <FormInput
            placeholder="e.g. AP Processing — Invoice to Payment"
            value={form.process_name}
            onChange={(e) => setForm({ ...form, process_name: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Process Frequency</FieldLabel>
          <FormSelect
            value={form.process_frequency}
            onChange={(e) => setForm({ ...form, process_frequency: e.target.value })}
          >
            <option value="">— Select —</option>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </FormSelect>
        </div>
        <div>
          <FieldLabel required>Quality of Data</FieldLabel>
          <FormSelect
            value={form.quality_of_data}
            onChange={(e) => setForm({ ...form, quality_of_data: e.target.value })}
          >
            <option value="">— Select —</option>
            {DATA_QUALITY.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </FormSelect>
        </div>
      </div>

      <div>
        <FieldLabel>Upload Process Documents (any type)</FieldLabel>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300 bg-slate-50/50"}`}
        >
          <input {...getInputProps()} />
          <p className="text-2xl mb-2">📁</p>
          <p className="text-sm text-slate-600 font-medium">Drag files here or browse</p>
          <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, images, CSV, and more</p>
        </div>
        {uploading && (
          <p className="text-xs text-blue-600 mt-2">Uploading and analyzing document...</p>
        )}
        {uploaded.length > 0 && (
          <ul className="mt-3 space-y-2">
            {uploaded.map((f) => (
              <li
                key={f.name}
                className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{f.name}</span>
                <span className="text-green-600 text-xs font-medium">✓ Uploaded</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <FieldLabel>Process Details</FieldLabel>
        <FormTextarea
          rows={5}
          className={readOnlyCls}
          readOnly={aiFilled}
          placeholder="Filled by AI after document upload"
          value={form.process_description}
          onChange={(e) => setForm({ ...form, process_description: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel>Goals / Outcomes</FieldLabel>
        {aiFilled ? (
          <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
            {form.goals.filter(Boolean).map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        ) : (
          <GoalList goals={form.goals} onChange={(goals) => setForm({ ...form, goals })} />
        )}
      </div>

      <div>
        <FieldLabel>Existing Systems / Tools</FieldLabel>
        {aiFilled ? (
          <p className="text-sm text-slate-600">{systemTags.join(", ") || "—"}</p>
        ) : (
          <TagInput tags={systemTags} onChange={setSystemTags} />
        )}
      </div>

      {aiFilled && (
        <InfoBanner variant="purple">
          Page generated from uploaded documents. You may edit Process Name, Frequency, and Quality
          of Data only.
        </InfoBanner>
      )}
    </ProcessStepShell>
  )
}
