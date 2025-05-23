import { Button } from "@/components/ui/button"
import { Shield, RefreshCw, Download, Terminal } from "lucide-react"

type ActionIconType = "Shield" | "RefreshCw" | "Download" | "Terminal"

interface ActionButtonProps {
  icon: ActionIconType
  label: string
}

export function ActionButton({ icon, label }: ActionButtonProps) {
  const IconComponent = () => {
    switch (icon) {
      case "Shield":
        return <Shield className="h-5 w-5 text-cyan-500" />
      case "RefreshCw":
        return <RefreshCw className="h-5 w-5 text-cyan-500" />
      case "Download":
        return <Download className="h-5 w-5 text-cyan-500" />
      case "Terminal":
        return <Terminal className="h-5 w-5 text-cyan-500" />
      default:
        return null
    }
  }

  return (
    <Button
      variant="outline"
      className="h-auto py-3 px-3 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center justify-center space-y-1 w-full"
    >
      <IconComponent />
      <span className="text-xs">{label}</span>
    </Button>
  )
}
