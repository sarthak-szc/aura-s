"use client"
import { useEffect, useState } from "react"
import { adminAPI } from "@/lib/api"
import { getStoredUser } from "@/lib/auth"

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
      setError(e.response?.data?.detail || "Failed to create user")
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
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="font-medium">All Users ({users.length})</span>
            <button onClick={() => setShowAdd(!showAdd)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              + Add User
            </button>
          </div>

          {/* Add User Form */}
          {showAdd && (
            <div className="p-4 bg-slate-50 border-b space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Full Name *"
                  className="border rounded-lg p-2 text-sm"
                  onChange={e => setForm({...form, full_name: e.target.value})}/>
                <input placeholder="Email *" type="email"
                  className="border rounded-lg p-2 text-sm"
                  onChange={e => setForm({...form, email: e.target.value})}/>
                <input placeholder="Password *" type="password"
                  className="border rounded-lg p-2 text-sm"
                  onChange={e => setForm({...form, password: e.target.value})}/>
                <select className="border rounded-lg p-2 text-sm"
                  onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  Create User
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {["Name","Email","Role","Status","Actions"]
                  .map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u._id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColor[u.role] || "bg-slate-100"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium
                        ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleUser(u._id, u.is_active)}
                        className={`text-xs px-3 py-1 rounded-lg font-medium
                          ${u.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Logs Tab */}
      {tab === "logs" && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-4 py-3 border-b">
            <span className="font-medium">Audit Logs ({logs.length})</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {["Action","Resource","User","Timestamp"]
                  .map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    No logs yet
                  </td>
                </tr>
              ) : (
                logs.map((log: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{log.resource}</td>
                    <td className="px-4 py-3 text-slate-500">{log.user_id}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}