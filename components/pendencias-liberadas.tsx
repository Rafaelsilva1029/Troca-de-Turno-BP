"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Check, Search, FileText, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type PendenciaLiberada, fetchPendenciasLiberadas } from "@/lib/supabase"

export function PendenciasLiberadas() {
  const [pendenciasLiberadas, setPendenciasLiberadas] = useState<PendenciaLiberada[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  const loadPendenciasLiberadas = async () => {
    try {
      setIsLoading(true)
      const data = await fetchPendenciasLiberadas()
      setPendenciasLiberadas(data)
    } catch (error) {
      console.error("Error loading released pendencias:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPendenciasLiberadas()
  }, [])

  const getCategoryName = (slug: string) => {
    const names: Record<string, string> = {
      "veiculos-logistica": "Veículos Logística",
      "caminhoes-pipas": "Caminhões Pipas",
      "caminhoes-munck": "Caminhões Munck",
      "caminhoes-prancha-vinhaca-muda": "Caminhões Prancha/Vinhaça/Muda",
      "caminhoes-cacambas": "Caminhões Caçambas",
      "area-de-vivencias": "Área de Vivências",
      "carretinhas-rtk": "Carretinhas RTK",
      "tanques-e-dolly": "Tanques e Dolly",
      "carretas-canavieira": "Carretas Canavieira",
    }
    return names[slug] || slug
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("pt-BR"),
      time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const filterPendencias = () => {
    return pendenciasLiberadas.filter((pendencia) => {
      const matchesSearch =
        pendencia.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pendencia.equipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pendencia.released_by.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "all" || pendencia.category === categoryFilter

      // Filtro de data
      const releaseDate = new Date(pendencia.released_at)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      const lastMonth = new Date(today)
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      let matchesDate = true

      if (dateFilter === "today") {
        matchesDate = releaseDate >= today
      } else if (dateFilter === "yesterday") {
        matchesDate = releaseDate >= yesterday && releaseDate < today
      } else if (dateFilter === "last7days") {
        matchesDate = releaseDate >= lastWeek
      } else if (dateFilter === "last30days") {
        matchesDate = releaseDate >= lastMonth
      }

      return matchesSearch && matchesCategory && matchesDate
    })
  }

  const filteredPendencias = filterPendencias()

  const uniqueCategories = Array.from(new Set(pendenciasLiberadas.map((p) => p.category)))

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
            <Check className="mr-2 h-5 w-5 text-green-500" />
            Equipamentos Liberados
          </CardTitle>
          <Badge variant="outline" className="bg-slate-800/50 text-green-400 border-green-500/50">
            {pendenciasLiberadas.length} registros
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Filtros e busca */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar em equipamentos liberados..."
                  className="pl-9 bg-slate-800 border-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                  <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectItem value="all">Todos Períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" className="bg-slate-800 hover:bg-slate-700" onClick={loadPendenciasLiberadas}>
                  <Download className="h-4 w-4 mr-2" /> Atualizar
                </Button>

                <Button
                  variant="outline"
                  className="bg-green-800/30 text-green-400 hover:bg-green-800/50 border-green-700/50"
                >
                  <FileText className="h-4 w-4 mr-2" /> Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Exibir pendências liberadas */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="h-8 w-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-400">Carregando registros...</span>
            </div>
          ) : filteredPendencias.length > 0 ? (
            <div className="space-y-3">
              {filteredPendencias.map((pendencia) => {
                const { date, time } = formatDateTime(pendencia.released_at)
                return (
                  <div
                    key={pendencia.id}
                    className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex justify-between">
                      <Badge variant="outline" className="mb-2 bg-green-900/20 text-green-400 border-green-700/50">
                        {getCategoryName(pendencia.category)}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">
                        #{pendencia.equipment_id}
                      </Badge>
                    </div>
                    <p className="text-slate-200 mb-2">{pendencia.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" /> {date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> {time}
                        </div>
                      </div>
                      <div>
                        Liberado por: <span className="text-green-400">{pendencia.released_by}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <Check className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p className="text-lg">Nenhum equipamento liberado encontrado</p>
              <p className="text-sm">Os equipamentos liberados aparecerão aqui quando forem processados.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
