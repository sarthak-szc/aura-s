"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import StepperBar from "@/components/process/StepperBar"
import { processAPI } from "@/lib/api"

interface Archetype {
  archetype_name: string
  fit_score: number
  description: string
  recommended_tools: string[]
  implementation_complexity: "Low" | "Medium" | "High"
  is_selected: boolean
}

export default function AIArchetypes() {
  const router = useRouter()
  const { id } = useParams()
  const [archetypes, setArchetypes]   = useState<Archetype[]>([])
  const [loading, setLoading]         = useState(false)
  const [generating, setGenerating]   = useState(false)
  const [error, setError]             = useState("")
  const [selected, setSelected]       = useState<number | null>(null)

  const complexityColor = {
    Low:    "bg-green-100 text-green-700",
    Medium: "bg-orange-100 text-orange-700",
    High:   "bg-red-100 text-red-700",
  }

  const generateArchetypes = async () => {
    setGenerating(true)
    setError("")
    try {
      const res = await processAPI.generateArchetypes(id as string)
      setArchetypes(res.data.archetypes)
    } catch {
      setError("AI generation failed. Please try again.")
    }
    setGenerating(false)
  }

  useEffect(() => {
    // Auto-generate on page load
    generateArchetypes()
  }, [])

  const handleNext = async () => {
    if (selected === null) { setError("Please select an archetype"); return }
    setLoading(true)
    setError("")
    try {
      const updated = archetypes.map((a, i) => ({...a, is_selected: i === selected}))
      await processAPI.saveArchetypes(id as string, { archetypes: updated })
      router.push(`/process/${id}/step/7`)
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <StepperBar current={6}/>
      <div className="bg-white rounded-xl border p-6 mt-4 space-y-6">

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">AI Archetypes</h2>
          <button onClick={generateArchetypes} disabled={generating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
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
            <p className="text-blue-600 font-medium">🤖 AI is generating archetypes...</p>
            <p className="text-xs text-slate-400 mt-1">This may take 20–30 seconds</p>
          </div>
        )}

        {/* Archetype Cards */}
        {!generating && archetypes.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {archetypes.map((arch, i) => (
              <div key={i}
                onClick={() => setSelected(i)}
                className={`border-2 rounded-xl p-5 cursor-pointer transition-all space-y-3
                  ${selected === i
                    ? "border-blue-600 bg-blue-50 shadow-md"
                    : "border-slate-200 hover:border-blue-300"}`}>

                {/* Fit Score */}
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full
                    ${selected === i ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {arch.fit_score}% Fit
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                    ${complexityColor[arch.implementation_complexity]}`}>
                    {arch.implementation_complexity} Complexity
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-bold text-base">{arch.archetype_name}</h3>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed">{arch.description}</p>

                {/* Tools */}
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Recommended Tools</p>
                  <div className="flex flex-wrap gap-1">
                    {arch.recommended_tools.map((tool, j) => (
                      <span key={j}
                        className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {selected === i && (
                  <div className="text-center text-blue-600 text-xs font-bold">
                    ✅ Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!generating && archetypes.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>Click "✨ Regenerate" to generate AI archetypes</p>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button onClick={() => router.back()}
            className="border px-6 py-2 rounded-lg text-sm hover:bg-slate-50">
            ← Back
          </button>
          <button onClick={handleNext} disabled={loading || selected === null}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40">
            {loading ? "Saving..." : "Next →"}
          </button>
        </div>
      </div>
    </div>
  )
}