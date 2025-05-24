import type { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth"
import { DashboardOverview } from "@/components/dashboard/overview"
import { DashboardCharts } from "@/components/dashboard-charts"
import { ReminderSystem } from "@/components/reminder-system"

export const metadata: Metadata = {
  title: "Dashboard | Branco Peres Agribusiness",
  description: "Visão geral do sistema de gestão Branco Peres Agribusiness",
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null // Será tratado pelo layout
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bem-vindo, {user.fullName}</h1>

      <DashboardOverview />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCharts />
        <ReminderSystem />
      </div>
    </div>
  )
}
