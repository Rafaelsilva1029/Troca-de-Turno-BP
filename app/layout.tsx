import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-manager"
import { AudioProvider } from "@/lib/audio-service"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
// import { ConnectionMonitor } from "@/components/connection-monitor"

export const metadata: Metadata = {
  title: "Branco Peres Agribusiness - Sistema de Gestão",
  description: "Dashboard futurista para gerenciamento de operações",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <AudioProvider>
            <NotificationProvider>
              {children}
              <Toaster />
            </NotificationProvider>
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
