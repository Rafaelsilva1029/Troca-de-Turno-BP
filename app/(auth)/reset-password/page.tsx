"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Eye, EyeOff, Save, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const supabase = createClientComponentClient()

  // Verificar se o usuário tem um token de redefinição válido
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        router.push("/login?error=invalid_reset_link")
      }
    }

    checkSession()
  }, [router, supabase])

  // Calcular força da senha
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0

    // Comprimento mínimo
    if (password.length >= 8) strength += 25

    // Contém números
    if (/\d/.test(password)) strength += 25

    // Contém letras minúsculas e maiúsculas
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25

    // Contém caracteres especiais
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25

    setPasswordStrength(strength)
  }, [password])

  const getStrengthColor = () => {
    if (passwordStrength < 50) return "bg-red-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength < 50) return "Fraca"
    if (passwordStrength < 75) return "Média"
    return "Forte"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validar senhas
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (passwordStrength < 50) {
      setError("Por favor, escolha uma senha mais forte.")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)

      // Registrar evento
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("logs").insert({
          event: "auth",
          details: {
            action: "password_reset_complete",
          },
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
      }

      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "Falha ao redefinir a senha.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Redefinir Senha</h1>
        <p className="text-gray-500">Crie uma nova senha para sua conta</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success ? (
        <div className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Senha redefinida com sucesso</AlertTitle>
            <AlertDescription className="text-green-700">
              Sua senha foi atualizada. Você será redirecionado para a página de login em instantes.
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Link href="/login">
              <Button className="bg-green-600 hover:bg-green-700">Ir para o login</Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

            {password && (
              <div className="space-y-1 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Força da senha:</span>
                  <span
                    className={
                      passwordStrength >= 75
                        ? "text-green-600"
                        : passwordStrength >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                    }
                  >
                    {getStrengthText()}
                  </span>
                </div>
                <Progress value={passwordStrength} className={`h-1 ${getStrengthColor()}`} />
                <ul className="text-xs text-gray-500 space-y-1 mt-2">
                  <li className={password.length >= 8 ? "text-green-600" : ""}>✓ Pelo menos 8 caracteres</li>
                  <li className={/\d/.test(password) ? "text-green-600" : ""}>✓ Pelo menos um número</li>
                  <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-green-600" : ""}>
                    ✓ Letras maiúsculas e minúsculas
                  </li>
                  <li className={/[^a-zA-Z0-9]/.test(password) ? "text-green-600" : ""}>
                    ✓ Pelo menos um caractere especial
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
            )}
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
                Redefinindo...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Redefinir Senha
              </>
            )}
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-green-600 hover:text-green-800">
              <ArrowLeft className="inline-block mr-1 h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
