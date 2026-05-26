"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardList,
  CheckCircle2,
  Loader2,
  Building2,
  Search,
  UserPlus,
  Zap,
} from "lucide-react"
import { clientAPI, processAPI } from "@/lib/api"

const currencySymbol = (c: string) =>
  c === "INR" ? "₹" : c === "USD" ? "$" : c === "EUR" ? "€" : ""

const statusLabel = (status: string) =>
  ({ completed: "Completed", in_progress: "In Progress", draft: "Draft" }[status] || status)

const statusBadgeCls = (status: string) => {
  const map: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-blue-100 text-blue-700",
    draft: "bg-slate-100 text-slate-600",
  }
  return map[status] || map.draft
}

const statusTopBorder = (status: string) => {
  const map: Record<string, string> = {
    completed: "border-t-emerald-500",
    in_progress: "border-t-sky-400",
    draft: "border-t-slate-300",
  }
  return map[status] || map.draft
}

const progressBarCls = (status: string) => {
  const map: Record<string, string> = {
    completed: "bg-emerald-500",
    in_progress: "bg-blue-500",
    draft: "bg-slate-400",
  }
  return map[status] || map.draft
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ total: 0, completed: 0, in_progress: 0 })
  const [processes, setProcesses] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([processAPI.getAll(), clientAPI.getAll()])
      const procs = pRes.data.processes
      setProcesses(procs)
      setClients(cRes.data.clients)
      setStats({
        total: procs.length,
        completed: procs.filter((p: any) => p.status === "completed").length,
        in_progress: procs.filter((p: any) => p.status === "in_progress").length,
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const getClientName = (client_id: string) => {
    const c = clients.find((c) => c._id === client_id)
    return c ? c.name : "—"
  }

  const filtered = processes
    .filter((p) => filter === "All" || p.status === filter.toLowerCase().replace(" ", "_"))
    .filter(
      (p) =>
        getClientName(p.client_id).toLowerCase().includes(search.toLowerCase()) ||
        p.steps_data?.step2?.process_name?.toLowerCase().includes(search.toLowerCase())
    )

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Dashboard <span className="text-slate-300 mx-1">/</span>{" "}
            <span className="font-medium text-slate-700">AI Process Discovery</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                placeholder="Search client, process..."
                className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserPlus size={16} />
              Add Client
            </button>
            <button
              type="button"
              onClick={() => router.push("/process/new")}
              className="flex items-center gap-2 rounded-lg bg-[#1570ef] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Zap size={16} />
              Initiate Discovery
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Assessments",
              value: stats.total,
              icon: ClipboardList,
              border: "border-t-blue-500",
              badge: "+4",
              badgeCls: "text-emerald-600 font-medium",
              badgePlain: true,
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle2,
              border: "border-t-emerald-500",
              badge: "Ready",
              badgeCls: "text-emerald-600 bg-emerald-50 px-2 rounded",
            },
            {
              label: "In Progress",
              value: stats.in_progress,
              icon: Loader2,
              border: "border-t-sky-400",
              badge: "Active",
              badgeCls: "text-blue-600 bg-blue-50 px-2 rounded",
            },
            {
              label: "Total Clients",
              value: clients.length,
              icon: Building2,
              border: "border-t-violet-500",
              badge: "Clients",
              badgeCls: "text-violet-600 bg-violet-50 px-2 rounded",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-white rounded-xl border border-slate-200 border-t-4 ${card.border} p-5 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                  <p
                    className={`mt-2 ${
                      (card as { badgePlain?: boolean }).badgePlain
                        ? `text-xs ${card.badgeCls}`
                        : `text-xs font-bold inline-block w-fit ${card.badgeCls}`
                    }`}
                  >
                    {card.badge}
                  </p>
                </div>
                <card.icon size={22} className="text-slate-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <span className="font-medium text-slate-800">
              All Process Discoveries ({filtered.length})
            </span>
            <div className="flex gap-1">
              {["All", "Draft", "In Progress", "Completed"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2 hidden lg:grid lg:grid-cols-[1.2fr_1.2fr_0.7fr_0.8fr_0.9fr_1fr_0.7fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Client</span>
            <span>Process Name</span>
            <span>Currency</span>
            <span>Start Date</span>
            <span>Status</span>
            <span>Progress</span>
            <span>Action</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-400">
              No process discoveries found
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p: any) => {
                const step = Math.min(7, Math.max(1, Number(p.current_step) || 1))
                const completion = Math.round((step / 7) * 100)
                const cur = p.currency || p.steps_data?.step1?.currency || "INR"
                const procName = p.steps_data?.step2?.process_name
                const industry = p.steps_data?.step1?.industry || ""
                const processArea = p.steps_data?.step1?.process_area || ""
                const clientName = getClientName(p.client_id)

                return (
                  <div
                    key={p._id}
                    className={`grid grid-cols-1 gap-3 rounded-xl border border-slate-200 border-t-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md lg:grid-cols-[1.2fr_1.2fr_0.7fr_0.8fr_0.9fr_1fr_0.7fr] lg:items-center ${statusTopBorder(p.status)}`}
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                        Client
                      </p>
                      <div className="font-medium text-slate-900">{clientName}</div>
                      {industry && <div className="text-xs text-slate-500">{industry}</div>}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                        Process Name
                      </p>
                      <div className="font-medium text-slate-900">
                        {procName || (
                          <span className="font-normal italic text-slate-400">Unnamed</span>
                        )}
                      </div>
                      {processArea && (
                        <div className="text-xs text-slate-500">{processArea}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                        Currency
                      </p>
                      <span className="text-slate-800">
                        {currencySymbol(cur)} {cur}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                        Start Date
                      </p>
                      <span className="text-slate-700">
                        {p.assessment_date
                          ? new Date(p.assessment_date).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                        Status
                      </p>
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeCls(p.status)}`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                        Progress
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 max-w-[88px] overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${progressBarCls(p.status)}`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{completion}%</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">Step {step} of 7</div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                        Action
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push(`/process/${p._id}/step/${step}`)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {p.status === "completed" ? "View" : "Resume →"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
