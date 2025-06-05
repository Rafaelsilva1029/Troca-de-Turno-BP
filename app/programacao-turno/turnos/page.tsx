"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { CalendarDays, PlusCircle, Filter, List, Download, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { FuturisticCard } from "../components/futuristic-card"
import { mockShifts, workFronts } from "../lib/data"
import type { Shift, WorkFront } from "../lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Calendar, dateFnsLocalizer, Views, type Event as CalendarEvent } from "react-big-calendar"
import format from "date-fns/format"
import parse from "date-fns/parse"
import startOfWeek from "date-fns/startOfWeek"
import getDay from "date-fns/getDay"
import enUS from "date-fns/locale/en-US" // Or your preferred locale
import ptBR from "date-fns/locale/pt-BR"

// Required for react-big-calendar
// import 'react-big-calendar/lib/css/react-big-calendar.css' // We are styling this in globals.css

// ISR revalidation
export const revalidate = 10

const locales = {
  "pt-BR": ptBR,
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
})

const shiftFormSchema = z.object({
  employeeName: z.string().min(3, "Nome do funcionário é obrigatório"),
  workFront: z.enum(workFronts as [string, ...string[]], {
    errorMap: () => ({ message: "Selecione uma frente de trabalho" }),
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido (HH:MM)"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido (HH:MM)"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  observations: z.string().optional(),
  status: z.enum(["Planejado", "Em Andamento", "Concluído", "Cancelado"]),
})

type ShiftFormData = z.infer<typeof shiftFormSchema>

const combineDateTime = (dateStr: string, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const date = new Date(dateStr)
  date.setHours(hours, minutes, 0, 0)
  return date
}

interface ShiftCalendarEvent extends CalendarEvent {
  resource?: Shift // Store original shift data
}

export default function TurnosPage() {
  const [shifts, setShifts] = useState<Shift[]>(mockShifts)
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>(mockShifts)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorkFront, setSelectedWorkFront] = useState<WorkFront | "all">("all")
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [calendarView, setCalendarView] = useState<keyof typeof Views>(Views.MONTH)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [isCalendarFullScreen, setIsCalendarFullScreen] = useState(false)

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      employeeName: "",
      workFront: undefined,
      startTime: "07:00",
      startDate: new Date().toISOString().split("T")[0],
      endTime: "16:00",
      endDate: new Date().toISOString().split("T")[0],
      observations: "",
      status: "Planejado",
    },
  })

  useEffect(() => {
    let result = shifts
    if (searchTerm) {
      result = result.filter((s) => s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (selectedWorkFront !== "all") {
      result = result.filter((s) => s.workFront === selectedWorkFront)
    }
    setFilteredShifts(result)
  }, [searchTerm, selectedWorkFront, shifts])

  const calendarEvents: ShiftCalendarEvent[] = useMemo(() => {
    return filteredShifts.map((shift) => ({
      title: `${shift.employeeName} (${shift.workFront})`,
      start: shift.startTime,
      end: shift.endTime,
      resource: shift, // Store original shift data
    }))
  }, [filteredShifts])

  const openModalForEdit = (shift: Shift) => {
    setEditingShift(shift)
    reset({
      employeeName: shift.employeeName,
      workFront: shift.workFront,
      startTime: format(shift.startTime, "HH:mm"),
      startDate: format(shift.startTime, "yyyy-MM-dd"),
      endTime: format(shift.endTime, "HH:mm"),
      endDate: format(shift.endTime, "yyyy-MM-dd"),
      observations: shift.observations || "",
      status: shift.status,
    })
    setIsModalOpen(true)
  }

  const openModalForNew = (slotInfo?: { start: Date; end: Date }) => {
    setEditingShift(null)
    const defaultStartDate = slotInfo?.start ? format(slotInfo.start, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
    const defaultStartTime = slotInfo?.start ? format(slotInfo.start, "HH:mm") : "07:00"
    const defaultEndDate = slotInfo?.end ? format(slotInfo.end, "yyyy-MM-dd") : defaultStartDate
    const defaultEndTime = slotInfo?.end ? format(slotInfo.end, "HH:mm") : "16:00"

    reset({
      employeeName: "",
      workFront: undefined,
      startTime: defaultStartTime,
      startDate: defaultStartDate,
      endTime: defaultEndTime,
      endDate: defaultEndDate,
      observations: "",
      status: "Planejado",
    })
    setIsModalOpen(true)
  }

  const onSubmit: SubmitHandler<ShiftFormData> = (data) => {
    const newShift: Shift = {
      id: editingShift ? editingShift.id : `shift${Date.now()}`,
      employeeName: data.employeeName,
      workFront: data.workFront as WorkFront,
      startTime: combineDateTime(data.startDate, data.startTime),
      endTime: combineDateTime(data.endDate, data.endTime),
      observations: data.observations,
      status: data.status,
    }

    if (editingShift) {
      setShifts(shifts.map((s) => (s.id === newShift.id ? newShift : s)))
    } else {
      setShifts([...shifts, newShift])
    }
    setIsModalOpen(false)
    reset()
  }

  const handleExportCSV = () => {
    const headers = ["ID", "Funcionário", "Frente de Trabalho", "Início", "Fim", "Status", "Observações"]
    const rows = filteredShifts.map((s) =>
      [
        s.id,
        s.employeeName,
        s.workFront,
        s.startTime.toLocaleString(),
        s.endTime.toLocaleString(),
        s.status,
        s.observations || "",
      ].join(","),
    )
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "turnos.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSelectEvent = useCallback(
    (event: ShiftCalendarEvent) => {
      if (event.resource) {
        openModalForEdit(event.resource)
      }
    },
    [reset],
  )

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; action: string }) => {
      // Only open modal if action is 'click' or 'doubleClick' on a slot, not 'select' (drag)
      if (slotInfo.action === "click" || slotInfo.action === "doubleClick") {
        openModalForNew(slotInfo)
      }
    },
    [reset],
  )

  const messages = {
    allDay: "Dia Inteiro",
    previous: "Anterior",
    next: "Próximo",
    today: "Hoje",
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    date: "Data",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "Não há eventos neste período.",
    showMore: (total: number) => `+ Ver mais (${total})`,
  }

  const eventStyleGetter = (event: ShiftCalendarEvent, start: Date, end: Date, isSelected: boolean) => {
    const newStyle: { backgroundColor?: string; borderColor?: string; color?: string; opacity?: number } = {
      backgroundColor: "#0ea5e9", // sky-500
      borderColor: "#0284c7", // sky-600
      color: "white",
      opacity: 0.9,
    }

    if (event.resource?.status === "Em Andamento") {
      newStyle.backgroundColor = "#22c55e" // green-500
      newStyle.borderColor = "#16a34a" // green-600
    } else if (event.resource?.status === "Concluído") {
      newStyle.backgroundColor = "#64748b" // slate-500
      newStyle.borderColor = "#475569" // slate-600
      newStyle.opacity = 0.7
    } else if (event.resource?.status === "Cancelado") {
      newStyle.backgroundColor = "#ef4444" // red-500
      newStyle.borderColor = "#dc2626" // red-600
      newStyle.opacity = 0.8
    }

    if (isSelected) {
      newStyle.backgroundColor = "#84cc16" // lime-500
      newStyle.borderColor = "#65a30d" // lime-600
    }
    return {
      style: newStyle,
    }
  }

  return (
    <div
      className={`space-y-6 ${isCalendarFullScreen ? "fixed inset-0 z-[100] bg-slate-900 p-4 overflow-y-auto" : ""}`}
    >
      {!isCalendarFullScreen && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-100">Gestão de Turnos</h1>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" className="border-slate-600 hover:bg-slate-700/50">
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </Button>
              <Button
                onClick={() => openModalForNew()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Turno
              </Button>
            </div>
          </div>

          <FuturisticCard title="Filtros e Visualização" icon={Filter} iconColorClass="text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input
                placeholder="Buscar por funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700/50 border-slate-600 placeholder:text-slate-400 text-slate-100"
              />
              <Select
                value={selectedWorkFront}
                onValueChange={(value) => setSelectedWorkFront(value as WorkFront | "all")}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Filtrar por Frente de Trabalho" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectItem value="all" className="hover:bg-slate-700">
                    Todas as Frentes
                  </SelectItem>
                  {workFronts.map((wf) => (
                    <SelectItem key={wf} value={wf} className="hover:bg-slate-700">
                      {wf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "table" ? "secondary" : "outline"}
                  onClick={() => setViewMode("table")}
                  className="w-full border-slate-600 hover:bg-slate-700/50 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
                >
                  <List className="mr-2 h-4 w-4" /> Tabela
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "secondary" : "outline"}
                  onClick={() => setViewMode("calendar")}
                  className="w-full border-slate-600 hover:bg-slate-700/50 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
                >
                  <CalendarDays className="mr-2 h-4 w-4" /> Calendário
                </Button>
              </div>
            </div>
          </FuturisticCard>
        </>
      )}

      {viewMode === "table" && !isCalendarFullScreen && (
        <FuturisticCard title="Lista de Turnos" icon={List} iconColorClass="text-slate-300">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/30">
                  <TableHead className="text-slate-300">Funcionário</TableHead>
                  <TableHead className="text-slate-300">Frente de Trabalho</TableHead>
                  <TableHead className="text-slate-300">Início</TableHead>
                  <TableHead className="text-slate-300">Fim</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.map((shift) => (
                  <TableRow
                    key={shift.id}
                    className="border-slate-700/50 hover:bg-slate-700/20"
                    onClick={() => openModalForEdit(shift)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell className="font-medium text-slate-100">{shift.employeeName}</TableCell>
                    <TableCell className="text-slate-300">{shift.workFront}</TableCell>
                    <TableCell className="text-slate-300">{shift.startTime.toLocaleString()}</TableCell>
                    <TableCell className="text-slate-300">{shift.endTime.toLocaleString()}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          shift.status === "Em Andamento"
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : shift.status === "Planejado"
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                              : shift.status === "Concluído"
                                ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {shift.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openModalForEdit(shift)
                        }}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredShifts.length === 0 && <p className="text-center text-slate-400 py-8">Nenhum turno encontrado.</p>}
          </div>
        </FuturisticCard>
      )}
      {viewMode === "calendar" && (
        <FuturisticCard
          title="Calendário de Turnos"
          icon={CalendarDays}
          iconColorClass="text-slate-300"
          headerActions={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCalendarFullScreen(!isCalendarFullScreen)}
              className="text-slate-400 hover:text-cyan-400"
              title={isCalendarFullScreen ? "Minimizar Calendário" : "Maximizar Calendário"}
            >
              {isCalendarFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          }
        >
          <div className="calendar-container">
            {" "}
            {/* Added container for height control */}
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }} // Ensure calendar fills container
              className="rbc-calendar" // Apply custom class for Tailwind styling
              view={calendarView}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              onView={(view) => setCalendarView(view as keyof typeof Views)}
              date={calendarDate}
              onNavigate={(date) => setCalendarDate(date)}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable // Allows selecting slots
              messages={messages}
              culture="pt-BR"
              eventPropGetter={eventStyleGetter}
              popup // Enables the overlay for "show more" events
              components={{
                toolbar: (toolbarProps) => {
                  return (
                    <div className="rbc-toolbar">
                      <span className="rbc-btn-group">
                        <button type="button" onClick={() => toolbarProps.onNavigate("TODAY")}>
                          Hoje
                        </button>
                        <button type="button" onClick={() => toolbarProps.onNavigate("PREV")}>
                          Anterior
                        </button>
                        <button type="button" onClick={() => toolbarProps.onNavigate("NEXT")}>
                          Próximo
                        </button>
                      </span>
                      <span className="rbc-toolbar-label">{toolbarProps.label}</span>
                      <span className="rbc-btn-group">
                        {toolbarProps.views.map((viewName) => (
                          <button
                            key={viewName}
                            type="button"
                            className={toolbarProps.view === viewName ? "rbc-active" : ""}
                            onClick={() => toolbarProps.onView(viewName as any)}
                          >
                            {(messages as any)[viewName.toLowerCase()] || viewName}
                          </button>
                        ))}
                      </span>
                    </div>
                  )
                },
              }}
            />
          </div>
        </FuturisticCard>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-cyan-400">{editingShift ? "Editar Turno" : "Novo Turno"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="employeeName" className="text-slate-300">
                Nome do Funcionário
              </Label>
              <Input
                id="employeeName"
                {...register("employeeName")}
                className="bg-slate-700/50 border-slate-600 mt-1"
              />
              {errors.employeeName && <p className="text-red-400 text-xs mt-1">{errors.employeeName.message}</p>}
            </div>
            <div>
              <Label htmlFor="workFront" className="text-slate-300">
                Frente de Trabalho
              </Label>
              <Controller
                name="workFront"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="workFront" className="bg-slate-700/50 border-slate-600 mt-1">
                      <SelectValue placeholder="Selecione a frente" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      {workFronts.map((wf) => (
                        <SelectItem key={wf} value={wf} className="hover:bg-slate-700">
                          {wf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.workFront && <p className="text-red-400 text-xs mt-1">{errors.workFront.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-slate-300">
                  Data Início
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className="bg-slate-700/50 border-slate-600 mt-1"
                />
                {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="startTime" className="text-slate-300">
                  Hora Início
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime")}
                  className="bg-slate-700/50 border-slate-600 mt-1"
                />
                {errors.startTime && <p className="text-red-400 text-xs mt-1">{errors.startTime.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate" className="text-slate-300">
                  Data Fim
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className="bg-slate-700/50 border-slate-600 mt-1"
                />
                {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="endTime" className="text-slate-300">
                  Hora Fim
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime")}
                  className="bg-slate-700/50 border-slate-600 mt-1"
                />
                {errors.endTime && <p className="text-red-400 text-xs mt-1">{errors.endTime.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="status" className="text-slate-300">
                Status
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="status" className="bg-slate-700/50 border-slate-600 mt-1">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      {(["Planejado", "Em Andamento", "Concluído", "Cancelado"] as Shift["status"][]).map((s) => (
                        <SelectItem key={s} value={s} className="hover:bg-slate-700">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-red-400 text-xs mt-1">{errors.status.message}</p>}
            </div>
            <div>
              <Label htmlFor="observations" className="text-slate-300">
                Observações
              </Label>
              <Textarea
                id="observations"
                {...register("observations")}
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
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {editingShift ? "Salvar Alterações" : "Criar Turno"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
