"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  PenToolIcon as Tool,
  Truck,
  CheckCircle,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EnhancedSidebarProps {
  activeItem: string
  onItemClick: (id: string) => void
  theme: "dark" | "light"
  toggleTheme: () => void
}

export function EnhancedSidebar({ activeItem, onItemClick, theme, toggleTheme }: EnhancedSidebarProps) {
  const [expanded, setExpanded] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Navigation items
  const navigationItems = [
    { id: "programacao", label: "Programação do Turno", icon: Calendar },
    { id: "pendencias", label: "Pendências Oficina", icon: Tool },
    { id: "veiculos", label: "Equipamentos Logística", icon: Truck },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "liberados", label: "Equipamentos Liberados", icon: CheckCircle },
    { id: "lavagem", label: "Lavagem e Lubrificação", icon: Activity },
    { id: "relatorios", label: "Relatórios", icon: FileText },
  ]

  return (
    <div
      className={cn(
        "fixed left-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-300 ease-in-out bg-gradient-to-b from-slate-900 to-black border-r border-slate-700/30",
        expanded ? "w-64" : "w-20",
      )}
    >
      {/* Logo and header with animation */}
      <div className="flex flex-col items-center p-4 border-b border-slate-700/30">
        <div className="flex items-center justify-between w-full mb-3">
          {expanded ? (
            <div className="flex items-center">
              <div className="relative w-10 h-10 mr-3">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse"></div>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-y6qW8slETHI3P7ZrH3hvmezn9NEOU2.png"
                  alt="Logo"
                  className="w-10 h-10 object-contain relative z-10 animate-spin-slow"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wider">TROCA DE TURNO</span>
                <span className="text-xs font-semibold text-slate-400">BRANCO PERES</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto relative w-12 h-12">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse"></div>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-y6qW8slETHI3P7ZrH3hvmezn9NEOU2.png"
                alt="Logo"
                className="w-12 h-12 object-contain relative z-10 animate-spin-slow"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
          >
            {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Animated line separator */}
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-500/50 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-shimmer"></div>
        </div>
      </div>

      {/* Navigation with improved spacing */}
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <TooltipProvider>
          <nav className="space-y-3">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeItem === item.id

              return expanded ? (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className={cn(
                    "flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-green-600/80 to-green-700/80 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                      : "hover:bg-slate-800/70 text-slate-400 hover:text-slate-200",
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-md mr-3 transition-all duration-200",
                      isActive
                        ? "bg-green-500/20 group-hover:bg-green-500/30"
                        : "bg-slate-800/70 group-hover:bg-slate-700/70",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-green-400" : "text-slate-400 group-hover:text-slate-300",
                      )}
                    />
                  </div>
                  <span className="font-medium text-sm tracking-wide">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-5 bg-green-400 rounded-full animate-pulse"></div>}
                </button>
              ) : (
                <Tooltip key={item.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onItemClick(item.id)}
                      className={cn(
                        "flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200 group",
                        isActive
                          ? "bg-gradient-to-r from-green-600/80 to-green-700/80 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                          : "hover:bg-slate-800/70 text-slate-400 hover:text-slate-200",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-transform duration-200",
                          isActive
                            ? "text-green-400"
                            : "text-slate-400 group-hover:text-slate-300 group-hover:scale-110",
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </TooltipProvider>
      </div>

      {/* Footer with improved styling */}
      <div className="p-4 border-t border-slate-700/30 space-y-3">
        {expanded ? (
          <>
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-all duration-200"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 mr-3" />
                  <span className="text-sm">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-3" />
                  <span className="text-sm">Modo Escuro</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-all duration-200"
            >
              <Settings className="h-4 w-4 mr-3" />
              <span className="text-sm">Configurações</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span className="text-sm">Sair</span>
            </Button>
          </>
        ) : (
          <TooltipProvider>
            <div className="flex flex-col items-center space-y-4">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-10 w-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 transition-all duration-200 hover:text-slate-200"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
                  {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 transition-all duration-200 hover:text-slate-200"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
                  Configurações
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 transition-all duration-200 hover:text-slate-200"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
                  Sair
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
