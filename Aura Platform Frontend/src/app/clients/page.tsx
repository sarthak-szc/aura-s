"use client"
import { useEffect, useState } from "react"
import { clientAPI } from "@/lib/api"
import { Client } from "@/lib/types"
import { Pencil, Trash2, Plus } from "lucide-react"
import AddClientModal from "@/components/clients/AddClientModal"
import EditClientModal from "@/components/clients/EditClientModal"

export default function ClientsPage() {
  const [clients, setClients]     = useState<Client[]>([])
  const [showAdd, setShowAdd]     = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [loading, setLoading]     = useState(true)

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

  useEffect(() => { fetchClients() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    await clientAPI.delete(id)
    fetchClients()
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Management</h1>
          <p className="text-slate-500 text-sm">
            Manage client master data used across all assessments
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
          <Plus size={16}/> Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b">
          <span className="font-medium text-slate-800">All Clients ({clients.length})</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {["Company","Industry","Contact","Email","Added On","# Assessments","Actions"]
                .map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No clients yet. Add your first client!
                </td>
              </tr>
            ) : (
              clients.map(c => (
                <tr key={c._id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.address}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-800">{c.industry}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900">{c.contact_person.name}</div>
                    <div className="text-xs text-slate-500">{c.contact_person.designation}</div>
                  </td>
                  <td className="px-4 py-3 text-blue-600">{c.contact_person.email}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                      {c.assessment_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => setEditClient(c)}
                      className="text-slate-400 hover:text-blue-600">
                      <Pencil size={16}/>
                    </button>
                    <button onClick={() => handleDelete(c._id, c.name)}
                      className="text-slate-400 hover:text-red-500">
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onSaved={fetchClients}/>
      )}
      {editClient && (
        <EditClientModal
          client={editClient}
          onClose={() => setEditClient(null)}
          onSaved={fetchClients}/>
      )}
    </div>
  )
}