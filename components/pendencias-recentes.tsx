"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  Clock,
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  Plus,
} from "lucide-react"
import { fetchPendencias, liberarPendencia } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PendenciaRecenteItem } from "./pendencias-recentes-item"

interface PendenciasRecentesProps {
  onViewCategory: (category: string) => void
  onGenerateReport: (category: string) => void
  onAddPendencia?: (category: string, description: string, frota: string, priority: string) => void
}

interface PendenciaRecente {
  id: number
  category: string
  description: string
  frota: string // Adicionado campo de frota
  created_at: string
  updated_at: string
  priority?: "baixa" | "media" | "alta" | "urgente"
  status?: "pendente" | "em-andamento" | "encerrado"
}

type FilterType = "all" | "today" | "week" | "month"
type SortType = "newest" | "oldest" | "priority" | "category" | "frota"
type StatusFilter = "all" | "pendente" | "em-andamento" | "encerrado"

export function PendenciasRecentes({ onViewCategory, onGenerateReport, onAddPendencia }: PendenciasRecentesProps) {
  const { toast } = useToast()
  const [pendenciasRecentes, setPendenciasRecentes] = useState<PendenciaRecente[]>([])
  const [filteredPendencias, setFilteredPendencias] = useState<PendenciaRecente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros e ordenação
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<FilterType>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortType>("newest")

  // Modal de encerramento
  const [encerrarModal, setEncerrarModal] = useState<{
    isOpen: boolean
    pendencia: PendenciaRecente | null
  }>({
    isOpen: false,
    pendencia: null,
  })
  const [motivoEncerramento, setMotivoEncerramento] = useState("")
  const [responsavelEncerramento, setResponsavelEncerramento] = useState("")

  // Modal de adição de pendência
  const [addPendenciaModal, setAddPendenciaModal] = useState(false)
  const [newPendenciaCategory, setNewPendenciaCategory] = useState("")
  const [newPendenciaDescription, setNewPendenciaDescription] = useState("")
  const [newPendenciaFrota, setNewPendenciaFrota] = useState("") // Novo campo de frota
  const [newPendenciaPriority, setNewPendenciaPriority] = useState<"baixa" | "media" | "alta" | "urgente">("media")
  const [isAddingPendencia, setIsAddingPendencia] = useState(false)

  // Função para carregar pendências do banco
  const loadPendenciasRecentes = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const pendencias = await fetchPendencias()

      // Adicionar propriedades simuladas para demonstração
      const pendenciasComStatus = pendencias.map((p) => ({
        ...p,
        frota: p.frota || `F-${Math.floor(Math.random() * 1000)}`, // Adicionar frota simulada se não existir
        priority: ["baixa", "media", "alta", "urgente"][Math.floor(Math.random() * 4)] as any,
        status: ["pendente", "em-andamento"][Math.floor(Math.random() * 2)] as any,
      }))

      setPendenciasRecentes(pendenciasComStatus)
    } catch (err) {
      console.error("Erro ao carregar pendências:", err)
      setError("Erro ao carregar pendências")

      // Dados de fallback
      setPendenciasRecentes([
        {
          id: 1,
          category: "veiculos-logistica",
          description: "Veículo L-001 com problema no freio",
          frota: "L-001",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          priority: "alta",
          status: "pendente",
        },
        {
          id: 2,
          category: "caminhoes-coletas",
          description: "Caminhão C-001 com problema na compactação",
          frota: "C-001",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: "urgente",
          status: "em-andamento",
        },
        {
          id: 3,
          category: "carretas-pranchas-ls-outros",
          description: "Carreta CR-001 com problema na suspensão",
          frota: "CR-001",
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          priority: "media",
          status: "pendente",
        },
        {
          id: 4,
          category: "trator-reboque",
          description: "Trator TR-001 com problema no motor",
          frota: "TR-001",
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "baixa",
          status: "pendente",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Função para adicionar nova pendência
  const handleAddPendencia = async () => {
    if (!newPendenciaCategory || !newPendenciaDescription || !newPendenciaFrota) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAddingPendencia(true)

      // Simulando adição ao banco de dados
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Criar nova pendência
      const newPendencia: PendenciaRecente = {
        id: Math.floor(Math.random() * 10000),
        category: newPendenciaCategory,
        description: newPendenciaDescription,
        frota: newPendenciaFrota,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority: newPendenciaPriority,
        status: "pendente",
      }

      // Adicionar à lista local
      setPendenciasRecentes((prev) => [newPendencia, ...prev])

      // Sincronizar com Pendências Oficina
      if (onAddPendencia) {
        onAddPendencia(newPendenciaCategory, newPendenciaDescription, newPendenciaFrota, newPendenciaPriority)
      }

      toast({
        title: "Sucesso",
        description: "Pendência adicionada com sucesso!",
        variant: "default",
      })

      // Limpar formulário e fechar modal
      setNewPendenciaCategory("")
      setNewPendenciaDescription("")
      setNewPendenciaFrota("")
      setNewPendenciaPriority("media")
      setAddPendenciaModal(false)
    } catch (error) {
      console.error("Erro ao adicionar pendência:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar pendência",
        variant: "destructive",
      })
    } finally {
      setIsAddingPendencia(false)
    }
  }

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...pendenciasRecentes]

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getCategoryName(p.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.frota.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por data
    const now = new Date()
    if (dateFilter !== "all") {
      filtered = filtered.filter((p) => {
        const date = new Date(p.created_at)
        switch (dateFilter) {
          case "today":
            return date.toDateString() === now.toDateString()
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return date >= weekAgo
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return date >= monthAgo
          default:
            return true
        }
      })
    }

    // Filtro por categoria
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case "oldest":
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        case "priority":
          const priorityOrder = { urgente: 4, alta: 3, media: 2, baixa: 1 }
          return (priorityOrder[b.priority || "baixa"] || 1) - (priorityOrder[a.priority || "baixa"] || 1)
        case "category":
          return getCategoryName(a.category).localeCompare(getCategoryName(b.category))
        case "frota":
          return a.frota.localeCompare(b.frota)
        default:
          return 0
      }
    })

    setFilteredPendencias(filtered)
  }, [pendenciasRecentes, searchTerm, dateFilter, categoryFilter, statusFilter, sortBy])

  // Carregar dados ao montar
  useEffect(() => {
    loadPendenciasRecentes()
    const interval = setInterval(loadPendenciasRecentes, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Função para encerrar pendência
  const handleEncerrarPendencia = async () => {
    if (!encerrarModal.pendencia || !motivoEncerramento.trim() || !responsavelEncerramento.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      await liberarPendencia({
        category: encerrarModal.pendencia.category,
        description: encerrarModal.pendencia.description,
        released_by: responsavelEncerramento,
        equipment_id: encerrarModal.pendencia.frota,
      })

      // Remover da lista local
      setPendenciasRecentes((prev) => prev.filter((p) => p.id !== encerrarModal.pendencia?.id))

      toast({
        title: "Sucesso",
        description: "Pendência encerrada com sucesso!",
        variant: "default",
      })

      setEncerrarModal({ isOpen: false, pendencia: null })
      setMotivoEncerramento("")
      setResponsavelEncerramento("")
    } catch (error) {
      console.error("Erro ao encerrar pendência:", error)
      toast({
        title: "Erro",
        description: "Erro ao encerrar pendência",
        variant: "destructive",
      })
    }
  }

  // Funções auxiliares
  const getCategoryName = (slug: string) => {
    const names: Record<string, string> = {
      "veiculos-logistica": "Veículos Logística",
      "caminhoes-pipas": "Caminhões Pipas",
      "caminhoes-munck": "Caminhões Munck",
      "caminhoes-coletas": "Caminhões Coletas",
      "carretas-pranchas-ls-outros": "Carretas / Pranchas / LS e outros",
      "caminhoes-prancha-vinhaca-muda": "Caminhões Prancha/Vinhaça/Muda",
      "caminhoes-cacambas": "Caminhões Caçambas",
      "trator-reboque": "Trator Reboque",
      "area-de-vivencias": "Área de Vivências",
      "carretinhas-rtk": "Carretinhas RTK",
      "tanques-e-dolly": "Tanques e Dolly",
      "carretas-canavieira": "Carretas Canavieira",
    }
    return names[slug] || slug
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "veiculos-logistica": "bg-blue-500/20 text-blue-400 border-blue-500/50",
      "caminhoes-pipas": "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      "caminhoes-munck": "bg-orange-500/20 text-orange-400 border-orange-500/50",
      "caminhoes-coletas": "bg-purple-500/20 text-purple-400 border-purple-500/50",
      "carretas-pranchas-ls-outros": "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      "caminhoes-prancha-vinhaca-muda": "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      "caminhoes-cacambas": "bg-red-500/20 text-red-400 border-red-500/50",
      "trator-reboque": "bg-violet-500/20 text-violet-400 border-violet-500/50",
      "area-de-vivencias": "bg-green-500/20 text-green-400 border-green-500/50",
      "carretinhas-rtk": "bg-indigo-500/20 text-indigo-400 border-indigo-500/50",
      "tanques-e-dolly": "bg-pink-500/20 text-pink-400 border-pink-500/50",
      "carretas-canavieira": "bg-teal-500/20 text-teal-400 border-teal-500/50",
    }
    return colors[category] || "bg-slate-500/20 text-slate-400 border-slate-500/50"
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgente":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "alta":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "media":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "baixa":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pendente":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "em-andamento":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "encerrado":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora mesmo"
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

  const getUniqueCategories = () => {
    const categories = [...new Set(pendenciasRecentes.map((p) => p.category))]
    return categories.map((cat) => ({ value: cat, label: getCategoryName(cat) }))
  }

  const getAllCategories = () => {
    return [
      { value: "veiculos-logistica", label: "Veículos Logística" },
      { value: "caminhoes-pipas", label: "Caminhões Pipas" },
      { value: "caminhoes-munck", label: "Caminhões Munck" },
      { value: "caminhoes-coletas", label: "Caminhões Coletas" },
      { value: "carretas-pranchas-ls-outros", label: "Carretas / Pranchas / LS e outros" },
      { value: "caminhoes-prancha-vinhaca-muda", label: "Caminhões Prancha/Vinhaça/Muda" },
      { value: "caminhoes-cacambas", label: "Caminhões Caçambas" },
      { value: "trator-reboque", label: "Trator Reboque" },
      { value: "area-de-vivencias", label: "Área de Vivências" },
      { value: "carretinhas-rtk", label: "Carretinhas RTK" },
      { value: "tanques-e-dolly", label: "Tanques e Dolly" },
      { value: "carretas-canavieira", label: "Carretas Canavieira" },
    ]
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
            <Clock className="mr-2 h-5 w-5 text-green-500" />
            Pendências Recentes
            <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/50">
              {filteredPendencias.length} {filteredPendencias.length === 1 ? "item" : "itens"}
            </Badge>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddPendenciaModal(true)}
              className="bg-green-900/30 text-green-400 hover:bg-green-900/50 border-green-700/50"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPendenciasRecentes}
              disabled={isLoading}
              className="bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border-slate-600/50"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {/* Filtros */}
        <div className="space-y-5 mb-6">
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por descrição, categoria ou frota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-300 h-11"
            />
          </div>

          {/* Filtros em linha */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={dateFilter} onValueChange={(value: FilterType) => setDateFilter(value)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {getUniqueCategories().map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em-andamento">Em Andamento</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigas</SelectItem>
                <SelectItem value="priority">Por prioridade</SelectItem>
                <SelectItem value="category">Por categoria</SelectItem>
                <SelectItem value="frota">Por frota</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de pendências */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-slate-400">Carregando pendências...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-400">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        ) : filteredPendencias.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-5">
              {filteredPendencias.map((pendencia) => (
                <PendenciaRecenteItem
                  key={pendencia.id}
                  pendencia={pendencia}
                  onViewCategory={onViewCategory}
                  onGenerateReport={onGenerateReport}
                  onEncerrar={(p) => setEncerrarModal({ isOpen: true, pendencia: p })}
                  getCategoryName={getCategoryName}
                  getCategoryColor={getCategoryColor}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  getTimeAgo={getTimeAgo}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Clock className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-base font-medium">Nenhuma pendência encontrada</p>
            <p className="text-sm text-center mt-1">
              {searchTerm || dateFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all"
                ? "Tente ajustar os filtros para ver mais resultados"
                : "Todas as pendências foram resolvidas"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddPendenciaModal(true)}
              className="mt-4 bg-green-900/30 text-green-400 hover:bg-green-900/50 border-green-700/50"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar Nova Pendência
            </Button>
          </div>
        )}

        {/* Estatísticas rápidas */}
        {pendenciasRecentes.length > 0 && (
          <div className="mt-8 pt-5 border-t border-slate-700/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Total</div>
                <div className="text-lg font-semibold text-slate-300">{pendenciasRecentes.length}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Pendentes</div>
                <div className="text-lg font-semibold text-red-400">
                  {pendenciasRecentes.filter((p) => p.status === "pendente").length}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Em Andamento</div>
                <div className="text-lg font-semibold text-yellow-400">
                  {pendenciasRecentes.filter((p) => p.status === "em-andamento").length}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Urgentes</div>
                <div className="text-lg font-semibold text-red-500">
                  {pendenciasRecentes.filter((p) => p.priority === "urgente").length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal de Encerramento */}
      <Dialog open={encerrarModal.isOpen} onOpenChange={(open) => setEncerrarModal({ isOpen: open, pendencia: null })}>
        <DialogContent className="bg-slate-900/95 border-slate-700/50 text-slate-100 p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              Encerrar Pendência
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Confirme o encerramento da pendência preenchendo as informações abaixo.
            </DialogDescription>
          </DialogHeader>

          {encerrarModal.pendencia && (
            <div className="space-y-5">
              {/* Informações da pendência */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-sm font-medium text-slate-300 mb-2">Pendência:</div>
                <div className="text-sm text-slate-400">{encerrarModal.pendencia.description}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(encerrarModal.pendencia.category)}`}>
                    {getCategoryName(encerrarModal.pendencia.category)}
                  </Badge>
                  <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 px-3 py-1 rounded-full border border-blue-500/50">
                    <span className="text-xs font-bold text-blue-300">
                      <Truck className="h-3 w-3 inline mr-1" />
                      {encerrarModal.pendencia.frota}
                    </span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(encerrarModal.pendencia.priority)}`}>
                    {encerrarModal.pendencia.priority?.toUpperCase() || "BAIXA"}
                  </Badge>
                </div>
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável pelo Encerramento *</Label>
                <Input
                  id="responsavel"
                  value={responsavelEncerramento}
                  onChange={(e) => setResponsavelEncerramento(e.target.value)}
                  placeholder="Nome do responsável"
                  className="bg-slate-800/50 border-slate-700/50"
                />
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo do Encerramento *</Label>
                <Textarea
                  id="motivo"
                  value={motivoEncerramento}
                  onChange={(e) => setMotivoEncerramento(e.target.value)}
                  placeholder="Descreva o motivo do encerramento da pendência..."
                  className="bg-slate-800/50 border-slate-700/50 min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEncerrarModal({ isOpen: false, pendencia: null })}
              className="bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEncerrarPendencia}
              className="bg-green-600 hover:bg-green-700"
              disabled={!motivoEncerramento.trim() || !responsavelEncerramento.trim()}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Encerrar Pendência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Adição de Pendência */}
      <Dialog open={addPendenciaModal} onOpenChange={setAddPendenciaModal}>
        <DialogContent className="bg-slate-900/95 border-slate-700/50 text-slate-100 p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-500" />
              Adicionar Nova Pendência
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Preencha os campos abaixo para adicionar uma nova pendência.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={newPendenciaCategory} onValueChange={setNewPendenciaCategory}>
                <SelectTrigger id="categoria" className="bg-slate-800/50 border-slate-700/50">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {getAllCategories().map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frota - Campo destacado */}
            <div className="space-y-2">
              <Label htmlFor="frota" className="text-blue-400 font-semibold flex items-center">
                <Truck className="h-4 w-4 mr-1" />
                Número de Frota *
              </Label>
              <div className="relative">
                <Input
                  id="frota"
                  value={newPendenciaFrota}
                  onChange={(e) => setNewPendenciaFrota(e.target.value.toUpperCase())}
                  placeholder="Ex: L-001, C-002, TR-003"
                  className="bg-blue-900/30 border-blue-500/50 text-blue-100 font-bold text-lg pl-10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={newPendenciaDescription}
                onChange={(e) => setNewPendenciaDescription(e.target.value)}
                placeholder="Descreva a pendência..."
                className="bg-slate-800/50 border-slate-700/50 min-h-[100px]"
              />
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={newPendenciaPriority}
                onValueChange={(value: "baixa" | "media" | "alta" | "urgente") => setNewPendenciaPriority(value)}
              >
                <SelectTrigger id="prioridade" className="bg-slate-800/50 border-slate-700/50">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setAddPendenciaModal(false)}
              className="bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddPendencia}
              className="bg-green-600 hover:bg-green-700"
              disabled={!newPendenciaCategory || !newPendenciaDescription || !newPendenciaFrota || isAddingPendencia}
            >
              {isAddingPendencia ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pendência
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
