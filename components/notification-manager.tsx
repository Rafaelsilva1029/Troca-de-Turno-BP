"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export type NotificationType = "success" | "error" | "warning" | "info" | "alert"

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  timestamp: Date
  autoCloseTime?: number
  dueTime?: string
  onAction?: (id: string, action: "complete" | "snooze" | "dismiss") => void
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((notificationData: Omit<Notification, "id" | "timestamp">) => {
    const notification: Notification = {
      ...notificationData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }

    setNotifications((prev) => [notification, ...prev])

    // Auto-remove notification if autoCloseTime is set
    if (notification.autoCloseTime) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.autoCloseTime)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        clearAllNotifications,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationCard key={notification.id} notification={notification} onRemove={removeNotification} />
      ))}
    </div>
  )
}

function NotificationCard({
  notification,
  onRemove,
}: {
  notification: Notification
  onRemove: (id: string) => void
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-400" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-400" />
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-900/80 border-green-700/50"
      case "error":
        return "bg-red-900/80 border-red-700/50"
      case "warning":
        return "bg-amber-900/80 border-amber-700/50"
      case "alert":
        return "bg-red-900/80 border-red-700/50"
      default:
        return "bg-blue-900/80 border-blue-700/50"
    }
  }

  const handleAction = (action: "complete" | "snooze" | "dismiss") => {
    if (notification.onAction) {
      notification.onAction(notification.id, action)
    }
    onRemove(notification.id)
  }

  return (
    <Card className={`${getBackgroundColor()} backdrop-blur-sm text-white shadow-lg animate-in slide-in-from-right`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white truncate">{notification.title}</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => onRemove(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-white/80 mt-1">{notification.message}</p>
            {notification.dueTime && (
              <div className="flex items-center mt-2">
                <Clock className="h-3 w-3 text-white/60 mr-1" />
                <span className="text-xs text-white/60">{notification.dueTime}</span>
              </div>
            )}
            {notification.onAction && (
              <div className="flex space-x-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => handleAction("complete")}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Concluir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => handleAction("snooze")}
                >
                  {/* Snooze icon component */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  Adiar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
