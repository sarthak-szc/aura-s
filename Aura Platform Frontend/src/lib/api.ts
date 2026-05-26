import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  // localtunnel shows a browser warning page without this header
  if (config.baseURL?.includes("loca.lt")) {
    config.headers["Bypass-Tunnel-Reminder"] = "true"
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      document.cookie = "token=; path=/; max-age=0"
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login"
      }
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
}

export const clientAPI = {
  getAll: () => api.get("/api/v1/clients"),
  getOne: (id: string) => api.get(`/api/v1/clients/${id}`),
  create: (data: unknown) => api.post("/api/v1/clients", data),
  update: (id: string, data: unknown) =>
    api.post(`/api/v1/clients/${id}/update`, data),
  delete: (id: string) => api.post(`/api/v1/clients/${id}/delete`, {}),
}

export const processAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get("/api/v1/process", { params }),
  getOne: (id: string) => api.get(`/api/v1/process/${id}`),
  customerInfo: (data: unknown) => api.post("/api/v1/process/customer-info", data),
  saveCustomerInfo: (id: string, data: unknown) =>
    api.post(`/api/v1/process/${id}/customer-info`, data),
  processEntry: (id: string, data: unknown) =>
    api.post(`/api/v1/process/${id}/process-entry`, data),
  processDetails: (id: string, data: unknown) =>
    api.post(`/api/v1/process/${id}/process-details`, data),
  activityBreakdown: (id: string, data: unknown) =>
    api.post(`/api/v1/process/${id}/activity-breakdown`, data),
  generateActivities: (id: string) =>
    api.post(`/api/v1/process/${id}/activity-breakdown/generate`),
  generateGSDA: (id: string) =>
    api.post(`/api/v1/process/${id}/gsda-evaluation/generate`),
  saveGSDA: (id: string, data: unknown) =>
    api.post(`/api/v1/process/${id}/gsda-evaluation`, data),
  generateArchetypes: (id: string) =>
    api.post(`/api/v1/process/${id}/archetype-generation`),
  saveArchetypes: (id: string, data: unknown) =>
    api.post(`/api/v1/process/${id}/archetype-selection`, data),
  generateSummary: (
    id: string,
    data?: { report_fields?: Record<string, string>; payback?: Record<string, unknown> }
  ) => api.post(`/api/v1/process/${id}/generate-summary`, data || {}),
  saveEvaluationSummary: (
    id: string,
    data: { report_fields?: Record<string, string>; payback?: Record<string, unknown> }
  ) => api.post(`/api/v1/process/${id}/evaluation-summary`, data),
  complete: (id: string) => api.post(`/api/v1/process/${id}/complete`),
  uploadContext: (id: string, form: FormData) =>
    api.post(`/api/v1/process/${id}/upload-context-file`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  generateProcessEntry: (id: string) =>
    api.post(`/api/v1/process/${id}/process-entry/generate`),
  generateVolumetrics: (id: string) =>
    api.post(`/api/v1/process/${id}/process-details/generate`),
  generateTechStack: (id: string) =>
    api.post(`/api/v1/process/${id}/technology-stack/generate`),
  uploadActivityFile: (id: string, form: FormData) =>
    api.post(`/api/v1/process/${id}/activity-breakdown/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  activityStatus: (id: string) =>
    api.get(`/api/v1/process/${id}/activity-breakdown/status`),
}

export const reportAPI = {
  list: () => api.get("/api/v1/process/reports"),
  downloadPdf: (id: string) =>
    api.get(`/api/v1/process/${id}/export-pdf`, { responseType: "blob" }),
}

export const adminAPI = {
  users: () => api.get("/api/v1/admin/users"),
  auditLogs: () => api.get("/api/v1/admin/audit-logs"),
  createUser: (data: unknown) => api.post("/api/v1/admin/users", data),
  toggleUser: (id: string, is_active: boolean) =>
    api.post(`/api/v1/admin/users/${id}/toggle`, { is_active }),
}

export default api
