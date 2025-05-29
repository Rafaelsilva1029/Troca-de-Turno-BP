"use client"

import { useState } from "react"
import { Bell, Menu, Search, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { UserProfile } from "@/lib/auth"
import { useDeviceType } from "@/hooks/use-device-type"
import { cn } from "@/lib/utils"

interface ResponsiveHeaderProps {
  user: UserProfile
  onMenuToggle?: () => void
  sidebarOpen?: boolean
}

export function ResponsiveHeader({ user, onMenuToggle, sidebarOpen = false }: ResponsiveHeaderProps) {
  const deviceType = useDeviceType()
  const [searchOpen, setSearchOpen] = useState(false)

  const showMenuButton = deviceType === "mobile" || deviceType === "tablet"

  return (
    <header className="bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu button and search */}
        <div className="flex items-center gap-4">
          {/* Menu button for mobile/tablet */}
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Search */}
          <div className="relative">
            {deviceType === "mobile" ? (
              // Mobile: apenas ícone que expande
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Search className="h-5 w-5" />
                </Button>
                {searchOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 z-50">
                    <Input
                      placeholder="Buscar..."
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                      autoFocus
                      onBlur={() => setSearchOpen(false)}
                    />
                  </div>
                )}
              </div>
            ) : (
              // Tablet/Desktop: campo de busca sempre visível
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  className={cn(
                    "bg-slate-800 border-slate-600 text-white placeholder-slate-400 pl-10",
                    deviceType === "tablet" ? "w-48" : "w-64",
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center p-0">
              3
            </Badge>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                {deviceType !== "mobile" && (
                  <div className="text-left">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.role}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-slate-300 hover:bg-slate-700 hover:text-white">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:bg-slate-700 hover:text-white">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-red-400 hover:bg-red-600 hover:text-white">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
