"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  ChevronUp,
  Search,
  AlertCircle,
  CheckCircle,
  PenToolIcon as Tool,
  Clock,
  Cpu,
  Tractor,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Tipos
interface Equipment {
  id: string
  name: string
  code: string
  category: string
  status: "available" | "in-use" | "maintenance" | "issue"
  location?: string
  lastUpdate?: string
  tanqueEngatado?: string
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

// Dados de exemplo expandidos
const sampleEquipments: Equipment[] = [
  { id: "1", name: "Pipa 01", code: "P001", category: "@Pipas Água Bruta", status: "available" },
  { id: "2", name: "Pipa 02", code: "P002", category: "@Pipas Água Bruta", status: "in-use" },
  { id: "3", name: "Tanque 01", code: "T001", category: "@Pipas Água Limpa/Tanques", status: "maintenance" },
  { id: "4", name: "Tanque 02", code: "T002", category: "@Pipas Água Limpa/Tanques", status: "available" },
  { id: "5", name: "Munck 01", code: "M001", category: "@Munck Disponível", status: "available" },
  { id: "6", name: "Munck 02", code: "M002", category: "@Munck Disponível", status: "issue" },
  { id: "7", name: "Caçamba 01", code: "C001", category: "@Caçambas Disponíveis", status: "available" },
  {
    id: "8",
    name: "Cavalo 01",
    code: "CV001",
    category: "@Cavalos / Pranchas / Vinhaça Localizada",
    status: "in-use",
    tanqueEngatado: "12345",
  },
  {
    id: "9",
    name: "Prancha 01",
    code: "PR001",
    category: "@Cavalos / Pranchas / Vinhaça Localizada",
    status: "available",
  },
  { id: "10", name: "Coleta 01", code: "CL001", category: "@Coleta / Viagem", status: "available" },
  { id: "11", name: "Viagem 01", code: "VG001", category: "@Coleta / Viagem", status: "in-use" },
  { id: "12", name: "Área Vivência 01", code: "AV001", category: "@Áreas de Vivência", status: "available" },
  { id: "13", name: "Carreta RTK 01", code: "RTK001", category: "@Carretas RTK / GPS", status: "maintenance" },
  { id: "14", name: "GPS 01", code: "GPS001", category: "@Carretas RTK / GPS", status: "available" },
  { id: "15", name: "Reboque Muda 01", code: "RM001", category: "@Reboque Muda", status: "available" },
  { id: "16", name: "Carretinha 01", code: "CR001", category: "@Carretinhas", status: "available" },
  {
    id: "17",
    name: "Carretinha Vivência 01",
    code: "CRV001",
    category: "@Carretinha Área de Vivência",
    status: "in-use",
  },
  {
    id: "18",
    name: "Carretinha Reboque 01",
    code: "CRR001",
    category: "@Carretinha Reboque Muda",
    status: "available",
  },
  { id: "19", name: "Carreta Canavieira 01", code: "CC001", category: "@Carreta Canavieira", status: "maintenance" },
  { id: "20", name: "Veículo 01", code: "V001", category: "@Veículos", status: "in-use" },
  { id: "21", name: "Veículo 02", code: "V002", category: "@Veículos", status: "available" },
  { id: "22", name: "Cavalo Terceiro 01", code: "CT001", category: "@Cavalo Terceiro", status: "available" },
  { id: "23", name: "Trator 01", code: "TR001", category: "@Tratores", status: "maintenance" },
  { id: "24", name: "Outros Equip 01", code: "OE001", category: "@Outros Equipamentos", status: "available" },
]

export function CollapsibleEquipmentControl() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [equipments, setEquipments] = useState<Equipment[]>(sampleEquipments)
  const [compactView, setCompactView] = useState(true)
  const router = useRouter()

  // Estatísticas
  const stats = {
    available: equipments.filter((e) => e.status === "available").length,
    inUse: equipments.filter((e) => e.status === "in-use").length,
    maintenance: equipments.filter((e) => e.status === "maintenance").length,
    issues: equipments.filter((e) => e.status === "issue").length,
    total: equipments.length,
  }

