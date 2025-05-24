import { databaseService } from "./database-service"
import { logger } from "./logger"
import { z } from "zod"

// Schemas de validação
const PendenciaSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
})

const ReminderSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/),
  priority: z.enum(["baixa", "media", "alta", "urgente"]),
  status: z.enum(["pendente", "concluido", "atrasado", "em-andamento", "arquivado"]),
  category: z.string().min(1),
  assignedTo: z.string().optional(),
})

// Classe base para operações de banco de dados
export class DatabaseOperations {
  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    operationName: string,
    options: {
      useCache?: boolean
      cacheKey?: string
      throwOnError?: boolean
    } = {},
  ): Promise<T | null> {
    const { useCache = false, cacheKey, throwOnError = true } = options

    try {
      const operation = async () => {
        const { data, error } = await queryFn()

        if (error) {
          logger.error("database", `${operationName} failed`, { error })
          if (throwOnError) {
            throw new Error(error.message || `${operationName} failed`)
          }
          return null
        }

        return data
      }

      if (useCache && cacheKey) {
        return await databaseService.executeWithCache(cacheKey, operation, useCache)
      } else {
        return await databaseService.executeWithRetry(operation, operationName)
      }
    } catch (error) {
      logger.error("database", `${operationName} error`, { error })
      if (throwOnError) {
        throw error
      }
      return null
    }
  }

  protected async executeMutation<T>(
    mutationFn: () => Promise<{ data: T | null; error: any }>,
    operationName: string,
    options: {
      invalidateCache?: string[]
      throwOnError?: boolean
    } = {},
  ): Promise<T | null> {
    const { invalidateCache = [], throwOnError = true } = options

    try {
      const result = await this.executeQuery(mutationFn, operationName, { throwOnError })

      // Invalidar cache após mutação bem-sucedida
      if (result && invalidateCache.length > 0) {
        invalidateCache.forEach((key) => databaseService.clearCache(key))
      }

      return result
    } catch (error) {
      logger.error("database", `${operationName} mutation error`, { error })
      if (throwOnError) {
        throw error
      }
      return null
    }
  }
}

// Operações de Pendências
export class PendenciasOperations extends DatabaseOperations {
  async fetchAll() {
    return (
      this.executeQuery(
        () => databaseService.getClient().from("pendencias").select("*").order("created_at", { ascending: false }),
        "fetchPendencias",
        { useCache: true, cacheKey: "pendencias-all" },
      ) || []
    )
  }

