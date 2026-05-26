import type { Metadata } from "next"
import "./globals.css"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "AuRA — AI Discovery",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}