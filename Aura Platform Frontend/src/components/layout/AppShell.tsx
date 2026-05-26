"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import AppTopBar from "@/components/layout/AppTopBar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/login"

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 ml-60 h-screen">
        <AppTopBar />
        <main className="flex-1 overflow-y-auto text-slate-900 bg-slate-50">{children}</main>
      </div>
    </div>
  )
}
