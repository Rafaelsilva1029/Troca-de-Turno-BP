"use client"

import type React from "react"

import { useState } from "react"
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns"
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

type ReminderPriority = "baixa" | "media" | "alta" | "urgente"
type ReminderStatus = "pendente" | "concluido" | "atrasado" | "em-andamento"

interface Reminder {
  id: string
  title: string
  description: string
  dueDate: string
  dueTime: string
  priority: ReminderPriority
  status: ReminderStatus
  category: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

const initialReminders: Reminder[] = [
  {
    id: "1",
    title: "Manutenção preventiva caminhão L-001",
    description: "Realizar troca de óleo e filtros no caminhão L-001",
    dueDate: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    dueTime: "08:00",
    priority: "alta",
    status: "pendente",
    category: "manutenção",
    assignedTo: "Carlos Silva",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Verificar freios caminhão pipa P-003",
    description: "Verificar sistema de freios que está apresentando falhas",
    dueDate: format(addDays(new Date(), -1), "yyyy-MM-dd"),
    dueTime: "14:30",
    priority: "urgente",
    status: "atrasado",
    category: "manutenção",
    assignedTo: "Roberto Almeida",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Calibrar pneus da frota de veículos leves",
    description: "Calibrar todos os pneus dos veículos leves conforme especificação",
    dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    dueTime: "10:00",
    priority: "media",
    status: "em-andamento",
    category: "manutenção",
    assignedTo: "Paulo Mendes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Reunião com equipe de logística",
    description: "Discutir planejamento semanal de rotas",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    dueTime: "15:00",
    priority: "media",
    status: "pendente",
    category: "reunião",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Inspeção de segurança caminhões munck",
    description: "Realizar inspeção de segurança em todos os caminhões munck",
    dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    dueTime: "09:00",
    priority: "alta",
    status: "pendente",
    category: "segurança",
    assignedTo: "André Santos",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function ReminderSystem() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

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
    return isBefore(dueDateTime, now) && reminder.status !== "concluido"
  }

  // Função para verificar se um lembrete está próximo do prazo (menos de 24h)
  const isReminderNearDue = (reminder: Reminder) => {
    const now = new Date()
    const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}:00`)
    const oneDayFromNow = addDays(now, 1)
    return isAfter(dueDateTime, now) && isBefore(dueDateTime, oneDayFromNow) && reminder.status !== "concluido"
  }

  // Função para adicionar um novo lembrete
  const addReminder = (reminder: Omit<Reminder, "id" | "createdAt" | "updatedAt">) => {
    const newReminder: Reminder = {
      ...reminder,
      id: (reminders.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setReminders([...reminders, newReminder])
    setIsDialogOpen(false)
  }

  // Função para atualizar um lembrete existente
  const updateReminder = (updatedReminder: Reminder) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === updatedReminder.id ? { ...updatedReminder, updatedAt: new Date().toISOString() } : reminder,
      ),
    )
    setIsDialogOpen(false)
    setEditingReminder(null)
  }

  // Função para excluir um lembrete
  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id))
  }

  // Função para marcar um lembrete como concluído
  const markAsCompleted = (id: string) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              status: "concluido",
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : reminder,
      ),
    )
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

  // Contagem de lembretes por status
  const reminderCounts = {
    all: reminders.length,
    pendente: reminders.filter((r) => r.status === "pendente").length,
    "em-andamento": reminders.filter((r) => r.status === "em-andamento").length,
    concluido: reminders.filter((r) => r.status === "concluido").length,
    atrasado: reminders.filter((r) => r.status === "atrasado").length,
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
            <Bell className="mr-2 h-5 w-5 text-green-500" />
            Sistema de Lembretes
          </CardTitle>
          <Button
            onClick={() => {
              setEditingReminder(null)
              setIsDialogOpen(true)
            }}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Lembrete
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filtros e busca */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
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
                  Concluídos <Badge className="ml-1 bg-green-900/30 text-green-400">{reminderCounts.concluido}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="atrasado"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-red-400"
                >
                  Atrasados <Badge className="ml-1 bg-red-900/30 text-red-400">{reminderCounts.atrasado}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

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

          {/* Lista de lembretes */}
          <div className="space-y-3">
            {sortedReminders.length > 0 ? (
              sortedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`bg-slate-800/50 rounded-md p-4 border ${
                    isReminderOverdue(reminder)
                      ? "border-red-500/50"
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
                        className="h-8 w-8 text-slate-500 hover:text-red-500"
                        onClick={() => deleteReminder(reminder.id)}
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
        </div>
      </CardContent>
      <CardFooter className="border-t border-slate-700/50 pt-4 flex justify-between">
        <div className="text-xs text-slate-500">
          Mostrando {sortedReminders.length} de {reminders.length} lembretes
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
