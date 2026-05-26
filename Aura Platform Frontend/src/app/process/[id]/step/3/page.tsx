"use client"

import { useState, useEffect, useMemo } from "react"
import ProcessStepShell from "@/components/process/ProcessStepShell"
import {
  StepSectionHeader,
  InfoBanner,
  InputWithSuffix,
  FormTextarea,
  FieldLabel,
} from "@/components/process/processFormUi"
import { processAPI } from "@/lib/api"
import { useProcessWizard } from "@/hooks/useProcessWizard"
import { processContextKey } from "@/lib/processContext"

type NumField = number | ""

const defaultForm = () => ({
  monthly_transaction_volume: "" as NumField,
  transaction_volume_unit: "Invoices",
  avg_time_per_transaction_mins: "" as NumField,
  processing_time_unit: "minutes",
  fte_count: "" as NumField,
  fte_cost_annual: "" as NumField,
  hours_spent_per_day: "" as NumField,
  working_days_per_month: "" as NumField,
  current_error_rate_pct: "" as NumField,
  business_impact_errors_monthly: "" as NumField,
  revenue_leakage: "" as NumField,
  sla_breach_rate_pct: "" as NumField,
  non_prime_transactions_monthly: "" as NumField,
  process_observations: "",
  key_improvement_areas: "",
})

const num = (v: NumField) => (v === "" ? 0 : Number(v))

const mapFromApi = (s3: Record<string, unknown>) => ({
  monthly_transaction_volume: (s3.monthly_transaction_volume as number) || ("" as NumField),
  transaction_volume_unit: (s3.transaction_volume_unit as string) || "Invoices",
  avg_time_per_transaction_mins: (s3.avg_time_per_transaction_mins as number) || ("" as NumField),
  processing_time_unit: (s3.processing_time_unit as string) || "minutes",
  fte_count: (s3.fte_count as number) || ("" as NumField),
  fte_cost_annual: (s3.fte_cost_annual as number) || ("" as NumField),
  hours_spent_per_day: (s3.hours_spent_per_day as number) || ("" as NumField),
  working_days_per_month: (s3.working_days_per_month as number) || ("" as NumField),
  current_error_rate_pct:
    (s3.current_error_rate_pct as number) || (s3.delay_impact_on_revenue_pct as number) || ("" as NumField),
  business_impact_errors_monthly: (s3.business_impact_errors_monthly as number) || ("" as NumField),
  revenue_leakage: (s3.revenue_leakage as number) || ("" as NumField),
  sla_breach_rate_pct: (s3.sla_breach_rate_pct as number) || ("" as NumField),
  non_prime_transactions_monthly:
    (s3.non_prime_transactions_monthly as number) ||
    (s3.risk_prone_transactions_count as number) ||
    ("" as NumField),
  process_observations: (s3.process_observations as string) || (s3.key_improvement_areas as string) || "",
  key_improvement_areas: (s3.key_improvement_areas as string) || "",
})

