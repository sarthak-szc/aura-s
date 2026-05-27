"use client"
import { useState } from "react"
import { clientAPI } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/apiError"
import { Client } from "@/lib/types"

export default function EditClientModal({ client, onClose, onSaved }:
  { client: Client, onClose: () => void, onSaved: () => void }) {

  const [form, setForm] = useState({
    name: client.name,
    industry: client.industry,
    address: client.address,
    contact_person: client.contact_person,
    currency: client.currency
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    setLoading(true)
    try {
      await clientAPI.update(client._id, form)
      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to update client"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-3">
        <h2 className="text-lg font-bold">Edit Client</h2>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <input defaultValue={client.name} className="w-full border rounded-lg p-2 text-sm"
          onChange={e => setForm({...form, name: e.target.value})}/>

        <input defaultValue={client.industry} className="w-full border rounded-lg p-2 text-sm"
          onChange={e => setForm({...form, industry: e.target.value})}/>

        <input defaultValue={client.address} className="w-full border rounded-lg p-2 text-sm"
          onChange={e => setForm({...form, address: e.target.value})}/>

        <input defaultValue={client.contact_person.name} className="w-full border rounded-lg p-2 text-sm"
          onChange={e => setForm({...form, contact_person: {...form.contact_person, name: e.target.value}})}/>

        <input defaultValue={client.contact_person.email} className="w-full border rounded-lg p-2 text-sm"
          onChange={e => setForm({...form, contact_person: {...form.contact_person, email: e.target.value}})}/>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 border rounded-lg py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}