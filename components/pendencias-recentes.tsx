"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Eye, FileText, Trash2, AlertCircle, CheckCircle2, Calendar } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

// Interface para pendências recentes
interface PendenciaRecente {
  id: string
  category: string
  description: string
  timestamp: Date
  action: "added" | "updated" | "removed"
  categoryDisplayName: string
}

interface PendenciasRecentesProps {
  onViewCategory: (category: string) => void
  onGenerateReport: (category: string) => void
}

export function PendenciasRecentes({ onViewCategory, onGenerateReport }: PendenciasRecentesProps) {
  const [pendenciasRecentes, setPendenciasRecentes] = useState<PendenciaRecente[]>([])
  const [filter, setFilter] = useState<"all" | "added" | "updated" | "removed">("all")

  // Função para obter o nome de exibição da categoria
  const getCategoryDisplayName = (slug: string) => {
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

  // Função para adicionar uma nova pendência recente
  const addPendenciaRecente = (category: string, description: string, action: "added" | "updated" | "removed") => {
    const novaPendencia: PendenciaRecente = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      description,
      timestamp: new Date(),
      action,
      categoryDisplayName: getCategoryDisplayName(category),
    }

    setPendenciasRecentes((prev) => {
      // Adicionar no início da lista e manter apenas os últimos 50 itens
      const updated = [novaPendencia, ...prev].slice(0, 50)

      // Salvar no localStorage para persistência
      try {
        localStorage.setItem("pendencias-recentes", JSON.stringify(updated))
      } catch (error) {
        console.warn("Erro ao salvar pendências recentes no localStorage:", error)
      }

      return updated
    })
  }

  // Carregar pendências recentes do localStorage na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pendencias-recentes")
      if (saved) {
        const parsed = JSON.parse(saved)
        // Converter timestamps de string para Date
        const withDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setPendenciasRecentes(withDates)
      }
    } catch (error) {
      console.warn("Erro ao carregar pendências recentes do localStorage:", error)
    }
  }, [])

  // Expor a função addPendenciaRecente globalmente para uso em outros componentes
  useEffect(() => {
    // @ts-ignore - Adicionar função global para uso em outros componentes
    window.addPendenciaRecente = addPendenciaRecente

    return () => {
      // @ts-ignore - Limpar função global
      delete window.addPendenciaRecente
    }
  }, [])

  // Filtrar pendências baseado no filtro selecionado
  const pendenciasFiltradas = pendenciasRecentes.filter((pendencia) => {
    if (filter === "all") return true
    return pendencia.action === filter
  })

  // Função para limpar todas as pendências recentes
  const clearPendenciasRecentes = () => {
    setPendenciasRecentes([])
    try {
      localStorage.removeItem("pendencias-recentes")
    } catch (error) {
      console.warn("Erro ao limpar pendências recentes do localStorage:", error)
    }
  }

  // Função para remover uma pendência específica
  const removePendenciaRecente = (id: string) => {
    setPendenciasRecentes((prev) => {
      const updated = prev.filter((p) => p.id !== id)
      try {
        localStorage.setItem("pendencias-recentes", JSON.stringify(updated))
      } catch (error) {
        console.warn("Erro ao salvar pendências recentes no localStorage:", error)
      }
      return updated
    })
  }

  // Função para obter o ícone baseado na ação
  const getActionIcon = (action: "added" | "updated" | "removed") => {
    switch (action) {
      case "added":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "updated":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "removed":
        return <Trash2 className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-slate-500" />
    }
  }

  // Função para obter a cor do badge baseado na ação
  const getActionColor = (action: "added" | "updated" | "removed") => {
    switch (action) {
      case "added":
        return "bg-green-900/30 text-green-400 border-green-500/50"
      case "updated":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/50"
      case "removed":
        return "bg-red-900/30 text-red-400 border-red-500/50"
      default:
        return "bg-slate-900/30 text-slate-400 border-slate-500/50"
    }
  }

  // Função para obter o texto da ação
  const getActionText = (action: "added" | "updated" | "removed") => {
    switch (action) {
      case "added":
        return "Adicionada"
      case "updated":
        return "Atualizada"
      case "removed":
        return "Removida"
      default:
        return "Modificada"
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
            <Clock className="mr-2 h-5 w-5 text-green-500" />
            Pendências Recentes
            <Badge variant="outline" className="ml-2 bg-slate-800/50 text-green-400 border-green-500/50 text-xs">
              {pendenciasFiltradas.length} {pendenciasFiltradas.length === 1 ? "item" : "itens"}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {pendenciasRecentes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearPendenciasRecentes}
                className="bg-red-900/20 text-red-400 border-red-500/50 hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar Tudo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={`flex-shrink-0 ${
              filter === "all"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            Todas ({pendenciasRecentes.length})
          </Button>
          <Button
            variant={filter === "added" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("added")}
            className={`flex-shrink-0 ${
              filter === "added"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Adicionadas ({pendenciasRecentes.filter((p) => p.action === "added").length})
          </Button>
          <Button
            variant={filter === "updated" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("updated")}
            className={`flex-shrink-0 ${
              filter === "updated"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Atualizadas ({pendenciasRecentes.filter((p) => p.action === "updated").length})
          </Button>
          <Button
            variant={filter === "removed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("removed")}
            className={`flex-shrink-0 ${
              filter === "removed"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Removidas ({pendenciasRecentes.filter((p) => p.action === "removed").length})
          </Button>
        </div>

        {/* Lista de pendências recentes */}
        <div className="bg-slate-800/30 rounded-md border border-slate-700/50 overflow-hidden">
          {pendenciasFiltradas.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-3">
                {pendenciasFiltradas.map((pendencia) => (
                  <div
                    key={pendencia.id}
                    className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(pendencia.action)}
                        <Badge variant="outline" className={`text-xs ${getActionColor(pendencia.action)}`}>
                          {getActionText(pendencia.action)}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                          {pendencia.categoryDisplayName}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-500 hover:text-blue-500"
                          onClick={() => onViewCategory(pendencia.category)}
                          title="Ver categoria"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-500 hover:text-green-500"
                          onClick={() => onGenerateReport(pendencia.category)}
                          title="Gerar relatório"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-500 hover:text-red-500"
                          onClick={() => removePendenciaRecente(pendencia.id)}
                          title="Remover da lista"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-slate-300 mb-2 line-clamp-2">{pendencia.description}</div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(pendencia.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      </div>
                      <span>{formatDistanceToNow(pendencia.timestamp, { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 p-4">
              <Clock className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhuma pendência recente</p>
              <p className="text-xs text-center mt-1">
                {filter === "all"
                  ? "As pendências adicionadas, atualizadas ou removidas aparecerão aqui"
                  : `Nenhuma pendência ${getActionText(filter as any).toLowerCase()} encontrada`}
              </p>
            </div>
          )}
        </div>

        {/* Estatísticas rápidas */}
        {pendenciasRecentes.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-slate-400">Adicionadas</span>
              </div>
              <div className="text-lg font-semibold text-green-400">
                {pendenciasRecentes.filter((p) => p.action === "added").length}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-slate-400">Atualizadas</span>
              </div>
              <div className="text-lg font-semibold text-yellow-400">
                {pendenciasRecentes.filter((p) => p.action === "updated").length}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="text-xs text-slate-400">Removidas</span>
              </div>
              <div className="text-lg font-semibold text-red-400">
                {pendenciasRecentes.filter((p) => p.action === "removed").length}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
