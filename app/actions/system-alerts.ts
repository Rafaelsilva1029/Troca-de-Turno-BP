"use server"

import { fetchSystemAlerts, saveSystemAlert, deleteSystemAlert, type SystemAlert } from "@/lib/supabase"

export async function getSystemAlerts(limit = 10) {
  try {
    return await fetchSystemAlerts(limit)
  } catch (error) {
    console.error("Error fetching system alerts:", error)
    // Retornar alertas padrão se houver erro
    return [
      {
        id: 1,
        title: "Security Scan Complete",
        description: "No threats detected in system scan",
        type: "info" as const,
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Bandwidth Spike Detected",
        description: "Unusual network activity on port 443",
        type: "warning" as const,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 3,
        title: "System Update Available",
        description: "Version 12.4.5 ready to install",
        type: "update" as const,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 4,
        title: "Backup Completed",
        description: "Incremental backup to drive E: successful",
        type: "success" as const,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
      },
    ]
  }
}

export async function createSystemAlert(alert: SystemAlert) {
  try {
    await saveSystemAlert(alert)
    return { success: true }
  } catch (error) {
    console.error("Error creating system alert:", error)
    return { success: false, error }
  }
}

export async function removeSystemAlert(id: number) {
  try {
    await deleteSystemAlert(id)
    return { success: true }
  } catch (error) {
    console.error("Error removing system alert:", error)
    return { success: false, error }
  }
}

// Função para simular alertas do sistema (para desenvolvimento)
export async function simulateSystemAlert() {
  const alertTypes = ["info", "warning", "success", "update"] as const
  const titles = [
    "System Scan Complete",
    "Network Activity Detected",
    "Backup Process Finished",
    "Update Available",
    "Security Check Passed",
    "Performance Optimized",
  ]
  const descriptions = [
    "All systems operating normally",
    "Monitoring network traffic patterns",
    "Data backup completed successfully",
    "New version ready for installation",
    "No security threats detected",
    "System performance has been optimized",
  ]

  const alert: SystemAlert = {
    title: titles[Math.floor(Math.random() * titles.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
  }

  try {
    await saveSystemAlert(alert)
    return { success: true, alert }
  } catch (error) {
    console.error("Error simulating system alert:", error)
    return { success: false, error }
  }
}
