"use client"

import { useState, useEffect } from "react"
import ProcessStepShell from "@/components/process/ProcessStepShell"
import GSDAQuadrants, {
  AutomationAssessment,
  listsFromItems,
  itemsFromLists,
  type GSDALists,
} from "@/components/process/GSDAQuadrants"
import { StepSectionHeader, BtnPurple, InfoBanner } from "@/components/process/processFormUi"
import { processAPI } from "@/lib/api"
import { useProcessWizard } from "@/hooks/useProcessWizard"

export default function GSDAEvaluation() {
  const w = useProcessWizard()
  const [lists, setLists] = useState<GSDALists>({
    goals: [""],
    signals: [""],
    decisions: [""],
    actions: [""],
  })
  const [scores, setScores] = useState<Record<string, unknown>>({})
  const [automation, setAutomation] = useState({
    canAutomate: true,
    automationPct: 70,
    horizon: "Immediate (0–12 months)",
    aiOpportunity:
      "High automation potential through document AI, workflow orchestration, and ERP integration.",
  })
  const [generating, setGenerating] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    w.loadProcess()
      .then((p) => {
        const s5 = p.steps_data?.step5
        if (s5?.gsda_items?.length) {
          setLists(listsFromItems(s5.gsda_items))
          if (s5.standardization !== undefined) {
            setScores({
              standardization: s5.standardization,
              digitization: s5.digitization,
              data_availability: s5.data_availability,
              automation_feasibility: s5.automation_feasibility,
              reasoning: s5.reasoning,
            })
          }
          if (s5.ai_opportunity) {
            setAutomation((a) => ({ ...a, aiOpportunity: String(s5.ai_opportunity) }))
          }
          if (s5.automation_pct != null) {
            setAutomation((a) => ({ ...a, automationPct: Number(s5.automation_pct) }))
          }
          setLoaded(true)
        } else {
          generateGSDA()
        }
      })
      .catch(() => generateGSDA())
  }, [w.processId])

  const generateGSDA = async () => {
    setGenerating(true)
    w.setError("")
    try {
      const res = await processAPI.generateGSDA(w.processId)
      setLists(listsFromItems(res.data.gsda_items || []))
      if (res.data.scores) setScores(res.data.scores)
      setLoaded(true)
    } catch {
      w.setError("GSDA generation failed. Please try again.")
    }
    setGenerating(false)
  }

  const persist = async () => {
    const gsda_items = itemsFromLists(lists)
    await processAPI.saveGSDA(w.processId, {
      gsda_items,
      scores,
      ai_opportunity: automation.aiOpportunity,
      automation_pct: automation.automationPct,
      can_automate: automation.canAutomate,
      automation_horizon: automation.horizon,
    })
  }

  const handleSave = async () => {
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
    w.setLoading(true)
    w.setError("")
    try {
      await persist()
      w.goNext(6)
    } catch (e: unknown) {
      w.setApiError(e, "Error")
    }
    w.setLoading(false)
  }

  if (!loaded && generating) {
    return (
      <ProcessStepShell
        step={5}
        currency={w.currency}
        onCancel={w.onCancel}
        onPrevious={() => w.goPrevious(4)}
        onSave={() => {}}
        onNext={() => {}}
      >
        <div className="text-center py-16">
          <p className="text-purple-600 font-medium">🤖 AI is generating GSDA evaluation...</p>
        </div>
      </ProcessStepShell>
    )
  }

  return (
    <ProcessStepShell
      step={5}
      currency={w.currency}
      error={w.error}
      success={w.success}
      onCancel={w.onCancel}
      onPrevious={() => w.goPrevious(4)}
      onSave={handleSave}
      onNext={handleNext}
      loading={w.loading}
      saving={w.saving}
    >
      <StepSectionHeader
        title="GSDA Evaluation"
        subtitle="Goals · Signals · Decisions · Actions"
        action={
          <BtnPurple onClick={generateGSDA} disabled={generating}>
            {generating ? "🤖 Generating..." : "✨ Generate with AI"}
          </BtnPurple>
        }
      />

      <InfoBanner variant="purple">
        AI generated from process description, scenarios, and activity breakdown. Click any item to
        edit inline. Use Regenerate to refresh.
      </InfoBanner>

      <GSDAQuadrants lists={lists} onChange={setLists} />

      <AutomationAssessment
        canAutomate={automation.canAutomate}
        automationPct={automation.automationPct}
        horizon={automation.horizon}
        aiOpportunity={automation.aiOpportunity}
        onChange={setAutomation}
      />
    </ProcessStepShell>
  )
}
