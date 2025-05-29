"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { deleteAllPendencias } from "@/lib/supabase"

interface DeleteAllPendenciasModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteAllPendenciasModal({ isOpen, onClose, onSuccess }: DeleteAllPendenciasModalProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const confirmationPhrase = "APAGAR TUDO"

  const handleDelete = async () => {
    if (confirmText !== confirmationPhrase) {
      toast({
        title: "Confirmação incorreta",
        description: `Digite "${confirmationPhrase}" para confirmar a exclusão.`,
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      await deleteAllPendencias()

      toast({
        title: "Pendências excluídas",
        description: "Todas as pendências foram excluídas com sucesso.",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao excluir pendências:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir as pendências. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900/90 border-red-700/50 backdrop-blur-sm text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center text-red-400">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
            Excluir todas as pendências
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Esta ação excluirá <span className="font-bold text-red-400">TODAS</span> as pendências do banco de dados.
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-950/20 border border-red-900/50 rounded-md p-4 my-4">
          <p className="text-sm text-red-300 mb-4">
            Para confirmar, digite <span className="font-bold">{confirmationPhrase}</span> no campo abaixo:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmationPhrase}
            className="bg-slate-800/70 border-slate-700 text-slate-100"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 hover:bg-slate-800 hover:text-slate-100"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== confirmationPhrase}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir todas as pendências
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
