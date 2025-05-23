"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Bell, Calendar, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { UserProfile } from "@/lib/auth"

interface DashboardHeaderProps {
  user: UserProfile
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const supabase = createClientComponentClient()

  // Atualizar o relógio
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Obter contagem de notificações não lidas
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false)

        if (!error && count !== null) {
          setUnreadNotifications(count)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchUnreadNotifications()

    // Inscrever-se para atualizações em tempo real
    const subscription = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadNotifications()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, user.id])

  // Alternar tema
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")

    // Salvar preferência do usuário
    localStorage.setItem("theme", newTheme)
  }

  // Fazer logout
  const handleLogout = async () => {
    try {
      // Registrar evento de logout
      await supabase.from("logs").insert({
        event: "auth",
        details: {
          action: "logout",
        },
        user_id: user.id,
        created_at: new Date().toISOString(),
      })

      // Fazer logout
      await supabase.auth.signOut()

      // Redirecionar para login
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Obter título da página atual
  const getPageTitle = () => {
    const routes: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/dashboard/pendencias": "Pendências Oficina",
      "/dashboard/veiculos": "Equipamentos Logística",
      "/dashboard/liberados": "Equipamentos Liberados",
      "/dashboard/lavagem": "Lavagem e Lubrificação",
      "/dashboard/relatorios": "Relatórios",
      "/dashboard/programacao": "Programação do Turno",
      "/dashboard/configuracoes": "Configurações",
    }

    return routes[pathname] || "Dashboard"
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm px-4">
      <div className="flex items-center gap-2 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="hidden md:flex md:items-center md:gap-2">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        <Badge variant="outline" className="bg-slate-800/50 text-green-400 border-green-500/50 text-xs ml-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></div>
          ATIVO
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center text-sm text-slate-400">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{format(currentTime, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          <span className="mx-2">|</span>
          <span>{format(currentTime, "HH:mm:ss")}</span>
        </div>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-slate-100">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-slate-100 relative">
          <Link href="/dashboard/notificacoes">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 flex items-center gap-2 pl-2 pr-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl || ""} alt={user.fullName} />
                <AvatarFallback className="bg-green-700 text-white">
                  {user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user.fullName}</span>
                <span className="text-xs text-slate-400">{user.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/perfil">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/configuracoes">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-slate-900 border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-100">Menu</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-1">
            {/* Mobile navigation items */}
            {[
              { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
              { href: "/dashboard/pendencias", label: "Pendências Oficina", icon: "tool" },
              { href: "/dashboard/veiculos", label: "Equipamentos Logística", icon: "truck" },
              { href: "/dashboard/liberados", label: "Equipamentos Liberados", icon: "check-circle" },
              { href: "/dashboard/lavagem", label: "Lavagem e Lubrificação", icon: "activity" },
              { href: "/dashboard/relatorios", label: "Relatórios", icon: "file-text" },
              { href: "/dashboard/programacao", label: "Programação do Turno", icon: "calendar" },
              { href: "/dashboard/configuracoes", label: "Configurações", icon: "settings" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md ${
                  pathname === item.href ? "bg-green-600/20 text-green-400" : "text-slate-300 hover:bg-slate-800/50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl || ""} alt={user.fullName} />
                  <AvatarFallback className="bg-green-700 text-white">
                    {user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-slate-400">{user.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
