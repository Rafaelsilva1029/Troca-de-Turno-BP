"use client"

import { useState, useEffect } from "react"
import { X, Check, Clock, Bell, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NotificationType } from "./notification-manager"
import { TruckAnimation } from "./truck-animation"
import { useAudio } from "@/lib/audio-service"

interface TruckNotificationProps {
  id: string
  title: string
  message: string
  type: NotificationType
  dueTime?: string
  onDismiss: () => void
  onAction: (action: "complete" | "snooze" | "dismiss") => void
  soundId?: string
}

export function TruckNotification({
  id,
  title,
  message,
  type,
  dueTime,
  onDismiss,
  onAction,
  soundId,
}: TruckNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioService = useAudio()

  useEffect(() => {
    // Animar a entrada da notificação
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    // Animar a saída da notificação
    setIsVisible(false)
    setTimeout(() => {
      onDismiss()
    }, 300)
  }

  const handleAction = (action: "complete" | "snooze" | "dismiss") => {
    // Animar a saída da notificação
    setIsVisible(false)
    setTimeout(() => {
      onAction(action)
    }, 300)
  }

  const toggleMute = () => {
    if (audioService && soundId) {
      if (isMuted) {
        audioService.play(soundId)
      } else {
        audioService.stop(soundId)
      }
      setIsMuted(!isMuted)
    }
  }

  // Determinar a cor com base no tipo de notificação
  const getTypeStyles = () => {
    switch (type) {
      case "info":
        return "bg-blue-900/80 border-blue-700"
      case "success":
        return "bg-green-900/80 border-green-700"
      case "alert":
        return "bg-amber-900/80 border-amber-700"
      case "error":
        return "bg-red-900/80 border-red-700"
      default:
        return "bg-slate-900/80 border-slate-700"
    }
  }

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`rounded-lg border backdrop-blur-sm shadow-lg overflow-hidden ${getTypeStyles()} w-full max-w-md`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <TruckAnimation type={type} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-white flex items-center">
                  <Bell className="h-4 w-4 mr-1" />
                  {title}
                </h3>
                <div className="flex space-x-1 ml-2">
                  {soundId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 text-white/70 hover:text-white hover:bg-white/10"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={handleDismiss}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-sm text-white/90">{message}</p>
              {dueTime && (
                <p className="mt-1 text-xs text-white/70 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {dueTime}
                </p>
              )}
              <div className="mt-3 flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-none text-xs py-1 h-7"
                  onClick={() => handleAction("complete")}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Concluir
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-none text-xs py-1 h-7"
                  onClick={() => handleAction("snooze")}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Adiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
