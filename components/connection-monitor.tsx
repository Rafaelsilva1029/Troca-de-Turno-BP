"use client"

import { useEffect, useState } from "react"
import { useDatabaseConnection } from "@/hooks/use-database-connection"
import { checkDatabaseHealth } from "@/lib/supabase-improved"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react"

export function ConnectionMonitor() {
  const { isConnected, isChecking, checkConnection } = useDatabaseConnection()
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean
    latency: number
    error?: string
  } | null>(null)
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)

  useEffect(() => {
    // Verificar saúde do banco a cada minuto
    const checkHealth = async () => {
      setIsCheckingHealth(true)
      const status = await checkDatabaseHealth()
      setHealthStatus(status)
      setIsCheckingHealth(false)
    }

    checkHealth()
    const interval = setInterval(checkHealth, 60000)

    return () => clearInterval(interval)
  }, [])

  if (isConnected && healthStatus?.isHealthy) {
    return null // Não mostrar nada quando tudo está funcionando
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant={isConnected ? "default" : "destructive"} className="shadow-lg border-2">
        <div className="flex items-start space-x-3">
          {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5" />}

          <div className="flex-1">
            <AlertTitle className="flex items-center justify-between">
              Status da Conexão
              <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
                {isConnected ? "Online" : "Offline"}
              </Badge>
            </AlertTitle>

            <AlertDescription className="mt-2 space-y-2">
              {!isConnected && (
                <p>Você está trabalhando offline. As alterações serão sincronizadas quando a conexão for restaurada.</p>
              )}

              {healthStatus && !healthStatus.isHealthy && (
                <div className="flex items-center space-x-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Banco de dados: {healthStatus.error}</span>
                </div>
              )}

              {healthStatus?.latency && healthStatus.latency > 1000 && (
                <div className="flex items-center space-x-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>Latência alta: {healthStatus.latency}ms</span>
                </div>
              )}

              <div className="flex items-center space-x-2 mt-3">
                <Button size="sm" variant="outline" onClick={checkConnection} disabled={isChecking || isCheckingHealth}>
                  {isChecking || isCheckingHealth ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Verificar Conexão
                </Button>

                {healthStatus?.isHealthy && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>DB OK ({healthStatus.latency}ms)</span>
                  </div>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  )
}
