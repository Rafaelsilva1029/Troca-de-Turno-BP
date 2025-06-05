// Re-using and expanding types from v464
import type { LucideIcon } from "lucide-react"

export type WorkFront =
  | "Frente 1"
  | "Frente 2"
  | "Frente 3"
  | "Frente 4"
  | "Plantio Mecanizado"
  | "Colheita de Muda"
  | "Fertirrigação Localizada"
  | "Manutenção Geral"
  | "Logística Interna"

export interface Shift {
  id: string
  employeeName: string
  startTime: Date
  endTime: Date
  workFront: WorkFront
  observations?: string
  status: "Planejado" | "Em Andamento" | "Concluído" | "Cancelado"
}

export type EquipmentCategory = "Tratores" | "Colheitadeiras" | "Pulverizadores" | "Veículos de Apoio" | "Implementos"
export type EquipmentStatus = "Disponível" | "Em Uso" | "Em Manutenção" | "Inativo"

export interface Equipment {
  id: string
  name: string
  category: EquipmentCategory
  allocatedWorkFront?: WorkFront
  status: EquipmentStatus
  observations?: string
  lastTransfer?: {
    front: WorkFront
    time: Date
    notes?: string
  }
  transferHistory?: Array<{
    front: WorkFront
    time: Date
    notes?: string
  }>
}

export interface BusSchedule {
  id: string
  workFront: WorkFront
  departureTime: string // HH:mm
  arrivalTime?: string // HH:mm
  driverName: string
  availableSeats: number
  status?: "Programado" | "Em Trânsito" | "Concluído"
}

export type ReminderPriority = "Alta" | "Média" | "Baixa"

export interface Reminder {
  id: string
  title: string
  description?: string
  time: Date // Specific time for the reminder
  notifyBeforeMinutes?: 15 | 30 // Optional: 15 or 30 minutes before
  priority: ReminderPriority
  isViewed: boolean
  relatedShiftId?: string
  relatedEquipmentId?: string
}

export interface DashboardStat {
  title: string
  value: string | number
  icon: LucideIcon
  description: string
  link: string
  colorClass: string // e.g., text-cyan-400 border-cyan-500
}

export interface QuickAction {
  label: string
  icon?: LucideIcon
  action: () => void
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
}

export interface StatusStyle {
  bgColor: string // e.g., "bg-green-500/20"
  textColor: string // e.g., "text-green-300"
  borderColor: string // e.g., "border-green-500/30"
  iconColor?: string // e.g., "text-green-400"
  icon?: LucideIcon // Optional specific icon for the status
}
