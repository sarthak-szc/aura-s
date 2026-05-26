/** Turn FastAPI / axios error payloads into a safe string for React UI. */
export function formatApiError(detail: unknown, fallback = "Something went wrong"): string {
  if (detail == null || detail === "") return fallback
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && "msg" in item) {
        const o = item as { msg?: string; loc?: unknown[] }
        const field = Array.isArray(o.loc)
          ? o.loc.filter((x) => x !== "body").join(".")
          : ""
        return field ? `${field}: ${o.msg}` : String(o.msg ?? fallback)
      }
      return String(item)
    })
    return parts.filter(Boolean).join("; ") || fallback
  }
  if (typeof detail === "object" && detail !== null) {
    if ("msg" in detail) return String((detail as { msg: string }).msg)
    if ("message" in detail) return String((detail as { message: string }).message)
  }
  return fallback
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const e = err as {
    response?: { data?: { detail?: unknown; message?: string } }
    message?: string
  }
  const data = e?.response?.data
  if (data?.detail !== undefined) return formatApiError(data.detail, fallback)
  if (data?.message) return formatApiError(data.message, fallback)
  if (e?.message && !e.message.includes("Network Error")) return e.message
  return fallback
}
