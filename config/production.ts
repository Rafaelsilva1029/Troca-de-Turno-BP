/**
 * Configurações específicas para ambiente de produção
 */

export const productionConfig = {
  // Configurações de segurança
  security: {
    // Headers de segurança
    headers: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    },

    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Limite de requisições por IP
    },

    // CORS
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "https://brancoperes.com.br",
      credentials: true,
    },
  },

  // Configurações de performance
  performance: {
    // Cache
    cache: {
      defaultTTL: 5 * 60, // 5 minutos em segundos
      maxAge: 60 * 60 * 24, // 24 horas
      staleWhileRevalidate: 60 * 60, // 1 hora
    },

    // Compressão
    compression: {
      level: 6,
      threshold: 1024, // 1KB
    },

    // Otimizações de imagem
    images: {
      quality: 85,
      formats: ["webp", "avif"],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    },
  },

  // Configurações de monitoramento
  monitoring: {
    // Sentry
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: "production",
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    },

    // Analytics
    analytics: {
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
      enableWebVitals: true,
    },
  },

  // Configurações de banco de dados
  database: {
    // Pool de conexões
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },

    // Retry
    retry: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      factor: 2,
    },

    // Timeouts
    timeouts: {
      query: 30000, // 30 segundos
      transaction: 60000, // 60 segundos
    },
  },

  // Configurações de API
  api: {
    // Timeouts
    timeout: 30000, // 30 segundos

    // Pagination
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
    },

    // Versioning
    version: "v1",
  },

  // Configurações de logs
  logging: {
    // Níveis de log por ambiente
    level: "error",

    // Destinos de log
    destinations: ["console", "file", "remote"],

    // Rotação de logs
    rotation: {
      maxFiles: 10,
      maxSize: "10m",
      datePattern: "YYYY-MM-DD",
    },
  },

  // Configurações de backup
  backup: {
    // Backup automático
    auto: {
      enabled: true,
      schedule: "0 2 * * *", // 2AM todos os dias
      retention: 30, // 30 dias
    },

    // Destinos de backup
    destinations: ["s3", "local"],
  },

  // Configurações de email
  email: {
    provider: "sendgrid",
    from: "noreply@brancoperes.com.br",
    replyTo: "suporte@brancoperes.com.br",

    // Templates
    templates: {
      welcome: "template-welcome",
      passwordReset: "template-password-reset",
      notification: "template-notification",
    },
  },

  // Configurações de manutenção
  maintenance: {
    // Modo de manutenção
    enabled: false,
    message: "Sistema em manutenção. Voltaremos em breve.",

    // IPs permitidos durante manutenção
    allowedIPs: ["127.0.0.1"],
  },
}

// Validar configurações obrigatórias
export function validateProductionConfig() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "NEXT_PUBLIC_BASE_URL",
  ]

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missingVars.join(", ")}`)
  }

  return true
}
