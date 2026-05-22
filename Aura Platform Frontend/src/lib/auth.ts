export function setSession(token: string, user: object) {
  const maxAge = 24 * 60 * 60
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
}

export function clearSession() {
  document.cookie = "token=; path=/; max-age=0"
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export function getStoredUser(): { role?: string; email?: string; name?: string } | null {
  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
