"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  PenToolIcon as Tool,
  Truck,
  CheckCircle,
  Users,
  FileText,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusItem } from "./status-item"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const MainSidebar = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState("programacao")
  const [isMobile, setIsMobile] = useState(false)

  // Detectar se é mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Navigation items
  const navigationItems = [
    { id: "programacao", icon: Calendar, label: "Programação", active: activeItem === "programacao" },
    { id: "pendencias", icon: Tool, label: "Pendências", active: activeItem === "pendencias" },
    { id: "veiculos", icon: Truck, label: "Veículos", active: activeItem === "veiculos" },
    { id: "liberados", icon: CheckCircle, label: "Liberados", active: activeItem === "liberados" },
    { id: "equipe", icon: Users, label: "Equipe", active: activeItem === "equipe" },
    { id: "relatorios", icon: FileText, label: "Relatórios", active: activeItem === "relatorios" },
    { id: "comunicacoes", icon: MessageSquare, label: "Comunicações", active: activeItem === "comunicacoes" },
    { id: "configuracoes", icon: Settings, label: "Configurações", active: activeItem === "configuracoes" },
  ]

  const handleMenuClick = (itemId) => {
    setActiveItem(itemId)
    // Se estiver no mobile, feche o menu após clicar
    if (isMobile) {
      setCollapsed(true)
    }
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  return (
    <Sidebar
      className="bg-gradient-to-br from-black to-slate-900 text-slate-100 relative"
      collapsible={collapsed ? "offcanvas" : "none"}
      side="left"
    >
      <SidebarHeader className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center justify-center mb-6">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-iliieuxhPX3jg8ZHtz6jwLzBhHKw3f.png" />
            <AvatarFallback className="bg-slate-700 text-green-500">BP</AvatarFallback>
          </Avatar>
          <div className="ml-2">
            <h2 className="font-bold text-white">TROCA DE TURNO</h2>
            <p className="text-xs text-slate-400">Branco Peres</p>
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-2 border-t border-slate-700/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-full bg-slate-800/50 lg:flex md:flex hidden"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  tooltip={collapsed ? item.label : undefined}
                  isActive={item.active}
                  onClick={() => handleMenuClick(item.id)}
                  className="justify-start py-2.5"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                  {item.id === "pendencias" && (
                    <Badge className="ml-auto bg-green-600/20 text-green-400 border-green-500/30" variant="outline">
                      12
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel>STATUS DO SISTEMA</SidebarGroupLabel>
          <div className="px-3 py-2 space-y-3">
            <StatusItem label="Banco de Dados" value={92} color="green" />
            <StatusItem label="Sincronização" value={87} color="yellow" />
            <StatusItem label="Rede" value={76} color="blue" />
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">v1.0.5</div>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/abstract-geometric-shapes.png" />
            <AvatarFallback className="bg-slate-700 text-green-500">BP</AvatarFallback>
          </Avatar>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export default MainSidebar
