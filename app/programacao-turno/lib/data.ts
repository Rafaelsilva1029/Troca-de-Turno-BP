import type { EquipmentStatus, StatusStyle } from "./types"
import { CheckCircle, Wrench, XCircle, Power } from "lucide-icon"

export const equipmentStatusStyles: Record<EquipmentStatus, StatusStyle> = {
  Disponível: {
    bgColor: "bg-green-500/20",
    textColor: "text-green-300",
    borderColor: "border-green-500/50",
    iconColor: "text-green-400",
    icon: CheckCircle,
  },
  "Em Uso": {
    bgColor: "bg-sky-500/20",
    textColor: "text-sky-300",
    borderColor: "border-sky-500/50",
    iconColor: "text-sky-400",
    icon: Power,
  },
  "Em Manutenção": {
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-300",
    borderColor: "border-amber-500/50",
    iconColor: "text-amber-400",
    icon: Wrench,
  },
  Inativo: {
    bgColor: "bg-red-500/20",
    textColor: "text-red-300",
    borderColor: "border-red-500/50",
    iconColor: "text-red-400",
    icon: XCircle,
  },
}
