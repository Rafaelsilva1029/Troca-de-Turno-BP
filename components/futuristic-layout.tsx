"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { EnhancedSidebar } from "@/components/enhanced-sidebar"
import { FuturisticHeader } from "@/components/futuristic-header"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface FuturisticLayoutProps {
  children: React.ReactNode
  theme: "dark" | "light"
  toggleTheme: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function FuturisticLayout({ children, theme, toggleTheme, activeTab, setActiveTab }: FuturisticLayoutProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 1024px)")

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && sidebarOpen) {
        const sidebar = document.getElementById("mobile-sidebar")
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setSidebarOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobile, sidebarOpen])

  return (
    <div className={`${theme} min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <EnhancedSidebar activeItem={activeTab} onItemClick={setActiveTab} theme={theme} toggleTheme={toggleTheme} />
      </div>

      {/* Mobile Sidebar */}
      {isMobile && (
        <div
          id="mobile-sidebar"
          className={cn(
            "fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="relative h-full w-72 bg-slate-900 shadow-xl">
            <EnhancedSidebar
              activeItem={activeTab}
              onItemClick={(id) => {
                setActiveTab(id)
                setSidebarOpen(false)
              }}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </div>
          <div className="absolute inset-0 bg-black/50 -z-10" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn("min-h-screen transition-all duration-300", "lg:pl-64")}>
        <FuturisticHeader
          currentTime={currentTime}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />
        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    </div>
  )
}

// Adicionar exportação padrão para compatibilidade
export default FuturisticLayout
