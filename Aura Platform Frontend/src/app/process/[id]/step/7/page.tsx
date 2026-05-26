"use client"

import { useState, useEffect, useMemo } from "react"
import ProcessStepShell from "@/components/process/ProcessStepShell"
import {
  StepSectionHeader,
  BtnPrimary,
  BtnPurple,
  InfoBanner,
  SummaryMetricCard,
  FieldLabel,
  FormTextarea,
  InputWithSuffix,
} from "@/components/process/processFormUi"
import { processAPI, reportAPI } from "@/lib/api"
import { useProcessWizard } from "@/hooks/useProcessWizard"

const REPORT_FIELDS: { key: string; label: string; col: "left" | "right" }[] = [
  { key: "process_area", label: "Process Area", col: "left" },
  { key: "sub_process_name", label: "Sub-Process Name", col: "right" },
  { key: "objective", label: "Objective", col: "left" },
  { key: "strategic_goal", label: "Strategic Goal", col: "right" },
  { key: "key_challenges", label: "Key Challenges", col: "left" },
  { key: "business_benefits", label: "Business Benefits (Y1)", col: "right" },
  { key: "ai_opportunity", label: "AI Opportunity", col: "left" },
  { key: "data_readiness", label: "Data Readiness", col: "right" },
  { key: "volume_capacity", label: "Volume and Capacity", col: "left" },
  { key: "key_outputs", label: "Key Outputs", col: "right" },
  { key: "key_inputs", label: "Key Inputs", col: "left" },
]

const DRAFT_REPORT: Record<string, string> = {
  process_area: "",
  sub_process_name: "",
  objective: "",
  strategic_goal: "",
  key_challenges: "",
  business_benefits: "",
  ai_opportunity: "",
  data_readiness: "",
  volume_capacity: "",
  key_inputs: "",
  key_outputs: "",
}

const REPORT_DRAFT_PLACEHOLDERS: Record<string, string> = {
  process_area: "Draft: e.g. Accounts Payable",
  sub_process_name: "Draft: e.g. Invoice Processing",
  objective: "Draft: Primary process objective",
  strategic_goal: "Draft: Strategic alignment goal",
  key_challenges: "Draft: Key pain points and challenges",
  business_benefits: "Draft: Expected Y1 business benefits",
  ai_opportunity: "Draft: AI automation opportunity",
  data_readiness: "Draft: e.g. Accurate / Partial",
  volume_capacity: "Draft: Monthly volume and FTE capacity",
  key_inputs: "Draft: Key process inputs",
  key_outputs: "Draft: Key process outputs",
}

const ERROR_REDUCTION_PCT = 30
const REVENUE_RECOVERY_PCT = 50

type NumField = number | ""

const num = (v: NumField | undefined | null) =>
  v === "" || v == null || Number.isNaN(Number(v)) ? 0 : Number(v)

