import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function readToken(request: NextRequest): string | undefined {
  const raw = request.cookies.get("token")?.value
  if (!raw) return undefined
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function middleware(request: NextRequest) {
  const token = readToken(request)
  const isLoginPage = request.nextUrl.pathname === "/login"

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}