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
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-slate-500 text-sm mt-1 mb-6">
        Completed assessments — download PDF reports
      </p>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {["Client", "Process", "Assessment Date", "Completed", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">
                  No completed reports yet. Finish a process discovery to see reports here.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.process_id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{clientName(r.client_id)}</td>
                  <td className="px-4 py-3">{r.process_name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.assessment_date
                      ? new Date(r.assessment_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.completed_at
                      ? new Date(r.completed_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => downloadPdf(r.process_id, r.process_name)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      <Download size={14} /> PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
