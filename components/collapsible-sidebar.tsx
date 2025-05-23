"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  FileText,
  Truck,
  PenToolIcon as Tool,
  CheckCircle,
  Users,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Sun,
  Moon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { StatusItem } from "@/components/status-item"

interface SidebarProps {
  activeItem?: string
  onItemClick?: (id: string) => void
  className?: string
  theme: "dark" | "light"
  toggleTheme: () => void
}

export function CollapsibleSidebar({
  activeItem = "programacao",
  onItemClick,
  className,
  theme,
  toggleTheme,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    }
  }

  const handleItemClick = (id: string) => {
    if (onItemClick) {
      onItemClick(id)
    }
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const navItems = [
    { id: "programacao", label: "Programação", icon: Calendar, notifications: 0 },
    { id: "pendencias", label: "Pendências", icon: Tool, notifications: 5 },
    { id: "veiculos", label: "Veículos", icon: Truck, notifications: 0 },
    { id: "liberados", label: "Liberados", icon: CheckCircle, notifications: 2 },
    { id: "equipe", label: "Equipe", icon: Users, notifications: 0 },
    { id: "relatorios", label: "Relatórios", icon: FileText, notifications: 0 },
    { id: "comunicacoes", label: "Comunicações", icon: MessageSquare, notifications: 3 },
    { id: "configuracoes", label: "Configurações", icon: Settings, notifications: 0 },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile toggle button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="fixed top-4 left-4 z-50 md:hidden bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          {mobileOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      )}

      <Card
        className={cn(
          "bg-slate-900/50 border-slate-700/50 backdrop-blur-sm transition-all duration-300 h-full",
          collapsed && !mobileOpen ? "w-[70px]" : "w-[240px]",
          isMobile && "fixed left-0 top-0 bottom-0 z-50",
          isMobile && !mobileOpen && "-translate-x-full",
          className,
        )}
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Logo area */}
          <div className="flex items-center justify-between mb-6 mt-2">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-slate-100">Dashboard</span>
              </div>
            )}

            {/* Collapse toggle button (desktop only) */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-8 w-8 text-slate-400 hover:text-slate-100"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            <TooltipProvider>
              {navItems.map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start relative",
                        activeItem === item.id
                          ? "bg-slate-800/70 text-green-400"
                          : "text-slate-400 hover:text-slate-100",
                      )}
                      onClick={() => handleItemClick(item.id)}
                    >
                      <item.icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-2")} />
                      {!collapsed && <span>{item.label}</span>}

                      {item.notifications > 0 && (
                        <Badge
                          className={cn(
                            "bg-green-600 text-white text-xs absolute",
                            collapsed ? "right-1 top-1" : "right-2",
                          )}
                        >
                          {item.notifications}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </TooltipProvider>
          </nav>

          {/* System status */}
          <div className={cn("mt-4 pt-4 border-t border-slate-700/50", collapsed && "hidden")}>
            <div className="text-xs text-slate-500 mb-2 font-mono">STATUS DO SISTEMA</div>
            <div className="space-y-3">
              <StatusItem label="Banco de Dados" value={95} color="green" />
              <StatusItem label="Sincronização" value={87} color="green" />
              <StatusItem label="Rede" value={92} color="yellow" />
            </div>
          </div>

          {/* Theme toggle */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="text-slate-400 hover:text-slate-100"
                  >
                    {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alternar tema</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default CollapsibleSidebar
