"use client"

import type React from "react"
import { useState } from "react"
import { ResponsiveHeader } from "@/components/dashboard/responsive-header"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-manager"
import { AudioProvider } from "@/lib/audio-service"
import { Toaster } from "@/components/ui/toaster"
import { ParticleBackground } from "@/components/particle-background"
import { useDeviceType } from "@/hooks/use-device-type"
import { cn } from "@/lib/utils"

// Importar a nova sidebar organizada
import { OrganizedSidebar } from "@/components/dashboard/organized-sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const deviceType = useDeviceType()

  // Simular usuário para demonstração - em produção, usar getCurrentUser()
  const user = {
    id: "1",
    name: "João Silva",
    email: "joao@brancoperes.com",
    role: "admin" as const,
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Calcular margem do conteúdo principal baseado no dispositivo
  const getMainContentMargin = () => {
    switch (deviceType) {
      case "mobile":
      case "tablet":
        return "ml-0" // Sem margem, sidebar é overlay
      case "desktop":
        return sidebarOpen ? "ml-[250px]" : "ml-[70px]" // Margem baseada no estado da sidebar
      default:
        return "ml-[250px]"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden">
      <ParticleBackground />

      {/* Sidebar */}
      <OrganizedSidebar user={user} isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content */}
      <div className={cn("min-h-screen transition-all duration-300 ease-in-out", getMainContentMargin())}>
        <ResponsiveHeader user={user} onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

        <main className="p-4 md:p-6">{children}</main>
      </div>

      <Toaster />
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AudioProvider>
        <NotificationProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </NotificationProvider>
      </AudioProvider>
    </ThemeProvider>
  )
}
