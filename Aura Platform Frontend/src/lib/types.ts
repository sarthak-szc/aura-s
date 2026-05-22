export interface Client {
  _id: string
  name: string
  industry: string
  address: string
  contact_person: {
    name: string
    email: string
    phone: string
    designation: string
  }
  currency: string
  status: "active" | "inactive" | "deleted"
  assessment_count: number
  created_at: string
}

export interface Process {
  _id: string
  client_id: string
  process_name: string
  current_step: number
  status: "draft" | "in_progress" | "completed"
  assessment_date: string
}