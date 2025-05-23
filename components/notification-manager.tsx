"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { TruckNotification } from "./truck-notification"
import { useAudio } from "@/lib/audio-service"

export type NotificationType = "info" | "success" | "alert" | "error"

export interface NotificationAction {
  id: string
  action: "complete" | "snooze" | "dismiss"
}

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

interface NotificationContextType {
  showNotification: (notification: NotificationProps) => void
  dismissNotification: (id: string) => void
  notifications: (NotificationProps & { id: string })[]
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<(NotificationProps & { id: string })[]>([])
  const audioService = useAudio()

  const showNotification = useCallback(
    (notification: NotificationProps) => {
      const id = notification.id || Math.random().toString(36).substring(2, 9)
      const newNotification = { ...notification, id }

      setNotifications((prev) => [...prev, newNotification])

      // Reproduzir som se solicitado
      if (notification.playSound && audioService && notification.soundId) {
        audioService.play(notification.soundId)
      }

      // Auto-fechar após o tempo especificado
      if (notification.autoCloseTime) {
        setTimeout(() => {
          dismissNotification(id)
        }, notification.autoCloseTime)
      }

      return id
    },
    [audioService],
  )

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  // Limitar o número máximo de notificações visíveis
  useEffect(() => {
    if (notifications.length > 5) {
      const oldestNotification = notifications[0]
      dismissNotification(oldestNotification.id)
    }
  }, [notifications, dismissNotification])

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification, notifications }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {notifications.map((notification) => (
          <TruckNotification
            key={notification.id}
            {...notification}
            onDismiss={() => dismissNotification(notification.id)}
            onAction={(action) => {
              if (notification.onAction) {
                notification.onAction(notification.id, action)
              }
              if (action === "dismiss") {
                dismissNotification(notification.id)
              }
            }}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de um NotificationProvider")
  }
  return context
}
