// Re-using from v464
// Basic client-side notification service

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Este navegador não suporta notificações desktop.")
    return "denied"
  }
  return Notification.requestPermission()
}

export function scheduleReminderNotification(
  title: string,
  scheduledTime: Date,
  body?: string,
  icon = "/branco-peres-logo.png", // Default icon
): void {
  requestNotificationPermission().then((permission) => {
    if (permission === "granted") {
      const now = new Date().getTime()
      const timeUntilNotification = scheduledTime.getTime() - now

      if (timeUntilNotification > 0) {
        setTimeout(() => {
          try {
            const notification = new Notification(title, { body, icon })
            // You can add onclick events to the notification here
            // notification.onclick = () => { window.focus(); this.close(); };
          } catch (e) {
            console.error("Erro ao exibir notificação:", e)
          }
        }, timeUntilNotification)
      } else {
        // If the scheduled time is in the past, show immediately (or handle as overdue)
        try {
          new Notification(title, { body: `${body} (Lembrete atrasado)`, icon })
        } catch (e) {
          console.error("Erro ao exibir notificação atrasada:", e)
        }
      }
    } else {
      console.log("Permissão para notificação negada.")
    }
  })
}
