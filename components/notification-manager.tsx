"use client"
import { useToast } from "@/hooks/use-toast"
import { useAudio } from "@/lib/audio-service"

export const NotificationManager = () => {
  const { toast } = useToast()
  const audioService = useAudio()

  // Por enquanto, vamos simplificar o componente removendo a dependência do Liveblocks
  // que não está configurada neste projeto

  const showNotification = (title: string, description: string) => {
    toast({
      title,
      description,
    })

    if (audioService) {
      audioService.play("notification")
    }
  }

  // Este componente pode ser usado para gerenciar notificações globalmente
  // Por enquanto, retorna null pois é apenas um gerenciador
  return null
}