export default function EvaluationSummary() {
  const w = useProcessWizard()
  const [process, setProcess] = useState<Record<string, unknown> | null>(null)
  const [report, setReport] = useState<Record<string, string>>({})
  const [summary, setSummary] = useState<{
    summary?: string
    next_steps?: string[]
    roi_estimate?: string
  } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [markComplete, setMarkComplete] = useState(false)
  const [implementationCost, setImplementationCost] = useState<NumField>("")

  useEffect(() => {
    w.loadProcess()
      .then(async (p) => {
        setProcess(p)
        const s7 = p.steps_data?.step7
        const fields = s7?.report_fields
          ? { ...DRAFT_REPORT, ...(s7.report_fields as Record<string, string>) }
          : { ...DRAFT_REPORT }
        setReport(fields)
        const pb = s7?.payback as { implementation_cost?: number } | undefined
        if (pb?.implementation_cost != null) {
          setImplementationCost(pb.implementation_cost)
        }
        if (s7?.summary) setSummary(s7)
        const hasReport = Object.values(fields).some((v) => String(v || "").trim())
        if (!hasReport) {
          const res = await processAPI.generateSummary(w.processId, {})
          setSummary(res.data)
          if (res.data?.report_fields) {
            setReport({ ...DRAFT_REPORT, ...res.data.report_fields })
          }
        }
      })
      .catch(() => w.setError("Failed to load process"))
      .finally(() => setPageLoading(false))
  }, [w.processId])

  const generateSummary = async () => {
    setGenerating(true)
    try {
      const res = await processAPI.generateSummary(w.processId, { report_fields: report })
      setSummary(res.data)
      if (res.data?.report_fields) {
        setReport({ ...DRAFT_REPORT, ...res.data.report_fields })
      }
    } catch {
      w.setError("Summary generation failed.")
    }
    setGenerating(false)
  }

  const readinessPct = () => {
    const s5 = (process?.steps_data as Record<string, Record<string, unknown>>)?.step5
    if (!s5?.standardization) return "72%"
    const avg =
      (Number(s5.standardization) +
        Number(s5.digitization) +
        Number(s5.data_availability) +
        Number(s5.automation_feasibility)) /
      4
    return `${Math.round((avg / 5) * 100)}%`
  }

  const sym =
    w.currency === "INR" ? "₹" : w.currency === "USD" ? "$" : w.currency === "EUR" ? "€" : w.currency

  const paybackMetrics = useMemo(() => {
    const steps = (process?.steps_data || {}) as Record<string, Record<string, unknown>>
    const s3 = steps.step3 || {}
    const s5 = steps.step5 || {}

    const fteAnnual = num(s3.fte_cost_annual as NumField)
    const automationCoverage = num(s5.automation_pct as NumField) / 100
    const businessImpactMonthly = num(s3.business_impact_errors_monthly as NumField)
    const revenueLeakageAnnual = num(s3.revenue_leakage as NumField)

    const annualBenefit =
      fteAnnual * automationCoverage +
      businessImpactMonthly * 12 * (ERROR_REDUCTION_PCT / 100) +
      revenueLeakageAnnual * (REVENUE_RECOVERY_PCT / 100)

    const implCost = num(implementationCost)
    const monthlyBenefit = annualBenefit / 12
    const paybackMonths =
      implCost > 0 && monthlyBenefit > 0
        ? Math.round((implCost / monthlyBenefit) * 10) / 10
        : null

    return { annualBenefit, paybackMonths, automationCoverage, monthlyBenefit }
  }, [process, implementationCost])

  const buildPaybackPayload = () => ({
    implementation_cost: num(implementationCost),
    annual_benefit: Math.round(paybackMetrics.annualBenefit),
    payback_period_months: paybackMetrics.paybackMonths,
    automation_coverage_pct: Math.round(paybackMetrics.automationCoverage * 100),
    error_reduction_pct: ERROR_REDUCTION_PCT,
    revenue_recovery_pct: REVENUE_RECOVERY_PCT,
  })

  const handleSave = async () => {
    w.setSaving(true)
    w.setError("")
    try {
      await processAPI.saveEvaluationSummary(w.processId, {
        report_fields: report,
        payback: buildPaybackPayload(),
      })
      w.flashSuccess()
    } catch (e: unknown) {
      w.setApiError(e, "Save failed")
    }
    w.setSaving(false)
  }

  const handleComplete = async () => {
    if (!markComplete) {
      w.setError("Please check 'Mark Assessment as Complete' first")
      return
    }
    w.setLoading(true)
    w.setError("")
    try {
      if (!summary) await generateSummary()
      await processAPI.saveEvaluationSummary(w.processId, {
        report_fields: report,
        payback: buildPaybackPayload(),
      })
      await processAPI.complete(w.processId)
      w.router.push("/dashboard")
    } catch (e: unknown) {
      w.setApiError(e, "Error")
    }
    w.setLoading(false)
  }

  const exportPdf = async () => {
    try {
      const res = await reportAPI.downloadPdf(w.processId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement("a")
      a.href = url
      a.download = `AuRA_Report_${w.processId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      w.setError("PDF export failed")
    }
  }

  const steps = (process?.steps_data || {}) as Record<string, Record<string, unknown>>
  const complexity =
    (steps.step6?.complexity as { overall?: string })?.overall || "Medium — 8 to 12 weeks"

  if (pageLoading) {
    return <div className="p-8 text-slate-400">Loading...</div>
  }

  const leftFields = REPORT_FIELDS.filter((f) => f.col === "left")
  const rightFields = REPORT_FIELDS.filter((f) => f.col === "right")

  return (
    <ProcessStepShell
      step={7}
      currency={w.currency}
      error={w.error}
      success={w.success}
      onCancel={w.onCancel}
      onPrevious={() => w.goPrevious(6)}
      onSave={handleSave}
      onNext={handleComplete}
      loading={w.loading}
      saving={w.saving}
      nextLabel="Mark Complete →"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Feasibility Score"
          value={readinessPct()}
          subtitle="Medium-High feasibility"
        />
        <SummaryMetricCard
          title="Payback Period"
          value={
            paybackMetrics.paybackMonths != null
              ? `${paybackMetrics.paybackMonths}`
              : "—"
          }
          subtitle={
            paybackMetrics.paybackMonths != null
              ? "months to recover investment"
              : "Enter implementation cost below"
          }
        />
        <SummaryMetricCard
          title="Implementation Complexity"
          value={complexity.split("—")[0]?.trim() || "Medium"}
          subtitle="8–12 weeks estimated"
        />
        <SummaryMetricCard
          title="Strategic Alignment"
          value="High"
          subtitle="Aligned with digital ops goals"
        />
      </div>

      <InfoBanner variant="yellow">
        Evaluation Summary is ready. Fields below are auto-generated by AI from prior steps. Use
        Generate with AI to refresh.
      </InfoBanner>
      <InfoBanner variant="blue">
        All monetary values are in {sym} ({w.currency}) as selected in Step 1.
      </InfoBanner>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
        <p className="text-sm font-bold text-slate-800">Payback Analysis</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWithSuffix
            label="Implementation Cost"
            value={implementationCost === "" ? "" : String(implementationCost)}
            onChange={(v) => setImplementationCost(v === "" ? "" : Number(v))}
            suffix={sym}
          />
          <InputWithSuffix
            label="Payback Period"
            value={
              paybackMetrics.paybackMonths != null ? String(paybackMetrics.paybackMonths) : ""
            }
            suffix="months"
            readOnly
          />
        </div>
        <p className="text-xs text-slate-600">
          Calculated Annual Benefit:{" "}
          <span className="font-semibold text-slate-900">
            {sym}
            {Math.round(paybackMetrics.annualBenefit).toLocaleString()}
          </span>
          {paybackMetrics.automationCoverage > 0 && (
            <span className="text-slate-400">
              {" "}
              (Automation coverage {Math.round(paybackMetrics.automationCoverage * 100)}% from Step
              5)
            </span>
          )}
        </p>
      </div>

      <StepSectionHeader
        title="Evaluation Summary Report"
        action={
          <div className="flex gap-2">
            <BtnPurple onClick={generateSummary} disabled={generating}>
              {generating ? "Generating..." : "✨ Generate with AI"}
            </BtnPurple>
            <button
              type="button"
              onClick={exportPdf}
              className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Export PDF
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          {leftFields.map((f) => (
            <div key={f.key}>
              <FieldLabel>{f.label}</FieldLabel>
              <FormTextarea
                rows={3}
                value={report[f.key] || ""}
                placeholder={REPORT_DRAFT_PLACEHOLDERS[f.key]}
                onChange={(e) => setReport({ ...report, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {rightFields.map((f) => (
            <div key={f.key}>
              <FieldLabel>{f.label}</FieldLabel>
              <FormTextarea
                rows={3}
                value={report[f.key] || ""}
                placeholder={REPORT_DRAFT_PLACEHOLDERS[f.key]}
                onChange={(e) => setReport({ ...report, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {summary?.summary && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-sm text-slate-600">
          <p className="font-semibold text-slate-800 mb-2">Executive narrative</p>
          <p>{summary.summary}</p>
        </div>
      )}

      <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={markComplete}
            onChange={(e) => setMarkComplete(e.target.checked)}
            className="mt-1 rounded border-slate-300"
          />
          <span>
            <span className="font-semibold text-slate-800">Mark Assessment as Complete</span>
            <br />
            <span className="text-xs text-slate-500">
              Completing locks this assessment and returns to dashboard.
            </span>
          </span>
        </label>
        <div className="flex gap-2">
          <BtnPrimary onClick={exportPdf} className="bg-emerald-600 hover:bg-emerald-700">
            Download Report
          </BtnPrimary>
        </div>
      </div>
    </ProcessStepShell>
  )
}
