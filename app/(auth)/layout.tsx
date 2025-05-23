import type React from "react"
import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Autenticação | Branco Peres Agribusiness",
  description: "Página de autenticação do sistema de gestão Branco Peres Agribusiness",
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar se o usuário já está autenticado
  const user = await getCurrentUser()

  // Se estiver autenticado, redirecionar para o dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Painel lateral com imagem e informações */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-800 to-green-950 text-white p-10 flex-col justify-between">
          <div>
            <Image
              src="/branco-peres-logo.png"
              alt="Branco Peres Agribusiness"
              width={180}
              height={60}
              className="mb-8"
            />
            <h1 className="text-3xl font-bold mb-6">Sistema de Gestão Operacional</h1>
            <p className="text-lg text-green-100 mb-4">
              Plataforma integrada para gerenciamento de operações agrícolas, logística e manutenção.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-700/30 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-300"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-green-200">Segurança Avançada</h3>
                <p className="text-green-300 text-sm">
                  Proteção de dados e controle de acesso por níveis de permissão.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-700/30 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-300"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-green-200">Acesso Multiplataforma</h3>
                <p className="text-green-300 text-sm">Acesse de qualquer dispositivo, com suporte a modo offline.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-700/30 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-300"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-green-200">Integração Completa</h3>
                <p className="text-green-300 text-sm">
                  Conectado com todos os sistemas da empresa para dados em tempo real.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-green-400">
            &copy; {new Date().getFullYear()} Branco Peres Agribusiness. Todos os direitos reservados.
          </div>
        </div>

        {/* Conteúdo de autenticação */}
        <div className="flex-1 p-6 md:p-10 flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-md">
            <div className="md:hidden mb-6">
              <Image src="/branco-peres-logo.png" alt="Branco Peres Agribusiness" width={150} height={50} />
            </div>

            {children}

            <div className="mt-8 text-center text-sm text-gray-500 md:hidden">
              &copy; {new Date().getFullYear()} Branco Peres Agribusiness
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
