import type React from "react"
// Re-using from v464
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface FuturisticCardProps {
  title: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
  iconColorClass?: string
  style?: React.CSSProperties
}

export function FuturisticCard({
  title,
  icon: Icon,
  children,
  className,
  action,
  iconColorClass = "text-cyan-400",
  style,
}: FuturisticCardProps) {
  return (
    <div
      className={cn(
        "futuristic-card p-6 rounded-xl border border-slate-700/50 bg-slate-800/30 shadow-xl backdrop-blur-md",
        "hover:border-slate-600/70 transition-all duration-300",
        className,
      )}
      style={style}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className={cn("h-7 w-7", iconColorClass)} />}
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="text-slate-300">{children}</div>
    </div>
  )
}
