import type React from "react"
import { cn } from "@/lib/utils"

export default function ProgramacaoTurnoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 futuristic-grid">
      {/* Could add a module-specific header or breadcrumbs here if needed */}
      {/* For now, relying on the global header potentially set in the main dashboard layout */}
      <main className={cn("p-4 md:p-6 lg:p-8")}>{children}</main>
    </div>
  )
}
