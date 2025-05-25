"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "error" | "info" | "alert" | "warning"
  timestamp: Date
  autoCloseTime?: number
  dueTime?: string
  playSound?: boolean
  onAction?: (id: string, action: string) => void
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  showNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

// Export alias for backward compatibility
export const useNotifications = useNotification

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification-sound.mp3")
      audio.volume = 0.5
      audio.play().catch(() => {
        // Silently fail if audio can't be played
      })
    } catch (error) {
      // Silently fail if audio can't be created
    }
  }

  const addNotification = useCallback(
    (notificationData: Omit<Notification, "id" | "timestamp">) => {
      const notification: Notification = {
        ...notificationData,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      }

      setNotifications((prevNotifications) => [...prevNotifications, notification])

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === "error" ? "destructive" : "default",
      })

      // Play sound if enabled
      if (notification.playSound !== false) {
        playNotificationSound()
      }

      // Auto-remove notification if autoCloseTime is set
      if (notification.autoCloseTime) {
        setTimeout(() => {
          removeNotification(notification.id)
        }, notification.autoCloseTime)
      }

      return notification.id
    },
    [toast],
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== id))
  }, [])

  // Alias for backward compatibility
  const showNotification = addNotification

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    showNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
