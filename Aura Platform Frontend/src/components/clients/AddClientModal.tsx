"use client"
import { useState } from "react"
import { clientAPI } from "@/lib/api"

export default function AddClientModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", industry: "", address: "",
    contact_person: { name: "", email: "", phone: "", designation: "" },
    currency: "INR"
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.contact_person.email) {
      alert("Name and Email required!")
      return
    }
    setLoading(true)
    await clientAPI.create(form)
    setLoading(false)
    onSaved()
    onClose()
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-xl">+</span>
            <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          <div>
            <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
            <input placeholder="e.g. Ventora Pvt Ltd" className={inputClass}
              onChange={e => setForm({...form, name: e.target.value})} />
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input placeholder="Full address" className={inputClass}
              onChange={e => setForm({...form, address: e.target.value})} />
          </div>

          <div>
            <label className={labelClass}>Industry <span className="text-red-500">*</span></label>
            <select className={inputClass}
              onChange={e => setForm({...form, industry: e.target.value})}>
              <option value="">— Select Industry —</option>
              {["Manufacturing","Banking & Financial Services","Insurance",
                "Food & Beverage","Retail","Healthcare","IT & Technology"]
                .map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          {/* Client Contact Section */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client Contact</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input placeholder="Full name" className={inputClass}
                  onChange={e => setForm({...form, contact_person: {...form.contact_person, name: e.target.value}})} />
              </div>
              <div>
                <label className={labelClass}>Role / Title</label>
                <input placeholder="e.g. CTO" className={inputClass}
                  onChange={e => setForm({...form, contact_person: {...form.contact_person, designation: e.target.value}})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                <input placeholder="email@company.com" type="email" className={inputClass}
                  onChange={e => setForm({...form, contact_person: {...form.contact_person, email: e.target.value}})} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input placeholder="+91 00000 00000" className={inputClass}
                  onChange={e => setForm({...form, contact_person: {...form.contact_person, phone: e.target.value}})} />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            💾 {loading ? "Saving..." : "Save Client"}
          </button>
        </div>

      </div>
    </div>
  )
}