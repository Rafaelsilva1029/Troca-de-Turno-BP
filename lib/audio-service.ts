"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type AudioMap = {
  [key: string]: HTMLAudioElement
}

interface AudioContextType {
  play: (id: string) => void
  stop: (id: string) => void
  setMuted: (muted: boolean) => void
  isMuted: boolean
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [audioMap, setAudioMap] = useState<AudioMap>({})
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Pré-carregar os arquivos de áudio
    const audioFiles = {
      "truck-horn": "/sounds/truck-horn.mp3",
    }

    const loadedAudio: AudioMap = {}

    // Carregar cada arquivo de áudio
    Object.entries(audioFiles).forEach(([id, src]) => {
      const audio = new Audio(src)
      audio.preload = "auto"
      loadedAudio[id] = audio
    })

    setAudioMap(loadedAudio)

    // Limpar os elementos de áudio quando o componente for desmontado
    return () => {
      Object.values(loadedAudio).forEach((audio) => {
        audio.pause()
        audio.src = ""
      })
    }
  }, [])

  // Atualizar o estado de mudo em todos os elementos de áudio
  useEffect(() => {
    Object.values(audioMap).forEach((audio) => {
      audio.muted = isMuted
    })
  }, [isMuted, audioMap])

  const play = (id: string) => {
    const audio = audioMap[id]
    if (audio) {
      // Reiniciar o áudio se já estiver tocando
      audio.pause()
      audio.currentTime = 0

      // Reproduzir o áudio
      const playPromise = audio.play()

      // Tratar erros de reprodução
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Erro ao reproduzir áudio:", error)
        })
      }
    }
  }

  const stop = (id: string) => {
    const audio = audioMap[id]
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  const setMuted = (muted: boolean) => {
    setIsMuted(muted)
  }

  return <AudioContext.Provider value={{ play, stop, setMuted, isMuted }}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    console.warn("useAudio deve ser usado dentro de um AudioProvider")
    return null
  }
  return context
}
