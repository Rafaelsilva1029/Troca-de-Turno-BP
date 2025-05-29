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
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Settings,
  PenToolIcon as Tool,
  Truck,
  Users,
  MapPin,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { UserProfile } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  user: UserProfile
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Verificar preferência do usuário para o estado da barra lateral
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setCollapsed(savedState === "true")
    }

    // Remover sidebars duplicadas
    const removeDuplicateSidebars = () => {
      const sidebars = document.querySelectorAll("[data-sidebar]")
      sidebars.forEach((sidebar, index) => {
        if (index > 0 && sidebar.getAttribute("data-sidebar") !== "main") {
          sidebar.remove()
        }
      })
    }

    removeDuplicateSidebars()

    // Observar mudanças no DOM para remover sidebars que possam ser adicionadas dinamicamente
    const observer = new MutationObserver(removeDuplicateSidebars)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  // Salvar preferência do usuário
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", String(newState))

    // Atualizar margem do conteúdo principal
    const mainContent = document.querySelector(".main-content-with-sidebar")
    if (mainContent) {
      if (newState) {
        mainContent.classList.add("collapsed")
      } else {
        mainContent.classList.remove("collapsed")
      }
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
      href: "/dashboard/lavagem",
      label: "Lavagem e Lubrificação",
      icon: Activity,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/relatorios",
      label: "Relatórios",
      icon: FileText,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/equipamentos-localizacao",
      label: "Equipamentos Localização",
      icon: MapPin,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/programacao",
      label: "Programação do Turno",
      icon: Calendar,
      requiredRole: "viewer",
    },
    {
      href: "/dashboard/estatisticas",
      label: "Estatísticas",
      icon: BarChart3,
      requiredRole: "manager",
    },
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

  return (
    <aside
      data-sidebar="main"
      className={cn(
        "bg-slate-900 border-r border-slate-700/50 h-screen flex flex-col transition-all duration-300 ease-in-out",
        "fixed left-0 top-0 z-50", // Posicionamento fixo para evitar sobreposição
        collapsed ? "w-[70px]" : "w-[250px]",
      )}
      style={{ zIndex: 1000 }} // Z-index alto para garantir que fique na frente
    >
      {/* Logo */}
      <div className="flex flex-col h-24 border-b border-slate-700/50 px-4 py-3 bg-slate-900">
        <div className="flex items-center justify-center mb-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/branco-peres-logo.png" alt="Branco Peres" width={32} height={32} className="rounded-sm" />
              <span className="font-bold text-lg text-white">Branco Peres</span>
            </Link>
          )}

          {collapsed && (
            <Link href="/dashboard">
              <Image src="/branco-peres-logo.png" alt="Branco Peres" width={32} height={32} className="rounded-sm" />
            </Link>
          )}
        </div>

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
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 bg-slate-900">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-green-600/20 text-green-400"
                            : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-slate-700/50 p-4 bg-slate-900", collapsed ? "text-center" : "")}>
        <div className="text-xs text-slate-500">
          {!collapsed && (
            <>
              <p>Branco Peres Agribusiness</p>
              <p>v1.0.0 - {new Date().getFullYear()}</p>
            </>
          )}
          {collapsed && <p>BP</p>}
        </div>
      </div>
    </aside>
  )
}
