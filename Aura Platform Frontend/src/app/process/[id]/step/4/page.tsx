"use client"
import { useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useDropzone } from "react-dropzone"
import StepperBar from "@/components/process/StepperBar"
import { processAPI } from "@/lib/api"

interface Activity {
  activity_name: string
  data_needed: string
  data_readiness: "Available" | "Partial" | "Missing"
  ai_automation_potential: "Low" | "Medium" | "High"
  integration_readiness: string
  frequency: "Daily" | "Weekly" | "Monthly"
}

export default function ActivityBreakdown() {
  const router = useRouter()
  const { id } = useParams()
  const [status, setStatus]         = useState<"idle"|"uploading"|"processing"|"done">("idle")
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError]           = useState("")
  const [loading, setLoading]       = useState(false)

  // ── File Upload ────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return
    setStatus("uploading")
    setError("")
    const form = new FormData()
    form.append("file", files[0])
    try {
      await processAPI.uploadActivityFile(id as string, form)
      setStatus("processing")
      const poll = setInterval(async () => {
        try {
          const res = await processAPI.activityStatus(id as string)
          if (res.data.status === "done") {
            clearInterval(poll)
            setActivities(res.data.activities)
            setStatus("done")
          } else if (res.data.status === "failed") {
            clearInterval(poll)
            setError("AI extraction failed. Please try again.")
            setStatus("idle")
          }
        } catch { clearInterval(poll) }
      }, 3000)
    } catch {
      setError("File upload failed.")
      setStatus("idle")
    }
  }, [id])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
    }
  })

  // ── Table Edit ─────────────────────────────────────────────────────────────
  const updateRow = (i: number, field: keyof Activity, value: string) => {
    const updated = [...activities]
    updated[i] = { ...updated[i], [field]: value }
    setActivities(updated)
  }

  const addRow = () => {
    setActivities([...activities, {
      activity_name: "",
      data_needed: "",
      data_readiness: "Available",
      ai_automation_potential: "Medium",
      integration_readiness: "",
      frequency: "Daily"
    }])
  }

  const deleteRow = (i: number) => {
    setActivities(activities.filter((_, idx) => idx !== i))
  }

  const handleAIGenerate = async () => {
    setStatus("processing")
    setError("")
    try {
      const res = await processAPI.generateActivities(id as string)
      setActivities(res.data.activities)
      setStatus("done")
    } catch {
      setError("AI generation failed.")
      setStatus("idle")
    }
  }

  const handleNext = async () => {
    if (activities.length === 0) { setError("At least one activity is required"); return }
    const invalid = activities.find(a => !a.activity_name.trim())
    if (invalid) { setError("All activities must have a name"); return }

    setLoading(true)
    setError("")
    try {
      await processAPI.activityBreakdown(id as string, { activities })
      router.push(`/process/${id}/step/5`)
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong")
    }
    setLoading(false)
  }

  const potentialColor = {
    Low:    "bg-red-100 text-red-700",
    Medium: "bg-orange-100 text-orange-700",
    High:   "bg-green-100 text-green-700",
  }

  const readinessColor = {
    Available: "bg-green-100 text-green-700",
    Partial:   "bg-orange-100 text-orange-700",
    Missing:   "bg-red-100 text-red-700",
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <StepperBar current={4}/>
      <div className="bg-white rounded-xl border p-6 mt-4 space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Activity Breakdown — L3 Level</h2>
            <p className="text-xs text-slate-400 mt-1">
              AI generates activities based on your process details. Edit as needed.
            </p>
          </div>
          <button onClick={handleAIGenerate} disabled={status === "processing"}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {status === "processing" ? "🤖 Generating..." : "✨ AI Generate"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Upload Zone */}
        {status === "idle" && (
          <div {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400"}`}>
            <input {...getInputProps()}/>
            <p className="text-slate-400 text-sm">📂 Upload process document (PDF, CSV, Excel)</p>
            <p className="text-xs text-slate-300 mt-1">or click "✨ AI Generate" to auto-generate</p>
          </div>
        )}

        {status === "uploading" && (
          <div className="border-2 border-dashed rounded-xl p-10 text-center border-blue-300 bg-blue-50">
            <p className="text-blue-600 font-medium">⬆️ Uploading file...</p>
          </div>
        )}

        {status === "processing" && (
          <div className="border-2 border-dashed rounded-xl p-10 text-center border-orange-300 bg-orange-50">
            <p className="text-orange-500 font-medium">🤖 AI is extracting activities...</p>
            <p className="text-xs text-slate-400 mt-1">This may take 15–30 seconds</p>
          </div>
        )}

        {/* Activity Table */}
        {(status === "done" || activities.length > 0) && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-600">
              🤖 Activities are AI-generated. Edit, add, or delete rows as needed.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {["Activity Name","Data Needed","Data Readiness",
                      "AI Automation Potential","Integration Readiness","Frequency",""]
                      .map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act, i) => (
                    <tr key={i} className="border-b hover:bg-slate-50">
                      <td className="px-2 py-2 min-w-[150px]">
                        <input value={act.activity_name}
                          className="w-full border rounded p-1 text-sm"
                          onChange={e => updateRow(i, "activity_name", e.target.value)}/>
                      </td>
                      <td className="px-2 py-2 min-w-[180px]">
                        <textarea value={act.data_needed} rows={2}
                          className="w-full border rounded p-1 text-sm resize-none"
                          onChange={e => updateRow(i, "data_needed", e.target.value)}/>
                      </td>
                      <td className="px-2 py-2">
                        <select value={act.data_readiness}
                          className={`w-full border-0 rounded-full px-2 py-1 text-xs font-medium ${readinessColor[act.data_readiness]}`}
                          onChange={e => updateRow(i, "data_readiness", e.target.value as any)}>
                          <option value="Available">Available</option>
                          <option value="Partial">Partial</option>
                          <option value="Missing">Missing</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select value={act.ai_automation_potential}
                          className={`w-full border-0 rounded-full px-2 py-1 text-xs font-medium ${potentialColor[act.ai_automation_potential]}`}
                          onChange={e => updateRow(i, "ai_automation_potential", e.target.value as any)}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 min-w-[150px]">
                        <input value={act.integration_readiness}
                          placeholder="e.g. SAP BAPI"
                          className="w-full border rounded p-1 text-sm"
                          onChange={e => updateRow(i, "integration_readiness", e.target.value)}/>
                      </td>
                      <td className="px-2 py-2">
                        <select value={act.frequency}
                          className="w-full border rounded p-1 text-sm"
                          onChange={e => updateRow(i, "frequency", e.target.value as any)}>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => deleteRow(i)}
                          className="text-red-400 hover:text-red-600 text-lg">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addRow}
              className="border border-dashed border-slate-300 w-full py-2 rounded-lg text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500">
              + Add Row
            </button>
          </>
        )}

        <div className="flex justify-between pt-2">
          <button onClick={() => router.back()}
            className="border px-6 py-2 rounded-lg text-sm hover:bg-slate-50">
            ← Back
          </button>
          <button onClick={handleNext} disabled={loading || activities.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40">
            {loading ? "Saving..." : "Next →"}
          </button>
        </div>
      </div>
    </div>
  )
}