"use client"
import { useEffect, useState } from "react"
import { clientAPI } from "@/lib/api"
import { Client } from "@/lib/types"
import { Pencil, Trash2, Plus } from "lucide-react"
import AddClientModal from "@/components/clients/AddClientModal"
import EditClientModal from "@/components/clients/EditClientModal"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    try {
      const res = await clientAPI.getAll()
      setClients(res.data.clients)
    } catch (e) {
      console.error("Error:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    await clientAPI.delete(id)
    fetchClients()
  }

  const clientTopBorder = (count: number) =>
    count > 0 ? "border-t-sky-400" : "border-t-slate-300"

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Management</h1>
          <p className="text-sm text-slate-500">
            Manage client master data used across all assessments
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <div className="mb-4 px-1">
            <span className="font-medium text-slate-800">All Clients ({clients.length})</span>
          </div>

          <div className="mb-2 hidden lg:grid lg:grid-cols-[1.3fr_1fr_1.1fr_1.1fr_0.8fr_0.7fr_0.5fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Company</span>
            <span>Industry</span>
            <span>Contact</span>
            <span>Email</span>
            <span>Added On</span>
            <span># Assessments</span>
            <span>Actions</span>
          </div>

          {clients.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-400">
              No clients yet. Add your first client!
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((c) => (
                <div
                  key={c._id}
                  className={`grid grid-cols-1 gap-3 rounded-xl border border-slate-200 border-t-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md lg:grid-cols-[1.3fr_1fr_1.1fr_1.1fr_0.8fr_0.7fr_0.5fr] lg:items-center ${clientTopBorder(c.assessment_count ?? 0)}`}
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Company
                    </p>
                    <div className="font-medium text-slate-900">{c.name}</div>
                    {c.address && <div className="text-xs text-slate-500">{c.address}</div>}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Industry
                    </p>
                    <span className="text-slate-800">{c.industry}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Contact
                    </p>
                    <div className="text-slate-900">{c.contact_person.name}</div>
                    <div className="text-xs text-slate-500">{c.contact_person.designation}</div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Email
                    </p>
                    <span className="text-blue-600">{c.contact_person.email}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      Added On
                    </p>
                    <span className="text-slate-700">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 lg:hidden">
                      # Assessments
                    </p>
                    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {c.assessment_count ?? 0}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <p className="sr-only">Actions</p>
                    <button
                      type="button"
                      onClick={() => setEditClient(c)}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c._id, c.name)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {showAdd && (
        <AddClientModal onClose={() => setShowAdd(false)} onSaved={fetchClients} />
      )}
      {editClient && (
        <EditClientModal
          client={editClient}
          onClose={() => setEditClient(null)}
          onSaved={fetchClients}
        />
      )}
    </div>
  )
}
