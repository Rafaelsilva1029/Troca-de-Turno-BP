"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  ChevronRight,
  Settings,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  MapPin,
  Truck,
  Construction,
  Loader,
  Car,
  Package,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Tractor,
  Zap,
} from "lucide-react"

// Tipos de dados
interface Equipment {
  id: string
  name: string
  code: string
  category: string
  location: string
  status: "disponivel" | "manutencao" | "aguardando-pecas" | "em-uso" | "inativo"
  description?: string
  lastMaintenance?: string
  nextMaintenance?: string
  operator?: string
  notes?: string
  createdAt: string
  updatedAt: string
  tanqueEngatado?: string
}

interface EquipmentGroup {
  category: string
  displayName: string
  icon: React.ReactNode
  color: string
  gradient: string
  equipments: Equipment[]
  isExpanded: boolean
  order: number
}

// Configurações de status
const statusConfig = {
  disponivel: {
    label: "Disponível",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  "em-uso": {
    label: "Em Uso",
    icon: <Activity className="h-4 w-4" />,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
  },
  manutencao: {
    label: "Manutenção",
    icon: <Wrench className="h-4 w-4" />,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  "aguardando-pecas": {
    label: "Aguardando Peças",
    icon: <Clock className="h-4 w-4" />,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
  },
  inativo: {
    label: "Inativo",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    glow: "shadow-red-500/20",
  },
}

// Componente de ícone de caminhão pipa
const TruckIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
)

// Componente de ícone de tanque
const TankIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
)

// Componente de ícone de cavalo mecânico
const TractorIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M4 15.5C4 17.43 5.57 19 7.5 19S11 17.43 11 15.5 9.43 12 7.5 12 4 13.57 4 15.5zm2.5-1.5c.83 0 1.5.67 1.5 1.5S7.33 17 6.5 17 5 16.33 5 15.5 5.67 14 6.5 14z" />
    <path d="M16.5 12C14.57 12 13 13.57 13 15.5S14.57 19 16.5 19 20 17.43 20 15.5 18.43 12 16.5 12zm0 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    <path d="M12 4H3v7h2.5c.28-1.8 1.8-3.2 3.7-3.45L12 4z" />
  </svg>
)

// Componente de ícone de carretinha
const TrailerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
    <circle cx="6" cy="17" r="1.5" />
    <circle cx="18" cy="17" r="1.5" />
    <rect x="3" y="6" width="14" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="0.5" />
  </svg>
)

// Componente de ícone de área de vivência
const HomeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    <rect x="8" y="14" width="8" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" />
  </svg>
)

// Configurações de categorias com ícones específicos
const categoryConfig = {
  "@Pipas Água Bruta": {
    icon: <TruckIcon className="h-5 w-5" />,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-blue-500/20",
    order: 1,
  },
  "@Pipas Água Limpa/Tanques": {
    icon: <TankIcon className="h-5 w-5" />,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-indigo-500/20",
    order: 2,
  },
  "@Munck Disponível": {
    icon: <Construction className="h-5 w-5" />,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/20",
    order: 3,
  },
  "@Caçambas Disponíveis": {
    icon: <Loader className="h-5 w-5" />,
    color: "text-green-400",
    gradient: "from-green-500/20 to-emerald-500/20",
    order: 4,
  },
  "@Cavalos / Pranchas / Vinhaça Localizada": {
    icon: <TractorIcon className="h-5 w-5" />,
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-pink-500/20",
    order: 5,
  },
  "@Coleta / Viagem": {
    icon: <Truck className="h-5 w-5" />,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-red-500/20",
    order: 6,
  },
  "@Áreas de Vivência": {
    icon: <HomeIcon className="h-5 w-5" />,
    color: "text-teal-400",
    gradient: "from-teal-500/20 to-cyan-500/20",
    order: 7,
  },
  "@Carretas RTK / GPS": {
    icon: <Zap className="h-5 w-5" />,
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-purple-500/20",
    order: 8,
  },
  "@Reboque Muda": {
    icon: <TrailerIcon className="h-5 w-5" />,
    color: "text-lime-400",
    gradient: "from-lime-500/20 to-green-500/20",
    order: 9,
  },
  "@Carretinhas": {
    icon: <TrailerIcon className="h-5 w-5" />,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-500/20",
    order: 10,
  },
  "@Carretinha Área de Vivência": {
    icon: <HomeIcon className="h-5 w-5" />,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/20",
    order: 11,
  },
  "@Carretinha Reboque Muda": {
    icon: <TrailerIcon className="h-5 w-5" />,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-purple-500/20",
    order: 12,
  },
  "@Carreta Canavieira": {
    icon: <Tractor className="h-5 w-5" />,
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-amber-500/20",
    order: 13,
  },
  "@Veículos": {
    icon: <Car className="h-5 w-5" />,
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-pink-500/20",
    order: 14,
  },
  "@Cavalo Terceiro": {
    icon: <TractorIcon className="h-5 w-5" />,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-yellow-500/20",
    order: 15,
  },
  "@Tratores": {
    icon: <Tractor className="h-5 w-5" />,
    color: "text-green-400",
    gradient: "from-green-500/20 to-lime-500/20",
    order: 16,
  },
  "@Outros Equipamentos": {
    icon: <Settings className="h-5 w-5" />,
    color: "text-slate-400",
    gradient: "from-slate-500/20 to-gray-500/20",
    order: 17,
  },
}