export default function ProcessVolumetrics() {
  const w = useProcessWizard()
  const [form, setForm] = useState(defaultForm())
  const [autoLoading, setAutoLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setAutoLoading(true)
      w.setError("")
      try {
        const p = await w.loadProcess()
        const s1 = p.steps_data?.step1
        const s2 = p.steps_data?.step2
        const s3 = p.steps_data?.step3
        const key = processContextKey(s1, s2)
        const cacheKey = `aura-s3-${w.processId}`
        const cached = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null
        const hasData = s3 && num(mapFromApi(s3).fte_count as NumField) > 0

        if (hasData && cached === key) {
          if (!cancelled) setForm(mapFromApi(s3))
        } else {
          const res = await processAPI.generateVolumetrics(w.processId)
          if (!cancelled) setForm(mapFromApi(res.data.step3 || {}))
          if (typeof window !== "undefined") sessionStorage.setItem(cacheKey, key)
        }
      } catch {
        if (!cancelled) w.setError("Could not load volumetrics")
      }
      if (!cancelled) setAutoLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [w.processId])

  const sym = w.currency === "INR" ? "₹" : w.currency === "USD" ? "$" : w.currency

  const costPerTransaction = useMemo(() => {
    const volume = num(form.monthly_transaction_volume)
    const fteAnnual = num(form.fte_cost_annual)
    if (volume <= 0 || fteAnnual <= 0) return ""
    return Math.round(fteAnnual / 12 / volume)
  }, [form.monthly_transaction_volume, form.fte_cost_annual])

  const financialRiskPerTxn = useMemo(() => {
    const impact = num(form.business_impact_errors_monthly)
    const riskTxns = num(form.non_prime_transactions_monthly)
    if (impact <= 0 || riskTxns <= 0) return ""
    return Math.round(impact / riskTxns)
  }, [form.business_impact_errors_monthly, form.non_prime_transactions_monthly])

  const annualCost = (
    num(form.fte_count) * (num(form.fte_cost_annual) / Math.max(num(form.fte_count), 1)) * 0.25
  ).toFixed(0)

  const validate = () => {
    if (num(form.fte_count) <= 0) {
      w.setError("FTE count must be greater than 0")
      return false
    }
    const sla = num(form.sla_breach_rate_pct)
    if (form.sla_breach_rate_pct !== "" && (sla < 0 || sla > 100)) {
      w.setError("SLA breach rate must be between 0–100")
      return false
    }
    return true
  }

  const buildPayload = () => ({
    monthly_transaction_volume: num(form.monthly_transaction_volume),
    transaction_volume_unit: form.transaction_volume_unit,
    avg_time_per_transaction_mins: num(form.avg_time_per_transaction_mins),
    processing_time_unit: form.processing_time_unit,
    fte_count: num(form.fte_count),
    fte_cost_annual: num(form.fte_cost_annual),
    cost_per_transaction: costPerTransaction === "" ? 0 : costPerTransaction,
    hours_spent_per_day: num(form.hours_spent_per_day),
    working_days_per_month: num(form.working_days_per_month) || 22,
    current_error_rate_pct: num(form.current_error_rate_pct),
    business_impact_errors_monthly: num(form.business_impact_errors_monthly),
    revenue_leakage: num(form.revenue_leakage),
    sla_breach_rate_pct: num(form.sla_breach_rate_pct),
    non_prime_transactions_monthly: num(form.non_prime_transactions_monthly),
    avg_financial_risk_per_txn: financialRiskPerTxn === "" ? 0 : financialRiskPerTxn,
    process_observations: form.process_observations,
    key_challenges: [],
    key_improvement_areas: form.process_observations || form.key_improvement_areas,
    avg_revenue_per_transaction: costPerTransaction === "" ? 0 : costPerTransaction,
    delay_impact_on_revenue_pct: num(form.current_error_rate_pct),
    risk_prone_transactions_count: num(form.non_prime_transactions_monthly),
    annual_cost_estimate: Number(annualCost),
    success_metrics: [],
  })

  const persist = async () => {
    await processAPI.processDetails(w.processId, buildPayload())
  }

  const handleSave = async () => {
    if (!validate()) return
    w.setSaving(true)
    w.setError("")
    try {
      await persist()
      w.flashSuccess()
    } catch (e: unknown) {
      w.setApiError(e, "Save failed")
    }
    w.setSaving(false)
  }

  const handleNext = async () => {
    if (!validate()) return
    w.setLoading(true)
    w.setError("")
    try {
      await persist()
      w.goNext(4)
    } catch (e: unknown) {
      w.setApiError(e, "Error")
    }
    w.setLoading(false)
  }

  const setNum = (key: keyof typeof form, v: string) =>
    setForm({ ...form, [key]: v === "" ? "" : Number(v) })

  const display = (v: NumField) => (v === "" ? "" : String(v))

  if (autoLoading) {
    return (
      <ProcessStepShell
        step={3}
        currency={w.currency}
        onCancel={w.onCancel}
        onPrevious={() => w.goPrevious(2)}
        onSave={() => {}}
        onNext={() => {}}
      >
        <p className="text-center text-blue-600 py-12">🤖 Generating volumetrics from prior steps...</p>
      </ProcessStepShell>
    )
  }

  return (
    <ProcessStepShell
      step={3}
      currency={w.currency}
      error={w.error}
      success={w.success}
      onCancel={w.onCancel}
      onPrevious={() => w.goPrevious(2)}
      onSave={handleSave}
      onNext={handleNext}
      loading={w.loading}
      saving={w.saving}
    >
      <StepSectionHeader
        title="Volumetrics & KPIs"
        subtitle="Quantify process volume, cost, and risk metrics."
      />

      <InfoBanner variant="yellow">
        AI has pre-filled available fields based on your uploaded documents. Please validate and
        fill any missing values.
      </InfoBanner>
      <InfoBanner variant="blue">
        All monetary fields use {w.currency} ({sym}) as selected in Step 1.
      </InfoBanner>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputWithSuffix
          label="Transaction Volume (per month)"
          value={display(form.monthly_transaction_volume)}
          onChange={(v) => setNum("monthly_transaction_volume", v)}
          suffix={form.transaction_volume_unit}
          suffixOptions={["Invoices", "Orders", "Transactions", "Cases"]}
          onSuffixChange={(v) => setForm({ ...form, transaction_volume_unit: v })}
        />
        <InputWithSuffix
          label="Processing Time (per transaction)"
          value={display(form.avg_time_per_transaction_mins)}
          onChange={(v) => setNum("avg_time_per_transaction_mins", v)}
          suffix={form.processing_time_unit}
          suffixOptions={["minutes", "hours", "days"]}
          onSuffixChange={(v) => setForm({ ...form, processing_time_unit: v })}
        />
        <InputWithSuffix
          label="FTE Count"
          required
          value={display(form.fte_count)}
          onChange={(v) => setNum("fte_count", v)}
          suffix="FTEs"
        />
        <InputWithSuffix
          label="FTE Cost (Annual)"
          required
          value={display(form.fte_cost_annual)}
          onChange={(v) => setNum("fte_cost_annual", v)}
          suffix={sym}
        />
        <InputWithSuffix
          label="Cost Per Transaction"
          value={costPerTransaction === "" ? "" : String(costPerTransaction)}
          suffix={sym}
          readOnly
        />
        <InputWithSuffix
          label="Hours Spent Per Day"
          value={display(form.hours_spent_per_day)}
          onChange={(v) => setNum("hours_spent_per_day", v)}
          suffix="Hrs"
        />
        <InputWithSuffix
          label="Working Days / Month"
          value={display(form.working_days_per_month)}
          onChange={(v) => setNum("working_days_per_month", v)}
          suffix="days"
        />
        <InputWithSuffix
          label="Current Error Rate"
          value={display(form.current_error_rate_pct)}
          onChange={(v) => setNum("current_error_rate_pct", v)}
          suffix="%"
        />
        <InputWithSuffix
          label={`Business Impact of Errors (${sym} / month)`}
          value={display(form.business_impact_errors_monthly)}
          onChange={(v) => setNum("business_impact_errors_monthly", v)}
          suffix={sym}
        />
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 pt-2">
        Revenue & Tax (Optional)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputWithSuffix
          label={`Revenue Leakage (Annual) ${sym}`}
          value={display(form.revenue_leakage)}
          onChange={(v) => setNum("revenue_leakage", v)}
          suffix={sym}
        />
        <InputWithSuffix
          label="SLA Breach Rate"
          value={display(form.sla_breach_rate_pct)}
          onChange={(v) => setNum("sla_breach_rate_pct", v)}
          suffix="%"
        />
        <InputWithSuffix
          label="Non-Prime Transactions / Month"
          value={display(form.non_prime_transactions_monthly)}
          onChange={(v) => setNum("non_prime_transactions_monthly", v)}
          suffix="Transactions"
        />
      </div>

      <InputWithSuffix
        label={`Annual Financial Risk (Per Transaction) ${sym}`}
        value={financialRiskPerTxn === "" ? "" : String(financialRiskPerTxn)}
        suffix={sym}
        readOnly
      />

      <div>
        <FieldLabel>Process Observations & Context</FieldLabel>
        <FormTextarea
          rows={4}
          placeholder="Draft: Peak loads, manual workarounds, bottlenecks..."
          value={form.process_observations}
          onChange={(e) => setForm({ ...form, process_observations: e.target.value })}
        />
      </div>
    </ProcessStepShell>
  )
}
