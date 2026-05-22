"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Step1 from "../[id]/step/1/page"

function NewProcess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const client_id = searchParams.get("client_id") || ""

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-4">Start New Process Discovery</h2>
      <Step1/>
    </div>
  )
}

export default function NewProcessPage() {
  return (
    <Suspense>
      <NewProcess/>
    </Suspense>
  )
}