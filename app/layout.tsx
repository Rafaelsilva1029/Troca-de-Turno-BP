import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-manager"
import { AudioProvider } from "@/lib/audio-service"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Dashboard Futurista</title>
        <meta name="description" content="Dashboard futurista para gerenciamento de operações" />
      </head>
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

export const metadata = {
  generator: "v0.dev",
}
