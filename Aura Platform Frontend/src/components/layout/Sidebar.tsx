"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Search, Users, BarChart3, Settings } from "lucide-react"

const nav = [
  { label: "Dashboard",         href: "/dashboard",  icon: LayoutDashboard },
  { label: "Process Discovery", href: "/process",    icon: Search },
  { label: "Client Management", href: "/clients",    icon: Users },
  { label: "Reports",           href: "/reports",    icon: BarChart3 },
  { label: "Admin Panel",       href: "/admin",      icon: Settings },
]

export default function Sidebar() {
  const path = usePathname()
  if (path === "/login") return null
  return (
    <aside className="w-60 min-h-screen bg-[#0f172a] flex flex-col">
      <div className="p-5 border-b border-slate-700">
        <span className="text-white font-bold text-xl">AuRA</span>
        <span className="text-slate-300 text-xs block">AI DISCOVERY</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${path.startsWith(href)
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-100 hover:bg-slate-800 hover:text-white"}`}>
            <Icon size={16} className={path.startsWith(href) ? "text-white" : "text-slate-200"} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}