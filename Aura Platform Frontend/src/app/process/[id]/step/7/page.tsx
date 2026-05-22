"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import StepperBar from "@/components/process/StepperBar"
import { processAPI, reportAPI } from "@/lib/api"

export default function EvaluationSummary() {
  const router = useRouter()
  const { id } = useParams()
  const [process, setProcess]       = useState<any>(null)
  const [summary, setSummary]       = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError]           = useState("")

  useEffect(() => { fetchProcess() }, [])

  const fetchProcess = async () => {
    try {
      const res = await processAPI.getOne(id as string)
      setProcess(res.data)
      if (res.data.steps_data?.step7) {
        setSummary(res.data.steps_data.step7)
      } else {
        generateSummary()
      }
    } catch {
      setError("Failed to load process data")
    }
    setLoading(false)
  }

  const generateSummary = async () => {
    setGenerating(true)
    try {
      const res = await processAPI.generateSummary(id as string)
      setSummary(res.data)
    } catch {
      setError("Summary generation failed. Please try again.")
    }
    setGenerating(false)
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await processAPI.complete(id as string)
      router.push("/dashboard")
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong")
    }
    setCompleting(false)
  }

  const selectedArchetype = process?.steps_data?.step6?.archetypes
    ?.find((a: any) => a.is_selected)

  const gsda = process?.steps_data?.step5
  const overall = gsda
    ? ((gsda.standardization + gsda.digitization +
        gsda.data_availability + gsda.automation_feasibility) / 4).toFixed(1)
    : "—"

  const gaugeColor = Number(overall) >= 3.5
    ? "bg-green-100 text-green-700 border-green-200"
    : Number(overall) >= 2
    ? "bg-orange-100 text-orange-700 border-orange-200"
    : "bg-red-100 text-red-700 border-red-200"

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <StepperBar current={7}/>
      <div className="space-y-6 mt-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Evaluation Summary</h2>
              <p className="text-slate-500 text-sm mt-1">
                {process?.steps_data?.step2?.process_name || "Process"} —{" "}
                {process?.steps_data?.step2?.department || ""}
              </p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
              ✅ Complete
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Activities</p>
            <p className="text-2xl font-bold text-blue-600">
              {process?.steps_data?.step4?.activities?.length || 0}
            </p>
          </div>
          <div className={`rounded-xl border p-4 text-center ${gaugeColor}`}>
            <p className="text-xs mb-1 opacity-70">GSDA Score</p>
            <p className="text-2xl font-bold">{overall}/5</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Monthly Volume</p>
            <p className="text-2xl font-bold text-slate-700">
              {process?.steps_data?.step3?.monthly_transaction_volume?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Annual Cost Est.</p>
            <p className="text-lg font-bold text-slate-700">
              ₹{Number(process?.steps_data?.step3?.annual_cost_estimate || 0)
                .toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Recommended Archetype */}
        {selectedArchetype && (
          <div className="bg-white rounded-xl border p-6">
            <p className="text-xs text-slate-400 mb-2 uppercase font-medium">
              Recommended Archetype
            </p>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{selectedArchetype.archetype_name}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedArchetype.description}</p>
                <div className="flex gap-2 mt-2">
                  {selectedArchetype.recommended_tools?.map((t: string, i: number) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center ml-6">
                <p className="text-3xl font-bold text-blue-600">{selectedArchetype.fit_score}%</p>
                <p className="text-xs text-slate-400">Fit Score</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Summary */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Executive Summary</h3>
            <button onClick={generateSummary} disabled={generating}
              className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {generating ? "Generating..." : "✨ Regenerate"}
            </button>
          </div>

          {generating ? (
            <div className="text-center py-8">
              <p className="text-purple-600">🤖 AI is generating summary...</p>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">{summary.summary}</p>
              {summary.next_steps && (
                <div>
                  <p className="font-medium text-sm mb-2">Next Steps:</p>
                  <ul className="space-y-1">
                    {summary.next_steps.map((step: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <span className="text-blue-600 font-bold">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.roi_estimate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium">ROI Estimate</p>
                  <p className="text-sm font-bold text-green-700">{summary.roi_estimate}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-4">
              Click "✨ Regenerate" to generate summary
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button onClick={() => router.back()}
            className="border px-6 py-2 rounded-lg text-sm hover:bg-slate-50">
            ← Back
          </button>

          <button
            onClick={async () => {
              const res = await reportAPI.downloadPdf(id as string)
              const url = window.URL.createObjectURL(new Blob([res.data]))
              const a = document.createElement("a")
              a.href = url
              a.download = `AuRA_Report_${id}.pdf`
              a.click()
              window.URL.revokeObjectURL(url)
            }}
            className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg text-sm hover:bg-blue-50">
            Export PDF
          </button>

          <button onClick={handleComplete} disabled={completing}
            className="bg-green-600 text-white px-8 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
            {completing ? "Completing..." : "✅ Mark as Complete"}
          </button>
        </div>
      </div>
    </div>
  )
}