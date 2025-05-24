import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { logger } from "./logger"

export class DatabaseService {
  private static instance: DatabaseService
  private client: SupabaseClient | null = null
  private retryCount = 0
  private maxRetries = 3
  private retryDelay = 1000 // 1 segundo
  private isConnected = false
  private connectionListeners: ((connected: boolean) => void)[] = []

  private constructor() {
    this.initializeClient()
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private initializeClient() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables")
      }

      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            "x-application-name": "branco-peres-agribusiness",
          },
        },
        db: {
          schema: "public",
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })

      this.isConnected = true
      this.notifyConnectionListeners(true)
      logger.info("database", "Database client initialized successfully")
    } catch (error) {
      logger.error("database", "Failed to initialize database client", { error })
      this.isConnected = false
      this.notifyConnectionListeners(false)
      throw error
    }
  }

  public getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error("Database client not initialized")
    }
    return this.client
  }

  public async executeWithRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation()

        // Reset retry count on success
        if (this.retryCount > 0) {
          this.retryCount = 0
          logger.info("database", `Operation ${operationName} succeeded after ${attempt} retries`)
        }

        return result
      } catch (error) {
        lastError = error as Error
        this.retryCount = attempt + 1

        logger.warn("database", `Operation ${operationName} failed (attempt ${attempt + 1}/${this.maxRetries + 1})`, {
          error: error instanceof Error ? error.message : String(error),
          attempt: attempt + 1,
        })

        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed
    logger.error("database", `Operation ${operationName} failed after all retries`, {
      error: lastError?.message,
      attempts: this.maxRetries + 1,
    })

    throw lastError || new Error(`Operation ${operationName} failed after ${this.maxRetries + 1} attempts`)
  }

  public async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.executeWithRetry(
        async () => this.getClient().from("health_check").select("*").limit(1),
        "testConnection",
      )

      if (error) {
        this.isConnected = false
        this.notifyConnectionListeners(false)
        return false
      }

      this.isConnected = true
      this.notifyConnectionListeners(true)
      return true
    } catch (error) {
      this.isConnected = false
      this.notifyConnectionListeners(false)
      return false
    }
  }

  public onConnectionChange(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener)
    // Immediately notify the new listener of current status
    listener(this.isConnected)
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((listener) => listener(connected))
  }

  public isOnline(): boolean {
    return this.isConnected
  }

  // Método para executar queries com cache
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutos

  public async executeWithCache<T>(key: string, operation: () => Promise<T>, useCache = true): Promise<T> {
    if (useCache) {
      const cached = this.cache.get(key)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.debug("database", `Cache hit for key: ${key}`)
        return cached.data as T
      }
    }

    const result = await this.executeWithRetry(operation, `cache-${key}`)

    if (useCache) {
      this.cache.set(key, { data: result, timestamp: Date.now() })
    }

    return result
  }

  public clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
}

// Exportar instância singleton
export const databaseService = DatabaseService.getInstance()
