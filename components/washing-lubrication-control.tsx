"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Droplets,
  Wrench,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  CheckCircle,
  AlertTriangle,
  Car,
  Truck,
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

interface WashingRecord {
  id: string
  vehicleId: string
  vehicleName: string
  vehicleType: "car" | "truck"
  serviceType: "washing" | "lubrication" | "both"
  date: string
  time: string
  responsible: string
  notes?: string
  status: "scheduled" | "in-progress" | "completed"
  createdAt: string
  updatedAt: string
}

interface WashingLubricationControlProps {
  initialWashingTime: number
  initialLubricationTime: number
  onWashingTimeChange: (time: number) => void
  onLubricationTimeChange: (time: number) => void
}

const WashingLubricationControl: React.FC<WashingLubricationControlProps> = ({
  initialWashingTime,
  initialLubricationTime,
  onWashingTimeChange,
  onLubricationTimeChange,
}) => {
  const [washingTime, setWashingTime] = useState(initialWashingTime)
  const [lubricationTime, setLubricationTime] = useState(initialLubricationTime)
  const [records, setRecords] = useState<WashingRecord[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<WashingRecord | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setWashingTime(initialWashingTime)
  }, [initialWashingTime])

  useEffect(() => {
    setLubricationTime(initialLubricationTime)
  }, [initialLubricationTime])

  // Mock data for demonstration
  useEffect(() => {
    const mockRecords: WashingRecord[] = [
      {
        id: "1",
        vehicleId: "V001",
        vehicleName: "Toyota Hilux - ABC-1234",
        vehicleType: "car",
        serviceType: "both",
        date: "2024-01-15",
        time: "09:00",
        responsible: "João Silva",
        notes: "Lavagem completa e troca de óleo",
        status: "completed",
        createdAt: "2024-01-14T10:00:00Z",
        updatedAt: "2024-01-15T09:30:00Z",
      },
      {
        id: "2",
        vehicleId: "V002",
        vehicleName: "Mercedes Atego - DEF-5678",
        vehicleType: "truck",
        serviceType: "washing",
        date: "2024-01-16",
        time: "14:00",
        responsible: "Carlos Oliveira",
        status: "scheduled",
        createdAt: "2024-01-15T08:00:00Z",
        updatedAt: "2024-01-15T08:00:00Z",
      },
      {
        id: "3",
        vehicleId: "V003",
        vehicleName: "Volvo FH - GHI-9012",
        vehicleType: "truck",
        serviceType: "lubrication",
        date: "2024-01-16",
        time: "10:30",
        responsible: "Maria Santos",
        notes: "Lubrificação preventiva",
        status: "in-progress",
        createdAt: "2024-01-15T12:00:00Z",
        updatedAt: "2024-01-16T10:30:00Z",
      },
    ]
    setRecords(mockRecords)
  }, [])

  const handleWashingTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number.parseInt(event.target.value, 10)
    setWashingTime(newTime)
    onWashingTimeChange(newTime)
  }

  const handleLubricationTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number.parseInt(event.target.value, 10)
    setLubricationTime(newTime)
    onLubricationTimeChange(newTime)
  }

  // Filter records based on active tab and search term
  const filteredRecords = records.filter((record) => {
    // Filter by status
    if (activeTab !== "all" && record.status !== activeTab) {
      return false
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        record.vehicleName.toLowerCase().includes(searchLower) ||
        record.responsible.toLowerCase().includes(searchLower) ||
        record.serviceType.toLowerCase().includes(searchLower) ||
        (record.notes && record.notes.toLowerCase().includes(searchLower))
      )
    }

    return true
  })

  // Sort records by date and time
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}:00`).getTime()
    const dateTimeB = new Date(`${b.date}T${b.time}:00`).getTime()
    return dateTimeB - dateTimeA
  })

  // Get service type display name
  const getServiceTypeName = (type: string) => {
    switch (type) {
      case "washing":
        return "Lavagem"
      case "lubrication":
        return "Lubrificação"
      case "both":
        return "Lavagem + Lubrificação"
      default:
        return type
    }
  }

  // Get service type color
  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case "washing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "lubrication":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "both":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Get status display name
  const getStatusName = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Agendado"
      case "in-progress":
        return "Em Andamento"
      case "completed":
        return "Concluído"
      default:
        return status
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "in-progress":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Get vehicle type icon
  const getVehicleTypeIcon = (type: string) => {
    return type === "car" ? <Car className="h-4 w-4" /> : <Truck className="h-4 w-4" />
  }

  // Add new record
  const addRecord = (recordData: Omit<WashingRecord, "id" | "createdAt" | "updatedAt">) => {
    const newRecord: WashingRecord = {
      ...recordData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setRecords((prev) => [newRecord, ...prev])
    setIsDialogOpen(false)
  }

  // Update existing record
  const updateRecord = (updatedRecordData: WashingRecord) => {
    const updatedRecord = {
      ...updatedRecordData,
      updatedAt: new Date().toISOString(),
    }

    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)))
    setIsDialogOpen(false)
    setEditingRecord(null)
  }

  // Delete record
  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  // Count records by status
  const recordCounts = {
    all: records.length,
    scheduled: records.filter((r) => r.status === "scheduled").length,
    "in-progress": records.filter((r) => r.status === "in-progress").length,
    completed: records.filter((r) => r.status === "completed").length,
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
            <Droplets className="mr-2 h-5 w-5 text-blue-500" />
            Controle de Lavagem e Lubrificação
          </CardTitle>
          <Button
            onClick={() => {
              setEditingRecord(null)
              setIsDialogOpen(true)
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Registro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters and search */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-800/50 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 data-[state=active]:text-blue-400">
                  Todos <Badge className="ml-1 bg-slate-700">{recordCounts.all}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-blue-400"
                >
                  Agendados <Badge className="ml-1 bg-blue-900/30 text-blue-400">{recordCounts.scheduled}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="in-progress"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-amber-400"
                >
                  Em Andamento{" "}
                  <Badge className="ml-1 bg-amber-900/30 text-amber-400">{recordCounts["in-progress"]}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-green-400"
                >
                  Concluídos <Badge className="ml-1 bg-green-900/30 text-green-400">{recordCounts.completed}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative">
              <Input
                placeholder="Buscar registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Records list */}
          <div className="space-y-3">
            {sortedRecords.length > 0 ? (
              sortedRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-slate-800/50 rounded-md p-4 border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center text-slate-200 font-medium">
                          {getVehicleTypeIcon(record.vehicleType)}
                          <span className="ml-2">{record.vehicleName}</span>
                        </div>
                        <Badge className={getServiceTypeColor(record.serviceType)}>
                          {record.serviceType === "washing" ? (
                            <Droplets className="h-3 w-3 mr-1" />
                          ) : record.serviceType === "lubrication" ? (
                            <Wrench className="h-3 w-3 mr-1" />
                          ) : (
                            <>
                              <Droplets className="h-3 w-3 mr-1" />
                              <Wrench className="h-3 w-3" />
                            </>
                          )}
                          <span className="ml-1">{getServiceTypeName(record.serviceType)}</span>
                        </Badge>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status === "completed" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : record.status === "in-progress" ? (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          <span className="ml-1">{getStatusName(record.status)}</span>
                        </Badge>
                      </div>
                      {record.notes && <p className="text-slate-400 text-sm mb-3">{record.notes}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(record.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {record.time}
                        </div>
                        <div className="flex items-center">
                          <span>Responsável: {record.responsible}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-500"
                        onClick={() => {
                          setEditingRecord(record)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-500"
                        onClick={() => deleteRecord(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500">
                <Droplets className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                <p className="text-lg">Nenhum registro encontrado</p>
                <p className="text-sm">
                  {searchTerm
                    ? "Tente ajustar seus filtros de busca"
                    : activeTab !== "all"
                      ? `Não há registros com status "${getStatusName(activeTab)}"`
                      : "Adicione um novo registro para começar"}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-slate-700/50 pt-4 flex justify-between">
        <div className="text-xs text-slate-500">
          Mostrando {sortedRecords.length} de {records.length} registros
        </div>
        <div className="flex space-x-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" /> Exportar Dados
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" /> Salvar Alterações
          </Button>
        </div>
      </CardFooter>

      {/* Dialog for adding/editing records */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Droplets className="mr-2 h-5 w-5 text-blue-500" />
              {editingRecord ? "Editar Registro" : "Novo Registro"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingRecord
                ? "Atualize os detalhes do registro de lavagem/lubrificação"
                : "Preencha os detalhes para criar um novo registro"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const recordData = {
                vehicleId: formData.get("vehicleId") as string,
                vehicleName: formData.get("vehicleName") as string,
                vehicleType: formData.get("vehicleType") as "car" | "truck",
                serviceType: formData.get("serviceType") as "washing" | "lubrication" | "both",
                date: formData.get("date") as string,
                time: formData.get("time") as string,
                responsible: formData.get("responsible") as string,
                notes: formData.get("notes") as string,
                status: formData.get("status") as "scheduled" | "in-progress" | "completed",
              }

              if (editingRecord) {
                updateRecord({
                  ...editingRecord,
                  ...recordData,
                })
              } else {
                addRecord(recordData)
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleId">ID do Veículo</Label>
                  <Input
                    id="vehicleId"
                    name="vehicleId"
                    defaultValue={editingRecord?.vehicleId || ""}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Tipo de Veículo</Label>
                  <Select name="vehicleType" defaultValue={editingRecord?.vehicleType || "car"}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="car">Carro</SelectItem>
                      <SelectItem value="truck">Caminhão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleName">Nome/Placa do Veículo</Label>
                <Input
                  id="vehicleName"
                  name="vehicleName"
                  defaultValue={editingRecord?.vehicleName || ""}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Serviço</Label>
                <Select name="serviceType" defaultValue={editingRecord?.serviceType || "washing"}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectItem value="washing">Lavagem</SelectItem>
                    <SelectItem value="lubrication">Lubrificação</SelectItem>
                    <SelectItem value="both">Lavagem + Lubrificação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={editingRecord?.date || format(new Date(), "yyyy-MM-dd")}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    defaultValue={editingRecord?.time || "09:00"}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input
                    id="responsible"
                    name="responsible"
                    defaultValue={editingRecord?.responsible || ""}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingRecord?.status || "scheduled"}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="in-progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingRecord?.notes || ""}
                  className="bg-slate-800 border-slate-700 min-h-[100px]"
                  placeholder="Observações adicionais (opcional)"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-slate-700/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setEditingRecord(null)
                }}
                className="bg-slate-800 hover:bg-slate-700 border-slate-700"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingRecord ? "Atualizar Registro" : "Criar Registro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Search icon component
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

export { WashingLubricationControl }
export default WashingLubricationControl
