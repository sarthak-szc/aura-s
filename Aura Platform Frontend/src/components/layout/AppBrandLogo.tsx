import SenzCraftBrand from "@/components/layout/SenzCraftBrand"

/** Main company + product lockup (sidebar, compact) */
export default function AppBrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-sm ${
          compact ? "h-9 w-9 text-sm" : "h-10 w-10 text-base"
        }`}
        style={{
          background: "linear-gradient(135deg, #1570ef 0%, #7c3aed 50%, #ec4899 100%)",
        }}
      >
        S
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <SenzCraftBrand className={compact ? "text-[14px]" : "text-[15px]"} />
        <p className="text-[13px] font-semibold leading-none tracking-tight text-slate-400">
          AuRA AI
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Discovery
        </p>
      </div>
    </div>
  )
}
