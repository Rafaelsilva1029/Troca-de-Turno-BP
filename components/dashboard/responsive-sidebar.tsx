"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Settings,
  PenToolIcon as Tool,
  Truck,
  Users,
  MapPin,
  X,
  Brain,
  Database,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { UserProfile } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-device-type"

interface ResponsiveSidebarProps {
  user: UserProfile
  isOpen?: boolean
  onToggle?: () => void
}

export function ResponsiveSidebar({ user, isOpen = false, onToggle }: ResponsiveSidebarProps) {
  const pathname = usePathname()
  const deviceType = useDeviceType()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(isOpen)
  const sidebarRef = useRef<HTMLElement>(null)

  // Verificar preferência do usuário para o estado da barra lateral (apenas desktop)
  useEffect(() => {
    if (deviceType === "desktop") {
      const savedState = localStorage.getItem("sidebarCollapsed")
      if (savedState !== null) {
        setCollapsed(savedState === "true")
      }
    } else {
      setCollapsed(false) // Sempre expandida em mobile/tablet quando aberta
    }
  }, [deviceType])

  // Sincronizar com prop isOpen
  useEffect(() => {
    setMobileOpen(isOpen)
  }, [isOpen])

  // Fechar sidebar ao clicar fora (mobile/tablet)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (deviceType === "mobile" || deviceType === "tablet") &&
        mobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setMobileOpen(false)
        onToggle?.()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [deviceType, mobileOpen, onToggle])

  // Fechar sidebar ao pressionar ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileOpen && deviceType !== "desktop") {
        setMobileOpen(false)
        onToggle?.()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [mobileOpen, deviceType, onToggle])

  // Salvar preferência do usuário (apenas desktop)
  const toggleCollapsed = () => {
    if (deviceType === "desktop") {
      const newState = !collapsed
      setCollapsed(newState)
      localStorage.setItem("sidebarCollapsed", String(newState))
    }
  }

  // Fechar sidebar mobile ao navegar
  const handleNavigation = () => {
    if (deviceType === "mobile" || deviceType === "tablet") {
      setMobileOpen(false)
      onToggle?.()
    }
  }

  // Verificar se o usuário tem permissão para acessar uma rota
  const hasPermission = (requiredRole: string) => {
    const roleHierarchy: Record<string, number> = {
      admin: 4,
      manager: 3,
      operator: 2,
      viewer: 1,
    }

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  }

  // Itens de navegação
  const navItems = [
    // Módulos principais
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/pendencias",
      label: "Pendências Oficina",
      icon: Tool,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/veiculos",
      label: "Equipamentos Logística",
      icon: Truck,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/liberados",
      label: "Equipamentos Liberados",
      icon: CheckCircle,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/equipamentos-ativos",
      label: "Equipamentos Ativos",
      icon: TrendingUp,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/equipamentos-localizacao",
      label: "Equipamentos Localização",
      icon: MapPin,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/lavagem",
      label: "Lavagem e Lubrificação",
      icon: Activity,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/programacao",
      label: "Programação do Turno",
      icon: Calendar,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/relatorios",
      label: "Relatórios",
      icon: FileText,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/estatisticas",
      label: "Estatísticas",
      icon: BarChart3,
      requiredRole: "manager",
    },

    // Extratores de dados
    {
      href: "/extrator-dados",
      label: "Extrator de Dados",
      icon: Database,
      requiredRole: "viewer",
    },
    {
      href: "/extrator-avancado",
      label: "Extrator Avançado",
      icon: Database,
      requiredRole: "viewer",
    },
    {
      href: "/extrator-ultra-robusto",
      label: "Extrator Ultra Robusto",
      icon: Database,
      requiredRole: "viewer",
    },
    {
      href: "/extrator-simples",
      label: "Extrator Simples",
      icon: Database,
      requiredRole: "viewer",
    },
    {
      href: "/extrator-excel",
      label: "Extrator Excel",
      icon: Database,
      requiredRole: "viewer",
    },
    {
      href: "/extrator-simples-imagem",
      label: "Extrator Simples Imagem",
      icon: Database,
      requiredRole: "viewer",
    },
    {
      href: "/extrator-ultra-avancado",
      label: "Extrator Ultra Avançado",
      icon: Database,
      requiredRole: "viewer",
    },
    {
      href: "/extrator-multi-formato",
      label: "Extrator Multi-Formato",
      icon: Database,
      requiredRole: "viewer",
    },

    // Módulos de IA
    {
      href: "/extrator-ia",
      label: "Extrator IA",
      icon: Brain,
      requiredRole: "viewer",
    },
    {
      href: "/ia-ultra-avancada",
      label: "IA Ultra-Avançada",
      icon: Brain,
      requiredRole: "viewer",
    },
    {
      href: "/teste-deteccao",
      label: "Teste Detecção",
      icon: Brain,
      requiredRole: "viewer",
    },
    {
      href: "/ia-extracao",
      label: "IA Extração",
      icon: Brain,
      requiredRole: "viewer",
    },
    {
      href: "/teste-ia",
      label: "Teste IA",
      icon: Brain,
      requiredRole: "viewer",
    },

    // Administração
    {
      href: "/dashboard/usuarios",
      label: "Usuários",
      icon: Users,
      requiredRole: "admin",
    },
    {
      href: "/dashboard/configuracoes",
      label: "Configurações",
      icon: Settings,
      requiredRole: "viewer",
    },
  ].filter((item) => hasPermission(item.requiredRole))

  // Configurações baseadas no tipo de dispositivo
  const getSidebarConfig = () => {
    switch (deviceType) {
      case "mobile":
        return {
          width: mobileOpen ? "w-[280px]" : "w-0",
          position: "fixed inset-y-0 left-0 z-50",
          showOverlay: mobileOpen,
          showToggleButton: false, // Botão será no header
          collapsible: false,
        }
      case "tablet":
        return {
          width: mobileOpen ? "w-[240px]" : "w-0",
          position: "fixed inset-y-0 left-0 z-40",
          showOverlay: mobileOpen,
          showToggleButton: false,
          collapsible: false,
        }
      case "desktop":
        return {
          width: collapsed ? "w-[70px]" : "w-[250px]",
          position: "fixed inset-y-0 left-0 z-30",
          showOverlay: false,
          showToggleButton: true,
          collapsible: true,
        }
      default:
        return {
          width: "w-[250px]",
          position: "fixed inset-y-0 left-0 z-30",
          showOverlay: false,
          showToggleButton: true,
          collapsible: true,
        }
    }
  }

  const config = getSidebarConfig()
  const isVisible = deviceType === "desktop" || mobileOpen

  return (
    <>
      {/* Overlay para mobile/tablet */}
      {config.showOverlay && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => {
            setMobileOpen(false)
            onToggle?.()
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        data-sidebar="main"
        className={cn(
          "bg-slate-900 border-r border-slate-700/50 h-screen flex flex-col transition-all duration-300 ease-in-out",
          config.position,
          config.width,
          !isVisible && "overflow-hidden",
        )}
        style={{
          zIndex: deviceType === "mobile" ? 50 : deviceType === "tablet" ? 40 : 30,
          transform: !isVisible && deviceType !== "desktop" ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        {/* Header da Sidebar */}
        <div className="flex flex-col border-b border-slate-700/50 px-4 py-3 bg-slate-900 min-h-[80px]">
          {/* Logo e botão de fechar (mobile/tablet) */}
          <div className="flex items-center justify-between mb-4">
            {(!collapsed || deviceType !== "desktop") && (
              <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavigation}>
                <Image src="/branco-peres-logo.png" alt="Branco Peres" width={32} height={32} className="rounded-sm" />
                <span className="font-bold text-lg text-white">Branco Peres</span>
              </Link>
            )}

            {collapsed && deviceType === "desktop" && (
              <Link href="/dashboard" className="mx-auto">
                <Image src="/branco-peres-logo.png" alt="Branco Peres" width={32} height={32} className="rounded-sm" />
              </Link>
            )}

            {/* Botão de fechar para mobile/tablet */}
            {(deviceType === "mobile" || deviceType === "tablet") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMobileOpen(false)
                  onToggle?.()
                }}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Botão de colapsar (apenas desktop) */}
          {config.showToggleButton && config.collapsible && (
            <div className="flex justify-end pt-2 border-t border-slate-700/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 bg-slate-900">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const showTooltip = collapsed && deviceType === "desktop"

              const linkContent = (
                <Link
                  href={item.href}
                  onClick={handleNavigation}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full",
                    isActive
                      ? "bg-green-600/20 text-green-400"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5 flex-shrink-0", collapsed && deviceType === "desktop" ? "mx-auto" : "mr-3")}
                  />
                  {(!collapsed || deviceType !== "desktop") && <span className="truncate">{item.label}</span>}
                </Link>
              )

              return (
                <li key={item.href}>
                  {showTooltip ? (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    linkContent
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-slate-700/50 p-4 bg-slate-900",
            collapsed && deviceType === "desktop" ? "text-center" : "",
          )}
        >
          <div className="text-xs text-slate-500">
            {(!collapsed || deviceType !== "desktop") && (
              <>
                <p>Branco Peres Agribusiness</p>
                <p>v1.0.0 - {new Date().getFullYear()}</p>
              </>
            )}
            {collapsed && deviceType === "desktop" && <p>BP</p>}
          </div>
        </div>
      </aside>
    </>
  )
}
