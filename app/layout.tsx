import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/notification-manager"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Futuristic Dashboard - Branco Peres Agribusiness",
  description: "Sistema avançado de controle e monitoramento para operações agrícolas",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <NotificationProvider>
          {children}
          <Toaster />
        </NotificationProvider>
      </body>
    </html>
  )
}
