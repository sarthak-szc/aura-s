"use client"
import { useEffect, useState } from "react"
import { reportAPI, clientAPI } from "@/lib/api"
import { Download } from "lucide-react"

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([reportAPI.list(), clientAPI.getAll()])
      .then(([rRes, cRes]) => {
        setReports(rRes.data.reports)
        setClients(cRes.data.clients)
      })
      .finally(() => setLoading(false))
  }, [])

  const clientName = (id: string) =>
    clients.find((c) => c._id === id)?.name || "—"

  const downloadPdf = async (processId: string, name: string) => {
    const res = await reportAPI.downloadPdf(processId)
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement("a")
    a.href = url
    a.download = `AuRA_Report_${name.replace(/\s+/g, "_")}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Completed assessments — download PDF reports
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
        <div className="mb-4 px-1">
          <span className="font-medium text-slate-800">
            Completed Reports ({reports.length})
          </span>
        </div>

        <div className="mb-2 hidden lg:grid lg:grid-cols-[1.1fr_1.3fr_1fr_1fr_0.6fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Client</span>
          <span>Process</span>
          <span>Assessment Date</span>
          <span>Completed</span>
          <span>Actions</span>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-400">
            No completed reports yet. Finish a process discovery to see reports here.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.process_id}
                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 border-t-4 border-t-emerald-500 bg-white p-4 shadow-sm transition-shadow hover:shadow-md lg:grid-cols-[1.1fr_1.3fr_1fr_1fr_0.6fr] lg:items-center"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                    Client
                  </p>
                  <span className="font-medium text-slate-900">{clientName(r.client_id)}</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                    Process
                  </p>
                  <span className="text-slate-800">{r.process_name}</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                    Assessment Date
                  </p>
                  <span className="text-slate-600">
                    {r.assessment_date
                      ? new Date(r.assessment_date).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                    Completed
                  </p>
                  <span className="text-slate-600">
                    {r.completed_at
                      ? new Date(r.completed_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                    Actions
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadPdf(r.process_id, r.process_name)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    <Download size={14} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
