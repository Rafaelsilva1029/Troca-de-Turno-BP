import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-manager"
import { AudioProvider } from "@/lib/audio-service"
import { Toaster } from "@/components/ui/toaster"
import { ParticleBackground } from "@/components/particle-background"

export const metadata: Metadata = {
  title: "Dashboard | Branco Peres Agribusiness",
  description: "Painel de controle do sistema de gestão Branco Peres Agribusiness",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar se o usuário está autenticado
  const user = await getCurrentUser()

  // Se não estiver autenticado, redirecionar para o login
  if (!user) {
    redirect("/login?redirectTo=/dashboard")
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AudioProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden">
            <ParticleBackground />

            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <DashboardSidebar user={user} />

              {/* Main content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader user={user} />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
              </div>
            </div>

            <Toaster />
          </div>
        </NotificationProvider>
      </AudioProvider>
    </ThemeProvider>
  )
}
