"use client"

import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"

// Implementação simplificada do serviço de áudio diretamente no componente
function useLocalAudio() {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Criar elemento de áudio
    const audioElement = new Audio()
    audioElement.preload = "auto"
    setAudio(audioElement)

    // Limpar quando o componente for desmontado
    return () => {
      audioElement.pause()
      audioElement.src = ""
    }
  }, [])

  const play = (src: string) => {
    if (audio) {
      audio.src = src
      audio.currentTime = 0

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Erro ao reproduzir áudio:", error)
        })
      }
    }
  }

  return { play }
}

export const NotificationManager = () => {
  const { toast } = useToast()
  const { play } = useLocalAudio()

  // Função para mostrar notificação
  const showNotification = (title: string, description: string) => {
    toast({
      title,
      description,
    })

    // Reproduzir som de notificação (usando um som padrão do sistema)
    play("/sounds/notification.mp3")
  }

  // Exemplo de uso (remova em produção)
  useEffect(() => {
    // Mostrar uma notificação de teste quando o componente montar
    const timer = setTimeout(() => {
      showNotification("Notificação de Teste", "Esta é uma notificação de teste")
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
