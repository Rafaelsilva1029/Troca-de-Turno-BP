"use client"

import { useState, useEffect } from "react"
import { Moon, Search, Sun } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface AnimatedHeaderProps {
  theme: "dark" | "light"
  toggleTheme: () => void
  currentTime: Date
}

export function AnimatedHeader({ theme, toggleTheme, currentTime }: AnimatedHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)

  // Detectar scroll para efeitos
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Formatar data e hora
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo e título */}
          <motion.div
            className="flex items-center space-x-4"
            onHoverStart={() => setLogoHovered(true)}
            onHoverEnd={() => setLogoHovered(false)}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-green-500/20 rounded-full"
                initial={{ scale: 1 }}
                animate={{ scale: logoHovered ? 1.2 : 1, opacity: logoHovered ? 0.8 : 0 }}
                transition={{ duration: 0.5 }}
              />
              <motion.img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-iliieuxhPX3jg8ZHtz6jwLzBhHKw3f.png"
                alt="Logo Branco Peres"
                className="h-12 w-auto object-contain relative z-10"
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              />
            </div>

            <div className="flex flex-col">
              <motion.div
                className="overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.h1
                  className="text-2xl font-bold tracking-wider"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                    TROCA DE TURNO
                  </span>
                </motion.h1>
              </motion.div>

              <motion.div
                className="overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <motion.p
                  className="text-sm text-slate-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  Branco Peres Agribusiness
                </motion.p>
              </motion.div>
            </div>

            <AnimatePresence>
              {logoHovered && (
                <motion.div
                  className="absolute left-32 top-16 bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg border border-green-500/30 shadow-lg shadow-green-500/20 z-20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs text-green-400">Sistema de Gestão Operacional</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Elementos centrais */}
          <motion.div
            className="hidden md:flex items-center space-x-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="bg-green-900/20 text-green-400 border-green-500/30 px-3 py-1.5 flex items-center"
            >
              <motion.div
                className="h-2 w-2 bg-green-500 rounded-full mr-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
              />
              Sistema Ativo
            </Badge>

            <div className="text-sm text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
              {formatDate(currentTime)} | {formatTime(currentTime)}
            </div>
          </motion.div>

          {/* Elementos da direita */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <div className="hidden md:flex items-center space-x-1 bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-700/50 backdrop-blur-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none focus:outline-none text-sm w-40 placeholder:text-slate-500"
              />
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="relative text-slate-400 hover:text-slate-100 bg-slate-800/50 rounded-full"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={theme}
                          initial={{ rotate: -180, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 180, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alternar tema</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="border-2 border-green-500/30 h-10 w-10">
                <AvatarImage src="/abstract-geometric-shapes.png" alt="Usuário" />
                <AvatarFallback className="bg-slate-700 text-green-500">BP</AvatarFallback>
              </Avatar>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Barra de progresso animada */}
      <motion.div
        className="h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-600"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
      />
    </motion.header>
  )
}
