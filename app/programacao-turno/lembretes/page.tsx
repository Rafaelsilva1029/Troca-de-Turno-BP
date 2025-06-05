"use client"
import { useState, useEffect } from "react"
import { PlusCircle, Filter, List, CheckCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { FuturisticCard } from "../components/futuristic-card"
import { mockReminders, reminderPriorities } from "../lib/data"
import type { Reminder, ReminderPriority } from "../lib/types"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { scheduleReminderNotification, requestNotificationPermission } from "../lib/notification-service"
import { Switch } from "@/components/ui/switch"

// ISR revalidation
export const revalidate = 10

const reminderFormSchema = z.object({
  title: z.string().min(3, "Título do lembrete é obrigatório"),
  description: z.string().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido (HH:MM)"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  priority: z.enum(reminderPriorities as [string, ...string[]], {
    errorMap: () => ({ message: "Selecione uma prioridade" }),
  }),
  notifyBeforeMinutes: z
    .enum(["0", "15", "30"])
    .optional()
    .transform((val) => (val ? (Number.parseInt(val) as 15 | 30) : undefined)),
})

type ReminderFormData = z.infer<typeof reminderFormSchema>

const combineDateTime = (dateStr: string, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const date = new Date(dateStr)
  date.setHours(hours, minutes, 0, 0)
  return date
}

