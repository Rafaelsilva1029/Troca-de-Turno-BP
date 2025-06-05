"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function EquipamentosLocalizacaoRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a rota de teste que funciona
    console.log("🔄 Redirecionando para rota de teste...")
    router.push("/teste-equipamentos")
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecionando para módulo de equipamentos...</p>
      </div>
    </div>
  )
}
