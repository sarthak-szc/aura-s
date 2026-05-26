"use client"

import { usePathname, useRouter } from "next/navigation"
import { useStoredUser } from "@/hooks/useStoredUser"

export default function AppTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, mounted } = useStoredUser()

  if (pathname === "/login") return null
  if (pathname === "/dashboard") return null
  if (pathname.startsWith("/process/") && pathname.includes("/step/")) return null

  const roleLabel = (mounted && user?.role ? user.role : "admin").replace(/_/g, " ")

  const titles: Record<string, string> = {
    "/clients": "Client Management",
    "/reports": "Reports",
    "/admin": "Admin Panel",
    "/process": "Process Discovery",
  }
  let title = "AuRA"
  for (const [p, t] of Object.entries(titles)) {
    if (pathname.startsWith(p)) title = t
  }

  return (
    <header className="shrink-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <span className="text-sm capitalize text-slate-500">{roleLabel}</span>
    </header>
  )
}