export default function LembretesPage() {
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders)
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>(mockReminders)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPriority, setSelectedPriority] = useState<ReminderPriority | "all">("all")
  const [showViewed, setShowViewed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: "",
      description: "",
      time: new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }), // 1 hour from now
      date: new Date().toISOString().split("T")[0],
      priority: "Média",
      notifyBeforeMinutes: undefined,
    },
  })

  useEffect(() => {
    requestNotificationPermission() // Request on page load
  }, [])

  useEffect(() => {
    let result = reminders
    if (searchTerm) {
      result = result.filter((r) => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (selectedPriority !== "all") {
      result = result.filter((r) => r.priority === selectedPriority)
    }
    if (!showViewed) {
      result = result.filter((r) => !r.isViewed)
    }
    setFilteredReminders(result.sort((a, b) => a.time.getTime() - b.time.getTime()))
  }, [searchTerm, selectedPriority, showViewed, reminders])

  const openModalForEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    reset({
      title: reminder.title,
      description: reminder.description || "",
      time: reminder.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      date: reminder.time.toISOString().split("T")[0],
      priority: reminder.priority,
      notifyBeforeMinutes: reminder.notifyBeforeMinutes || undefined,
    })
    setIsModalOpen(true)
  }

  const openModalForNew = () => {
    setEditingReminder(null)
    reset()
    setIsModalOpen(true)
  }

  const onSubmit: SubmitHandler<ReminderFormData> = (data) => {
    const reminderTime = combineDateTime(data.date, data.time)
    const newReminder: Reminder = {
      id: editingReminder ? editingReminder.id : `rem${Date.now()}`,
      title: data.title,
      description: data.description,
      time: reminderTime,
      priority: data.priority as ReminderPriority,
      notifyBeforeMinutes: data.notifyBeforeMinutes,
      isViewed: editingReminder ? editingReminder.isViewed : false,
    }

    if (editingReminder) {
      setReminders(reminders.map((r) => (r.id === newReminder.id ? newReminder : r)))
    } else {
      setReminders([...reminders, newReminder])
    }

    // Schedule notification
    const notifyTime = newReminder.notifyBeforeMinutes
      ? new Date(newReminder.time.getTime() - newReminder.notifyBeforeMinutes * 60000)
      : newReminder.time
    scheduleReminderNotification(newReminder.title, notifyTime, newReminder.description)

    setIsModalOpen(false)
    reset()
  }

  const toggleViewed = (id: string) => {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, isViewed: !r.isViewed } : r)))
  }

  const handleExportCSV = () => {
    const headers = ["ID", "Título", "Descrição", "Horário", "Prioridade", "Visualizado", "Notificar Antes (min)"]
    const rows = filteredReminders.map((r) =>
      [
        r.id,
        r.title,
        r.description || "",
        r.time.toLocaleString(),
        r.priority,
        r.isViewed ? "Sim" : "Não",
        r.notifyBeforeMinutes || "N/A",
      ].join(","),
    )
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "lembretes.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-100">Sistema de Lembretes</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="border-slate-600 hover:bg-slate-700/50">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button
            onClick={openModalForNew}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Lembrete
          </Button>
        </div>
      </div>

      <FuturisticCard title="Filtros e Opções" icon={Filter} iconColorClass="text-slate-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700/50 border-slate-600 placeholder:text-slate-400 text-slate-100"
          />
          <Select
            value={selectedPriority}
            onValueChange={(value) => setSelectedPriority(value as ReminderPriority | "all")}
          >
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
              <SelectValue placeholder="Filtrar por Prioridade" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectItem value="all" className="hover:bg-slate-700">
                Todas as Prioridades
              </SelectItem>
              {reminderPriorities.map((p) => (
                <SelectItem key={p} value={p} className="hover:bg-slate-700">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 justify-self-start md:justify-self-end pt-2">
            <Switch
              id="showViewed"
              checked={showViewed}
              onCheckedChange={setShowViewed}
              className="data-[state=checked]:bg-green-500"
            />
            <Label htmlFor="showViewed" className="text-slate-300">
              Mostrar Visualizados
            </Label>
          </div>
        </div>
      </FuturisticCard>

      <FuturisticCard title="Lista de Lembretes" icon={List} iconColorClass="text-slate-300">
        <div className="space-y-3">
          {filteredReminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-4 rounded-lg border flex items-start gap-4 transition-all ${reminder.isViewed ? "bg-slate-700/30 border-slate-600/50 opacity-70" : "bg-slate-700/50 border-slate-600/70 hover:border-slate-500/80"}`}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleViewed(reminder.id)}
                className={`mt-1 flex-shrink-0 ${reminder.isViewed ? "text-green-400 hover:text-green-300" : "text-slate-500 hover:text-slate-300"}`}
              >
                {reminder.isViewed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 border-2 border-slate-500 rounded-full group-hover:border-slate-300" />
                )}
              </Button>
              <div className="flex-grow" onClick={() => openModalForEdit(reminder)} style={{ cursor: "pointer" }}>
                <div className="flex justify-between items-center">
                  <h3
                    className={`font-semibold ${reminder.isViewed ? "text-slate-400 line-through" : "text-slate-100"}`}
                  >
                    {reminder.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      reminder.priority === "Alta"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : reminder.priority === "Média"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    }`}
                  >
                    {reminder.priority}
                  </span>
                </div>
                <p className={`text-sm ${reminder.isViewed ? "text-slate-500" : "text-slate-400"}`}>
                  {reminder.time.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  {reminder.notifyBeforeMinutes && ` (Notificar ${reminder.notifyBeforeMinutes} min antes)`}
                </p>
                {reminder.description && (
                  <p className={`text-xs mt-1 ${reminder.isViewed ? "text-slate-600" : "text-slate-500"}`}>
                    {reminder.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openModalForEdit(reminder)
                }}
                className="text-amber-400 hover:text-amber-300 self-center"
              >
                Editar
              </Button>
            </div>
          ))}
          {filteredReminders.length === 0 && (
            <p className="text-center text-slate-400 py-8">Nenhum lembrete encontrado.</p>
          )}
        </div>
      </FuturisticCard>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-amber-400">
              {editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="title" className="text-slate-300">
                Título
              </Label>
              <Input id="title" {...register("title")} className="bg-slate-700/50 border-slate-600 mt-1" />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-slate-300">
                  Data
                </Label>
                <Input id="date" type="date" {...register("date")} className="bg-slate-700/50 border-slate-600 mt-1" />
                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <Label htmlFor="time" className="text-slate-300">
                  Hora
                </Label>
                <Input id="time" type="time" {...register("time")} className="bg-slate-700/50 border-slate-600 mt-1" />
                {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority" className="text-slate-300">
                  Prioridade
                </Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="priority" className="bg-slate-700/50 border-slate-600 mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                        {reminderPriorities.map((p) => (
                          <SelectItem key={p} value={p} className="hover:bg-slate-700">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority.message}</p>}
              </div>
              <div>
                <Label htmlFor="notifyBeforeMinutes" className="text-slate-300">
                  Notificar Antes
                </Label>
                <Controller
                  name="notifyBeforeMinutes"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => field.onChange(val as unknown as 15 | 30 | undefined)}
                      defaultValue={field.value?.toString()}
                    >
                      <SelectTrigger id="notifyBeforeMinutes" className="bg-slate-700/50 border-slate-600 mt-1">
                        <SelectValue placeholder="Não notificar antes" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                        <SelectItem value="0" className="hover:bg-slate-700">
                          No horário
                        </SelectItem>
                        <SelectItem value="15" className="hover:bg-slate-700">
                          15 minutos antes
                        </SelectItem>
                        <SelectItem value="30" className="hover:bg-slate-700">
                          30 minutos antes
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-slate-300">
                Descrição (Opcional)
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                className="bg-slate-700/50 border-slate-600 mt-1"
              />
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-slate-600 hover:bg-slate-700/50">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                {editingReminder ? "Salvar Alterações" : "Criar Lembrete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
