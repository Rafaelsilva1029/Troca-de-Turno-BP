"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const errorCode = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  // Definir mensagem de erro com base no código
  const getErrorMessage = (code: string | null) => {
    switch (code) {
      case "account_inactive":
        return "Sua conta está inativa. Entre em contato com o administrador."
      case "session_expired":
        return "Sua sessão expirou. Por favor, faça login novamente."
      default:
        return null
    }
  }

  // Processar o login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Verificar se o usuário está ativo
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("is_active")
        .eq("id", data.user.id)
        .single()

      if (userError || !userData) {
        throw new Error("Erro ao verificar status do usuário")
      }

      if (!userData.is_active) {
        // Fazer logout se o usuário estiver inativo
        await supabase.auth.signOut()
        throw new Error("Sua conta está inativa. Entre em contato com o administrador.")
      }

      // Atualizar último login
      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", data.user.id)

      // Registrar evento de login
      await supabase.from("logs").insert({
        event: "auth",
        details: {
          action: "login",
          method: "email",
        },
        user_id: data.user.id,
        created_at: new Date().toISOString(),
      })

      // Redirecionar para a página solicitada
      router.push(redirectTo)
      router.refresh()
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Falha ao fazer login. Verifique suas credenciais.")
    } finally {
      setIsLoading(false)
    }
  }

  // Erro da URL
  const urlError = getErrorMessage(errorCode)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="text-gray-500">Entre com suas credenciais para acessar o sistema</p>
      </div>

      {(error || urlError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error || urlError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu.email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-800">
              Esqueceu a senha?
            </Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isLoading}
          />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
            Lembrar de mim
          </Label>
        </div>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Entrando...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </>
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Não tem uma conta?{" "}
          <Link href="/contact" className="text-green-600 hover:text-green-800 font-medium">
            Entre em contato
          </Link>
        </p>
      </div>
    </div>
  )
}
