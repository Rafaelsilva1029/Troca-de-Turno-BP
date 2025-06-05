"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Search, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface Equipamento {
  id: string
  numero_frota: string
  categoria: string
  localizacao: string
  servico: string | null
  status: string
}

const categorias = [
  "PIPAS ÁGUA BRUTA",
  "PIPAS ÁGUA TRATADA",
  "MUNCK DISPONÍVEL",
  "CAÇAMBAS DISPONÍVEIS",
  "VEÍCULOS",
  "TRATORES",
  "OUTROS",
]

export default function EquipamentosLocalizacaoMobile() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    async function fetchEquipamentos() {
      try {
        console.log("🔄 Carregando equipamentos...")
        const { data, error } = await supabase
          .from("equipamentos_localizacao")
          .select("*")
          .order("categoria", { ascending: true })

        if (error) {
          console.error("❌ Erro Supabase:", error)
          throw error
        }

        console.log("✅ Equipamentos carregados:", data?.length || 0)
        setEquipamentos(data || [])
      } catch (error) {
        console.error("❌ Erro ao carregar:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEquipamentos()
  }, [supabase])

  const filteredEquipamentos = equipamentos.filter(
    (eq) =>
      eq.numero_frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.localizacao.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header Mobile */}
      <div className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-400" />
              Equipamentos Localização
            </h1>
            <p className="text-sm text-green-400">✓ Módulo carregado</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Buscar equipamento..."
            className="pl-10 bg-slate-800 border-slate-600 text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="bg-slate-800 border-l-4 border-green-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <div>
              <p className="font-medium">Sistema Ativo</p>
              <p className="text-sm text-slate-400">
                {isLoading ? "Carregando..." : `${filteredEquipamentos.length} equipamentos`}
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        )}

        {/* Lista de Equipamentos */}
        {!isLoading && (
          <div className="space-y-3">
            {categorias.map((categoria) => {
              const equipamentosCategoria = filteredEquipamentos.filter((eq) => eq.categoria === categoria)

              if (equipamentosCategoria.length === 0) return null

              return (
                <Card key={categoria} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-400" />
                      {categoria} ({equipamentosCategoria.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {equipamentosCategoria.map((eq) => (
                        <div key={eq.id} className="bg-slate-700 p-3 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-green-400">Frota: {eq.numero_frota}</p>
                              <p className="text-sm text-slate-300 mt-1">📍 {eq.localizacao}</p>
                              {eq.servico && <p className="text-xs text-slate-400 mt-1">{eq.servico}</p>}
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                eq.status === "ATIVO"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {eq.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Mensagem vazia */}
        {!isLoading && filteredEquipamentos.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum equipamento encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
