"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

interface NotificationContextType {
  notifications: any[]
  addNotification: (notification: any) => void
  removeNotification: (id: string) => void
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
  const [notifications, setNotifications] = useState<any[]>([])
  const { toast } = useToast()

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification-sound.mp3")
      audio.volume = 0.5
      audio.play().catch(console.error)
    } catch (error) {
      console.error("Error playing notification sound:", error)
    }
  }

  const addNotification = useCallback((notification: any) => {
    setNotifications((prevNotifications) => [...prevNotifications, notification])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== id))
  }, [])

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1]

      toast({
        title: latestNotification.title,
        description: latestNotification.message,
      })

      playNotificationSound()
    }
  }, [notifications, toast])

  // Example of fetching notifications from an API (replace with your actual API endpoint)
  // useEffect(() => {
  //   const fetchNotifications = async () => {
  //     try {
  //       const response = await fetch('/api/notifications');
  //       const data = await response.json();
  //       data.forEach((notification: any) => addNotification(notification));
  //     } catch (error) {
  //       console.error("Failed to fetch notifications:", error);
  //     }
  //   };

  //   // Only fetch if user is authenticated (you can add your own auth check here)
  //   fetchNotifications();
  // }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
