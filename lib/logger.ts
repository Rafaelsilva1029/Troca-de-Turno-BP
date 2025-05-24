import { getSupabaseClient } from "./supabase-client"
import { loggingConfig } from "@/config/environment"

type LogLevel = "debug" | "info" | "warn" | "error"
type LogEvent = "auth" | "data" | "system" | "user_action" | "api" | "error"

interface LogEntry {
  level: LogLevel
  event: LogEvent
  message: string
  details?: any
  userId?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Sistema de logs centralizado
 * Registra eventos no console e/ou no banco de dados
 */
export class Logger {
  private static instance: Logger

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Registra um evento de log
   */
  public async log({ level, event, message, details = {}, userId, ipAddress, userAgent }: LogEntry): Promise<void> {
    // Verificar se o nível de log está habilitado
    if (!this.shouldLog(level)) {
      return
    }

    // Registrar no console se habilitado
    if (loggingConfig.enableConsole) {
      this.logToConsole(level, event, message, details)
    }

    // Registrar remotamente se habilitado
    if (loggingConfig.enableRemote) {
      await this.logToDatabase(event, message, details, userId, ipAddress, userAgent)
    }
  }

  /**
   * Registra um evento de debug
   */
  public debug(event: LogEvent, message: string, details?: any, userId?: string): void {
    this.log({ level: "debug", event, message, details, userId })
  }

  /**
   * Registra um evento informativo
   */
  public info(event: LogEvent, message: string, details?: any, userId?: string): void {
    this.log({ level: "info", event, message, details, userId })
  }

  /**
   * Registra um aviso
   */
  public warn(event: LogEvent, message: string, details?: any, userId?: string): void {
    this.log({ level: "warn", event, message, details, userId })
  }

  /**
   * Registra um erro
   */
  public error(event: LogEvent, message: string, details?: any, userId?: string): void {
    this.log({ level: "error", event, message, details, userId })
  }

  /**
   * Verifica se o nível de log deve ser registrado
   */
  private shouldLog(level: LogLevel): boolean {
    const levelPriority: Record<LogLevel, number> = {
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
    }

    const configLevelPriority = levelPriority[loggingConfig.level as LogLevel] || 2
    return levelPriority[level] >= configLevelPriority
  }

  /**
   * Registra no console com formatação colorida
   */
  private logToConsole(level: LogLevel, event: LogEvent, message: string, details?: any): void {
    const timestamp = new Date().toISOString()
    const colors = {
      debug: "\x1b[36m", // Ciano
      info: "\x1b[32m", // Verde
      warn: "\x1b[33m", // Amarelo
      error: "\x1b[31m", // Vermelho
      reset: "\x1b[0m", // Reset
    }

    console[level](
      `${colors[level]}[${timestamp}] [${level.toUpperCase()}] [${event}]${colors.reset} ${message}`,
      details ? details : "",
    )
  }

  /**
   * Registra no banco de dados
   */
  private async logToDatabase(
    event: string,
    message: string,
    details: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient()

      await supabase.from("logs").insert({
        event,
        details: {
          message,
          ...details,
        },
        created_at: new Date().toISOString(),
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
    } catch (error) {
      // Falha silenciosa para evitar loops infinitos de log
      console.error("Failed to log to database:", error)
    }
  }
}

// Exportar uma instância singleton
export const logger = Logger.getInstance()
