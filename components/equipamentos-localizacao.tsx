"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, MapPin, Truck, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Equipamento {
  id: string
  numero_frota: string
  categoria: string
  localizacao: string
  servico: string
  status: string
  created_at: string
  updated_at: string
}

const categorias = [
  "PIPAS ÁGUA BRUTA",
  "PIPAS ÁGUA LIMPA/TANQUES",
  "MUNCK DISPONÍVEL",
  "CAÇAMBAS DISPONÍVEIS",
  "CAVALOS / PRANCHAS / VINHAÇA LOCALIZADA",
  "COLETA / VIAGEM",
  "ÁREAS DE VIVÊNCIA",
  "CARRETAS RTK / GPS",
  "REBOQUE MUDA",
  "VEÍCULOS",
]

export function EquipamentosLocalizacao() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [filteredEquipamentos, setFilteredEquipamentos] = useState<Equipamento[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    numero_frota: "",
    categoria: "",
    localizacao: "",
    servico: "",
    status: "ATIVO",
  })

  const supabase = createClient()

  // Carregar equipamentos do banco
  const loadEquipamentos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("equipamentos_localizacao")
        .select("*")
        .order("categoria", { ascending: true })
        .order("numero_frota", { ascending: true })

      if (error) throw error

      setEquipamentos(data || [])
      setFilteredEquipamentos(data || [])
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar equipamentos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEquipamentos()
  }, [])

  // Filtrar equipamentos
  useEffect(() => {
    let filtered = equipamentos

    if (searchTerm) {
      filtered = filtered.filter(
        (eq) =>
          eq.numero_frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eq.localizacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eq.servico.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((eq) => eq.categoria === selectedCategory)
    }

    setFilteredEquipamentos(filtered)
  }, [equipamentos, searchTerm, selectedCategory])

  // Adicionar/Editar equipamento
  const handleSubmit = async () => {
    try {
      if (editingEquipamento) {
        const { error } = await supabase
          .from("equipamentos_localizacao")
          .update({
            numero_frota: formData.numero_frota,
            categoria: formData.categoria,
            localizacao: formData.localizacao,
            servico: formData.servico,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEquipamento.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso!",
        })
      } else {
        const { error } = await supabase.from("equipamentos_localizacao").insert([
          {
            numero_frota: formData.numero_frota,
            categoria: formData.categoria,
            localizacao: formData.localizacao,
            servico: formData.servico,
            status: formData.status,
          },
        ])

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Equipamento adicionado com sucesso!",
        })
      }

      setIsAddDialogOpen(false)
      setEditingEquipamento(null)
      setFormData({
        numero_frota: "",
        categoria: "",
        localizacao: "",
        servico: "",
        status: "ATIVO",
      })
      loadEquipamentos()
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar equipamento",
        variant: "destructive",
      })
    }
  }

  // Excluir equipamento
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("equipamentos_localizacao").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Equipamento excluído com sucesso!",
      })
      loadEquipamentos()
    } catch (error) {
      console.error("Erro ao excluir equipamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir equipamento",
        variant: "destructive",
      })
    }
  }

  // Abrir dialog de edição
  const handleEdit = (equipamento: Equipamento) => {
    setEditingEquipamento(equipamento)
    setFormData({
      numero_frota: equipamento.numero_frota,
      categoria: equipamento.categoria,
      localizacao: equipamento.localizacao,
      servico: equipamento.servico,
      status: equipamento.status,
    })
    setIsAddDialogOpen(true)
  }

  // Agrupar equipamentos por categoria
  const equipamentosPorCategoria = categorias.reduce(
    (acc, categoria) => {
      acc[categoria] = filteredEquipamentos.filter((eq) => eq.categoria === categoria)
      return acc
    },
    {} as Record<string, Equipamento[]>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Carregando equipamentos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar por frota, localização ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[250px] bg-slate-800 border-slate-700 text-slate-100">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">
                {editingEquipamento ? "Editar Equipamento" : "Adicionar Equipamento"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingEquipamento
                  ? "Edite as informações do equipamento"
                  : "Adicione um novo equipamento à localização"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numero_frota" className="text-right text-slate-300">
                  Número da Frota
                </Label>
                <Input
                  id="numero_frota"
                  value={formData.numero_frota}
                  onChange={(e) => setFormData({ ...formData, numero_frota: e.target.value })}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100"
                  placeholder="Ex: 4575"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria" className="text-right text-slate-300">
                  Categoria
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="localizacao" className="text-right text-slate-300">
                  Localização
                </Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100"
                  placeholder="Ex: Pátio Usina"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="servico" className="text-right text-slate-300">
                  Serviço/Observações
                </Label>
                <Textarea
                  id="servico"
                  value={formData.servico}
                  onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100"
                  placeholder="Ex: Molhando trajeto fundo 14 até 24"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right text-slate-300">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">ATIVO</SelectItem>
                    <SelectItem value="INATIVO">INATIVO</SelectItem>
                    <SelectItem value="MANUTENÇÃO">MANUTENÇÃO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setEditingEquipamento(null)
                  setFormData({
                    numero_frota: "",
                    categoria: "",
                    localizacao: "",
                    servico: "",
                    status: "ATIVO",
                  })
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                {editingEquipamento ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Equipamentos por Categoria */}
      <div className="space-y-6">
        {categorias.map((categoria) => {
          const equipamentosCategoria = equipamentosPorCategoria[categoria]

          if (equipamentosCategoria.length === 0 && selectedCategory !== "all" && selectedCategory !== categoria) {
            return null
          }

          return (
            <Card key={categoria} className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-green-400 uppercase">@ {categoria}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                      {equipamentosCategoria.length} equipamentos
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                          onClick={() => {
                            setFormData({
                              numero_frota: "",
                              categoria: categoria,
                              localizacao: "",
                              servico: "",
                              status: "ATIVO",
                            })
                            setEditingEquipamento(null)
                            setIsAddDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {equipamentosCategoria.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum equipamento nesta categoria</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {equipamentosCategoria.map((equipamento) => (
                      <div
                        key={equipamento.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-400" />
                            <span className="font-bold text-green-400 text-lg">{equipamento.numero_frota}</span>
                          </div>
                          <div className="text-slate-300">
                            <span className="font-medium">{equipamento.localizacao}</span>
                            {equipamento.servico && <span className="text-slate-400"> – {equipamento.servico}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={equipamento.status === "ATIVO" ? "default" : "secondary"}
                            className={
                              equipamento.status === "ATIVO"
                                ? "bg-green-600 text-white"
                                : equipamento.status === "MANUTENÇÃO"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-red-600 text-white"
                            }
                          >
                            {equipamento.status}
                          </Badge>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(equipamento)}
                            className="text-slate-400 hover:text-slate-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(equipamento.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
