"use client"

import { useState, useEffect } from "react"
import { databaseService } from "@/lib/database-service"
import { useToast } from "@/hooks/use-toast"

export function useDatabaseConnection() {
  const [isConnected, setIsConnected] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar conexão inicial
    checkConnection()

    // Escutar mudanças de conexão
    const unsubscribe = databaseService.onConnectionChange((connected) => {
      setIsConnected(connected)

      if (!connected) {
        toast({
          title: "Conexão perdida",
          description:
            "Trabalhando em modo offline. As alterações serão sincronizadas quando a conexão for restaurada.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Conexão restaurada",
          description: "Sincronizando dados com o servidor...",
        })
      }
    })

    // Verificar conexão periodicamente
    const interval = setInterval(checkConnection, 30000) // A cada 30 segundos

    return () => {
      clearInterval(interval)
    }
  }, [toast])

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const connected = await databaseService.testConnection()
      setIsConnected(connected)
    } catch (error) {
      setIsConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  return {
    isConnected,
    isChecking,
    checkConnection,
  }
}
