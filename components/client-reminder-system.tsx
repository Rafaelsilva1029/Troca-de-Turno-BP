"use client"

import { ReminderSystem } from "./reminder-system"
import { useNotifications } from "./notification-manager"
import { ErrorBoundary } from "./error-boundary"

export function ClientReminderSystem() {
  const notifications = useNotifications()

  if (!notifications) {
    console.error(
      "NotificationProvider não encontrado. Certifique-se de que ClientReminderSystem está dentro de NotificationProvider.",
    )
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-100">
        <h3 className="font-semibold">Erro de Contexto</h3>
        <p>Sistema de notificações não disponível. Recarregue a página ou contate o suporte.</p>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={<div>Erro ao carregar o sistema de lembretes.</div>}>
      <ReminderSystem />
    </ErrorBoundary>
  )
}
