"use client"

import type React from "react"

import { useState } from "react"
import { Check, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { liberarPendencia } from "@/lib/supabase"

interface LiberarPendenciaModalProps {
  isOpen: boolean
  onClose: () => void
  category: string
  description: string
  onSuccess: () => void
}

export function LiberarPendenciaModal({
  isOpen,
  onClose,
  category,
  description,
  onSuccess,
}: LiberarPendenciaModalProps) {
  const [equipmentId, setEquipmentId] = useState("")
  const [releasedBy, setReleasedBy] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!equipmentId.trim()) {
      setError("Por favor, insira o ID do equipamento.")
      return
    }

    try {
      setIsSubmitting(true)
      // Corrigir a forma como os dados são passados para a função liberarPendencia
      await liberarPendencia({
        category,
        description,
        equipment_id: equipmentId,
        released_by: releasedBy || "Sistema",
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error releasing pendencia:", err)
      setError("Erro ao liberar pendência. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentDate = new Date().toLocaleDateString("pt-BR")
  const currentTime = new Date().toLocaleTimeString("pt-BR")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center text-green-400">
            <Check className="mr-2 h-5 w-5 text-green-500" />
            Liberar Pendência
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Confirme a liberação desta pendência para removê-la da lista ativa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700/50 my-4">
            <p className="text-slate-300 mb-2">{description}</p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" /> {currentDate}
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {currentTime}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentId">ID do Equipamento</Label>
              <Input
                id="equipmentId"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                className="bg-slate-800 border-slate-700"
                placeholder="Ex: L-001, P-002, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releasedBy">Liberado Por (opcional)</Label>
              <Input
                id="releasedBy"
                value={releasedBy}
                onChange={(e) => setReleasedBy(e.target.value)}
                className="bg-slate-800 border-slate-700"
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 text-red-400 p-2 rounded-md mt-4 text-sm border border-red-800/50">
              {error}
            </div>
          )}

          <DialogFooter className="mt-6 pt-4 border-t border-slate-700/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" /> Confirmar Liberação
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
