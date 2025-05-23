type StorageKey = "dashboard-metrics" | "dashboard-settings" | "dashboard-alerts" | "dashboard-logs"

export class OfflineStorage {
  private static instance: OfflineStorage
  private readonly storage: Storage

  private constructor() {
    this.storage = window.localStorage
  }

  public static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage()
    }
    return OfflineStorage.instance
  }

  public save<T>(key: StorageKey, data: T): void {
    try {
      const serialized = JSON.stringify(data)
      this.storage.setItem(key, serialized)
    } catch (error) {
      console.error("Failed to save data to offline storage:", error)
    }
  }

  public load<T>(key: StorageKey, defaultValue: T): T {
    try {
      const serialized = this.storage.getItem(key)
      if (serialized === null) {
        return defaultValue
      }
      return JSON.parse(serialized) as T
    } catch (error) {
      console.error("Failed to load data from offline storage:", error)
      return defaultValue
    }
  }

  public clear(key: StorageKey): void {
    try {
      this.storage.removeItem(key)
    } catch (error) {
      console.error("Failed to clear data from offline storage:", error)
    }
  }

  public clearAll(): void {
    try {
      this.storage.clear()
    } catch (error) {
      console.error("Failed to clear all data from offline storage:", error)
    }
  }

  public saveMetrics(metrics: any): void {
    const timestamp = new Date().toISOString()
    const metricsWithTimestamp = { ...metrics, timestamp }

    // Get existing metrics
    const existingMetrics = this.load<any[]>("dashboard-metrics", [])

    // Add new metrics and limit to last 100 records
    const updatedMetrics = [metricsWithTimestamp, ...existingMetrics].slice(0, 100)

    this.save("dashboard-metrics", updatedMetrics)
  }

  public getLastMetrics(): any | null {
    const metrics = this.load<any[]>("dashboard-metrics", [])
    return metrics.length > 0 ? metrics[0] : null
  }

  public getAllMetrics(): any[] {
    return this.load<any[]>("dashboard-metrics", [])
  }
}

export default OfflineStorage.getInstance()
