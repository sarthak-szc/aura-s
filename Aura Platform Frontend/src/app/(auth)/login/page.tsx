"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api"
import { setSession } from "@/lib/auth"

const ROLES = ["Admin", "Process Owner", "Viewer"] as const
type Role = (typeof ROLES)[number]

const ROLE_PRESETS: Record<Role, { email: string; password: string }> = {
  Admin: { email: "admin@aura.com", password: "Admin@123" },
  "Process Owner": { email: "process@senzcraft.com", password: "Process@123" },
  Viewer: { email: "viewer@senzcraft.com", password: "Viewer@123" },
}

const FEATURES = [
  "AI-Powered Process Discovery",
  "7-Step Progressive Assessment",
  "GSDA Evaluation Framework",
  "Multi-Currency ROI Scoring",
]

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("Admin")
  const [form, setForm] = useState(ROLE_PRESETS.Admin)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onRoleChange = (r: Role) => {
    setRole(r)
    setForm(ROLE_PRESETS[r])
    setError("")
  }

  const handleLogin = async () => {
    if (!form.email) {
      setError("Email is required")
      return
    }
    if (!form.password) {
      setError("Password is required")
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await authAPI.login(form)
      setSession(res.data.token, res.data.user)
      router.push("/dashboard")
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || "Invalid email or password")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full">
      {/* Left — brand panel */}
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-[44%] flex-col justify-between p-10 xl:p-12 text-white"
        style={{
          background: "linear-gradient(160deg, #0c1929 0%, #132f4c 45%, #1a4a6e 100%)",
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-10">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(90deg, #7dd3fc, #38bdf8, #f472b6, #fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              senzcraft
            </span>
          </div>

          <h1 className="text-5xl xl:text-6xl font-bold tracking-tight leading-none">
            <span className="text-white">Au</span>
            <span className="text-sky-300">RA</span>
          </h1>
          <p className="text-sky-200/90 text-xs font-semibold tracking-[0.2em] mt-3 uppercase">
            AI Discovery Framework
          </p>
          <p className="text-slate-300/90 text-sm leading-relaxed mt-6 max-w-md">
            Assess, understand, and recommend AI automation for your business
            processes — powered by SenzCraft.
          </p>

          <ul className="mt-10 space-y-3">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#eef1f6] px-6 py-10">
        <div className="w-full max-w-[420px]">
          <h2 className="text-3xl font-bold text-slate-900">Welcome back 👋</h2>
          <p className="text-slate-500 text-sm mt-1 mb-8">Sign in to your AuRA workspace</p>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 block">
                Sign In As
              </label>
              <select
                value={role}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                onChange={(e) => onRoleChange(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl bg-[#2563eb] py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign In → AuRA"}
            </button>
          </div>

          <p className="mt-12 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            Powered by
            <span
              className="font-semibold"
              style={{
                background: "linear-gradient(90deg, #38bdf8, #f472b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SenzCraft
            </span>
            Technologies
          </p>
        </div>
      </div>
    </div>
  )
}
