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
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FixedSidebarProps {
  activeItem: string
  onItemClick: (id: string) => void
  theme: "dark" | "light"
  toggleTheme: () => void
}

export function FixedSidebar({ activeItem, onItemClick, theme, toggleTheme }: FixedSidebarProps) {
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
    { id: "equipamentos-localizacao", label: "Equipamentos Localização", icon: MapPin },
  ]

  return (
    <div
      className={cn(
        "fixed left-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-300 ease-in-out bg-gradient-to-b from-slate-900 to-black border-r border-slate-700/30",
        expanded ? "w-64" : "w-20",
      )}
    >
      {/* Logo and header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
        {expanded ? (
          <div className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
              <img src="/branco-peres-logo.png" alt="Logo" className="w-8 h-8 object-contain relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400">BRANCO PERES</span>
              <span className="text-sm font-bold text-green-500">AGRIBUSINESS</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto relative w-10 h-10">
            <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
            <img src="/branco-peres-logo.png" alt="Logo" className="w-10 h-10 object-contain relative z-10" />
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

      {/* System name */}
      <div className={cn("py-4 text-center border-b border-slate-700/30", expanded ? "px-4" : "px-2")}>
        {expanded ? (
          <div>
            <h2 className="text-lg font-bold text-white tracking-wider">TROCA DE TURNO</h2>
            <div className="h-0.5 w-12 bg-green-500 mx-auto mt-1"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-white tracking-wider rotate-90 transform origin-center whitespace-nowrap">
              TROCA DE TURNO
            </span>
            <div className="h-0.5 w-6 bg-green-500 mx-auto mt-2"></div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <TooltipProvider>
          <nav className="space-y-1 px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeItem === item.id

              return expanded ? (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className={cn(
                    "flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-green-600/80 to-green-700/80 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                      : "hover:bg-slate-800/70 text-slate-400 hover:text-slate-200",
                  )}
                >
                  <div className={cn("p-1.5 rounded-md mr-3", isActive ? "bg-green-500/20" : "bg-slate-800/70")}>
                    <Icon className={cn("h-5 w-5", isActive ? "text-green-400" : "text-slate-400")} />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-5 bg-green-400 rounded-full"></div>}
                </button>
              ) : (
                <Tooltip key={item.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onItemClick(item.id)}
                      className={cn(
                        "flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-green-600/80 to-green-700/80 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                          : "hover:bg-slate-800/70 text-slate-400 hover:text-slate-200",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isActive ? "text-green-400" : "text-slate-400")} />
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

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/30 space-y-2">
        {expanded ? (
          <>
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
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
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
            >
              <Settings className="h-4 w-4 mr-3" />
              <span className="text-sm">Configurações</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
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
                    className="h-10 w-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
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
                    className="h-10 w-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
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
                    className="h-10 w-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
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
