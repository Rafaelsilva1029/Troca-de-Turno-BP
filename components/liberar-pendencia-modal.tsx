"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2, User, Hash } from "lucide-react"
import { liberarPendencia } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface LiberarPendenciaModalProps {
  isOpen: boolean
  onClose: () => void
  category: string
  description: string
  frota: string
  onSuccess?: () => void
}

const getCategoryColor = (slug: string) => {
  const colors: Record<string, string> = {
    "veiculos-logistica": "bg-green-400 text-white",
    "caminhoes-pipas": "bg-blue-400 text-white",
    "caminhoes-munck": "bg-yellow-400 text-white",
    "caminhoes-prancha-vinhaca-muda": "bg-red-400 text-white",
    "caminhoes-cacambas": "bg-purple-400 text-white",
    "area-de-vivencias": "bg-pink-400 text-white",
    "carretinhas-rtk": "bg-orange-400 text-white",
    "tanques-e-dolly": "bg-teal-400 text-white",
    "carretas-canavieira": "bg-gray-400 text-white",
  }
  return colors[slug] || "bg-slate-700 text-white"
}

export function LiberarPendenciaModal({
  isOpen,
  onClose,
  category,
  description,
  frota,
  onSuccess,
}: LiberarPendenciaModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    equipmentId: "",
    releasedBy: "",
    observations: "",
  })

  const getCategoryName = (slug: string) => {
    const names: Record<string, string> = {
      "veiculos-logistica": "Veículos Logística",
      "caminhoes-pipas": "Caminhões Pipas",
      "caminhoes-munck": "Caminhões Munck",
      "caminhoes-prancha-vinhaca-muda": "Caminhões Prancha/Vinhaça/Muda",
      "caminhoes-cacambas": "Caminhões Caçambas",
      "area-de-vivencias": "Área de Vivências",
      "carretinhas-rtk": "Carretinhas RTK",
      "tanques-e-dolly": "Tanques e Dolly",
      "carretas-canavieira": "Carretas Canavieira",
    }
    return names[slug] || slug
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.equipmentId.trim() || !formData.releasedBy.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o ID do equipamento e quem liberou.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await liberarPendencia({
        category,
        description: formData.observations.trim() || description,
        released_by: formData.releasedBy.trim(),
        equipment_id: formData.equipmentId.trim(),
      })

      toast({
        title: "Pendência liberada com sucesso!",
        description: `O equipamento ${formData.equipmentId} foi liberado e movido para a lista de equipamentos liberados.`,
        variant: "default",
      })

      // Reset form
      setFormData({
        equipmentId: "",
        releasedBy: "",
        observations: "",
      })

      onClose()

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Erro ao liberar pendência:", error)
      toast({
        title: "Erro ao liberar pendência",
        description: "Não foi possível liberar a pendência. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        equipmentId: "",
        releasedBy: "",
        observations: "",
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900/95 border-slate-700/50 backdrop-blur-sm text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center text-green-400">
            <CheckCircle className="mr-2 h-5 w-5" />
            Liberar Equipamento
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Finalize a pendência e mova o equipamento para a lista de liberados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da pendência */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="text-sm font-medium text-slate-300 mb-2">Pendência:</div>
            <div className="text-sm text-slate-400">{description}</div>
            {frota && (
              <div className="text-sm text-slate-400 mt-1">
                <span className="text-slate-500">Frota:</span> {frota}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className={`text-xs ${getCategoryColor(category)}`}>
                {getCategoryName(category)}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ID do Equipamento */}
            <div className="space-y-2">
              <Label htmlFor="equipmentId" className="text-slate-300 flex items-center">
                <Hash className="h-4 w-4 mr-1" />
                ID do Equipamento *
              </Label>
              <Input
                id="equipmentId"
                type="text"
                placeholder="Ex: L-001, P-002, M-003..."
                value={formData.equipmentId}
                onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                className="bg-slate-800 border-slate-700 focus:border-green-500"
                required
                disabled={isLoading}
              />
            </div>

            {/* Liberado por */}
            <div className="space-y-2">
              <Label htmlFor="releasedBy" className="text-slate-300 flex items-center">
                <User className="h-4 w-4 mr-1" />
                Liberado por *
              </Label>
              <Input
                id="releasedBy"
                type="text"
                placeholder="Nome do responsável pela liberação"
                value={formData.releasedBy}
                onChange={(e) => setFormData({ ...formData, releasedBy: e.target.value })}
                className="bg-slate-800 border-slate-700 focus:border-green-500"
                required
                disabled={isLoading}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations" className="text-slate-300">
                Observações (opcional)
              </Label>
              <Textarea
                id="observations"
                placeholder="Observações adicionais sobre a liberação..."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="bg-slate-800 border-slate-700 focus:border-green-500 min-h-[80px]"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">Se não preenchido, será usada a descrição original da pendência.</p>
            </div>
          </form>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="bg-slate-800 hover:bg-slate-700 border-slate-700"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Liberando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Liberar Equipamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
