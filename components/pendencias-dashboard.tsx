"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Truck, BarChart3, PieChart } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface PendenciaItem {
  id?: string
  description: string
  frota: string
  priority?: "baixa" | "media" | "alta" | "urgente"
  createdAt?: string
}

interface PendenciasDashboardProps {
  pendenciasData: Record<string, PendenciaItem[]>
}

export function PendenciasDashboard({ pendenciasData }: PendenciasDashboardProps) {
  const [activeTab, setActiveTab] = useState("resumo")
  const [totalPendencias, setTotalPendencias] = useState(0)
  const [pendenciasPorCategoria, setPendenciasPorCategoria] = useState<Record<string, number>>({})
  const [pendenciasPorPrioridade, setPendenciasPorPrioridade] = useState<Record<string, number>>({})
  const [categoriasOrdenadas, setCategoriasOrdenadas] = useState<{ nome: string; count: number }[]>([])

  // Processar dados para o dashboard
  useEffect(() => {
    // Calcular total de pendências
    let total = 0
    const porCategoria: Record<string, number> = {}
    const porPrioridade: Record<string, number> = {
      urgente: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    }

    // Processar dados
    Object.entries(pendenciasData).forEach(([categoria, items]) => {
      const pendenciasValidas = items.filter((item) => item.description && item.description.trim() !== "")
      const count = pendenciasValidas.length

      if (count > 0) {
        total += count
        porCategoria[categoria] = count

        // Contar por prioridade
        pendenciasValidas.forEach((item) => {
          const prioridade = item.priority || "media"
          porPrioridade[prioridade] = (porPrioridade[prioridade] || 0) + 1
        })
      }
    })

    // Ordenar categorias por quantidade de pendências
    const ordenadas = Object.entries(porCategoria)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 categorias

    setTotalPendencias(total)
    setPendenciasPorCategoria(porCategoria)
    setPendenciasPorPrioridade(porPrioridade)
    setCategoriasOrdenadas(ordenadas)
  }, [pendenciasData])

  // Função para obter o nome amigável da categoria
  const getCategoryName = (slug: string) => {
    const names: Record<string, string> = {
      "veiculos-logistica": "Veículos Logística",
      "caminhoes-pipas": "Caminhões Pipas",
      "caminhoes-munck": "Caminhões Munck",
      "caminhoes-coletas": "Caminhões Coletas",
      "carretas-pranchas-ls-outros": "Carretas / Pranchas / LS",
      "caminhoes-prancha-vinhaca-muda": "Caminhões Prancha/Vinhaça",
      "caminhoes-cacambas": "Caminhões Caçambas",
      "trator-reboque": "Trator Reboque",
      "area-de-vivencias": "Área de Vivências",
      "carretinhas-rtk": "Carretinhas RTK",
      "tanques-e-dolly": "Tanques e Dolly",
      "carretas-canavieira": "Carretas Canavieira",
    }
    return names[slug] || slug
  }

  // Calcular porcentagem para cada prioridade
  const calcularPorcentagem = (valor: number) => {
    return totalPendencias > 0 ? Math.round((valor / totalPendencias) * 100) : 0
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
          <BarChart3 className="mr-2 h-5 w-5 text-green-500" />
          Dashboard de Pendências
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resumo" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 bg-slate-800/50">
            <TabsTrigger
              value="resumo"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400"
            >
              Resumo
            </TabsTrigger>
            <TabsTrigger
              value="categorias"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400"
            >
              Por Categoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-blue-500" />
                    Total de Pendências
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="text-2xl font-bold">{totalPendencias}</div>
                  <p className="text-xs text-muted-foreground">Em todas as categorias</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Pendências Urgentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="text-2xl font-bold">{pendenciasPorPrioridade.urgente || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {calcularPorcentagem(pendenciasPorPrioridade.urgente || 0)}% do total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                    Categorias Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="text-2xl font-bold">{Object.keys(pendenciasPorCategoria).length}</div>
                  <p className="text-xs text-muted-foreground">Com pendências registradas</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300">Distribuição por Prioridade</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className="bg-red-900/30 text-red-400 border-red-500/50 mr-2">Urgente</Badge>
                    <span className="text-sm">{pendenciasPorPrioridade.urgente || 0} pendências</span>
                  </div>
                  <span className="text-sm">{calcularPorcentagem(pendenciasPorPrioridade.urgente || 0)}%</span>
                </div>
                <Progress
                  value={calcularPorcentagem(pendenciasPorPrioridade.urgente || 0)}
                  className="h-2 bg-slate-700"
                  indicatorClassName="bg-red-500"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className="bg-orange-900/30 text-orange-400 border-orange-500/50 mr-2">Alta</Badge>
                    <span className="text-sm">{pendenciasPorPrioridade.alta || 0} pendências</span>
                  </div>
                  <span className="text-sm">{calcularPorcentagem(pendenciasPorPrioridade.alta || 0)}%</span>
                </div>
                <Progress
                  value={calcularPorcentagem(pendenciasPorPrioridade.alta || 0)}
                  className="h-2 bg-slate-700"
                  indicatorClassName="bg-orange-500"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-500/50 mr-2">Média</Badge>
                    <span className="text-sm">{pendenciasPorPrioridade.media || 0} pendências</span>
                  </div>
                  <span className="text-sm">{calcularPorcentagem(pendenciasPorPrioridade.media || 0)}%</span>
                </div>
                <Progress
                  value={calcularPorcentagem(pendenciasPorPrioridade.media || 0)}
                  className="h-2 bg-slate-700"
                  indicatorClassName="bg-yellow-500"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className="bg-green-900/30 text-green-400 border-green-500/50 mr-2">Baixa</Badge>
                    <span className="text-sm">{pendenciasPorPrioridade.baixa || 0} pendências</span>
                  </div>
                  <span className="text-sm">{calcularPorcentagem(pendenciasPorPrioridade.baixa || 0)}%</span>
                </div>
                <Progress
                  value={calcularPorcentagem(pendenciasPorPrioridade.baixa || 0)}
                  className="h-2 bg-slate-700"
                  indicatorClassName="bg-green-500"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categorias" className="mt-0">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Top 5 Categorias com Mais Pendências</h3>

            <div className="space-y-4">
              {categoriasOrdenadas.length > 0 ? (
                categoriasOrdenadas.map((categoria) => (
                  <div key={categoria.nome} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-green-900/20 flex items-center justify-center text-green-400 border border-green-500/30 mr-3">
                          <Truck className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-200">{getCategoryName(categoria.nome)}</span>
                      </div>
                      <Badge className="bg-slate-700/50 text-green-400 border-green-500/50">
                        {categoria.count} pendências
                      </Badge>
                    </div>
                    <Progress
                      value={calcularPorcentagem(categoria.count)}
                      className="h-2 bg-slate-700"
                      indicatorClassName="bg-gradient-to-r from-green-500 to-cyan-500"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <PieChart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma pendência registrada</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
