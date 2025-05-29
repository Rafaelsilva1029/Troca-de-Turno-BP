"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, Trash2, Truck, AlertTriangle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PendenciaItemProps {
  index: number
  pendencia: {
    id?: string
    description: string
    frota: string
    priority?: "baixa" | "media" | "alta" | "urgente"
    createdAt?: string
  }
  title: string
  updatePendenciaDescription: (index: number, value: string) => void
  updatePendenciaFrota: (index: number, value: string) => void
  removePendencia: (index: number) => void
  openLiberarPendenciaModal: (category: string, description: string, frota: string) => void
  slug: string
}

export function PendenciaItem({
  index,
  pendencia,
  title,
  updatePendenciaDescription,
  updatePendenciaFrota,
  removePendencia,
  openLiberarPendenciaModal,
  slug,
}: PendenciaItemProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgente":
        return "bg-red-600/20 text-red-500 border-red-500/50"
      case "alta":
        return "bg-orange-600/20 text-orange-500 border-orange-500/50"
      case "media":
        return "bg-yellow-600/20 text-yellow-500 border-yellow-500/50"
      case "baixa":
        return "bg-green-600/20 text-green-500 border-green-500/50"
      default:
        return "bg-blue-600/20 text-blue-500 border-blue-500/50"
    }
  }

  // Calcular o tempo desde a criação, se disponível
  const getTimeAgo = () => {
    if (!pendencia.createdAt) return null

    const created = new Date(pendencia.createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d`
    if (diffHours > 0) return `${diffHours}h`
    return `${diffMins}m`
  }

  const timeAgo = getTimeAgo()

  return (
    <div className="bg-slate-800/30 hover:bg-slate-800/50 transition-colors duration-200 rounded-lg border border-slate-700/50 p-4 mb-3">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Frota destacada com melhor visualização */}
        <div className="md:min-w-[120px] md:max-w-[120px] flex-shrink-0">
          <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 rounded-lg p-3 border border-blue-500/30 shadow-md hover:shadow-blue-500/10 transition-all group">
            <label className="block text-xs text-blue-300 mb-1 font-semibold tracking-wider flex items-center">
              <Truck className="h-3 w-3 mr-1" />
              Frota
            </label>
            <div className="relative bg-blue-950/60 rounded-md flex items-center justify-center px-2 py-3 group-hover:bg-blue-900/60 transition-colors">
              <input
                value={pendencia.frota || ""}
                onChange={(e) => updatePendenciaFrota(index, e.target.value.toUpperCase())}
                placeholder="Nº FROTA"
                className="bg-transparent border-0 text-center text-white font-bold text-xl placeholder:text-blue-400/50 focus:outline-none focus:ring-0 w-full"
              />
              <div className="absolute inset-0 bg-blue-500/10 rounded-md pointer-events-none"></div>
            </div>
          </div>

          {/* Prioridade e tempo */}
          <div className="flex justify-center gap-1 mt-2">
            {pendencia.priority && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={`text-xs px-2 ${getPriorityColor(pendencia.priority)}`}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {pendencia.priority.toUpperCase()}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Prioridade: {pendencia.priority}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {timeAgo && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="bg-slate-800/80 text-slate-300 border-slate-600/50 text-xs px-2"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {timeAgo}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Criado em: {new Date(pendencia.createdAt || "").toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Área de texto da pendência expandida para ocupar todo o espaço disponível */}
        <div className="flex-1 min-w-0 w-full">
          <Textarea
            value={pendencia.description || ""}
            onChange={(e) => updatePendenciaDescription(index, e.target.value)}
            placeholder={`Descreva a pendência para ${title}...`}
            className="bg-slate-800 border-slate-700 min-h-[120px] h-full w-full resize-y p-3 text-sm leading-relaxed placeholder:text-slate-500"
          />
        </div>

        {/* Botões de ação */}
        <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-2 md:mt-0">
          {pendencia.description && pendencia.description.trim() !== "" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-500 hover:text-green-500 bg-slate-800/50 rounded-full hover:bg-green-900/20 transition-colors"
                      onClick={() => openLiberarPendenciaModal(slug, pendencia.description, pendencia.frota)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Finalizar pendência</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-500 hover:text-red-500 bg-slate-800/50 rounded-full hover:bg-red-900/20 transition-colors"
                      onClick={() => removePendencia(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Remover pendência</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
