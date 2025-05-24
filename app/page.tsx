import { ClientReminderSystem } from "@/components/client-reminder-system"
import { Suspense } from "react"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <Suspense fallback={<div>Carregando...</div>}>
        <ClientReminderSystem />
      </Suspense>
    </main>
  )
}
