import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import type { SystemMetric } from "@/lib/supabase"

// Componente para linhas de processo
export function ProcessRow({
  pid,
  name,
  user,
  cpu,
  memory,
  status,
}: {
  pid: string
  name: string
  user: string
  cpu: number
  memory: number
  status: string
}) {
  return (
    <div className="grid grid-cols-12 text-xs p-3 hover:bg-slate-800/30">
      <div className="col-span-1 text-slate-500">{pid}</div>
      <div className="col-span-4 text-cyan-400">{name}</div>
      <div className="col-span-2 text-slate-400">{user}</div>
      <div className="col-span-2 text-slate-400">{cpu}%</div>
      <div className="col-span-2 text-slate-400">{memory} MB</div>
      <div className="col-span-1">
        <Badge
          variant="outline"
          className={`${
            status === "running"
              ? "bg-green-500/20 text-green-400 border-green-500/50"
              : "bg-amber-500/20 text-amber-400 border-amber-500/50"
          }`}
        >
          {status}
        </Badge>
      </div>
    </div>
  )
}

// Componente para itens de armazenamento
export function StorageItem({
  name,
  total,
  used,
  type,
}: {
  name: string
  total: number
  used: number
  type: string
}) {
  const percentage = Math.round((used / total) * 100)
  const free = total - used

  return (
    <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-slate-300">{name}</div>
        <Badge
          variant="outline"
          className={`${
            type === "SSD"
              ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
              : "bg-blue-500/20 text-blue-400 border-blue-500/50"
          }`}
        >
          {type}
        </Badge>
      </div>
      <div className="mb-2">
        <Progress value={percentage} className="h-2 bg-slate-700">
          <div
            className={`h-full rounded-full ${
              percentage > 90
                ? "bg-red-500"
                : percentage > 70
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </Progress>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="text-slate-400">
          {used} GB <span className="text-slate-500">used</span>
        </div>
        <div className="text-slate-400">
          {free} GB <span className="text-slate-500">free</span>
        </div>
      </div>
    </div>
  )
}

// Componente para itens de alerta
export function AlertItem({
  title,
  time,
  description,
  type,
}: {
  title: string
  time: string
  description: string
  type: "info" | "warning" | "error" | "success" | "update"
}) {
  const getTypeStyles = () => {
    switch (type) {
      case "info":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "warning":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50"
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "update":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
    }
  }

  return (
    <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-slate-800/30">
      <Badge variant="outline" className={getTypeStyles()}>
        {type.toUpperCase()}
      </Badge>
      <div>
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-slate-300">{title}</div>
          <div className="text-xs text-slate-500">{time}</div>
        </div>
        <div className="text-xs text-slate-400 mt-1">{description}</div>
      </div>
    </div>
  )
}

// Componente para itens de comunicação
export function CommunicationItem({
  sender,
  time,
  message,
  avatar,
  unread,
}: {
  sender: string
  time: string
  message: string
  avatar: string
  unread?: boolean
}) {
  return (
    <div className={`flex space-x-3 p-2 rounded-md ${unread ? "bg-slate-800/30" : "hover:bg-slate-800/30"}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatar || "/placeholder.svg"} alt={sender} />
        <AvatarFallback className="bg-slate-700 text-cyan-500">{sender.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-300">{sender}</div>
          <div className="text-xs text-slate-500">{time}</div>
        </div>
        <div className="text-xs text-slate-400 mt-1">{message}</div>
      </div>
      {unread && <div className="h-2 w-2 rounded-full bg-cyan-500 mt-2"></div>}
    </div>
  )
}

// Componente para botões de ação
export function ActionButton({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="flex flex-col items-center justify-center bg-slate-800/50 rounded-md p-3 border border-slate-700/50 hover:bg-slate-800 transition-colors">
      <Icon className="h-5 w-5 text-cyan-500 mb-1" />
      <span className="text-xs text-slate-400">{label}</span>
    </button>
  )
}

// Componente para o gráfico de desempenho
export function PerformanceChart({ metrics = [] }: { metrics: SystemMetric[] }) {
  // Ordenar métricas por timestamp (mais antigas primeiro)
  const sortedMetrics = [...metrics].sort(
    (a, b) => new Date(a.timestamp || "").getTime() - new Date(b.timestamp || "").getTime(),
  )

  // Se não houver métricas, mostrar uma mensagem
  if (sortedMetrics.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-slate-500 text-sm">No performance data available</div>
      </div>
    )
  }

  // Calcular a altura máxima do gráfico
  const maxHeight = 200
  const padding = 20

  // Obter os valores máximos para normalização
  const maxCpu = Math.max(...sortedMetrics.map((m) => m.cpu_usage))
  const maxMemory = Math.max(...sortedMetrics.map((m) => m.memory_usage))
  const maxNetwork = Math.max(...sortedMetrics.map((m) => m.network_status))

  // Normalizar valores para a altura do gráfico
  const normalizeCpu = (value: number) => (value / 100) * (maxHeight - padding * 2) + padding
  const normalizeMemory = (value: number) => (value / 100) * (maxHeight - padding * 2) + padding
  const normalizeNetwork = (value: number) => (value / 100) * (maxHeight - padding * 2) + padding

  // Calcular a largura de cada ponto no gráfico
  const width = 100 / (sortedMetrics.length - 1)

  // Gerar pontos para as linhas do gráfico
  const cpuPoints = sortedMetrics
    .map((metric, index) => `${index * width},${maxHeight - normalizeCpu(metric.cpu_usage)}`)
    .join(" ")

  const memoryPoints = sortedMetrics
    .map((metric, index) => `${index * width},${maxHeight - normalizeMemory(metric.memory_usage)}`)
    .join(" ")

  const networkPoints = sortedMetrics
    .map((metric, index) => `${index * width},${maxHeight - normalizeNetwork(metric.network_status)}`)
    .join(" ")

  return (
    <div className="h-full w-full relative">
      {/* Linhas de grade */}
      <div className="absolute inset-0 grid grid-rows-4 h-full w-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-t border-slate-700/30 h-0"></div>
        ))}
      </div>

      {/* SVG para as linhas do gráfico */}
      <svg viewBox={`0 0 100 ${maxHeight}`} className="h-full w-full absolute inset-0">
        {/* Linha CPU */}
        <polyline
          points={cpuPoints}
          fill="none"
          stroke="rgba(6, 182, 212, 0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Linha Memory */}
        <polyline
          points={memoryPoints}
          fill="none"
          stroke="rgba(168, 85, 247, 0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Linha Network */}
        <polyline
          points={networkPoints}
          fill="none"
          stroke="rgba(59, 130, 246, 0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos para CPU */}
        {sortedMetrics.map((metric, index) => (
          <circle
            key={`cpu-${index}`}
            cx={index * width}
            cy={maxHeight - normalizeCpu(metric.cpu_usage)}
            r="1.5"
            fill="#06b6d4"
          />
        ))}

        {/* Pontos para Memory */}
        {sortedMetrics.map((metric, index) => (
          <circle
            key={`memory-${index}`}
            cx={index * width}
            cy={maxHeight - normalizeMemory(metric.memory_usage)}
            r="1.5"
            fill="#a855f7"
          />
        ))}

        {/* Pontos para Network */}
        {sortedMetrics.map((metric, index) => (
          <circle
            key={`network-${index}`}
            cx={index * width}
            cy={maxHeight - normalizeNetwork(metric.network_status)}
            r="1.5"
            fill="#3b82f6"
          />
        ))}
      </svg>

      {/* Rótulos de tempo */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-2">
        <span>{sortedMetrics.length > 0 ? new Date(sortedMetrics[0].timestamp || "").toLocaleTimeString() : ""}</span>
        <span>
          {sortedMetrics.length > 0
            ? new Date(sortedMetrics[sortedMetrics.length - 1].timestamp || "").toLocaleTimeString()
            : ""}
        </span>
      </div>
    </div>
  )
}
