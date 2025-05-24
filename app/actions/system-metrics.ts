"use server"

import { fetchLatestSystemMetric, fetchSystemMetrics, saveSystemMetric, type SystemMetric } from "@/lib/supabase"

export async function getLatestSystemMetric() {
  try {
    return await fetchLatestSystemMetric()
  } catch (error) {
    console.error("Error fetching latest system metric:", error)
    return {
      cpu_usage: 42,
      memory_usage: 68,
      network_status: 92,
      system_status: 85,
      security_level: 75,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getSystemMetricsHistory(limit = 24) {
  try {
    return await fetchSystemMetrics(limit)
  } catch (error) {
    console.error("Error fetching system metrics history:", error)
    return []
  }
}

export async function updateSystemMetric(metric: SystemMetric) {
  try {
    await saveSystemMetric(metric)
    return { success: true }
  } catch (error) {
    console.error("Error updating system metric:", error)
    return { success: false, error }
  }
}

// Função para simular métricas do sistema (para desenvolvimento)
export async function simulateSystemMetric() {
  const metric: SystemMetric = {
    cpu_usage: Math.floor(Math.random() * 30) + 30,
    memory_usage: Math.floor(Math.random() * 20) + 60,
    network_status: Math.floor(Math.random() * 15) + 80,
    system_status: Math.floor(Math.random() * 10) + 80,
    security_level: Math.floor(Math.random() * 15) + 70,
  }

  try {
    await saveSystemMetric(metric)
    return { success: true, metric }
  } catch (error) {
    console.error("Error simulating system metric:", error)
    return { success: false, error }
  }
}
