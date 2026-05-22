import type { Metadata } from "next"
import "./globals.css"
import Sidebar from "@/components/layout/Sidebar"

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
      <body>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <main className="flex-1 overflow-auto min-w-0 text-slate-900 bg-slate-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}