  async save(category: string, items: string[]) {
    // Validar dados
    const validItems = items.filter((item) => {
      try {
        PendenciaSchema.parse({ category, description: item })
        return true
      } catch (error) {
        logger.warn("validation", "Invalid pendencia item", { category, item, error })
        return false
      }
    })

    if (validItems.length === 0 && items.length > 0) {
      throw new Error("Nenhum item válido para salvar")
    }

    // Transação: deletar existentes e inserir novos
    const client = databaseService.getClient()

    // Deletar existentes
    await this.executeMutation(
      () => client.from("pendencias").delete().eq("category", category),
      `deletePendencias-${category}`,
      { invalidateCache: ["pendencias-all", `pendencias-${category}`] },
    )

    // Inserir novos
    if (validItems.length > 0) {
      const pendenciasToInsert = validItems.map((description) => ({
        category,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      await this.executeMutation(
        () => client.from("pendencias").insert(pendenciasToInsert),
        `insertPendencias-${category}`,
        { invalidateCache: ["pendencias-all", `pendencias-${category}`] },
      )
    }

    logger.info("database", "Pendencias saved successfully", { category, count: validItems.length })
    return true
  }

  async liberar(pendencia: {
    category: string
    description: string
    released_by: string
    equipment_id: string
  }) {
    const client = databaseService.getClient()

    // Inserir em pendencias_liberadas
    await this.executeMutation(
      () =>
        client.from("pendencias_liberadas").insert({
          ...pendencia,
          released_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      "liberarPendencia-insert",
      { invalidateCache: ["pendencias-liberadas-all"] },
    )

    // Deletar de pendencias
    await this.executeMutation(
      () =>
        client.from("pendencias").delete().eq("category", pendencia.category).eq("description", pendencia.description),
      "liberarPendencia-delete",
      { invalidateCache: ["pendencias-all", `pendencias-${pendencia.category}`] },
    )

    logger.info("database", "Pendencia liberada successfully", pendencia)
    return true
  }
}

// Operações de Lembretes
export class RemindersOperations extends DatabaseOperations {
  async fetchActive() {
    return (
      this.executeQuery(
        () =>
          databaseService
            .getClient()
            .from("reminders")
            .select("*")
            .not("status", "eq", "arquivado")
            .order("due_date", { ascending: true })
            .order("due_time", { ascending: true }),
        "fetchActiveReminders",
        { useCache: true, cacheKey: "reminders-active" },
      ) || []
    )
  }

  async fetchArchived() {
    return (
      this.executeQuery(
        () =>
          databaseService
            .getClient()
            .from("reminders")
            .select("*")
            .eq("status", "arquivado")
            .order("completed_at", { ascending: false }),
        "fetchArchivedReminders",
        { useCache: true, cacheKey: "reminders-archived" },
      ) || []
    )
  }

  async save(reminder: any) {
    // Validar dados
    try {
      ReminderSchema.parse(reminder)
    } catch (error) {
      logger.error("validation", "Invalid reminder data", { reminder, error })
      throw new Error("Dados do lembrete inválidos")
    }

    const client = databaseService.getClient()
    const reminderToSave = {
      ...reminder,
      updated_at: new Date().toISOString(),
    }

    if (!reminder.id) {
      // Criar novo
      reminderToSave.id = crypto.randomUUID()
      reminderToSave.created_at = new Date().toISOString()

      return this.executeMutation(() => client.from("reminders").insert(reminderToSave), "createReminder", {
        invalidateCache: ["reminders-active", "reminders-archived"],
      })
    } else {
      // Atualizar existente
      return this.executeMutation(
        () => client.from("reminders").update(reminderToSave).eq("id", reminder.id),
        "updateReminder",
        { invalidateCache: ["reminders-active", "reminders-archived"] },
      )
    }
  }

  async delete(id: string) {
    return this.executeMutation(
      () => databaseService.getClient().from("reminders").delete().eq("id", id),
      "deleteReminder",
      { invalidateCache: ["reminders-active", "reminders-archived"] },
    )
  }

  async archive(reminder: any) {
    const reminderToArchive = {
      ...reminder,
      status: "arquivado",
      completed_at: reminder.completed_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return this.executeMutation(
      () => databaseService.getClient().from("reminders").update(reminderToArchive).eq("id", reminder.id),
      "archiveReminder",
      { invalidateCache: ["reminders-active", "reminders-archived"] },
    )
  }
}

// Operações de Métricas do Sistema
export class SystemMetricsOperations extends DatabaseOperations {
  async fetchLatest() {
    const result = await this.executeQuery(
      () =>
        databaseService
          .getClient()
          .from("system_metrics")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(1)
          .single(),
      "fetchLatestSystemMetric",
      { useCache: true, cacheKey: "system-metrics-latest", throwOnError: false },
    )

    // Retornar valores padrão se não houver dados
    return (
      result || {
        cpu_usage: 42,
        memory_usage: 68,
        network_status: 92,
        system_status: 85,
        security_level: 75,
        timestamp: new Date().toISOString(),
      }
    )
  }

  async fetchHistory(limit = 24) {
    return (
      this.executeQuery(
        () =>
          databaseService
            .getClient()
            .from("system_metrics")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(limit),
        "fetchSystemMetricsHistory",
        { useCache: true, cacheKey: `system-metrics-history-${limit}` },
      ) || []
    )
  }

  async save(metric: any) {
    const metricToSave = {
      ...metric,
      timestamp: new Date().toISOString(),
    }

    return this.executeMutation(
      () => databaseService.getClient().from("system_metrics").insert(metricToSave),
      "saveSystemMetric",
      { invalidateCache: ["system-metrics-latest", "system-metrics-history-24"] },
    )
  }
}

// Exportar instâncias das operações
export const pendenciasOps = new PendenciasOperations()
export const remindersOps = new RemindersOperations()
export const systemMetricsOps = new SystemMetricsOperations()

// Função para verificar saúde do banco de dados
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean
  latency: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const connected = await databaseService.testConnection()
    const latency = Date.now() - startTime

    if (!connected) {
      return {
        isHealthy: false,
        latency,
        error: "Não foi possível conectar ao banco de dados",
      }
    }

    // Verificar se consegue fazer uma query simples
    const client = databaseService.getClient()
    const { error } = await client.from("health_check").select("*").limit(1)

    if (error) {
      return {
        isHealthy: false,
        latency,
        error: error.message,
      }
    }

    return {
      isHealthy: true,
      latency,
    }
  } catch (error) {
    return {
      isHealthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
