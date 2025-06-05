"use client"
import { useState, useEffect } from "react"
import { PlusCircle, Filter, List, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { FuturisticCard } from "../components/futuristic-card"
import { mockBusSchedules, workFronts } from "../lib/data"
import type { BusSchedule, WorkFront } from "../lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// ISR revalidation
export const revalidate = 10

const busScheduleFormSchema = z.object({
  workFront: z.enum(workFronts as [string, ...string[]], {
    errorMap: () => ({ message: "Selecione uma frente de trabalho" }),
  }),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido (HH:MM)"),
  arrivalTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido (HH:MM)")
    .optional()
    .or(z.literal("")),
  driverName: z.string().min(3, "Nome do motorista é obrigatório"),
  availableSeats: z.coerce.number().int().min(0, "Número de assentos inválido"),
  status: z.enum(["Programado", "Em Trânsito", "Concluído"]).optional(),
})

type BusScheduleFormData = z.infer<typeof busScheduleFormSchema>

export default function OnibusPage() {
  const [schedules, setSchedules] = useState<BusSchedule[]>(mockBusSchedules)
  const [filteredSchedules, setFilteredSchedules] = useState<BusSchedule[]>(mockBusSchedules)
  const [searchTerm, setSearchTerm] = useState("") // For driver name
  const [selectedWorkFront, setSelectedWorkFront] = useState<WorkFront | "all">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<BusSchedule | null>(null)

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<BusScheduleFormData>({
    resolver: zodResolver(busScheduleFormSchema),
    defaultValues: {
      workFront: undefined,
      departureTime: "06:00",
      arrivalTime: "17:00",
      driverName: "",
      availableSeats: 20,
      status: "Programado",
    },
  })

  useEffect(() => {
    let result = schedules
    if (searchTerm) {
      result = result.filter((s) => s.driverName.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (selectedWorkFront !== "all") {
      result = result.filter((s) => s.workFront === selectedWorkFront)
    }
    setFilteredSchedules(result.sort((a, b) => a.departureTime.localeCompare(b.departureTime)))
  }, [searchTerm, selectedWorkFront, schedules])

  const openModalForEdit = (schedule: BusSchedule) => {
    setEditingSchedule(schedule)
    reset({
      workFront: schedule.workFront,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime || "",
      driverName: schedule.driverName,
      availableSeats: schedule.availableSeats,
      status: schedule.status || "Programado",
    })
    setIsModalOpen(true)
  }

  const openModalForNew = () => {
    setEditingSchedule(null)
    reset()
    setIsModalOpen(true)
  }

  const onSubmit: SubmitHandler<BusScheduleFormData> = (data) => {
    const newSchedule: BusSchedule = {
      id: editingSchedule ? editingSchedule.id : `bus${Date.now()}`,
      workFront: data.workFront as WorkFront,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime || undefined,
      driverName: data.driverName,
      availableSeats: data.availableSeats,
      status: data.status || "Programado",
    }

    if (editingSchedule) {
      setSchedules(schedules.map((s) => (s.id === newSchedule.id ? newSchedule : s)))
    } else {
      setSchedules([...schedules, newSchedule])
    }
    setIsModalOpen(false)
    reset()
  }

  const handleExportCSV = () => {
    const headers = ["ID", "Frente de Trabalho", "Partida", "Chegada Prev.", "Motorista", "Assentos Disp.", "Status"]
    const rows = filteredSchedules.map((s) =>
      [
        s.id,
        s.workFront,
        s.departureTime,
        s.arrivalTime || "N/A",
        s.driverName,
        s.availableSeats,
        s.status || "Programado",
      ].join(","),
    )
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "horarios_onibus.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-100">Horários dos Ônibus</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="border-slate-600 hover:bg-slate-700/50">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button
            onClick={openModalForNew}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Horário
          </Button>
        </div>
      </div>

      <FuturisticCard title="Filtros" icon={Filter} iconColorClass="text-slate-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Buscar por motorista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700/50 border-slate-600 placeholder:text-slate-400 text-slate-100"
          />
          <Select value={selectedWorkFront} onValueChange={(value) => setSelectedWorkFront(value as WorkFront | "all")}>
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
        </div>
      </FuturisticCard>

      <FuturisticCard title="Tabela de Horários" icon={List} iconColorClass="text-slate-300">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/30">
                <TableHead className="text-slate-300">Frente</TableHead>
                <TableHead className="text-slate-300">Partida</TableHead>
                <TableHead className="text-slate-300">Chegada Prev.</TableHead>
                <TableHead className="text-slate-300">Motorista</TableHead>
                <TableHead className="text-slate-300">Assentos</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((s) => (
                <TableRow
                  key={s.id}
                  className="border-slate-700/50 hover:bg-slate-700/20"
                  onClick={() => openModalForEdit(s)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell className="font-medium text-slate-100">{s.workFront}</TableCell>
                  <TableCell className="text-slate-300">{s.departureTime}</TableCell>
                  <TableCell className="text-slate-300">{s.arrivalTime || "N/A"}</TableCell>
                  <TableCell className="text-slate-300">{s.driverName}</TableCell>
                  <TableCell className="text-slate-300">{s.availableSeats}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        s.status === "Programado"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : s.status === "Em Trânsito"
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30" // Concluído
                      }`}
                    >
                      {s.status || "Programado"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openModalForEdit(s)
                      }}
                      className="text-orange-400 hover:text-orange-300"
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredSchedules.length === 0 && (
            <p className="text-center text-slate-400 py-8">Nenhum horário encontrado.</p>
          )}
        </div>
      </FuturisticCard>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-orange-400">
              {editingSchedule ? "Editar Horário" : "Novo Horário de Ônibus"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="busWorkFront" className="text-slate-300">
                Frente de Trabalho
              </Label>
              <Controller
                name="workFront"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="busWorkFront" className="bg-slate-700/50 border-slate-600 mt-1">
                      <SelectValue placeholder="Selecione" />
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
                <Label htmlFor="departureTime" className="text-slate-300">
                  Horário Partida
                </Label>
                <Input
                  id="departureTime"
                  type="time"
                  {...register("departureTime")}
                  className="bg-slate-700/50 border-slate-600 mt-1"
                />
                {errors.departureTime && <p className="text-red-400 text-xs mt-1">{errors.departureTime.message}</p>}
              </div>
              <div>
                <Label htmlFor="arrivalTime" className="text-slate-300">
                  Horário Chegada (Opcional)
                </Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  {...register("arrivalTime")}
                  className="bg-slate-700/50 border-slate-600 mt-1"
                />
                {errors.arrivalTime && <p className="text-red-400 text-xs mt-1">{errors.arrivalTime.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driverName" className="text-slate-300">
                  Nome do Motorista
                </Label>
                <Input id="driverName" {...register("driverName")} className="bg-slate-700/50 border-slate-600 mt-1" />
                {errors.driverName && <p className="text-red-400 text-xs mt-1">{errors.driverName.message}</p>}
              </div>
              <div>
                <Label htmlFor="availableSeats" className="text-slate-300">
                  Assentos Disponíveis
                </Label>
                <Input
                  id="availableSeats"
                  type="number"
                  {...register("availableSeats")}
                  className="bg-slate-700/50 border-slate-600 mt-1"
                />
                {errors.availableSeats && <p className="text-red-400 text-xs mt-1">{errors.availableSeats.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="busStatus" className="text-slate-300">
                Status
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="busStatus" className="bg-slate-700/50 border-slate-600 mt-1">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      {(["Programado", "Em Trânsito", "Concluído"] as BusSchedule["status"][]).map((s) => (
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
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-slate-600 hover:bg-slate-700/50">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white"
              >
                {editingSchedule ? "Salvar Alterações" : "Adicionar Horário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
