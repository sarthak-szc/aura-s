"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import StepperBar from "@/components/process/StepperBar"
import { processAPI } from "@/lib/api"

interface GSDAItem {
  goal: string
  signal: string
  decision: string
  action: string
  time_estimate: string
  system_involved: string
  data_type: string
  complexity: "Low" | "Medium" | "High"
  frequency: string
  ai_scope: string
}

export default function GSDAEvaluation() {
  const router = useRouter()
  const { id } = useParams()
  const [items, setItems]         = useState<GSDAItem[]>([])
  const [scores, setScores]       = useState<Record<string, unknown>>({})
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState("")

  useEffect(() => { generateGSDA() }, [])

  const generateGSDA = async () => {
    setGenerating(true)
    setError("")
    try {
      const res = await processAPI.generateGSDA(id as string)
      setItems(res.data.gsda_items)
      if (res.data.scores) setScores(res.data.scores)
    } catch {
      setError("GSDA generation failed. Please try again.")
    }
    setGenerating(false)
    setLoading(false)
  }

  const updateItem = (i: number, field: keyof GSDAItem, value: string) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const handleNext = async () => {
    if (items.length === 0) { setError("At least one GSDA item required"); return }
    setSaving(true)
    setError("")
    try {
      await processAPI.saveGSDA(id as string, { gsda_items: items, scores })
      router.push(`/process/${id}/step/6`)
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong")
    }
    setSaving(false)
  }

  const complexityColor = {
    Low:    "bg-green-100 text-green-700",
    Medium: "bg-orange-100 text-orange-700",
    High:   "bg-red-100 text-red-700",
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <StepperBar current={5}/>
      <div className="bg-white rounded-xl border p-6 mt-4 space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">GSDA Evaluation</h2>
            <p className="text-xs text-slate-400 mt-1">
              Goals · Signals · Decisions · Actions — System Generated, Editable
            </p>
          </div>
          <button onClick={generateGSDA} disabled={generating}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
            {generating ? "🤖 Generating..." : "✨ Regenerate"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {generating && (
          <div className="text-center py-12">
            <p className="text-purple-600 font-medium">🤖 AI is generating GSDA evaluation...</p>
            <p className="text-xs text-slate-400 mt-1">Based on your activity breakdown</p>
          </div>
        )}

        {/* GSDA Items */}
        {!generating && items.map((item, i) => (
          <div key={i} className="border rounded-xl p-5 space-y-4 bg-slate-50">
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-600 text-sm">Activity {i + 1}</span>
              <div className="flex gap-2">
                <select value={item.complexity}
                  className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${complexityColor[item.complexity]}`}
                  onChange={e => updateItem(i, "complexity", e.target.value as any)}>
                  <option value="Low">Low Complexity</option>
                  <option value="Medium">Medium Complexity</option>
                  <option value="High">High Complexity</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Goal */}
              <div className="col-span-2">
                <label className="text-xs font-medium text-blue-600 mb-1 block">🎯 Goal</label>
                <textarea value={item.goal} rows={2}
                  className="w-full border rounded-lg p-2 text-sm bg-white resize-none"
                  onChange={e => updateItem(i, "goal", e.target.value)}/>
              </div>

              {/* Signal */}
              <div>
                <label className="text-xs font-medium text-green-600 mb-1 block">📡 Signal (Input Trigger)</label>
                <textarea value={item.signal} rows={2}
                  className="w-full border rounded-lg p-2 text-sm bg-white resize-none"
                  onChange={e => updateItem(i, "signal", e.target.value)}/>
              </div>

              {/* Decision */}
              <div>
                <label className="text-xs font-medium text-orange-600 mb-1 block">⚖️ Decision Logic</label>
                <textarea value={item.decision} rows={2}
                  className="w-full border rounded-lg p-2 text-sm bg-white resize-none"
                  onChange={e => updateItem(i, "decision", e.target.value)}/>
              </div>

              {/* Action */}
              <div className="col-span-2">
                <label className="text-xs font-medium text-purple-600 mb-1 block">⚡ Action</label>
                <textarea value={item.action} rows={2}
                  className="w-full border rounded-lg p-2 text-sm bg-white resize-none"
                  onChange={e => updateItem(i, "action", e.target.value)}/>
              </div>

              {/* Meta fields */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">System Involved</label>
                <input value={item.system_involved}
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                  onChange={e => updateItem(i, "system_involved", e.target.value)}/>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">AI Scope</label>
                <input value={item.ai_scope}
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                  onChange={e => updateItem(i, "ai_scope", e.target.value)}/>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Data Type</label>
                <select value={item.data_type}
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                  onChange={e => updateItem(i, "data_type", e.target.value)}>
                  <option value="Structured">Structured</option>
                  <option value="Unstructured">Unstructured</option>
                  <option value="Semi-Structured">Semi-Structured</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Frequency</label>
                <select value={item.frequency}
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                  onChange={e => updateItem(i, "frequency", e.target.value)}>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Time Estimate</label>
                <input value={item.time_estimate}
                  placeholder="e.g. 15 mins"
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                  onChange={e => updateItem(i, "time_estimate", e.target.value)}/>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-2">
          <button onClick={() => router.back()}
            className="border px-6 py-2 rounded-lg text-sm hover:bg-slate-50">
            ← Back
          </button>
          <button onClick={handleNext} disabled={saving || items.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40">
            {saving ? "Saving..." : "Next →"}
          </button>
        </div>
      </div>
    </div>
  )
}