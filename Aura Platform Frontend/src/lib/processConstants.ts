export const CURRENCIES = [
  { code: "INR", label: "INR - ₹ Indian Rupee", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", label: "USD - $ US Dollar", symbol: "$", name: "US Dollar" },
  { code: "EUR", label: "EUR - € Euro", symbol: "€", name: "Euro" },
  { code: "GBP", label: "GBP - £ British Pound", symbol: "£", name: "British Pound" },
] as const

export const BUSINESS_FUNCTIONS = [
  "Finance",
  "Human Resources",
  "Operations",
  "Sales",
  "Marketing",
  "IT",
  "Procurement",
  "Customer Service",
] as const

export const PROCESS_AREAS: Record<string, string[]> = {
  Finance: [
    "Accounts Payable",
    "Accounts Receivable",
    "General Ledger",
    "Treasury",
    "Tax & Compliance",
  ],
  "Human Resources": ["Recruitment", "Payroll", "Onboarding", "Performance Management"],
  Operations: ["Supply Chain", "Inventory", "Production Planning", "Quality Control"],
  Sales: ["Order Management", "Pricing", "Contract Management"],
  Marketing: ["Campaign Management", "Lead Generation", "Content Operations"],
  IT: ["Service Desk", "Infrastructure", "Application Support"],
  Procurement: ["Vendor Management", "Purchase Orders", "Sourcing"],
  "Customer Service": ["Case Management", "Returns", "Billing Support"],
}

export function formatAssessmentDate(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function assessmentDateToIso(display: string): string {
  const m = display.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return display
}

export function assessmentDateFromIso(iso: string): string {
  if (!iso) return formatAssessmentDate()
  if (iso.includes("-") && iso.length === 10 && iso[4] === "-") {
    const [y, mo, d] = iso.split("-")
    return `${d}-${mo}-${y}`
  }
  return iso
}
