"use client"
import { useState, useEffect } from "react"
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export type NotificationType = "success" | "error" | "warning" | "info" | "alert"

export interface TruckNotificationProps {
  id: string
  title: string
  message: string
  type: NotificationType
  dueTime?: string
  autoCloseTime?: number
  onDismiss?: () => void
  onAction?: (action: "complete" | "snooze" | "dismiss") => void
}

export function TruckNotification({
  id,
  title,
  message,
  type,
  dueTime,
  autoCloseTime,
  onDismiss,
  onAction,
}: TruckNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState(autoCloseTime || 0)

  // Auto-close timer
  useEffect(() => {
    if (autoCloseTime && autoCloseTime > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoCloseTime)

      return () => clearTimeout(timer)
    }
  }, [autoCloseTime])

  // Countdown timer for display
  useEffect(() => {
    if (autoCloseTime && autoCloseTime > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            clearInterval(interval)
            return 0
          }
          return prev - 1000
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [autoCloseTime])

  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) {
      onDismiss()
    }
  }

  const handleAction = (action: "complete" | "snooze" | "dismiss") => {
    if (onAction) {
      onAction(action)
    }
    if (action === "dismiss") {
      handleDismiss()
    }
  }

  const getIcon = () => {
    switch (type) {
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
    switch (type) {
      case "success":
        return "bg-green-900/90 border-green-700/50"
      case "error":
        return "bg-red-900/90 border-red-700/50"
      case "warning":
        return "bg-amber-900/90 border-amber-700/50"
      case "alert":
        return "bg-red-900/90 border-red-700/50"
      default:
        return "bg-blue-900/90 border-blue-700/50"
    }
  }

  const getProgressColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-amber-500"
      case "alert":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  if (!isVisible) {
    return null
  }

  const progressPercentage = autoCloseTime ? ((autoCloseTime - timeLeft) / autoCloseTime) * 100 : 0

  return (
    <Card
      className={`${getBackgroundColor()} backdrop-blur-sm text-white shadow-lg animate-in slide-in-from-right-full duration-300 relative overflow-hidden max-w-sm`}
    >
      {/* Progress bar */}
      {autoCloseTime && autoCloseTime > 0 && (
        <div className="absolute top-0 left-0 h-1 bg-white/20 w-full">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-1000 ease-linear`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-white/90 mb-2 leading-relaxed">{message}</p>

            {dueTime && (
              <div className="flex items-center mb-3">
                <Clock className="h-3 w-3 text-white/60 mr-1 flex-shrink-0" />
                <span className="text-xs text-white/70">{dueTime}</span>
              </div>
            )}

            {/* Action buttons */}
            {onAction && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  onClick={() => handleAction("complete")}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Concluir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  onClick={() => handleAction("snooze")}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Adiar
                </Button>
              </div>
            )}

            {/* Auto-close countdown */}
            {autoCloseTime && timeLeft > 0 && (
              <div className="mt-2 text-xs text-white/50">Fecha automaticamente em {Math.ceil(timeLeft / 1000)}s</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TruckNotification
