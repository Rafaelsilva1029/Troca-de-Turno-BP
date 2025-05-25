"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback } from "react"

interface AudioContextType {
  playNotificationSound: () => void
  playAlertSound: () => void
  setVolume: (volume: number) => void
  isMuted: boolean
  toggleMute: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [volume, setVolumeState] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)

  const playSound = useCallback(
    (soundPath: string) => {
      if (isMuted) return

      try {
        const audio = new Audio(soundPath)
        audio.volume = volume
        audio.play().catch(console.error)
      } catch (error) {
        console.error("Error playing sound:", error)
      }
    },
    [volume, isMuted],
  )

  const playNotificationSound = useCallback(() => {
    playSound("/notification-sound.mp3")
  }, [playSound])

  const playAlertSound = useCallback(() => {
    playSound("/alert-sound.mp3")
  }, [playSound])

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)))
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const value: AudioContextType = {
    playNotificationSound,
    playAlertSound,
    setVolume,
    isMuted,
    toggleMute,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}
