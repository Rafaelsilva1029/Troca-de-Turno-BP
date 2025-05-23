"use client"

import { useState, useEffect } from "react"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { AnimatedHeader } from "@/components/animated-header"
import { ParticleBackground } from "@/components/particle-background"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import heavy components to improve initial load time
const DashboardContent = dynamic(() => import("@/components/dashboard-content"), {
  loading: () => <div className="p-12 text-center">Loading dashboard content...</div>,
  ssr: false,
})

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("programacao")
  const [databaseError, setDatabaseError] = useState<string | null>(null)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Simulate loading screen for a better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [])

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Handle sidebar item click
  const handleSidebarItemClick = (id: string) => {
    setActiveTab(id)
  }

  return (
    <div
      className={`${theme} min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden`}
    >
      {/* Background particle effect */}
      <ParticleBackground />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-r-yellow-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
              <div className="absolute inset-6 border-4 border-b-red-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
              <div className="absolute inset-8 border-4 border-l-yellow-500 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
            </div>
            <div className="mt-4 text-green-500 font-mono text-sm tracking-wider">INICIALIZANDO SISTEMA</div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-2 sm:px-4 relative z-10">
        {/* Header */}
        <AnimatedHeader theme={theme} toggleTheme={toggleTheme} currentTime={currentTime} />

        {/* Espaçador para compensar o header fixo */}
        <div className="h-24"></div>

        {/* Main content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <CollapsibleSidebar
              activeItem={activeTab}
              onItemClick={handleSidebarItemClick}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </div>

          {/* Main content area */}
          <div className="col-span-12 md:col-span-9 lg:col-span-10">
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-100 flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-green-500" />
                      Painel de Controle
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-slate-800/50 text-green-400 border-green-500/50 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></div>
                        ATIVO
                      </Badge>
                      <div className="text-sm text-slate-400">
                        {formatDate(currentTime)} | {formatTime(currentTime)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Database Error Alert */}
              {databaseError && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro de Conexão</AlertTitle>
                  <AlertDescription>
                    {databaseError} Você pode continuar trabalhando offline e tentar sincronizar mais tarde.
                  </AlertDescription>
                </Alert>
              )}

              {/* Main Content */}
              {!isLoading && <DashboardContent activeTab={activeTab} theme={theme} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
