"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import StepperBar from "@/components/process/StepperBar"
import { clientAPI, processAPI } from "@/lib/api"

export default function CustomerInfo() {
  const router = useRouter()
  const { id } = useParams()
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({
    client_id: "",
    assessment_date: "",
    currency: "INR"
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    clientAPI.getAll().then(r => setClients(r.data.clients))
  }, [])

  const handleNext = async () => {
    // Frontend validations
    if (!form.client_id) { setError("Please select a client"); return }
    if (!form.assessment_date) { setError("Please select assessment date"); return }

    setLoading(true)
    setError("")
    try {
      const res = await processAPI.customerInfo(form)
      router.push(`/process/${res.data.process_id}/step/2`)
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <StepperBar current={1}/>
      <div className="bg-white rounded-xl border p-6 mt-4 space-y-4">
        <h2 className="text-lg font-bold">Customer Info</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Select Client *</label>
          <select className="w-full border rounded-lg p-2 text-sm"
            onChange={e => setForm({...form, client_id: e.target.value})}>
            <option value="">-- Select Client --</option>
            {clients.map((c: any) =>
              <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Assessment Date *</label>
          <input type="date" className="w-full border rounded-lg p-2 text-sm"
            onChange={e => setForm({...form, assessment_date: e.target.value})}/>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Currency</label>
          <select className="w-full border rounded-lg p-2 text-sm"
            onChange={e => setForm({...form, currency: e.target.value})}>
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
          </select>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleNext} disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Next →"}
          </button>
        </div>
      </div>
    </div>
  )
}