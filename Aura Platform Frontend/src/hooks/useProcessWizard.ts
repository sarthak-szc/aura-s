"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { processAPI } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/apiError"

export function useProcessWizard() {
  const router = useRouter()
  const { id } = useParams()
  const processId = id as string

  const [currency, setCurrency] = useState("INR")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!processId) return
    processAPI
      .getOne(processId)
      .then((r) => {
        const c = r.data.currency || r.data.steps_data?.step1?.currency || "INR"
        setCurrency(c)
      })
      .catch(() => {})
  }, [processId])

  const onCancel = () => router.push("/dashboard")
  const goToStep = (step: number) => {
    const id = String(processId || "").trim()
    if (!id || id === "undefined" || id === "new") {
      setError("Process ID missing — complete Step 1 or open this assessment from the dashboard.")
      return
    }
    const n = Math.min(7, Math.max(1, step))
    router.replace(`/process/${id}/step/${n}`)
  }
  const goPrevious = (step: number) => goToStep(step)
  const goNext = (step: number) => goToStep(step)

  const flashSuccess = () => {
    setSuccess("Saved successfully")
    setTimeout(() => setSuccess(""), 3000)
  }

  const loadProcess = async () => {
    const r = await processAPI.getOne(processId)
    return r.data
  }

  const setApiError = (err: unknown, fallback = "Something went wrong") => {
    setError(getApiErrorMessage(err, fallback))
  }

  return {
    processId,
    router,
    currency,
    error,
    setError,
    setApiError,
    success,
    setSuccess,
    loading,
    setLoading,
    saving,
    setSaving,
    onCancel,
    goPrevious,
    goNext,
    flashSuccess,
    loadProcess,
  }
}
