"use client"

import type { ReactNode } from "react"

export function FieldLabel({
  children,
  required,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 block">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export function SectionTitle({ icon, title }: { icon?: string; title: string }) {
  return (
    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
      {icon && <span>{icon}</span>}
      {title}
    </h3>
  )
}

export function StepSectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-1">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function InfoBanner({
  variant = "blue",
  children,
}: {
  variant?: "yellow" | "blue" | "purple"
  children: ReactNode
}) {
  const styles = {
    yellow: "bg-amber-50 border-amber-200 text-amber-900",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
  }
  return (
    <div className={`rounded-lg border px-4 py-2.5 text-xs leading-relaxed ${styles[variant]}`}>
      {children}
    </div>
  )
}

const draftPlaceholder =
  "placeholder:text-slate-300 placeholder:italic placeholder:font-normal"

export function FormInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${draftPlaceholder} ${className}`}
      {...props}
    />
  )
}

export function FormSelect({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function FormTextarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${draftPlaceholder} ${className}`}
      {...props}
    />
  )
}

export function InputWithSuffix({
  label,
  required,
  value,
  onChange,
  suffix,
  suffixOptions,
  onSuffixChange,
  type = "number",
  min,
  max,
  placeholder,
  readOnly,
}: {
  label: string
  required?: boolean
  value: string | number
  onChange?: (v: string) => void
  suffix: string
  suffixOptions?: string[]
  onSuffixChange?: (v: string) => void
  type?: string
  min?: number
  max?: number
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div
        className={`flex overflow-hidden rounded-lg border border-slate-200 ${
          readOnly ? "bg-slate-50" : "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500"
        }`}
      >
        <input
          type={type}
          min={min}
          max={max}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={readOnly ? undefined : (e) => onChange?.(e.target.value)}
          className={`flex-1 min-w-0 border-0 px-3 py-2.5 text-sm focus:ring-0 ${
            readOnly ? "cursor-not-allowed bg-slate-50 text-slate-700" : draftPlaceholder
          }`}
        />
        {suffixOptions && onSuffixChange ? (
          <select
            value={suffix}
            onChange={(e) => onSuffixChange(e.target.value)}
            className="border-l border-slate-200 bg-slate-50 text-xs text-slate-600 px-2 py-2.5 max-w-[110px]"
          >
            {suffixOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <span className="border-l border-slate-200 bg-slate-50 text-xs text-slate-500 px-3 py-2.5 flex items-center shrink-0">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Type system name and press Enter",
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const add = (raw: string) => {
    const t = raw.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
  }
  return (
    <div className="border border-slate-200 rounded-lg px-2 py-2 min-h-[44px] flex flex-wrap gap-1.5 items-center focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full"
        >
          {tag}
          <button
            type="button"
            className="text-slate-400 hover:text-red-500"
            onClick={() => onChange(tags.filter((x) => x !== tag))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] text-sm border-0 focus:ring-0 py-1 px-1"
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            add((e.target as HTMLInputElement).value)
            ;(e.target as HTMLInputElement).value = ""
          }
        }}
      />
    </div>
  )
}

export function GoalList({
  goals,
  onChange,
}: {
  goals: string[]
  onChange: (goals: string[]) => void
}) {
  return (
    <div className="space-y-2">
      {goals.map((g, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-blue-500 shrink-0" title="Goal">
            ℹ
          </span>
          <input
            value={g}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Goal / outcome"
            onChange={(e) => {
              const u = [...goals]
              u[i] = e.target.value
              onChange(u)
            }}
          />
          <button
            type="button"
            className="text-slate-400 hover:text-red-500 px-2"
            onClick={() => onChange(goals.filter((_, idx) => idx !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...goals, ""])}
        className="text-blue-600 text-xs font-medium hover:underline"
      >
        + Add Goal / Outcome
      </button>
    </div>
  )
}

export function SummaryMetricCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div
      className="rounded-xl p-5 text-white shadow-sm"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  )
}

export function BtnPrimary({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#1570ef] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#175cd3] disabled:opacity-50 shadow-sm ${className}`}
    >
      {children}
    </button>
  )
}

export function BtnPurple({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export function BtnAIGenerate({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, #1570ef 0%, #7c3aed 100%)",
      }}
    >
      {children}
    </button>
  )
}