// Dados de exemplo
const sampleEquipments: Equipment[] = [
  {
    id: "1",
    name: "Pipa Água Bruta 001",
    code: "PAB-001",
    category: "@Pipas Água Bruta",
    location: "Setor A - Captação",
    status: "disponivel",
    description: "Caminhão pipa para transporte de água bruta",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-04-15",
    operator: "João Silva",
    notes: "Última revisão completa realizada",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Tanque Água Limpa 001",
    code: "TAL-001",
    category: "@Pipas Água Limpa/Tanques",
    location: "Setor B - Tratamento",
    status: "disponivel",
    description: "Tanque para armazenamento de água tratada",
    lastMaintenance: "2024-01-10",
    nextMaintenance: "2024-04-10",
    operator: "Maria Santos",
    notes: "Tanque em perfeitas condições",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T14:15:00Z",
  },
  {
    id: "3",
    name: "Cavalo Mecânico 001",
    code: "CM-001",
    category: "@Cavalos / Pranchas / Vinhaça Localizada",
    location: "Pátio Central",
    status: "em-uso",
    description: "Cavalo mecânico para transporte",
    lastMaintenance: "2024-01-12",
    nextMaintenance: "2024-04-12",
    operator: "Carlos Oliveira",
    notes: "Equipamento operando normalmente",
    tanqueEngatado: "12345",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-12T09:45:00Z",
  },
]

