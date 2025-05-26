"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FixedSidebar } from "@/components/fixed-sidebar"
import { FuturisticHeader } from "@/components/futuristic-header"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
  theme: "dark" | "light"
  toggleTheme: () => void
  activeTab: string
  setActiveTab: (id: string) => void
}

export function MainLayout({ children, theme, toggleTheme, activeTab, setActiveTab }: MainLayoutProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Check if mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100", theme)}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <FixedSidebar activeItem={activeTab} onItemClick={setActiveTab} theme={theme} toggleTheme={toggleTheme} />
      </div>

      {/* Mobile Sidebar - Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <FixedSidebar
            activeItem={activeTab}
            onItemClick={(id) => {
              setActiveTab(id)
              setIsMobileSidebarOpen(false)
            }}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          "lg:ml-64", // Adjust based on sidebar width
        )}
      >
        <FuturisticHeader
          currentTime={currentTime}
          onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isMobile={isMobile}
        />

        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    </div>
  )
}
