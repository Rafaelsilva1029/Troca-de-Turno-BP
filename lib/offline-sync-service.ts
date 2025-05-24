import { logger } from "./logger"
import { databaseService } from "./database-service"

interface PendingOperation {
  id: string
  type: "create" | "update" | "delete"
  table: string
  data: any
  timestamp: number
  retries: number
}

export class OfflineSyncService {
  private static instance: OfflineSyncService
  private pendingOperations: PendingOperation[] = []
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null
  private readonly STORAGE_KEY = "branco_peres_pending_operations"
  private readonly MAX_RETRIES = 5

  private constructor() {
    this.loadPendingOperations()
    this.startSyncInterval()
  }

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService()
    }
    return OfflineSyncService.instance
  }

  private loadPendingOperations() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.pendingOperations = JSON.parse(stored)
        logger.info("offline-sync", "Loaded pending operations", {
          count: this.pendingOperations.length,
        })
      }
    } catch (error) {
      logger.error("offline-sync", "Failed to load pending operations", { error })
    }
  }

  private savePendingOperations() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingOperations))
    } catch (error) {
      logger.error("offline-sync", "Failed to save pending operations", { error })
    }
  }

  public addOperation(operation: Omit<PendingOperation, "id" | "timestamp" | "retries">) {
    const newOperation: PendingOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    }

    this.pendingOperations.push(newOperation)
    this.savePendingOperations()

    logger.info("offline-sync", "Added pending operation", {
      type: operation.type,
      table: operation.table,
    })

    // Tentar sincronizar imediatamente se online
    if (databaseService.isOnline()) {
      this.syncPendingOperations()
    }
  }

  private startSyncInterval() {
    // Tentar sincronizar a cada 30 segundos
    this.syncInterval = setInterval(() => {
      if (databaseService.isOnline() && this.pendingOperations.length > 0) {
        this.syncPendingOperations()
      }
    }, 30000)
  }

  public async syncPendingOperations() {
    if (this.isSyncing || this.pendingOperations.length === 0) {
      return
    }

    this.isSyncing = true
    logger.info("offline-sync", "Starting sync", {
      pendingCount: this.pendingOperations.length,
    })

    const successfulOperations: string[] = []
    const failedOperations: PendingOperation[] = []

    for (const operation of this.pendingOperations) {
      try {
        await this.executeOperation(operation)
        successfulOperations.push(operation.id)
      } catch (error) {
        logger.error("offline-sync", "Failed to sync operation", {
          operation,
          error,
        })

        operation.retries++

        if (operation.retries < this.MAX_RETRIES) {
          failedOperations.push(operation)
        } else {
          logger.error("offline-sync", "Operation exceeded max retries", {
            operation,
          })
        }
      }
    }

    // Atualizar lista de operações pendentes
    this.pendingOperations = failedOperations
    this.savePendingOperations()

    logger.info("offline-sync", "Sync completed", {
      successful: successfulOperations.length,
      failed: failedOperations.length,
      remaining: this.pendingOperations.length,
    })

    this.isSyncing = false
  }

  private async executeOperation(operation: PendingOperation) {
    const client = databaseService.getClient()

    switch (operation.type) {
      case "create":
        await client.from(operation.table).insert(operation.data)
        break

      case "update":
        const { id, ...updateData } = operation.data
        await client.from(operation.table).update(updateData).eq("id", id)
        break

      case "delete":
        await client.from(operation.table).delete().eq("id", operation.data.id)
        break

      default:
        throw new Error(`Unknown operation type: ${operation.type}`)
    }
  }

  public getPendingOperationsCount(): number {
    return this.pendingOperations.length
  }

  public clearPendingOperations() {
    this.pendingOperations = []
    this.savePendingOperations()
  }

  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

// Exportar instância singleton
export const offlineSyncService = OfflineSyncService.getInstance()
