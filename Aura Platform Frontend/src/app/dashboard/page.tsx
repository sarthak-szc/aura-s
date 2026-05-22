"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { clientAPI, processAPI } from "@/lib/api"

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats]       = useState({
    total: 0, completed: 0, in_progress: 0
  })
  const [processes, setProcesses] = useState<any[]>([])
  const [clients, setClients]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [filter, setFilter]       = useState("All")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        processAPI.getAll(),
        clientAPI.getAll()
      ])
      const procs = pRes.data.processes
      setProcesses(procs)
      setClients(cRes.data.clients)
      setStats({
        total:       procs.length,
        completed:   procs.filter((p: any) => p.status === "completed").length,
        in_progress: procs.filter((p: any) => p.status === "in_progress").length,
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const getClientName = (client_id: string) => {
    const c = clients.find(c => c._id === client_id)
    return c ? c.name : "—"
  }

  const filtered = processes
    .filter(p => filter === "All" || p.status === filter.toLowerCase().replace(" ", "_"))
    .filter(p =>
      getClientName(p.client_id).toLowerCase().includes(search.toLowerCase()) ||
      p.steps_data?.step2?.process_name?.toLowerCase().includes(search.toLowerCase())
    )

  const statusBadge = (status: string) => {
    const map: any = {
      completed:   "bg-green-100 text-green-700",
      in_progress: "bg-blue-100 text-blue-700",
      draft:       "bg-slate-100 text-slate-500",
    }
    return map[status] || "bg-slate-100 text-slate-500"
  }

  const statusLabel = (status: string) => ({
    completed:   "✓ Completed",
    in_progress: "● In Progress",
    draft:       "○ Draft",
  }[status] || status)

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500 text-sm">
            Overview of all AI process discovery assessments
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/clients")}
            className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-50">
            + Add Client
          </button>
          <button onClick={() => router.push("/process/new")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            ⚡ Initiate Process Discovery
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-400 uppercase font-medium">Total Assessments</p>
          <p className="text-3xl font-bold mt-1">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">↑ This month</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-400 uppercase font-medium">Completed</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{stats.completed}</p>
          <p className="text-xs text-green-500 mt-1">Ready to download</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-400 uppercase font-medium">In Progress</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">{stats.in_progress}</p>
          <p className="text-xs text-blue-400 mt-1">Active assessments</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs text-slate-400 uppercase font-medium">Total Clients</p>
          <p className="text-3xl font-bold mt-1 text-slate-700">{clients.length}</p>
          <p className="text-xs text-slate-400 mt-1">Registered clients</p>
        </div>
      </div>

      {/* Process List */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold">Process Discoveries</h2>
          <div className="flex gap-3 items-center">
            {/* Search */}
            <input
              placeholder="Search client, process..."
              className="border rounded-lg px-3 py-1.5 text-sm w-56"
              value={search}
              onChange={e => setSearch(e.target.value)}/>
            {/* Filter */}
            <div className="flex gap-1">
              {["All","Draft","In Progress","Completed"].map(f => (
                <button key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium
                    ${filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {["Client Name","Process Name","Currency","Start Date","Status","Completion","Actions"]
                .map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No processes found
                </td>
              </tr>
            ) : (
              filtered.map((p: any) => {
                const completion = Math.round((p.current_step / 7) * 100)
                return (
                  <tr key={p._id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      {getClientName(p.client_id)}
                    </td>
                    <td className="px-4 py-3">
                      {p.steps_data?.step2?.process_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                        ₹ {p.currency || "INR"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.assessment_date
                        ? new Date(p.assessment_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(p.status)}`}>
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${completion}%` }}/>
                        </div>
                        <span className="text-xs text-slate-500">{completion}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/process/${p._id}/step/${p.current_step}`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        {p.status === "completed" ? "View" : "Resume →"}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}