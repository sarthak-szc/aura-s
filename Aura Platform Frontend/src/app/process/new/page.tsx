"use client"
import { Suspense } from "react"
import CustomerDetailsStep from "../[id]/step/1/page"

export default function NewProcessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading...</div>}>
      <CustomerDetailsStep />
    </Suspense>
  )
}
