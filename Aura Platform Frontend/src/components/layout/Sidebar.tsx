"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  LayoutDashboard,
  Search,
  Users,
  BarChart3,
  Settings,
  MoreVertical,
} from "lucide-react"
import { clearSession } from "@/lib/auth"
import { useStoredUser } from "@/hooks/useStoredUser"
import { processAPI } from "@/lib/api"
import AppBrandLogo from "@/components/layout/AppBrandLogo"

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Process Discovery", href: "/process", icon: Search, badge: true },
  { label: "Client Management", href: "/clients", icon: Users },
]

const analyticsNav = [
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Admin Panel", href: "/admin", icon: Settings, adminTag: true },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const { user, mounted } = useStoredUser()
  const [inProgressCount, setInProgressCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = mounted && user?.name ? user.name : "Admin"
  const displayRole = mounted && user?.role ? user.role : "Administrator"
  const avatarLetter = (mounted && user?.name ? user.name : "A").charAt(0).toUpperCase()

  useEffect(() => {
    processAPI
      .getAll()
      .then((r) => {
        const n = (r.data.processes || []).filter(
          (p: { status: string }) => p.status === "in_progress"
        ).length
        setInProgressCount(n)
      })
      .catch(() => {})
  }, [path])

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [menuOpen])

  if (path === "/login") return null

  const signOut = () => {
    clearSession()
    router.refresh()
    router.push("/login")
  }

  const linkClass = (href: string) => {
    const active = path === href || (href !== "/dashboard" && path.startsWith(href))
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-[3px] ${
      active
        ? "bg-blue-50 text-blue-700 border-blue-600"
        : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      <div className="shrink-0 border-b border-slate-100 px-4 py-4">
        <AppBrandLogo compact />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-400">MAIN</p>
          <div className="space-y-0.5">
            {mainNav.map(({ label, href, icon: Icon, badge }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon size={18} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && inProgressCount > 0 && (
                  <span className="min-w-[22px] rounded-full bg-[#1570ef] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                    {inProgressCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-400">ANALYTICS</p>
          <div className="space-y-0.5">
            {analyticsNav.map(({ label, href, icon: Icon, adminTag }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon size={18} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {adminTag && (
                  <span className="text-[10px] font-semibold text-red-500">Admin</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {avatarLetter}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{displayRole}</p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 text-slate-400 hover:text-slate-600"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="absolute bottom-full right-0 z-50 mb-1 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    signOut()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
