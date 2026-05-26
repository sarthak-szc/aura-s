"use client"
import { useEffect, useState } from "react"
import { adminAPI } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/apiError"
export default function AdminPanel() {
  const [users, setUsers]     = useState<any[]>([])
  const [logs, setLogs]       = useState<any[]>([])
  const [tab, setTab]         = useState<"users"|"logs">("users")
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({
    email: "", full_name: "", password: "", role: "analyst"
  })
  const [error, setError]     = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [uRes, lRes] = await Promise.all([
        adminAPI.users(),
        adminAPI.auditLogs(),
      ])
      setUsers(uRes.data.users)
      setLogs(lRes.data.logs)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleAddUser = async () => {
    if (!form.email)     { setError("Email is required");    return }
    if (!form.full_name) { setError("Name is required");     return }
    if (!form.password)  { setError("Password is required"); return }

    try {
      await adminAPI.createUser(form)
      setSuccess("User created successfully!")
      setShowAdd(false)
      setForm({ email: "", full_name: "", password: "", role: "analyst" })
      fetchData()
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Failed to create user"))
    }
  }

  const handleToggleUser = async (id: string, is_active: boolean) => {
    await adminAPI.toggleUser(id, !is_active)
    fetchData()
  }

  const roleColor: any = {
    admin:   "bg-red-100 text-red-700",
    analyst: "bg-blue-100 text-blue-700",
    viewer:  "bg-slate-100 text-slate-600",
  }

  const userTopBorder = (is_active: boolean) =>
    is_active ? "border-t-emerald-500" : "border-t-slate-300"

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-slate-500 text-sm">Manage users and view audit logs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[["users","👥 Users"], ["logs","📋 Audit Logs"]].map(([key, label]) => (
          <button key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${tab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Success/Error */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-2 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <span className="font-medium text-slate-800">All Users ({users.length})</span>
            <button
              type="button"
              onClick={() => setShowAdd(!showAdd)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              + Add User
            </button>
          </div>

          {showAdd && (
            <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  placeholder="Full Name *"
                  className="rounded-lg border p-2 text-sm"
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
                <input
                  placeholder="Email *"
                  type="email"
                  className="rounded-lg border p-2 text-sm"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                  placeholder="Password *"
                  type="password"
                  className="rounded-lg border p-2 text-sm"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <select
                  className="rounded-lg border p-2 text-sm"
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mb-2 hidden lg:grid lg:grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_0.9fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {users.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-400">
              No users found
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u: any) => (
                <div
                  key={u._id}
                  className={`grid grid-cols-1 gap-3 rounded-xl border border-slate-200 border-t-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md lg:grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_0.9fr] lg:items-center ${userTopBorder(u.is_active)}`}
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Name
                    </p>
                    <span className="font-medium text-slate-900">{u.full_name}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Email
                    </p>
                    <span className="text-slate-500">{u.email}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Role
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${roleColor[u.role] || "bg-slate-100"}`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Status
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        u.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Actions
                    </p>
                    <button
                      type="button"
                      onClick={() => handleToggleUser(u._id, u.is_active)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium ${
                        u.is_active
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {tab === "logs" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <div className="mb-4 px-1">
            <span className="font-medium text-slate-800">Audit Logs ({logs.length})</span>
          </div>

          <div className="mb-2 hidden lg:grid lg:grid-cols-[1fr_1.2fr_1fr_1.1fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Action</span>
            <span>Resource</span>
            <span>User</span>
            <span>Timestamp</span>
          </div>

          {logs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-400">
              No logs yet
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 border-t-4 border-t-sky-400 bg-white p-4 shadow-sm transition-shadow hover:shadow-md lg:grid-cols-[1fr_1.2fr_1fr_1.1fr] lg:items-center"
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Action
                    </p>
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                      {log.action}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Resource
                    </p>
                    <span className="text-slate-500">{log.resource}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      User
                    </p>
                    <span className="text-slate-500">{log.user_id}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Timestamp
                    </p>
                    <span className="text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}