export function FuturisticEquipmentControl() {
  const { toast } = useToast()

  // Estados principais
  const [equipments, setEquipments] = useState<Equipment[]>(sampleEquipments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [categoryOrder, setCategoryOrder] = useState<Record<string, number>>(() => {
    const initialOrder: Record<string, number> = {}
    Object.entries(categoryConfig).forEach(([category, config]) => {
      initialOrder[category] = config.order
    })
    return initialOrder
  })

  // Estados do formulário
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: "",
    code: "",
    category: "@Pipas Água Bruta",
    location: "",
    status: "disponivel",
    description: "",
    operator: "",
    notes: "",
    tanqueEngatado: "",
  })

  // Simular status de conexão
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Filtrar e agrupar equipamentos
  const filteredAndGroupedEquipments = useMemo(() => {
    let filtered = equipments

    if (searchTerm) {
      filtered = filtered.filter(
        (eq) =>
          eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eq.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eq.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eq.operator?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((eq) => eq.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((eq) => eq.category === categoryFilter)
    }

    const groups: EquipmentGroup[] = []
    const categories = Array.from(new Set(filtered.map((eq) => eq.category)))

    categories.forEach((category) => {
      const categoryEquipments = filtered.filter((eq) => eq.category === category)
      const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig["@Outros Equipamentos"]

      groups.push({
        category,
        displayName: category.replace("@", ""),
        icon: config.icon,
        color: config.color,
        gradient: config.gradient,
        equipments: categoryEquipments,
        isExpanded: expandedGroups.has(category),
        order: categoryOrder[category] || config.order,
      })
    })

    return groups.sort((a, b) => a.order - b.order)
  }, [equipments, searchTerm, statusFilter, categoryFilter, expandedGroups, categoryOrder])

  // Estatísticas
  const stats = useMemo(() => {
    const total = equipments.length
    const disponivel = equipments.filter((eq) => eq.status === "disponivel").length
    const manutencao = equipments.filter((eq) => eq.status === "manutencao").length
    const emUso = equipments.filter((eq) => eq.status === "em-uso").length
    const aguardandoPecas = equipments.filter((eq) => eq.status === "aguardando-pecas").length
    const inativo = equipments.filter((eq) => eq.status === "inativo").length

    return { total, disponivel, manutencao, emUso, aguardandoPecas, inativo }
  }, [equipments])

  // Mover categoria para cima
  const moveCategoryUp = (category: string) => {
    const currentOrder = categoryOrder[category]
    const categoriesAbove = Object.entries(categoryOrder).filter(([_, order]) => order < currentOrder)

    if (categoriesAbove.length > 0) {
      const [categoryAbove] = categoriesAbove.sort(([_, a], [__, b]) => b - a)[0]
      const newOrder = { ...categoryOrder }
      newOrder[category] = categoryOrder[categoryAbove]
      newOrder[categoryAbove] = currentOrder
      setCategoryOrder(newOrder)

      toast({
        title: "Categoria movida",
        description: `${category.replace("@", "")} foi movida para cima.`,
      })
    }
  }

  // Mover categoria para baixo
  const moveCategoryDown = (category: string) => {
    const currentOrder = categoryOrder[category]
    const categoriesBelow = Object.entries(categoryOrder).filter(([_, order]) => order > currentOrder)

    if (categoriesBelow.length > 0) {
      const [categoryBelow] = categoriesBelow.sort(([_, a], [__, b]) => a - b)[0]
      const newOrder = { ...categoryOrder }
      newOrder[category] = categoryOrder[categoryBelow]
      newOrder[categoryBelow] = currentOrder
      setCategoryOrder(newOrder)

      toast({
        title: "Categoria movida",
        description: `${category.replace("@", "")} foi movida para baixo.`,
      })
    }
  }

  // Alternar expansão de grupo
  const toggleGroupExpansion = (category: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedGroups(newExpanded)
  }

  // Expandir/colapsar todos os grupos
  const toggleAllGroups = () => {
    const allCategories = Array.from(new Set(equipments.map((eq) => eq.category)))
    if (expandedGroups.size === allCategories.length) {
      setExpandedGroups(new Set())
    } else {
      setExpandedGroups(new Set(allCategories))
    }
  }

  // Abrir formulário para adicionar equipamento
  const openAddDialog = (category?: string) => {
    setEditingEquipment(null)
    setFormData({
      name: "",
      code: "",
      category: category || "@Pipas Água Bruta",
      location: "",
      status: "disponivel",
      description: "",
      operator: "",
      notes: "",
      tanqueEngatado: "",
    })
    setIsDialogOpen(true)
  }

  // Abrir formulário para editar equipamento
  const openEditDialog = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    setFormData(equipment)
    setIsDialogOpen(true)
  }

  // Salvar equipamento
  const saveEquipment = () => {
    if (!formData.name || !formData.code || !formData.category || !formData.location) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const now = new Date().toISOString()

    if (editingEquipment) {
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.id === editingEquipment.id ? { ...(formData as Equipment), id: editingEquipment.id, updatedAt: now } : eq,
        ),
      )
      toast({
        title: "Equipamento atualizado",
        description: `${formData.name} foi atualizado com sucesso.`,
      })
    } else {
      const newEquipment: Equipment = {
        ...(formData as Equipment),
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }
      setEquipments((prev) => [...prev, newEquipment])
      toast({
        title: "Equipamento adicionado",
        description: `${formData.name} foi adicionado com sucesso.`,
      })
    }

    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header com título e status de conexão */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Controle de Equipamentos
          </h1>
          <p className="text-slate-400 mt-1">
            Sistema inteligente de gestão de equipamentos com categorias organizáveis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isOnline
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="text-sm font-medium">{isOnline ? "Online" : "Offline"}</span>
          </div>
          <Button
            onClick={() => setIsLoading(!isLoading)}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 border border-slate-700/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 border border-slate-700/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Disponível</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.disponivel}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 border border-slate-700/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Em Uso</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.emUso}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 border border-slate-700/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-slate-400">Manutenção</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.manutencao}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 border border-slate-700/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-slate-400">Aguard. Peças</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{stats.aguardandoPecas}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 border border-slate-700/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-slate-400">Inativo</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.inativo}</div>
          </div>
        </motion.div>
      </div>

      {/* Controles e filtros */}
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar equipamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
            </div>

            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em-uso">Em Uso</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="aguardando-pecas">Aguard. Peças</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700/50">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {Object.keys(categoryConfig).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace("@", "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllGroups}
                className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
              >
                {expandedGroups.size > 0 ? "Colapsar Todos" : "Expandir Todos"}
              </Button>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => openAddDialog()}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Equipamento
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de grupos de equipamentos */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAndGroupedEquipments.map((group, index) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardHeader
                  className={`cursor-pointer transition-all duration-300 bg-gradient-to-r ${group.gradient} border-b border-slate-700/50 hover:bg-opacity-80`}
                  onClick={() => toggleGroupExpansion(group.category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div animate={{ rotate: group.isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </motion.div>
                      <div className={`p-2 rounded-lg bg-slate-800/50 ${group.color}`}>{group.icon}</div>
                      <div>
                        <CardTitle className={`text-lg ${group.color} font-bold`}>{group.displayName}</CardTitle>
                        <p className="text-sm text-slate-400">
                          {group.equipments.length} equipamento{group.equipments.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            moveCategoryUp(group.category)
                          }}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                          disabled={group.order === 1}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            moveCategoryDown(group.category)
                          }}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                          disabled={group.order === Object.keys(categoryConfig).length}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <GripVertical className="h-4 w-4 text-slate-500" />
                      <Badge variant="outline" className={`${group.color} border-current`}>
                        {group.equipments.length}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddDialog(group.category)
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {group.isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="p-0">
                        {group.equipments.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="text-slate-400 mb-2">
                              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>Nenhum equipamento nesta categoria</p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => openAddDialog(group.category)}
                              className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Primeiro Equipamento
                            </Button>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-700/50">
                            {group.equipments.map((equipment, equipIndex) => (
                              <motion.div
                                key={equipment.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: equipIndex * 0.05 }}
                                className="p-4 hover:bg-slate-800/30 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-slate-200">{equipment.name}</h4>
                                      <Badge variant="outline" className="text-xs bg-slate-800/50 border-slate-600/50">
                                        {equipment.code}
                                      </Badge>
                                      <div
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                          statusConfig[equipment.status].bg
                                        } ${statusConfig[equipment.status].color} ${
                                          statusConfig[equipment.status].border
                                        } border`}
                                      >
                                        {statusConfig[equipment.status].icon}
                                        {statusConfig[equipment.status].label}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-slate-400">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {equipment.location}
                                      </div>
                                      {equipment.operator && (
                                        <div className="flex items-center gap-1">
                                          <Activity className="h-3 w-3" />
                                          {equipment.operator}
                                        </div>
                                      )}
                                      {equipment.nextMaintenance && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          Próx. manutenção: {new Date(equipment.nextMaintenance).toLocaleDateString()}
                                        </div>
                                      )}
                                      {equipment.tanqueEngatado && (
                                        <div className="flex items-center gap-1">
                                          <Package className="h-3 w-3" />
                                          Tanque: {equipment.tanqueEngatado}
                                        </div>
                                      )}
                                    </div>
                                    {equipment.description && (
                                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                        {equipment.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => openEditDialog(equipment)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Marcar Disponível
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Wrench className="h-4 w-4 mr-2" />
                                          Enviar p/ Manutenção
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-400 focus:text-red-400">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAndGroupedEquipments.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Search className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300 mb-2">Nenhum equipamento encontrado</h3>
            <p className="text-slate-500 mb-4">Tente ajustar os filtros ou adicionar novos equipamentos</p>
            <Button
              onClick={() => openAddDialog()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Equipamento
            </Button>
          </motion.div>
        )}
      </div>

      {/* Dialog para adicionar/editar equipamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900/95 border-slate-700/50 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {editingEquipment ? "Editar Equipamento" : "Adicionar Equipamento"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingEquipment
                ? "Atualize as informações do equipamento"
                : "Preencha as informações do novo equipamento"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Nome do Equipamento *
                </Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50"
                  placeholder="Ex: Pipa Água Bruta 001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">
                  Código *
                </Label>
                <Input
                  id="code"
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50"
                  placeholder="Ex: PAB-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-300">
                  Categoria *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categoryConfig).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace("@", "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-300">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Equipment["status"] })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-300">
                  Localização *
                </Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50"
                  placeholder="Ex: Setor A - Captação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operator" className="text-slate-300">
                  Operador
                </Label>
                <Input
                  id="operator"
                  value={formData.operator || ""}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50"
                  placeholder="Ex: João Silva"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50"
                placeholder="Descrição detalhada do equipamento..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50"
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>

            {formData.category === "@Cavalos / Pranchas / Vinhaça Localizada" && (
              <div className="space-y-2">
                <Label htmlFor="tanqueEngatado" className="text-slate-300">
                  Número do Tanque Engatado
                </Label>
                <Input
                  id="tanqueEngatado"
                  value={formData.tanqueEngatado || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 5)
                    setFormData({ ...formData, tanqueEngatado: value })
                  }}
                  className="bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50"
                  placeholder="Ex: 12345"
                  maxLength={5}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveEquipment}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {editingEquipment ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
