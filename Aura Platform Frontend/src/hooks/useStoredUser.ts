"use client"

import { useEffect, useState } from "react"
import { getStoredUser } from "@/lib/auth"

export type StoredUser = { role?: string; email?: string; name?: string } | null

/** Reads localStorage user only after mount — avoids SSR hydration mismatch. */
export function useStoredUser() {
  const [user, setUser] = useState<StoredUser>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setUser(getStoredUser())
    setMounted(true)
  }, [])

  return { user, mounted }
}
