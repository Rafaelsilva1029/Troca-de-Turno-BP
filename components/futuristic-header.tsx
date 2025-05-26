"use client"

import { useState } from "react"
import { Bell, Search, User, Menu, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FuturisticHeaderProps {
  currentTime: Date
  onMenuClick?: () => void
  isMobile?: boolean
}

export function FuturisticHeader({ currentTime, onMenuClick, isMobile = false }: FuturisticHeaderProps) {
  const [notifications, setNotifications] = useState(3)
  const [searchOpen, setSearchOpen] = useState(false)

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <header
      className={cn(
        "bg-gradient-to-r from-slate-900/90 to-black/90 backdrop-blur-md border-b border-slate-700/30 py-3 px-4 flex items-center justify-between",
        "sticky top-0 z-20 transition-all duration-300",
      )}
    >
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="mr-2 h-9 w-9 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex items-center space-x-4">
        {searchOpen ? (
          <div className="relative animate-in fade-in slide-in-from-left-5 duration-300">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 h-9 w-[200px] sm:w-[300px] bg-slate-800/50 border-slate-700/50 rounded-full text-sm focus:ring-green-500/50"
              autoFocus
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-9 w-9 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-1 sm:space-x-4">
        <TooltipProvider>
          <div className="hidden md:flex items-center space-x-1">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-green-900/20 border border-green-500/30">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">Sistema Ativo</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-800 text-slate-200 border-slate-700">
                Todos os serviços estão operacionais
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="hidden md:block h-6 w-px bg-slate-700/50 mx-2"></div>

        <div className="text-right">
          <div className="text-xs text-slate-400">{formatDate(currentTime)}</div>
          <div className="text-sm font-medium text-slate-200">{formatTime(currentTime)}</div>
        </div>

        <div className="hidden md:block h-6 w-px bg-slate-700/50 mx-2"></div>

        <TooltipProvider>
          <div className="relative">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-800 text-slate-200 border-slate-700">
                Notificações
              </TooltipContent>
            </Tooltip>
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white border-none">
                {notifications}
              </Badge>
            )}
          </div>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
              >
                <Shield className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-800 text-slate-200 border-slate-700">
              Segurança do Sistema
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
              >
                <User className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-800 text-slate-200 border-slate-700">
              Perfil do Usuário
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