  // Filtrar equipamentos
  const filteredEquipments = equipments.filter(
    (equipment) =>
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (equipment.location && equipment.location.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Agrupar por categoria
  const groupedEquipments = filteredEquipments.reduce(
    (acc, equipment) => {
      const category = equipment.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(equipment)
      return acc
    },
    {} as Record<string, Equipment[]>,
  )

  // Função para renderizar o ícone de status
  const renderStatusIcon = (status: Equipment["status"]) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in-use":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "maintenance":
        return <Tool className="h-4 w-4 text-yellow-500" />
      case "issue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  // Função para obter a cor do status
  const getStatusColor = (status: Equipment["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "in-use":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "maintenance":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "issue":
        return "bg-red-500/10 text-red-500 border-red-500/20"
    }
  }

  // Função para obter o texto do status
  const getStatusText = (status: Equipment["status"]) => {
    switch (status) {
      case "available":
        return "Disponível"
      case "in-use":
        return "Em Uso"
      case "maintenance":
        return "Manutenção"
      case "issue":
        return "Problema"
    }
  }

  // Função para renderizar ícone da categoria
  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "@Pipas Água Bruta":
        return <TruckIcon className="h-4 w-4" />
      case "@Pipas Água Limpa/Tanques":
        return <TankIcon className="h-4 w-4" />
      case "@Cavalos / Pranchas / Vinhaça Localizada":
      case "@Cavalo Terceiro":
        return <TractorIcon className="h-4 w-4" />
      case "@Carretinhas":
      case "@Carretinha Reboque Muda":
        return <TrailerIcon className="h-4 w-4" />
      case "@Áreas de Vivência":
      case "@Carretinha Área de Vivência":
        return <HomeIcon className="h-4 w-4" />
      case "@Carretas RTK / GPS":
        return <Zap className="h-4 w-4" />
      case "@Carreta Canavieira":
      case "@Tratores":
        return <Tractor className="h-4 w-4" />
      default:
        return <Cpu className="h-4 w-4" />
    }
  }

  return (
    <div className="w-full mb-6 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      {/* Header sempre visível */}
      <div
        className={cn(
          "w-full p-4 cursor-pointer bg-gradient-to-r from-cyan-900/30 to-blue-900/30",
          "border-b border-slate-700/50 transition-all duration-300",
          isExpanded ? "rounded-t-xl" : "rounded-xl",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-glow-sm">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Controle de Equipamentos</h3>
              <p className="text-xs text-slate-400">
                {stats.total} equipamentos • {stats.available} disponíveis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex space-x-2">
              <Badge variant="outline" className={cn("border", getStatusColor("available"))}>
                <CheckCircle className="h-3 w-3 mr-1" /> {stats.available}
              </Badge>
              <Badge variant="outline" className={cn("border", getStatusColor("in-use"))}>
                <Clock className="h-3 w-3 mr-1" /> {stats.inUse}
              </Badge>
              <Badge variant="outline" className={cn("border", getStatusColor("maintenance"))}>
                <Tool className="h-3 w-3 mr-1" /> {stats.maintenance}
              </Badge>
              <Badge variant="outline" className={cn("border", getStatusColor("issue"))}>
                <AlertCircle className="h-3 w-3 mr-1" /> {stats.issues}
              </Badge>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo expansível */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Barra de busca e controles */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar equipamento..."
                    className="pl-9 bg-slate-800/50 border-slate-700 text-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("border-slate-700 bg-slate-800/50", compactView ? "bg-slate-700" : "")}
                    onClick={() => setCompactView(true)}
                  >
                    Compacto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("border-slate-700 bg-slate-800/50", !compactView ? "bg-slate-700" : "")}
                    onClick={() => setCompactView(false)}
                  >
                    Detalhado
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                    onClick={() => router.push("/controle-equipamentos")}
                  >
                    Ver Completo
                  </Button>
                </div>
              </div>

              {/* Lista de equipamentos agrupados */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {Object.keys(groupedEquipments).length > 0 ? (
                  Object.entries(groupedEquipments).map(([category, items], categoryIndex) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: categoryIndex * 0.05 }}
                      className="space-y-2"
                    >
                      <h4 className="text-sm font-medium text-slate-300 flex items-center">
                        {renderCategoryIcon(category)}
                        <span className="ml-2">{category.replace("@", "")}</span>
                        <span className="text-xs text-slate-500 ml-2">({items.length})</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {(compactView ? items.slice(0, 4) : items).map((equipment, index) => (
                          <motion.div
                            key={equipment.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 + categoryIndex * 0.05 }}
                            className={cn(
                              "p-3 rounded-lg border border-slate-700/50",
                              "bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/80",
                              "transition-all duration-200 group",
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                                  {equipment.name}
                                </p>
                                <p className="text-xs text-slate-400">{equipment.code}</p>
                                {equipment.tanqueEngatado && (
                                  <p className="text-xs text-cyan-400 mt-1">Tanque: {equipment.tanqueEngatado}</p>
                                )}
                              </div>
                              <Badge className={cn("text-xs", getStatusColor(equipment.status))}>
                                {renderStatusIcon(equipment.status)}
                                <span className="ml-1">{getStatusText(equipment.status)}</span>
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {compactView && items.length > 4 && (
                        <p className="text-xs text-slate-500 text-right">
                          +{items.length - 4} equipamentos não exibidos
                        </p>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-slate-400">Nenhum equipamento encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
