"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

// Tipos para as notificações
export type NotificationType = "info" | "success" | "alert" | "error"

export interface NotificationProps {
  id?: string
  title: string
  message: string
  type: NotificationType
  dueTime?: string
  autoCloseTime?: number
  playSound?: boolean
  soundId?: string
  onAction?: (id: string, action: "complete" | "snooze" | "dismiss") => void
}

// Contexto para o sistema de notificações
interface NotificationContextType {
  showNotification: (notification: NotificationProps) => void
  dismissNotification: (id: string) => void
  notifications: (NotificationProps & { id: string })[]
}

const NotificationContext = createContext<NotificationContextType | null>(null)

// Provider do sistema de notificações
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<(NotificationProps & { id: string })[]>([])
  const { toast } = useToast()

  const showNotification = useCallback(
    (notification: NotificationProps) => {
      const id = notification.id || Math.random().toString(36).substring(2, 9)
      const newNotification = { ...notification, id }

      // Adicionar à lista de notificações
      setNotifications((prev) => [...prev, newNotification])

      // Mostrar toast
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === "error" ? "destructive" : "default",
      })

      // Auto-fechar após o tempo especificado
      if (notification.autoCloseTime) {
        setTimeout(() => {
          dismissNotification(id)
        }, notification.autoCloseTime)
      }

      return id
    },
    [toast],
  )

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification, notifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook para usar o sistema de notificações
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de um NotificationProvider")
  }
  return context
}

// Componente NotificationManager (mantido para compatibilidade)
export const NotificationManager = () => {
  // Este componente agora é apenas um placeholder
  // A lógica foi movida para o Provider
  return null
}
