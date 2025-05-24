"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { format, addDays, isAfter, isBefore, parseISO, differenceInMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Bell,
  Calendar,
  Clock,
  Flag,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Download,
  Save,
  Archive,
  RotateCcw,
  Loader2,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "./notification-manager"
import {
  type Reminder,
  type ReminderPriority,
  type ReminderStatus,
  fetchReminders,
  saveReminder,
  deleteReminder,
  archiveReminder,
  fetchArchivedReminders,
  restoreReminder,
  saveReminders,
} from "@/lib/supabase"

export function ReminderSystem() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [archivedReminders, setArchivedReminders] = useState<Reminder[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [activeView, setActiveView] = useState<"active" | "archived">("active")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncingDatabase, setIsSyncingDatabase] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState(false)
  const { showNotification } = useNotifications()

  // Carregar lembretes do banco de dados
  const loadRemindersFromDatabase = useCallback(async () => {
    try {
      setIsSyncingDatabase(true)
      setDatabaseError(null)

      // Carregar lembretes ativos
      const activeRemindersData = await fetchReminders()
      setReminders(activeRemindersData)

      // Carregar lembretes arquivados
      const archivedRemindersData = await fetchArchivedReminders()
      setArchivedReminders(archivedRemindersData)

      setLastSyncTime(new Date())
      setPendingChanges(false)
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error)
      setDatabaseError("Erro ao carregar lembretes. Verifique sua conexão.")
      showNotification({
        title: "Erro de Sincronização",
        message: "Não foi possível carregar os lembretes do banco de dados.",
        type: "error",
        autoCloseTime: 5000,
      })
    } finally {
      setIsSyncingDatabase(false)
      setIsLoading(false)
    }
  }, [showNotification])

  // Salvar lembretes no banco de dados
  const saveRemindersToDatabase = async () => {
    try {
      setIsSaving(true)
      setDatabaseError(null)

      // Salvar todos os lembretes ativos
      await saveReminders(reminders)

      setLastSyncTime(new Date())
      setPendingChanges(false)

      showNotification({
        title: "Sincronização Concluída",
        message: "Todos os lembretes foram salvos com sucesso.",
        type: "success",
        autoCloseTime: 3000,
      })
    } catch (error) {
      console.error("Erro ao salvar lembretes:", error)
      setDatabaseError("Erro ao salvar lembretes. Verifique sua conexão.")
      showNotification({
        title: "Erro de Sincronização",
        message: "Não foi possível salvar os lembretes no banco de dados.",
        type: "error",
        autoCloseTime: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Carregar lembretes ao montar o componente
  useEffect(() => {
    loadRemindersFromDatabase()
  }, [loadRemindersFromDatabase])

  // Auto-save quando houver alterações pendentes
  useEffect(() => {
    if (pendingChanges && !isSaving) {
      const timer = setTimeout(() => {
        saveRemindersToDatabase()
      }, 5000) // Auto-save após 5 segundos de inatividade

      return () => clearTimeout(timer)
    }
  }, [pendingChanges, isSaving, reminders])

  // Verificar lembretes e enviar notificações (SEM ÁUDIO)
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()

      reminders.forEach((reminder) => {
        if (reminder.status === "concluido" || reminder.status === "arquivado") return

        const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}:00`)
        const minutesToDue = differenceInMinutes(dueDateTime, now)

        // Notificar lembretes exatamente 1 hora antes do prazo (entre 58 e 62 minutos)
        if (minutesToDue >= 58 && minutesToDue <= 62 && !reminder.oneHourNotified && reminder.status !== "atrasado") {
          showNotification({
            title: "Lembrete em 1 hora!",
            message: `${reminder.title} vence em 1 hora`,
            type: "alert",
            dueTime: `Vence em ${format(dueDateTime, "dd/MM/yyyy 'às' HH:mm")}`,
            autoCloseTime: 15000,
            onAction: (id, action) => {
              if (action === "complete") {
                markAsCompleted(reminder.id)
              } else if (action === "snooze") {
                postponeReminder(reminder.id, 30)
              }
            },
          })

          // Marcar como notificado para 1 hora
          setReminders((prev) =>
            prev.map((r) =>
              r.id === reminder.id ? { ...r, oneHourNotified: true, updatedAt: new Date().toISOString() } : r,
            ),
          )
          setPendingChanges(true)
        }

        // Notificar lembretes atrasados
        else if (isBefore(dueDateTime, now) && reminder.status !== "atrasado") {
          showNotification({
            title: "Lembrete Atrasado!",
            message: reminder.title,
            type: "alert",
            dueTime: `Venceu em ${format(dueDateTime, "dd/MM/yyyy 'às' HH:mm")}`,
            onAction: (id, action) => {
              if (action === "complete") {
                markAsCompleted(reminder.id)
              } else if (action === "snooze") {
                postponeReminder(reminder.id, 60)
              }
            },
          })

          // Atualizar status para atrasado
          setReminders((prev) =>
            prev.map((r) =>
              r.id === reminder.id
                ? { ...r, status: "atrasado", notified: true, updatedAt: new Date().toISOString() }
                : r,
            ),
          )
          setPendingChanges(true)
        }

        // Notificar lembretes próximos (menos de 15 minutos, mas não 1 hora)
        else if (minutesToDue > 0 && minutesToDue < 15 && !reminder.notified && reminder.status !== "atrasado") {
          showNotification({
            title: "Lembrete Próximo",
            message: reminder.title,
            type: "info",
            dueTime: `Vence em ${format(dueDateTime, "dd/MM/yyyy 'às' HH:mm")}`,
            onAction: (id, action) => {
              if (action === "complete") {
                markAsCompleted(reminder.id)
              } else if (action === "snooze") {
                postponeReminder(reminder.id, 10)
              }
            },
          })

          // Marcar como notificado
          setReminders((prev) =>
            prev.map((r) => (r.id === reminder.id ? { ...r, notified: true, updatedAt: new Date().toISOString() } : r)),
          )
          setPendingChanges(true)
        }
      })
    }

    // Verificar imediatamente e depois a cada minuto
    checkReminders()
    const interval = setInterval(checkReminders, 60000)

    return () => clearInterval(interval)
  }, [reminders, showNotification])

  // Função para adiar um lembrete
  const postponeReminder = async (id: string, minutes: number) => {
    try {
      const reminderToUpdate = reminders.find((r) => r.id === id)
      if (!reminderToUpdate) return

      const dueDateTime = new Date(`${reminderToUpdate.dueDate}T${reminderToUpdate.dueTime}:00`)
      const newDueTime = new Date(dueDateTime.getTime() + minutes * 60 * 1000)

      const updatedReminder = {
        ...reminderToUpdate,
        dueDate: format(newDueTime, "yyyy-MM-dd"),
        dueTime: format(newDueTime, "HH:mm"),
        notified: false,
        oneHourNotified: false,
        updatedAt: new Date().toISOString(),
      }

      // Atualizar estado local
      setReminders((prev) => prev.map((r) => (r.id === id ? updatedReminder : r)))
      setPendingChanges(true)

      // Salvar no banco de dados
      await saveReminder(updatedReminder)

      showNotification({
        title: "Lembrete Adiado",
        message: `O lembrete foi adiado por ${minutes} minutos`,
        type: "success",
        autoCloseTime: 5000,
      })
    } catch (error) {
      console.error("Erro ao adiar lembrete:", error)
      showNotification({
        title: "Erro ao Adiar",
        message: "Não foi possível adiar o lembrete. Tente novamente.",
        type: "error",
        autoCloseTime: 5000,
      })
    }
  }

  // Função para obter a cor baseada na prioridade
  const getPriorityColor = (priority: ReminderPriority) => {
    switch (priority) {
      case "baixa":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "media":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "alta":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "urgente":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Função para obter o ícone baseado na prioridade
  const getPriorityIcon = (priority: ReminderPriority) => {
    switch (priority) {
      case "baixa":
        return <Info className="h-4 w-4 text-blue-400" />
      case "media":
        return <Info className="h-4 w-4 text-green-400" />
      case "alta":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />
      case "urgente":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <Info className="h-4 w-4 text-slate-400" />
    }
  }

  // Função para obter a cor baseada no status
  const getStatusColor = (status: ReminderStatus) => {
    switch (status) {
      case "pendente":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "em-andamento":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "concluido":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "atrasado":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "arquivado":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Função para obter o ícone baseado no status
  const getStatusIcon = (status: ReminderStatus) => {
    switch (status) {
      case "pendente":
        return <Clock className="h-4 w-4 text-blue-400" />
      case "em-andamento":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />
      case "concluido":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case "atrasado":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case "arquivado":
        return <Archive className="h-4 w-4 text-purple-400" />
      default:
        return <Info className="h-4 w-4 text-slate-400" />
    }
  }

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  // Função para verificar se um lembrete está atrasado
  const isReminderOverdue = (reminder: Reminder) => {
    const now = new Date()
    const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}:00`)
    return isBefore(dueDateTime, now) && reminder.status !== "concluido" && reminder.status !== "arquivado"
  }

  // Função para verificar se um lembrete está próximo do prazo (menos de 24h)
  const isReminderNearDue = (reminder: Reminder) => {
    const now = new Date()
    const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}:00`)
    const oneDayFromNow = addDays(now, 1)
    return (
      isAfter(dueDateTime, now) &&
      isBefore(dueDateTime, oneDayFromNow) &&
      reminder.status !== "concluido" &&
      reminder.status !== "arquivado"
    )
  }

  // Função para verificar se um lembrete está a exatamente 1 hora do prazo
  const isReminderOneHourToDue = (reminder: Reminder) => {
    const now = new Date()
    const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}:00`)
    const minutesToDue = differenceInMinutes(dueDateTime, now)
    return (
      minutesToDue >= 55 && minutesToDue <= 65 && reminder.status !== "concluido" && reminder.status !== "arquivado"
    )
  }

  // Função para adicionar um novo lembrete
  const addReminder = async (
    reminderData: Omit<Reminder, "id" | "createdAt" | "updatedAt" | "notified" | "oneHourNotified">,
  ) => {
    try {
      // Criar novo objeto de lembrete
      const newReminder: Reminder = {
        ...reminderData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notified: false,
        oneHourNotified: false,
      }

      // Atualizar estado local
      setReminders((prev) => [...prev, newReminder])
      setPendingChanges(true)
      setIsDialogOpen(false)

      // Salvar no banco de dados
      await saveReminder(newReminder)

      // Mostrar notificação de sucesso
      showNotification({
        title: "Novo Lembrete Criado",
        message: newReminder.title,
        type: "success",
        dueTime: `Vence em ${format(
          new Date(`${newReminder.dueDate}T${newReminder.dueTime}:00`),
          "dd/MM/yyyy 'às' HH:mm",
        )}`,
        autoCloseTime: 5000,
      })
    } catch (error) {
      console.error("Erro ao adicionar lembrete:", error)
      showNotification({
        title: "Erro ao Criar Lembrete",
        message: "Não foi possível criar o lembrete. Tente novamente.",
        type: "error",
        autoCloseTime: 5000,
      })
    }
  }

  // Função para atualizar um lembrete existente
  const updateReminder = async (updatedReminderData: Reminder) => {
    try {
      const originalReminder = reminders.find((r) => r.id === updatedReminderData.id)
      if (!originalReminder) return

      // Verificar se a data/hora foi alterada para resetar as notificações
      const resetNotifications =
        originalReminder.dueDate !== updatedReminderData.dueDate ||
        originalReminder.dueTime !== updatedReminderData.dueTime

      const updatedReminder = {
        ...updatedReminderData,
        updatedAt: new Date().toISOString(),
        notified: resetNotifications ? false : originalReminder.notified,
        oneHourNotified: resetNotifications ? false : originalReminder.oneHourNotified,
      }

      // Atualizar estado local
      setReminders((prev) => prev.map((r) => (r.id === updatedReminder.id ? updatedReminder : r)))
      setPendingChanges(true)
      setIsDialogOpen(false)
      setEditingReminder(null)

      // Salvar no banco de dados
      await saveReminder(updatedReminder)

      // Mostrar notificação de sucesso
      showNotification({
        title: "Lembrete Atualizado",
        message: updatedReminder.title,
        type: "info",
        autoCloseTime: 5000,
      })
    } catch (error) {
      console.error("Erro ao atualizar lembrete:", error)
      showNotification({
        title: "Erro ao Atualizar Lembrete",
        message: "Não foi possível atualizar o lembrete. Tente novamente.",
        type: "error",
        autoCloseTime: 5000,
      })
    }
  }

  // Função para excluir um lembrete
  const deleteReminderHandler = async (id: string) => {
    try {
      const reminderToDelete = reminders.find((r) => r.id === id)
      if (!reminderToDelete) return

      // Atualizar estado local
      setReminders((prev) => prev.filter((r) => r.id !== id))
      setPendingChanges(true)

      // Excluir do banco de dados
      await deleteReminder(id)

      // Mostrar notificação de sucesso
      showNotification({
        title: "Lembrete Excluído",
        message: reminderToDelete.title,
        type: "info",
        autoCloseTime: 5000,
      })
    } catch (error) {
      console.error("Erro ao excluir lembrete:", error)
      showNotification({
        title: "Erro ao Excluir Lembrete",
        message: "Não foi possível excluir o lembrete. Tente novamente.",
        type: "error",
        autoCloseTime: 5000,
      })
    }
  }

  // Função para excluir um lembrete arquivado
  const deleteArchivedReminderHandler = async (id: string) => {
    try {
      const reminderToDelete = archivedReminders.find((r) => r.id === id)
      if (!reminderToDelete) return

      // Atualizar estado local
      setArchivedReminders((prev) => prev.filter((r) => r.id !== id))

      // Excluir do banco de dados
      await deleteReminder(id)

      // Mostrar notificação de sucesso
      showNotification({
        title: "Lembrete Arquivado Excluído",
        message: reminderToDelete.title,
        type: "info",
        autoCloseTime: 5000,
      })
    } catch (error) {
      console.error("Erro ao excluir lembrete arquivado:", error)
      showNotification({
        title: "Erro ao Excluir Lembrete",
        message: "Não foi possível excluir o lembrete arquivado. Tente novamente.",
        type: "error",
        autoCloseTime: 5000,
      })
    }
  }

  // Função para marcar um lembrete como concluído
  const markAsCompleted = async (id: string) => {
    try {
      const reminderToComplete = reminders.find((r) => r.id === id)
      if (!reminderToComplete) return

      const completedReminder = {
        ...reminderToComplete,
        status: "concluido" as ReminderStatus,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Atualizar estado local
      setReminders((prev) => prev.map((r) => (r.id === id ? completedReminder : r)))
      setPendingChanges(true)

      // Salvar no banco de dados
      await saveReminder(completedReminder)

      // Mostrar notificação de sucesso
      showNotification({
        title: "Lembrete Concluído",
        message: reminderToComplete.title,
        type: "success",
        autoCloseTime: 5000,
      })
    } catch (error) {
      console.error("Erro ao marcar lembrete como concluído:", error)
      showNotification({
        title: "Erro ao Concluir Lembrete",
        message: "Não foi possível marcar o lembrete como concluído. Tente novamente.",
        type: "error",
        autoCloseTime: 5000,
      })
    }
  }

  // Função para arquivar um lembrete
  const archiveReminderHandler = async (id: string) => {
    try {
      const reminderToArchive = reminders.find((r) => r.id === id)
      if (!reminderToArchive) return

      // Atualizar estado local
      setReminders((prev) => prev.filter((r) => r.id !== id))
      setPendingChanges(true)

      // Arquivar no banco de dados
      const archivedReminderData = await archiveReminder(reminderToArchive)

      // Adicionar à lista de arquivados
      setArchivedReminders((prev) => [archivedReminderData, ...prev])

      // Mostrar notificação de sucesso
      showNotification({
        title: "Lembrete Arquivado",
        message: reminderToArchive.title,
        type: "success",
        autoCloseTime: 5000,
      })
    } catch (error) {
      console.error("Erro ao arquivar lembrete:", error)
      showNotification({
        title: "Erro ao Arquivar Lembrete",
        message: "Não foi possível arquivar o lembrete. Tente novamente.",
        type: "error",
        autoCloseTime: 5000,
      })
    }
  }

  // Função para restaurar um lembrete arquivado
  const restoreReminderHandler = async (id: string) => {
    try {
      const reminderToRestore = archivedReminders.find((r) => r.id === id)
      if (!reminderToRestore) return

      // Atualizar estado local
      setArchivedReminders((prev) => prev.filter((r) => r.id !== id))

      // Restaurar no banco de dados
      await restoreReminder(id)

      // Recarregar lembretes ativos
      await loadRemindersFromDatabase()

      // Mostrar notificação de sucesso
      showNotification({
        title: "Lembrete Restaurado",
        message: reminderToRestore.title,
        type: "success",
        autoCloseTime: 5000,
      })
    } catch (error) {
      console.error("Erro ao restaurar lembrete:", error)
      showNotification({
        title: "Erro ao Restaurar Lembrete",
        message: "Não foi possível restaurar o lembrete. Tente novamente.",
        type: "error",
        autoCloseTime: 5000,
      })
    }
  }

  // Função para filtrar lembretes com base na aba ativa e termo de busca
  const filteredReminders = reminders.filter((reminder) => {
    // Filtro por status
    if (activeTab !== "all" && reminder.status !== activeTab) {
      return false
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        reminder.title.toLowerCase().includes(searchLower) ||
        reminder.description.toLowerCase().includes(searchLower) ||
        (reminder.assignedTo && reminder.assignedTo.toLowerCase().includes(searchLower)) ||
        reminder.category.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  // Função para filtrar lembretes arquivados por termo de busca
  const filteredArchivedReminders = archivedReminders.filter((reminder) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        reminder.title.toLowerCase().includes(searchLower) ||
        reminder.description.toLowerCase().includes(searchLower) ||
        (reminder.assignedTo && reminder.assignedTo.toLowerCase().includes(searchLower)) ||
        reminder.category.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // Ordenar lembretes por prioridade e data
  const sortedReminders = [...filteredReminders].sort((a, b) => {
    // Primeiro por status (atrasado primeiro)
    if (a.status === "atrasado" && b.status !== "atrasado") return -1
    if (a.status !== "atrasado" && b.status === "atrasado") return 1

    // Depois por prioridade
    const priorityOrder = { urgente: 0, alta: 1, media: 2, baixa: 3 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }

    // Por fim, por data
    return new Date(`${a.dueDate}T${a.dueTime}:00`).getTime() - new Date(`${b.dueDate}T${b.dueTime}:00`).getTime()
  })

  // Ordenar lembretes arquivados por data de conclusão (mais recentes primeiro)
  const sortedArchivedReminders = [...filteredArchivedReminders].sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
    return dateB - dateA
  })

  // Contagem de lembretes por status
  const reminderCounts = {
    all: reminders.length,
    pendente: reminders.filter((r) => r.status === "pendente").length,
    "em-andamento": reminders.filter((r) => r.status === "em-andamento").length,
    concluido: reminders.filter((r) => r.status === "concluido").length,
    atrasado: reminders.filter((r) => r.status === "atrasado").length,
    arquivado: archivedReminders.length,
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
            <Bell className="mr-2 h-5 w-5 text-green-500" />
            Sistema de Lembretes
            {pendingChanges && (
              <Badge className="ml-2 bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse">
                Alterações não salvas
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditingReminder(null)
                setIsDialogOpen(true)
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-1" /> Novo Lembrete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Exibir mensagem de carregamento */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-4" />
            <p className="text-slate-400">Carregando lembretes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Erro de banco de dados */}
            {databaseError && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-md p-3 text-red-300 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
                  <p>{databaseError}</p>
                </div>
              </div>
            )}

            {/* Alternar entre lembretes ativos e arquivados */}
            <div className="flex justify-center mb-2">
              <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "active" | "archived")}>
                <TabsList className="bg-slate-800/50 p-1">
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:bg-slate-700 data-[state=active]:text-green-400"
                  >
                    Lembretes Ativos
                    <Badge className="ml-1 bg-green-900/30 text-green-400">{reminderCounts.all}</Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="archived"
                    className="data-[state=active]:bg-slate-700 data-[state=active]:text-purple-400"
                  >
                    Lembretes Arquivados
                    <Badge className="ml-1 bg-purple-900/30 text-purple-400">{reminderCounts.arquivado}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Filtros e busca */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              {activeView === "active" ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-slate-800/50 p-1">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-slate-700 data-[state=active]:text-green-400"
                    >
                      Todos <Badge className="ml-1 bg-slate-700">{reminderCounts.all}</Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="pendente"
                      className="data-[state=active]:bg-slate-700 data-[state=active]:text-blue-400"
                    >
                      Pendentes <Badge className="ml-1 bg-blue-900/30 text-blue-400">{reminderCounts.pendente}</Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="em-andamento"
                      className="data-[state=active]:bg-slate-700 data-[state=active]:text-amber-400"
                    >
                      Em Andamento{" "}
                      <Badge className="ml-1 bg-amber-900/30 text-amber-400">{reminderCounts["em-andamento"]}</Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="concluido"
                      className="data-[state=active]:bg-slate-700 data-[state=active]:text-green-400"
                    >
                      Concluídos{" "}
                      <Badge className="ml-1 bg-green-900/30 text-green-400">{reminderCounts.concluido}</Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="atrasado"
                      className="data-[state=active]:bg-slate-700 data-[state=active]:text-red-400"
                    >
                      Atrasados <Badge className="ml-1 bg-red-900/30 text-red-400">{reminderCounts.atrasado}</Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : (
                <div className="flex items-center">
                  <History className="h-5 w-5 text-purple-400 mr-2" />
                  <span className="text-slate-300">Histórico de Lembretes Arquivados</span>
                </div>
              )}

              <div className="relative">
                <Input
                  placeholder="Buscar lembretes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Lista de lembretes ativos */}
            {activeView === "active" && (
              <div className="space-y-3">
                {sortedReminders.length > 0 ? (
                  sortedReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`bg-slate-800/50 rounded-md p-4 border ${
                        isReminderOverdue(reminder)
                          ? "border-red-500/50"
                          : isReminderOneHourToDue(reminder)
                            ? "border-amber-500/80 animate-pulse"
                            : isReminderNearDue(reminder)
                              ? "border-amber-500/50"
                              : "border-slate-700/50"
                      } hover:bg-slate-800/70 transition-colors`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-slate-200 font-medium">{reminder.title}</h3>
                            <Badge className={getPriorityColor(reminder.priority)}>
                              {getPriorityIcon(reminder.priority)}
                              <span className="ml-1 capitalize">{reminder.priority}</span>
                            </Badge>
                            <Badge className={getStatusColor(reminder.status)}>
                              {getStatusIcon(reminder.status)}
                              <span className="ml-1 capitalize">
                                {reminder.status === "em-andamento" ? "Em andamento" : reminder.status}
                              </span>
                            </Badge>
                            {isReminderOneHourToDue(reminder) && (
                              <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 animate-pulse">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>1h restante</span>
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-3">{reminder.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(reminder.dueDate)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {reminder.dueTime}
                            </div>
                            {reminder.category && (
                              <div className="flex items-center">
                                <Flag className="h-3 w-3 mr-1" />
                                <span className="capitalize">{reminder.category}</span>
                              </div>
                            )}
                            {reminder.assignedTo && (
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {reminder.assignedTo}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {reminder.status !== "concluido" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-green-500"
                              onClick={() => markAsCompleted(reminder.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-500"
                            onClick={() => {
                              setEditingReminder(reminder)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-purple-500"
                            onClick={() => archiveReminderHandler(reminder.id)}
                            title="Arquivar lembrete"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-500"
                            onClick={() => deleteReminderHandler(reminder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-lg">Nenhum lembrete encontrado</p>
                    <p className="text-sm">
                      {searchTerm
                        ? "Tente ajustar seus filtros de busca"
                        : activeTab !== "all"
                          ? `Não há lembretes com status "${activeTab}"`
                          : "Adicione um novo lembrete para começar"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Lista de lembretes arquivados */}
            {activeView === "archived" && (
              <div className="space-y-3">
                {sortedArchivedReminders.length > 0 ? (
                  sortedArchivedReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="bg-slate-800/50 rounded-md p-4 border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-slate-200 font-medium">{reminder.title}</h3>
                            <Badge className={getPriorityColor(reminder.priority)}>
                              {getPriorityIcon(reminder.priority)}
                              <span className="ml-1 capitalize">{reminder.priority}</span>
                            </Badge>
                            <Badge className={getStatusColor("arquivado")}>
                              {getStatusIcon("arquivado")}
                              <span className="ml-1">Arquivado</span>
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm mb-3">{reminder.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(reminder.dueDate)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {reminder.dueTime}
                            </div>
                            {reminder.category && (
                              <div className="flex items-center">
                                <Flag className="h-3 w-3 mr-1" />
                                <span className="capitalize">{reminder.category}</span>
                              </div>
                            )}
                            {reminder.assignedTo && (
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {reminder.assignedTo}
                              </div>
                            )}
                            {reminder.completedAt && (
                              <div className="flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" />
                                <span>
                                  Concluído em{" "}
                                  {format(new Date(reminder.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-500"
                            onClick={() => restoreReminderHandler(reminder.id)}
                            title="Restaurar lembrete"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-500"
                            onClick={() => deleteArchivedReminderHandler(reminder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    <Archive className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-lg">Nenhum lembrete arquivado encontrado</p>
                    <p className="text-sm">
                      {searchTerm
                        ? "Tente ajustar seus filtros de busca"
                        : "Quando você arquivar lembretes, eles aparecerão aqui"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-slate-700/50 pt-4 flex justify-between">
        <div className="text-xs text-slate-500">
          {activeView === "active" ? (
            <>
              Mostrando {sortedReminders.length} de {reminders.length} lembretes
            </>
          ) : (
            <>
              Mostrando {sortedArchivedReminders.length} de {archivedReminders.length} lembretes arquivados
            </>
          )}
          {lastSyncTime && (
            <span className="ml-2">
              Última sincronização: {format(lastSyncTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={loadRemindersFromDatabase}
            disabled={isSyncingDatabase}
          >
            {isSyncingDatabase ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" /> Sincronizar
              </>
            )}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={saveRemindersToDatabase}
            disabled={isSaving || !pendingChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </CardFooter>

      {/* Dialog para adicionar/editar lembrete */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Bell className="mr-2 h-5 w-5 text-green-500" />
              {editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingReminder
                ? "Atualize os detalhes do lembrete existente"
                : "Preencha os detalhes para criar um novo lembrete"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const reminderData = {
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                dueDate: formData.get("dueDate") as string,
                dueTime: formData.get("dueTime") as string,
                priority: formData.get("priority") as ReminderPriority,
                status: formData.get("status") as ReminderStatus,
                category: formData.get("category") as string,
                assignedTo: formData.get("assignedTo") as string,
              }

              if (editingReminder) {
                updateReminder({
                  ...editingReminder,
                  ...reminderData,
                })
              } else {
                addReminder(reminderData)
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingReminder?.title || ""}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingReminder?.description || ""}
                  className="bg-slate-800 border-slate-700 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={editingReminder?.dueDate || format(new Date(), "yyyy-MM-dd")}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueTime">Hora</Label>
                  <Input
                    id="dueTime"
                    name="dueTime"
                    type="time"
                    defaultValue={editingReminder?.dueTime || "09:00"}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select name="priority" defaultValue={editingReminder?.priority || "media"}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingReminder?.status || "pendente"}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em-andamento">Em andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select name="category" defaultValue={editingReminder?.category || "manutenção"}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="manutenção">Manutenção</SelectItem>
                      <SelectItem value="reunião">Reunião</SelectItem>
                      <SelectItem value="segurança">Segurança</SelectItem>
                      <SelectItem value="operação">Operação</SelectItem>
                      <SelectItem value="logística">Logística</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Responsável</Label>
                  <Input
                    id="assignedTo"
                    name="assignedTo"
                    defaultValue={editingReminder?.assignedTo || ""}
                    className="bg-slate-800 border-slate-700"
                    placeholder="Nome do responsável (opcional)"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-slate-700/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setEditingReminder(null)
                }}
                className="bg-slate-800 hover:bg-slate-700 border-slate-700"
              >
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingReminder ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Atualizar Lembrete
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Criar Lembrete
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Componente de ícone de usuário
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// Componente de ícone de busca
function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
