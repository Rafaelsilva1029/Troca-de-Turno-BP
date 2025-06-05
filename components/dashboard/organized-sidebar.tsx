"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  MapPin,
  Settings,
  PenToolIcon as Tool,
  Truck,
  Users,
  Brain,
  Database,
  Zap,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { UserProfile } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-device-type"

interface OrganizedSidebarProps {
  user: UserProfile
  isOpen?: boolean
  onToggle?: () => void
}

interface NavSection {
  title: string
  icon: any
  items: NavItem[]
}

interface NavItem {
  href: string
  label: string
  icon: any
  requiredRole: string
}

export function OrganizedSidebar({ user, isOpen = false, onToggle }: OrganizedSidebarProps) {
  const pathname = usePathname()
  const deviceType = useDeviceType()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(isOpen)
  const [expandedSections, setExpandedSections] = useState<string[]>(["main", "extractors"])

  // Verificar preferência do usuário para o estado da barra lateral (apenas desktop)
  useEffect(() => {
    if (deviceType === "desktop") {
      const savedState = localStorage.getItem("sidebarCollapsed")
      if (savedState !== null) {
        setCollapsed(savedState === "true")
      }
    }
  }, [deviceType])

  // Sincronizar com prop isOpen
  useEffect(() => {
    setMobileOpen(isOpen)
  }, [isOpen])

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

  // Seções organizadas de navegação
  const navSections: NavSection[] = [
    {
      title: "Principal",
      icon: Home,
      items: [
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
          icon: Zap,
          requiredRole: "viewer",
        },
        {
          href: "/equipamentos-sistema",
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
      ].filter((item) => hasPermission(item.requiredRole)),
    },
    {
      title: "Extratores de Dados",
      icon: Database,
      items: [
        {
          href: "/extrator-dados",
          label: "Extrator Básico",
          icon: FileText,
          requiredRole: "viewer",
        },
        {
          href: "/extrator-simples",
          label: "Extrator Simples",
          icon: FileText,
          requiredRole: "viewer",
        },
        {
          href: "/extrator-avancado",
          label: "Extrator Avançado",
          icon: FileText,
          requiredRole: "viewer",
        },
        {
          href: "/extrator-ultra-robusto",
          label: "Extrator Ultra Robusto",
          icon: FileText,
          requiredRole: "viewer",
        },
        {
          href: "/extrator-ultra-avancado",
          label: "Extrator Ultra Avançado",
          icon: FileText,
          requiredRole: "viewer",
        },
        {
          href: "/extrator-excel",
          label: "Extrator Excel",
          icon: FileText,
          requiredRole: "viewer",
        },
        {
          href: "/extrator-simples-imagem",
          label: "Extrator Imagem",
          icon: FileText,
          requiredRole: "viewer",
        },
        {
          href: "/extrator-multi-formato",
          label: "Extrator Multi-Formato",
          icon: FileText,
          requiredRole: "viewer",
        },
      ].filter((item) => hasPermission(item.requiredRole)),
    },
    {
      title: "Inteligência Artificial",
      icon: Brain,
      items: [
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
          href: "/ia-extracao",
          label: "IA Extração",
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
          href: "/teste-ia",
          label: "Teste IA",
          icon: Brain,
          requiredRole: "viewer",
        },
      ].filter((item) => hasPermission(item.requiredRole)),
    },
    {
      title: "Relatórios e Análises",
      icon: BarChart3,
      items: [
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
      ].filter((item) => hasPermission(item.requiredRole)),
    },
    {
      title: "Administração",
      icon: Settings,
      items: [
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
      ].filter((item) => hasPermission(item.requiredRole)),
    },
  ].filter((section) => section.items.length > 0)

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle) ? prev.filter((s) => s !== sectionTitle) : [...prev, sectionTitle],
    )
  }

  const handleNavigation = () => {
    if (deviceType === "mobile" || deviceType === "tablet") {
      setMobileOpen(false)
      onToggle?.()
    }
  }

  const toggleCollapsed = () => {
    if (deviceType === "desktop") {
      const newState = !collapsed
      setCollapsed(newState)
      localStorage.setItem("sidebarCollapsed", String(newState))
    }
  }

  // Configurações baseadas no tipo de dispositivo
  const getSidebarConfig = () => {
    switch (deviceType) {
      case "mobile":
        return {
          width: mobileOpen ? "w-[300px]" : "w-0",
          position: "fixed inset-y-0 left-0 z-50",
          showOverlay: mobileOpen,
        }
      case "tablet":
        return {
          width: mobileOpen ? "w-[280px]" : "w-0",
          position: "fixed inset-y-0 left-0 z-40",
          showOverlay: mobileOpen,
        }
      case "desktop":
        return {
          width: collapsed ? "w-[70px]" : "w-[280px]",
          position: "fixed inset-y-0 left-0 z-30",
          showOverlay: false,
        }
      default:
        return {
          width: "w-[280px]",
          position: "fixed inset-y-0 left-0 z-30",
          showOverlay: false,
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
        className={cn(
          "bg-slate-900 border-r border-slate-700/50 h-screen flex flex-col transition-all duration-300 ease-in-out",
          config.position,
          config.width,
          !isVisible && "overflow-hidden",
        )}
        style={{
          transform: !isVisible && deviceType !== "desktop" ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        {/* Header da Sidebar */}
        <div className="flex flex-col border-b border-slate-700/50 px-4 py-3 bg-slate-900 min-h-[80px]">
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

          {deviceType === "desktop" && (
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
          <div className="space-y-2">
            {navSections.map((section) => {
              const isExpanded = expandedSections.includes(section.title)
              const SectionIcon = section.icon

              if (collapsed && deviceType === "desktop") {
                // Modo colapsado - mostrar apenas ícones
                return (
                  <div key={section.title} className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      const ItemIcon = item.icon

                      return (
                        <TooltipProvider key={item.href} delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                onClick={handleNavigation}
                                className={cn(
                                  "flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors w-full",
                                  isActive
                                    ? "bg-green-600/20 text-green-400"
                                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                                )}
                              >
                                <ItemIcon className="h-5 w-5" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                )
              }

              return (
                <Collapsible key={section.title} open={isExpanded} onOpenChange={() => toggleSection(section.title)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <SectionIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      const ItemIcon = item.icon

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleNavigation}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-6 py-2 text-sm font-medium transition-colors ml-2",
                            isActive
                              ? "bg-green-600/20 text-green-400 border-l-2 border-green-400"
                              : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                          )}
                        >
                          <ItemIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
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
                <p>v2.0.0 - {new Date().getFullYear()}</p>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">Sistema Online</span>
                </div>
              </>
            )}
            {collapsed && deviceType === "desktop" && <p>BP</p>}
          </div>
        </div>
      </aside>
    </>
  )
}
