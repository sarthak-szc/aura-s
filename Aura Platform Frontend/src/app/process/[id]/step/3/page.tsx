"use client"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import StepperBar from "@/components/process/StepperBar"
import { processAPI } from "@/lib/api"

export default function ProcessVolumetrics() {
  const router = useRouter()
  const { id } = useParams()
  const [form, setForm] = useState({
    // Pain Points
    key_challenges: ["", "", ""],
    key_improvement_areas: "",
    // Volumetrics — Cost
    monthly_transaction_volume: 0,
    fte_count: 0,
    avg_time_per_transaction_mins: 0,
    // Revenue
    avg_revenue_per_transaction: 0,
    revenue_leakage: 0,
    delay_impact_on_revenue_pct: 0,
    // Risk
    risk_prone_transactions_count: 0,
    avg_financial_risk_per_txn: 0,
    sla_breach_rate_pct: 0,
    // Success Metrics
    success_metrics: [
      { kpi: "Cycle Time", current: "", target: "" },
      { kpi: "Accuracy %", current: "", target: "" },
      { kpi: "Errors/month", current: "", target: "" },
    ]
  })
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)

  // Annual Cost Estimate
  const annualCost = (
    form.fte_count * 600000 * (form.avg_time_per_transaction_mins / 480)
  ).toFixed(0)

  const handleNext = async () => {
      if (form.fte_count <= 0) { setError("FTE count must be greater than 0"); return }
      if (form.sla_breach_rate_pct < 0 || form.sla_breach_rate_pct > 100) {
        setError("SLA breach rate must be between 0–100"); return
      }

      setLoading(true)
      setError("")
      try {
        await processAPI.processDetails(id as string, {
          ...form,
          annual_cost_estimate: Number(annualCost)
        })
        router.push(`/process/${id}/step/4`)
      } catch (e: any) {
        const detail = e.response?.data?.detail
        if (Array.isArray(detail)) {
          setError(detail[0]?.msg || "Validation error")
        } else {
          setError(detail || "Something went wrong")
        }
      }
      setLoading(false)
    }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <StepperBar current={3}/>
      <div className="bg-white rounded-xl border p-6 mt-4 space-y-6">
        <h2 className="text-lg font-bold">Process Volumetrics & Pain Points</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Key Challenges */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            🔴 Key Challenges *
          </label>
          {form.key_challenges.map((c, i) => (
            <input key={i} value={c}
              placeholder={`Challenge ${i + 1} — e.g. High volume, poor PO matching`}
              className="w-full border rounded-lg p-2 text-sm mb-2"
              onChange={e => {
                const updated = [...form.key_challenges]
                updated[i] = e.target.value
                setForm({...form, key_challenges: updated})
              }}/>
          ))}
          <button onClick={() => setForm({...form, key_challenges: [...form.key_challenges, ""]})}
            className="text-blue-600 text-xs hover:underline">
            + Add Challenge
          </button>
        </div>

        {/* Cost Metrics */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            💰 Cost Metrics
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Monthly Transaction Volume</label>
              <input type="number" min={0} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, monthly_transaction_volume: Number(e.target.value)})}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">FTE Count *</label>
              <input type="number" min={0} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, fte_count: Number(e.target.value)})}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Avg Time per Transaction (mins)</label>
              <input type="number" min={0} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, avg_time_per_transaction_mins: Number(e.target.value)})}/>
            </div>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            📈 Revenue Metrics
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Avg Revenue per Transaction *</label>
              <input type="number" min={0} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, avg_revenue_per_transaction: Number(e.target.value)})}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Revenue Leakage (Annual)</label>
              <input type="number" min={0} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, revenue_leakage: Number(e.target.value)})}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Delay Impact on Revenue (%)</label>
              <input type="number" min={0} max={100} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, delay_impact_on_revenue_pct: Number(e.target.value)})}/>
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            ⚠️ Risk Metrics
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Risk-prone Transactions/month</label>
              <input type="number" min={0} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, risk_prone_transactions_count: Number(e.target.value)})}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Avg Financial Risk per Txn (₹)</label>
              <input type="number" min={0} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, avg_financial_risk_per_txn: Number(e.target.value)})}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">SLA Breach Rate (%) *</label>
              <input type="number" min={0} max={100} placeholder="0"
                className="w-full border rounded-lg p-2 text-sm"
                onChange={e => setForm({...form, sla_breach_rate_pct: Number(e.target.value)})}/>
            </div>
          </div>
        </div>

        {/* Success Metrics Table */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            🎯 Success Metrics
          </label>
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-slate-50 border-b">
              <tr>
                {["KPI","Current Value","Target Value"]
                  .map(h => <th key={h} className="text-left px-3 py-2 text-xs font-medium text-slate-500">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {form.success_metrics.map((m, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-2">
                    <input value={m.kpi}
                      className="w-full border rounded p-1 text-sm"
                      onChange={e => {
                        const updated = [...form.success_metrics]
                        updated[i] = {...updated[i], kpi: e.target.value}
                        setForm({...form, success_metrics: updated})
                      }}/>
                  </td>
                  <td className="px-2 py-2">
                    <input value={m.current} placeholder="e.g. 5 days"
                      className="w-full border rounded p-1 text-sm"
                      onChange={e => {
                        const updated = [...form.success_metrics]
                        updated[i] = {...updated[i], current: e.target.value}
                        setForm({...form, success_metrics: updated})
                      }}/>
                  </td>
                  <td className="px-2 py-2">
                    <input value={m.target} placeholder="e.g. 2 days"
                      className="w-full border rounded p-1 text-sm"
                      onChange={e => {
                        const updated = [...form.success_metrics]
                        updated[i] = {...updated[i], target: e.target.value}
                        setForm({...form, success_metrics: updated})
                      }}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setForm({...form, success_metrics: [...form.success_metrics, {kpi:"",current:"",target:""}]})}
            className="text-blue-600 text-xs hover:underline mt-2">
            + Add KPI
          </button>
        </div>

        {/* Key Improvement Areas */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Key Improvement Areas</label>
          <textarea placeholder="e.g. Auto classification, GL code validation..."
            rows={2} className="w-full border rounded-lg p-2 text-sm resize-none"
            onChange={e => setForm({...form, key_improvement_areas: e.target.value})}/>
        </div>

        {/* Annual Cost Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-500 font-medium">Annual Cost Estimate</p>
          <p className="text-2xl font-bold text-blue-700">
            ₹ {Number(annualCost).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Based on FTE count × avg salary ÷ working hours
          </p>
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