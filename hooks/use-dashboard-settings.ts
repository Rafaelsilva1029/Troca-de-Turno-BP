"use client"

import { useState, useEffect } from "react"

type DashboardTheme = "dark" | "light" | "system"
type DashboardLayout = "default" | "compact" | "expanded"

interface DashboardSettings {
  theme: DashboardTheme
  sidebarOpen: boolean
  layout: DashboardLayout
  animations: boolean
  notifications: boolean
}

const DEFAULT_SETTINGS: DashboardSettings = {
  theme: "dark",
  sidebarOpen: true,
  layout: "default",
  animations: true,
  notifications: true,
}

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem("dashboard-settings")
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }
        setIsLoaded(true)
      } catch (error) {
        console.error("Failed to load dashboard settings:", error)
        setIsLoaded(true)
      }
    }

    loadSettings()
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("dashboard-settings", JSON.stringify(settings))
    }
  }, [settings, isLoaded])

  const updateSettings = (newSettings: Partial<DashboardSettings>) => {
    setSettings((current) => ({ ...current, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoaded,
  }
}
