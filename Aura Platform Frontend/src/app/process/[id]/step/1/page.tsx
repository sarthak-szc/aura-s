"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import ProcessStepShell from "@/components/process/ProcessStepShell"
import { clientAPI, processAPI } from "@/lib/api"
import { getStoredUser } from "@/lib/auth"
import { getApiErrorMessage } from "@/lib/apiError"
import {
  CURRENCIES,
  BUSINESS_FUNCTIONS,
  PROCESS_AREAS,
  formatAssessmentDate,
  assessmentDateFromIso,
  assessmentDateToIso,
} from "@/lib/processConstants"

const emptyForm = () => ({
  client_id: "",
  industry: "",
  customer_rep_name: "",
  customer_rep_email: "",
  customer_rep_role: "",
  currency: "INR",
  assessment_date: "",
  business_function: "",
  process_area: "",
  sme_name: "",
  sme_email: "",
  sme_phone: "",
  owner_name: "",
  owner_email: "",
  owner_phone: "",
})

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
      <span>{icon}</span>
      {title}
    </h3>
  )
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 block">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export default function CustomerDetailsStep() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const routeId = params?.id as string | undefined
  const isNewRoute = pathname?.includes("/process/new") ?? false

  const [processId, setProcessId] = useState<string | null>(
    isNewRoute ? null : routeId || null
  )
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const currencyMeta = CURRENCIES.find((c) => c.code === form.currency) || CURRENCIES[0]
  const processAreas = PROCESS_AREAS[form.business_function] || []

  useEffect(() => {
    setForm((f) => ({
      ...f,
      assessment_date: f.assessment_date || formatAssessmentDate(),
    }))
  }, [])

  const loadClients = useCallback(async () => {
    const r = await clientAPI.getAll()
    setClients(r.data.clients || [])
  }, [])

  const applyClient = useCallback((client: any) => {
    const cp = client?.contact_person || {}
    setForm((f) => ({
      ...f,
      client_id: client._id,
      industry: client.industry || "",
      customer_rep_name: cp.name || "",
      customer_rep_email: cp.email || "",
      customer_rep_role: cp.designation || "Representative",
    }))
  }, [])

  const loadProcess = useCallback(async (pid: string) => {
    const r = await processAPI.getOne(pid)
    const p = r.data
    const s1 = p.steps_data?.step1 || {}
    setForm({
      client_id: s1.client_id || p.client_id || "",
      industry: s1.industry || "",
      customer_rep_name: s1.customer_rep_name || "",
      customer_rep_email: s1.customer_rep_email || "",
      customer_rep_role: s1.customer_rep_role || "",
      currency: s1.currency || p.currency || "INR",
      assessment_date: assessmentDateFromIso(s1.assessment_date || p.assessment_date || ""),
      business_function: s1.business_function || "",
      process_area: s1.process_area || "",
      sme_name: s1.sme_name || "",
      sme_email: s1.sme_email || "",
      sme_phone: s1.sme_phone || "",
      owner_name: s1.owner_name || "",
      owner_email: s1.owner_email || "",
      owner_phone: s1.owner_phone || "",
    })
  }, [])

  useEffect(() => {
    loadClients()
    if (processId && !isNewRoute) {
      loadProcess(processId).catch(() => setError("Could not load saved data"))
    }
  }, [processId, isNewRoute, loadClients, loadProcess])

  const buildPayload = () => ({
    ...form,
    assessment_date: assessmentDateToIso(
      form.assessment_date || formatAssessmentDate()
    ),
  })

  const validate = () => {
    if (!form.client_id) {
      setError("Please select a customer")
      return false
    }
    if (!form.business_function) {
      setError("Business function is required")
      return false
    }
    if (!form.process_area) {
      setError("Process area is required")
      return false
    }
    if (!form.sme_name?.trim()) {
      setError("Process SME name is required")
      return false
    }
    return true
  }

  const persist = async (): Promise<string> => {
    const payload = buildPayload()
    if (processId) {
      await processAPI.saveCustomerInfo(processId, payload)
      return processId
    }
    const res = await processAPI.customerInfo(payload)
    const pid = String(res.data?.process_id || res.data?._id || "").trim()
    if (!pid) throw new Error("Server did not return a process id")
    setProcessId(pid)
    return pid
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await persist()
      setSuccess("Saved successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Save failed"))
    }
    setSaving(false)
  }

  const handleNext = async () => {
    if (!validate()) return
    setLoading(true)
    setError("")
    try {
      const pid = await persist()
      const id = String(pid || "").trim()
      if (!id || id === "new" || id === "undefined") {
        setError("Could not create process. Please save again or check the API connection.")
        return
      }
      router.replace(`/process/${id}/step/2`)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Something went wrong"))
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    router.push("/dashboard")
  }

  return (
    <ProcessStepShell
      step={1}
      currency={form.currency}
      error={error}
      success={success}
      onCancel={() => router.push("/dashboard")}
      onPrevious={handlePrevious}
      onSave={handleSave}
      onNext={handleNext}
      loading={loading}
      saving={saving}
      showPrevious={true}
    >
            {/* Client Information */}
            <section>
              <SectionTitle icon="📋" title="Client Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel required>Customer Name</FieldLabel>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.client_id}
                    onChange={(e) => {
                      const c = clients.find((x) => x._id === e.target.value)
                      if (c) applyClient(c)
                      else setForm((f) => ({ ...f, client_id: e.target.value }))
                    }}
                  >
                    <option value="">— Select customer —</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Select from client master. Add new clients via Client Management.
                  </p>
                </div>
                <div>
                  <FieldLabel>Industry</FieldLabel>
                  <input
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-700"
                    value={form.industry}
                    placeholder="Auto-populated from client master"
                  />
                  <p className="text-xs text-slate-400 mt-1">Auto-populated from client master.</p>
                </div>
              </div>

              <p className="text-xs font-semibold uppercase text-slate-500 mt-6 mb-3">
                Customer Representative
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.customer_rep_name}
                    onChange={(e) =>
                      setForm({ ...form, customer_rep_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.customer_rep_email}
                    onChange={(e) =>
                      setForm({ ...form, customer_rep_email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Role</FieldLabel>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.customer_rep_role}
                    onChange={(e) =>
                      setForm({ ...form, customer_rep_role: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Assessment Currency */}
            <section>
              <SectionTitle icon="💱" title="Assessment Currency" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div>
                  <FieldLabel required>Currency</FieldLabel>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-2xl font-bold text-blue-700">{currencyMeta.symbol}</p>
                  <p className="text-sm font-medium text-blue-900">{currencyMeta.name}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Used in all monetary calculations
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 flex gap-2 text-sm text-blue-800">
                <span className="text-blue-500 font-bold">ℹ</span>
                <p>
                  This currency applies to the entire assessment. All monetary inputs in
                  Volumetrics (Step 3), Business Benefits, FTE Costs, ROI calculations, and
                  the final Evaluation on Summary (Step 7) will use{" "}
                  <strong>
                    {currencyMeta.symbol} ({form.currency})
                  </strong>
                  .
                </p>
              </div>
            </section>

            {/* Assessment Details */}
            <section>
              <SectionTitle icon="📅" title="Assessment Details" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <FieldLabel>Assessment Date</FieldLabel>
                  <input
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50"
                    value={form.assessment_date}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Auto-set on initiation — not editable
                  </p>
                </div>
                <div>
                  <FieldLabel required>Business Function</FieldLabel>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.business_function}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        business_function: e.target.value,
                        process_area: "",
                      })
                    }
                  >
                    <option value="">— Select business function —</option>
                    {BUSINESS_FUNCTIONS.map((bf) => (
                      <option key={bf} value={bf}>
                        {bf}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel required>Process Area</FieldLabel>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.process_area}
                    onChange={(e) => setForm({ ...form, process_area: e.target.value })}
                  >
                    <option value="">— Select process area —</option>
                    {processAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Filtered by Business Function</p>
                </div>
              </div>
            </section>

            {/* Process SME */}
            <section>
              <SectionTitle icon="👤" title="Process SME / Owner (Client Side)" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel required>Name</FieldLabel>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.sme_name}
                    onChange={(e) => setForm({ ...form, sme_name: e.target.value })}
                    placeholder="Draft: e.g. Ravi Kumar"
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.sme_email}
                    onChange={(e) => setForm({ ...form, sme_email: e.target.value })}
                    placeholder="Draft: e.g. ravi@company.com"
                  />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.sme_phone}
                    onChange={(e) => setForm({ ...form, sme_phone: e.target.value })}
                    placeholder="Draft: e.g. 9988776655"
                  />
                </div>
              </div>
            </section>

            {/* Assessment Owner SenzCraft */}
            <section>
              <SectionTitle icon="🏢" title="Assessment Owner (SenzCraft)" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-300 placeholder:italic"
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    placeholder="Draft: e.g. Murali D"
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-300 placeholder:italic"
                    value={form.owner_email}
                    onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                    placeholder="Draft: e.g. admin@senzcraft.com"
                  />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={form.owner_phone}
                    onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                  />
                </div>
              </div>
            </section>
    </ProcessStepShell>
  )
}
