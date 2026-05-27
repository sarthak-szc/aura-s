"use client"
import { useState } from "react"
import { clientAPI } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/apiError"

const INDUSTRIES = [
  "Manufacturing",
  "Banking & Financial Services",
  "Insurance",
  "Food & Beverage",
  "Retail",
  "Healthcare",
  "IT & Technology",
]

export default function AddClientModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    address: "",
    contact_person: { name: "", email: "", phone: "", designation: "" },
    currency: "INR",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    if (!form.name.trim()) {
      setError("Company name is required")
      return
    }
    if (!form.industry.trim()) {
      setError("Industry is required")
      return
    }
    if (!form.contact_person.email.trim()) {
      setError("Contact email is required")
      return
    }
    const phoneDigits = form.contact_person.phone.replace(/\D/g, "")
    if (form.contact_person.phone.trim() && phoneDigits.length < 10) {
      setError("Phone must be at least 10 digits when provided")
      return
    }
    if (form.contact_person.name.trim() && form.contact_person.name.trim().length < 2) {
      setError("Contact name must be at least 2 characters")
      return
    }

    setLoading(true)
    try {
      await clientAPI.create({
        name: form.name.trim(),
        industry: form.industry.trim(),
        address: form.address.trim(),
        contact_person: {
          name: form.contact_person.name.trim(),
          email: form.contact_person.email.trim(),
          phone: form.contact_person.phone.trim(),
          designation: form.contact_person.designation.trim(),
        },
        currency: form.currency,
      })
      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to create client"))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-xl">+</span>
            <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="e.g. Ventora Pvt Ltd"
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input
              placeholder="Full address"
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              className={inputClass}
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            >
              <option value="">— Select Industry —</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Client Contact
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  placeholder="Full name"
                  className={inputClass}
                  value={form.contact_person.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact_person: { ...form.contact_person, name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Role / Title</label>
                <input
                  placeholder="e.g. CTO"
                  className={inputClass}
                  value={form.contact_person.designation}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact_person: { ...form.contact_person, designation: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="email@company.com"
                  type="email"
                  className={inputClass}
                  value={form.contact_person.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact_person: { ...form.contact_person, email: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Phone (optional)</label>
                <input
                  placeholder="+91 00000 00000"
                  className={inputClass}
                  value={form.contact_person.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact_person: { ...form.contact_person, phone: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Saving..." : "Save Client"}
          </button>
        </div>
      </div>
    </div>
  )
}
