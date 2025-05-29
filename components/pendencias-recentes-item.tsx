"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckCircle2, Eye, FileText, MoreHorizontal, Truck } from "lucide-react"

interface PendenciaRecente {
  id: number
  category: string
  description: string
  frota: string
  created_at: string
  updated_at: string
  priority?: "baixa" | "media" | "alta" | "urgente"
  status?: "pendente" | "em-andamento" | "encerrado"
}

interface PendenciaRecenteItemProps {
  pendencia: PendenciaRecente
  onViewCategory: (category: string) => void
  onGenerateReport: (category: string) => void
  onEncerrar: (pendencia: PendenciaRecente) => void
  getCategoryName: (slug: string) => string
  getCategoryColor: (category: string) => string
  getPriorityColor: (priority?: string) => string
  getStatusColor: (status?: string) => string
  getTimeAgo: (dateString: string) => string
}

export function PendenciaRecenteItem({
  pendencia,
  onViewCategory,
  onGenerateReport,
  onEncerrar,
  getCategoryName,
  getCategoryColor,
  getPriorityColor,
  getStatusColor,
  getTimeAgo,
}: PendenciaRecenteItemProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200 overflow-hidden">
      {/* Número de Frota em destaque */}
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-4 border-b border-blue-500/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500/30 p-3 rounded-full animate-pulse">
              <Truck className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-blue-300 font-medium uppercase tracking-wider mb-1">Frota</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {pendencia.frota}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500">{getTimeAgo(pendencia.updated_at)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewCategory(pendencia.category)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Categoria
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGenerateReport(pendencia.category)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEncerrar(pendencia)} className="text-green-400">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Encerrar Pendência
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Badge variant="outline" className={`text-xs ${getCategoryColor(pendencia.category)}`}>
            {getCategoryName(pendencia.category)}
          </Badge>
          <Badge variant="outline" className={`text-xs ${getPriorityColor(pendencia.priority)}`}>
            {pendencia.priority?.toUpperCase() || "BAIXA"}
          </Badge>
          <Badge variant="outline" className={`text-xs ${getStatusColor(pendencia.status)}`}>
            {pendencia.status?.toUpperCase() || "PENDENTE"}
          </Badge>
        </div>

        {/* Descrição */}
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">{pendencia.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700/30">
          <div className="flex items-center space-x-2">
            <span>ID: {pendencia.id}</span>
            <span>•</span>
            <span>Criado em {new Date(pendencia.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-400 hover:text-green-400"
              onClick={() => onViewCategory(pendencia.category)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-400 hover:text-blue-400"
              onClick={() => onGenerateReport(pendencia.category)}
            >
              <FileText className="h-3 w-3 mr-1" />
              Relatório
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
