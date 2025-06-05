"use client"
import { useState, useEffect } from "react"
import { PlusCircle, Filter, List, Download, Tractor, LayoutGrid, AlertTriangle, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { FuturisticCard } from "../components/futuristic-card"
import { mockEquipment, equipmentCategories, equipmentStatuses, workFronts, equipmentStatusStyles } from "../lib/data"
import type { Equipment, EquipmentCategory, EquipmentStatus, WorkFront } from "../lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ISR revalidation
export const revalidate = 10

const equipmentFormSchema = z.object({
  name: z.string().min(3, "Nome do equipamento é obrigatório"),
  category: z.enum(equipmentCategories as [string, ...string[]], {
    errorMap: () => ({ message: "Selecione uma categoria" }),
  }),
  status: z.enum(equipmentStatuses as [string, ...string[]], { errorMap: () => ({ message: "Selecione um status" }) }),
  allocatedWorkFront: z
    .enum(workFronts as [string, ...string[]])
    .optional()
    .or(z.literal("")),
  observations: z.string().optional(),
})

type EquipmentFormData = z.infer<typeof equipmentFormSchema>

export default function EquipamentosPage() {
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipment)
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>(mockEquipment)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | "all">("all")
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | "all">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: "",
      category: undefined,
      status: "Disponível",
      allocatedWorkFront: "",
      observations: "",
    },
  })

  useEffect(() => {
    let result = equipments
    if (searchTerm) {
      result = result.filter((e) => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (selectedCategory !== "all") {
      result = result.filter((e) => e.category === selectedCategory)
    }
    if (selectedStatus !== "all") {
      result = result.filter((e) => e.status === selectedStatus)
    }
    setFilteredEquipments(result)
  }, [searchTerm, selectedCategory, selectedStatus, equipments])

  const openModalForEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    reset({
      name: equipment.name,
      category: equipment.category,
      status: equipment.status,
      allocatedWorkFront: equipment.allocatedWorkFront || "",
      observations: equipment.observations || "",
    })
    setIsModalOpen(true)
  }

  const openModalForNew = () => {
    setEditingEquipment(null)
    reset({
      // Reset with default values for new entry
      name: "",
      category: undefined,
      status: "Disponível",
      allocatedWorkFront: "",
      observations: "",
    })
    setIsModalOpen(true)
  }

  const onSubmit: SubmitHandler<EquipmentFormData> = (data) => {
    const newEquipment: Equipment = {
      id: editingEquipment ? editingEquipment.id : `eq${Date.now()}`,
      name: data.name,
      category: data.category as EquipmentCategory,
      status: data.status as EquipmentStatus,
      allocatedWorkFront: data.allocatedWorkFront ? (data.allocatedWorkFront as WorkFront) : undefined,
      observations: data.observations,
      transferHistory: editingEquipment?.transferHistory || [],
    }

    if (editingEquipment) {
      setEquipments(equipments.map((e) => (e.id === newEquipment.id ? newEquipment : e)))
    } else {
      setEquipments([...equipments, newEquipment])
    }
    setIsModalOpen(false)
  }

  const handleExportCSV = () => {
    const headers = ["ID", "Nome", "Categoria", "Status", "Frente Alocada", "Observações"]
    const rows = filteredEquipments.map((e) =>
      [e.id, e.name, e.category, e.status, e.allocatedWorkFront || "N/A", e.observations || ""].join(","),
    )
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "equipamentos.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderStatusBadge = (status: EquipmentStatus, isLarge = false) => {
    const style = equipmentStatusStyles[status]
    const Icon = style.icon || AlertTriangle

    if (isLarge) {
      return (
        <div className={cn("flex items-center gap-2 p-2 rounded-md", style.bgColor, style.borderColor)}>
          <Icon className={cn("h-5 w-5", style.iconColor)} />
          <span className={cn("font-semibold", style.textColor)}>{status}</span>
        </div>
      )
    }

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-full font-semibold inline-flex items-center gap-1",
                style.bgColor,
                style.textColor,
                style.borderColor,
              )}
            >
              <Icon className={cn("h-3 w-3", style.iconColor)} />
              {status}
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
            <p>{status}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-100">Controle de Equipamentos</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="border-slate-600 hover:bg-slate-700/50">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button
            onClick={openModalForNew}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Equipamento
          </Button>
        </div>
      </div>

      <FuturisticCard title="Filtros e Visualização" icon={Filter} iconColorClass="text-slate-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700/50 border-slate-600 placeholder:text-slate-400 text-slate-100"
          />
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as EquipmentCategory | "all")}
          >
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectItem value="all" className="hover:bg-slate-700">
                Todas as Categorias
              </SelectItem>
              {equipmentCategories.map((cat) => (
                <SelectItem key={cat} value={cat} className="hover:bg-slate-700">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as EquipmentStatus | "all")}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectItem value="all" className="hover:bg-slate-700">
                Todos os Status
              </SelectItem>
              {equipmentStatuses.map((st) => (
                <SelectItem key={st} value={st} className="hover:bg-slate-700">
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "secondary" : "outline"}
              onClick={() => setViewMode("table")}
              className="w-full border-slate-600 hover:bg-slate-700/50 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
            >
              <List className="mr-2 h-4 w-4" /> Tabela
            </Button>
            <Button
              variant={viewMode === "cards" ? "secondary" : "outline"}
              onClick={() => setViewMode("cards")}
              className="w-full border-slate-600 hover:bg-slate-700/50 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
            >
              <LayoutGrid className="mr-2 h-4 w-4" /> Cards
            </Button>
          </div>
        </div>
      </FuturisticCard>

      {viewMode === "table" && (
        <FuturisticCard title="Lista de Equipamentos" icon={List} iconColorClass="text-slate-300">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/30">
                  <TableHead className="text-slate-300">Nome</TableHead>
                  <TableHead className="text-slate-300">Categoria</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Frente Alocada</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipments.map((eq) => (
                  <TableRow
                    key={eq.id}
                    className="border-slate-700/50 hover:bg-slate-700/20 transition-colors duration-150"
                    onClick={() => openModalForEdit(eq)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell className="font-medium text-slate-100">{eq.name}</TableCell>
                    <TableCell className="text-slate-300">{eq.category}</TableCell>
                    <TableCell>{renderStatusBadge(eq.status)}</TableCell>
                    <TableCell className="text-slate-300">{eq.allocatedWorkFront || "N/A"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openModalForEdit(eq)
                        }}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Edit3 className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredEquipments.length === 0 && (
              <p className="text-center text-slate-400 py-8">Nenhum equipamento encontrado.</p>
            )}
          </div>
        </FuturisticCard>
      )}

      {viewMode === "cards" && (
        <FuturisticCard title="Equipamentos em Cards" icon={LayoutGrid} iconColorClass="text-slate-300">
          {filteredEquipments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredEquipments.map((eq) => {
                const statusStyle = equipmentStatusStyles[eq.status]
                const StatusIcon = statusStyle.icon || Tractor // Default to Tractor if no specific icon
                return (
                  <div
                    key={eq.id}
                    className={cn(
                      "rounded-lg border p-5 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]",
                      statusStyle.borderColor,
                      "bg-slate-800/60 backdrop-blur-sm",
                    )}
                    onClick={() => openModalForEdit(eq)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <StatusIcon className={cn("h-8 w-8", statusStyle.iconColor, "opacity-80")} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7", statusStyle.textColor, `hover:${statusStyle.textColor}/80`)}
                        onClick={(e) => {
                          e.stopPropagation()
                          openModalForEdit(eq)
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 truncate mb-1" title={eq.name}>
                      {eq.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-1">{eq.category}</p>

                    <div
                      className={cn(
                        "mt-3 mb-3 p-2 rounded-md flex items-center justify-center gap-2",
                        statusStyle.bgColor,
                        statusStyle.borderColor,
                      )}
                    >
                      <StatusIcon className={cn("h-4 w-4", statusStyle.iconColor)} />
                      <span className={cn("text-sm font-medium", statusStyle.textColor)}>{eq.status}</span>
                    </div>

                    {eq.allocatedWorkFront && (
                      <p className="text-xs text-slate-500 mb-1">
                        Frente: <span className="text-slate-400">{eq.allocatedWorkFront}</span>
                      </p>
                    )}
                    {eq.observations && (
                      <p className="text-xs text-slate-500 truncate" title={eq.observations}>
                        Obs: {eq.observations}
                      </p>
                    )}
                    {!eq.observations && !eq.allocatedWorkFront && (
                      <p className="text-xs text-slate-600 italic">Sem informações adicionais.</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">Nenhum equipamento encontrado.</p>
          )}
        </FuturisticCard>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-green-400">
              {editingEquipment ? "Editar Equipamento" : "Novo Equipamento"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">
                Nome do Equipamento
              </Label>
              <Input id="name" {...register("name")} className="bg-slate-700/50 border-slate-600 mt-1" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-slate-300">
                  Categoria
                </Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger id="category" className="bg-slate-700/50 border-slate-600 mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                        {equipmentCategories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="hover:bg-slate-700">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
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
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                        {equipmentStatuses.map((st) => (
                          <SelectItem key={st} value={st} className="hover:bg-slate-700">
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <p className="text-red-400 text-xs mt-1">{errors.status.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="allocatedWorkFront" className="text-slate-300">
                Frente de Trabalho Alocada (Opcional)
              </Label>
              <Controller
                name="allocatedWorkFront"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="allocatedWorkFront" className="bg-slate-700/50 border-slate-600 mt-1">
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="" className="hover:bg-slate-700">
                        Nenhuma
                      </SelectItem>
                      {workFronts.map((wf) => (
                        <SelectItem key={wf} value={wf} className="hover:bg-slate-700">
                          {wf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                {editingEquipment ? "Salvar Alterações" : "Adicionar Equipamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
