"use client"
import { useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useDropzone } from "react-dropzone"
import StepperBar from "@/components/process/StepperBar"
import { processAPI } from "@/lib/api"

export default function ProcessContext() {
  const router = useRouter()
  const { id } = useParams()
  const [form, setForm] = useState({
    process_name: "",
    process_description: "",
    goals: ["", "", ""],
    existing_systems: "",
    maturity_level: "",
    process_summary: "",
    sop_summary: "",
    volumetrics_summary: "",
    kpi_summary: "",
  })
  const [files, setFiles] = useState<{[key: string]: File | null}>({
    process_flow: null,
    sop: null,
    volumetrics: null,
    kpi: null,
  })
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({})
  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)

  // ── File Upload Handler ───────────────────────────────────────────────────
  const uploadFile = async (file: File, type: string) => {
    setUploading(prev => ({...prev, [type]: true}))
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("doc_type", type)
      const res = await processAPI.uploadContext(id as string, formData)
      // AI Generated summary
      setForm(prev => ({...prev, [`${type}_summary`]: res.data.summary}))
      setFiles(prev => ({...prev, [type]: file}))
    } catch {
      setError(`Failed to upload ${type} file`)
    }
    setUploading(prev => ({...prev, [type]: false}))
  }

  const FileDropZone = ({ type, label }: { type: string, label: string }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles[0]) uploadFile(acceptedFiles[0], type)
    }, [type])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "image/*": [".png", ".jpg", ".jpeg"],
        "text/csv": [".csv"],
      }
    })

    return (
      <div className="space-y-2">
        <label className="text-xs text-slate-500 font-medium block">{label}</label>
        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}>
          <input {...getInputProps()}/>
          {uploading[type] ? (
            <p className="text-blue-500 text-xs">🤖 AI is analyzing file...</p>
          ) : files[type] ? (
            <p className="text-green-600 text-xs">✅ {files[type]?.name}</p>
          ) : (
            <p className="text-slate-400 text-xs">Drop {label} here (PDF, PNG, CSV)</p>
          )}
        </div>
        {/* AI Generated Summary */}
        {form[`${type}_summary` as keyof typeof form] && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium mb-1">🤖 AI Summary</p>
            <p className="text-xs text-slate-600">
              {form[`${type}_summary` as keyof typeof form] as string}
            </p>
          </div>
        )}
      </div>
    )
  }

  const handleNext = async () => {
    if (!form.process_name)        { setError("Process name is required"); return }
    if (!form.process_description) { setError("Process description is required"); return }
    if (!form.maturity_level)      { setError("Maturity level is required"); return }

    setLoading(true)
    setError("")
    try {
      await processAPI.processEntry(id as string, form)
      router.push(`/process/${id}/step/3`)
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <StepperBar current={2}/>
      <div className="bg-white rounded-xl border p-6 mt-4 space-y-6">
        <h2 className="text-lg font-bold">High-Level Process Context</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Process Name */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Process Name *</label>
          <input placeholder="e.g. AP Processing"
            className="w-full border rounded-lg p-2 text-sm"
            onChange={e => setForm({...form, process_name: e.target.value})}/>
        </div>

        {/* Process Description */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Process Description *</label>
          <textarea placeholder="Describe the process in detail..."
            rows={3} className="w-full border rounded-lg p-2 text-sm resize-none"
            onChange={e => setForm({...form, process_description: e.target.value})}/>
        </div>

        {/* Goals */}
        <div>
          <label className="text-xs text-slate-500 mb-2 block">Goals & Objectives (3–5)</label>
          {form.goals.map((goal, i) => (
            <input key={i}
              placeholder={`Goal ${i + 1} — e.g. Automate invoice approvals`}
              className="w-full border rounded-lg p-2 text-sm mb-2"
              value={goal}
              onChange={e => {
                const updated = [...form.goals]
                updated[i] = e.target.value
                setForm({...form, goals: updated})
              }}/>
          ))}
          <button onClick={() => setForm({...form, goals: [...form.goals, ""]})}
            className="text-blue-600 text-xs hover:underline">
            + Add Goal
          </button>
        </div>

        {/* Existing Systems */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Existing Systems / Tools</label>
          <input placeholder="e.g. SAP, Excel, Outlook"
            className="w-full border rounded-lg p-2 text-sm"
            onChange={e => setForm({...form, existing_systems: e.target.value})}/>
        </div>

        {/* Maturity Level */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Maturity Level *</label>
          <select className="w-full border rounded-lg p-2 text-sm"
            onChange={e => setForm({...form, maturity_level: e.target.value})}>
            <option value="">Select Maturity Level</option>
            {["Ad-hoc","Defined","Automated","Optimized"]
              .map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* File Uploads */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-slate-700 mb-4">
            📎 Upload Documents (Optional — AI will generate summaries)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FileDropZone type="process_flow" label="Process Flow Docs"/>
            <FileDropZone type="sop"          label="SOP Docs"/>
            <FileDropZone type="volumetrics"  label="Volumetrics Docs"/>
            <FileDropZone type="kpi"          label="KPI Docs"/>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button onClick={() => router.back()}
            className="border px-6 py-2 rounded-lg text-sm hover:bg-slate-50">
            ← Back
          </button>
          <button onClick={handleNext} disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Next →"}
          </button>
        </div>
      </div>
    </div>
  )
}