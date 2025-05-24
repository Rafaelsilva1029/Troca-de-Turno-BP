import { NextResponse } from "next/server"
import { checkDatabaseHealth } from "@/lib/supabase-improved"
import { logger } from "@/lib/logger"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const startTime = Date.now()
  const headersList = headers()
  const userAgent = headersList.get("user-agent") || "unknown"
  const ip = headersList.get("x-forwarded-for") || "unknown"

  try {
    // Verificar saúde do banco de dados
    const dbHealth = await checkDatabaseHealth()

    // Verificar outras dependências
    const checks = {
      database: dbHealth.isHealthy,
      api: true,
      cache: true, // Implementar verificação real se necessário
      storage: true, // Implementar verificação real se necessário
    }

    const allHealthy = Object.values(checks).every((check) => check === true)
    const responseTime = Date.now() - startTime

    const healthStatus = {
      status: allHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      responseTime,
      checks,
      database: {
        connected: dbHealth.isHealthy,
        latency: dbHealth.latency,
        error: dbHealth.error,
      },
    }

    // Log health check
    logger.info("api", "Health check performed", {
      status: healthStatus.status,
      responseTime,
      userAgent,
      ip,
    })

    return NextResponse.json(healthStatus, {
      status: allHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Response-Time": `${responseTime}ms`,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const responseTime = Date.now() - startTime

    logger.error("api", "Health check failed", {
      error: errorMessage,
      responseTime,
      userAgent,
      ip,
    })

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: errorMessage,
        responseTime,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Response-Time": `${responseTime}ms`,
        },
      },
    )
  }
}

// Endpoint para monitoramento detalhado (protegido)
export async function POST(request: Request) {
  try {
    // Verificar autorização (implementar autenticação real)
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Coletar métricas detalhadas
    const metrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    logger.error("api", "Detailed health check failed", { error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
