"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Search, Plus, Edit, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Equipamento {
  id: string
  numero_frota: string
  categoria: string
  localizacao: string
  servico: string | null
  status: string
  created_at: string
  updated_at: string
}

const categorias = [
  "PIPAS ÁGUA BRUTA",
  "PIPAS ÁGUA TRATADA",
  "MUNCK DISPONÍVEL",
  "CAÇAMBAS DISPONÍVEIS",
  "VEÍCULOS",
  "TRATORES",
  "MOTONIVELADORAS",
  "ESCAVADEIRAS",
  "CARREGADEIRAS",
  "OUTROS",
]

const statusOptions = ["ATIVO", "MANUTENÇÃO", "INATIVO", "RESERVA"]

export function EquipamentosLocalizacaoClient() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [filteredEquipamentos, setFilteredEquipamentos] = useState<Equipamento[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>("PIPAS ÁGUA BRUTA") // Updated default value
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentEquipamento, setCurrentEquipamento] = useState<Equipamento | null>(null)
  const [formData, setFormData] = useState({
    numero_frota: "",
    categoria: "PIPAS ÁGUA BRUTA",
    localizacao: "",
    servico: "",
    status: "ATIVO",
  })

  const { toast } = useToast()
  const supabase = createClient()

  // Carregar equipamentos
  useEffect(() => {
    async function fetchEquipamentos() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("equipamentos_localizacao")
          .select("*")
          .order("categoria", { ascending: true })
          .order("numero_frota", { ascending: true })

        if (error) {
          console.error("Erro Supabase:", error)
          throw error
        }

        console.log("Equipamentos carregados:", data)
        setEquipamentos(data || [])
        setFilteredEquipamentos(data || [])
      } catch (error) {
        console.error("Erro ao carregar equipamentos:", error)
        toast({
          title: "Erro ao carregar equipamentos",
          description: "Não foi possível carregar os equipamentos. Tente novamente mais tarde.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEquipamentos()
  }, [supabase, toast])

  // Filtrar equipamentos
  useEffect(() => {
    let filtered = equipamentos

    if (searchTerm) {
      filtered = filtered.filter(
        (eq) =>
          eq.numero_frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eq.localizacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (eq.servico && eq.servico.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (categoriaFiltro) {
      filtered = filtered.filter((eq) => eq.categoria === categoriaFiltro)
    }

    setFilteredEquipamentos(filtered)
  }, [searchTerm, categoriaFiltro, equipamentos])

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      numero_frota: "",
      categoria: "PIPAS ÁGUA BRUTA",
      localizacao: "",
      servico: "",
      status: "ATIVO",
    })
    setIsEditMode(false)
    setCurrentEquipamento(null)
  }

  // Abrir formulário para edição
  const handleEdit = (equipamento: Equipamento) => {
    setCurrentEquipamento(equipamento)
    setFormData({
      numero_frota: equipamento.numero_frota,
      categoria: equipamento.categoria,
      localizacao: equipamento.localizacao,
      servico: equipamento.servico || "",
      status: equipamento.status,
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  // Excluir equipamento
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este equipamento?")) return

    try {
      const { error } = await supabase.from("equipamentos_localizacao").delete().eq("id", id)

      if (error) {
        throw error
      }

      setEquipamentos((prev) => prev.filter((eq) => eq.id !== id))
      toast({
        title: "Equipamento excluído",
        description: "O equipamento foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir equipamento:", error)
      toast({
        title: "Erro ao excluir equipamento",
        description: "Não foi possível excluir o equipamento. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  // Salvar equipamento (criar ou atualizar)
  const handleSave = async () => {
    try {
      // Validação básica
      if (!formData.numero_frota || !formData.categoria || !formData.localizacao) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive",
        })
        return
      }

      if (isEditMode && currentEquipamento) {
        // Atualizar equipamento existente
        const { data, error } = await supabase
          .from("equipamentos_localizacao")
          .update({
            numero_frota: formData.numero_frota,
            categoria: formData.categoria,
            localizacao: formData.localizacao,
            servico: formData.servico || null,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEquipamento.id)
          .select()

        if (error) {
          throw error
        }

        setEquipamentos((prev) => prev.map((eq) => (eq.id === currentEquipamento.id ? { ...data[0] } : eq)))

        toast({
          title: "Equipamento atualizado",
          description: "As informações do equipamento foram atualizadas com sucesso.",
        })
      } else {
        // Criar novo equipamento
        const { data, error } = await supabase
          .from("equipamentos_localizacao")
          .insert({
            numero_frota: formData.numero_frota,
            categoria: formData.categoria,
            localizacao: formData.localizacao,
            servico: formData.servico || null,
            status: formData.status,
          })
          .select()

        if (error) {
          throw error
        }

        setEquipamentos((prev) => [...prev, data[0]])

        toast({
          title: "Equipamento adicionado",
          description: "O equipamento foi adicionado com sucesso.",
        })
      }

      // Fechar diálogo e resetar formulário
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error)
      toast({
        title: "Erro ao salvar equipamento",
        description: "Não foi possível salvar o equipamento. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  // Agrupar equipamentos por categoria
  const equipamentosPorCategoria = categorias.map((categoria) => {
    return {
      categoria,
      equipamentos: filteredEquipamentos.filter((eq) => eq.categoria === categoria),
    }
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header com indicador visual */}
      <div className="border-l-4 border-green-500 pl-4">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
          <MapPin className="h-8 w-8 text-green-500" />
          Equipamentos Localização
        </h1>
        <p className="text-slate-400 mt-2">Gerencie a localização e status dos equipamentos por categoria</p>
        <div className="mt-2 text-sm text-green-400">✓ Módulo carregado com sucesso</div>
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800 p-4 rounded-lg">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Buscar equipamento, localização..."
              className="pl-8 bg-slate-700 border-slate-600 text-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={categoriaFiltro || ""} onValueChange={(value) => setCategoriaFiltro(value || null)}>
            <SelectTrigger className="w-[200px] bg-slate-700 border-slate-600 text-slate-100">
              <SelectValue placeholder="Todas categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">
                {isEditMode ? "Editar Equipamento" : "Adicionar Equipamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numero_frota" className="text-right text-slate-300">
                  Nº Frota*
                </Label>
                <Input
                  id="numero_frota"
                  value={formData.numero_frota}
                  onChange={(e) => setFormData({ ...formData, numero_frota: e.target.value })}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria" className="text-right text-slate-300">
                  Categoria*
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="localizacao" className="text-right text-slate-300">
                  Localização*
                </Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="servico" className="text-right text-slate-300">
                  Serviço
                </Label>
                <Textarea
                  id="servico"
                  value={formData.servico}
                  onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100"
                  rows={3}
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
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                {isEditMode ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estado de carregamento */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}

      {/* Mensagem quando não há equipamentos */}
      {!isLoading && filteredEquipamentos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-medium text-slate-200">Nenhum equipamento encontrado</h3>
          <p className="text-slate-400 mt-2 max-w-md">
            {searchTerm || categoriaFiltro
              ? "Nenhum equipamento corresponde aos filtros aplicados."
              : "Não há equipamentos cadastrados. Clique em 'Adicionar Equipamento' para começar."}
          </p>
        </div>
      )}

      {/* Lista de equipamentos por categoria */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipamentosPorCategoria
            .filter((grupo) => grupo.equipamentos.length > 0)
            .map((grupo) => (
              <Card key={grupo.categoria} className="overflow-hidden bg-slate-800 border-slate-700">
                <CardHeader className="bg-slate-700">
                  <CardTitle className="flex items-center text-lg text-slate-100">
                    <MapPin className="h-5 w-5 mr-2 text-green-400" />
                    {grupo.categoria} ({grupo.equipamentos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-600">
                    {grupo.equipamentos.map((eq) => (
                      <div key={eq.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-slate-200">
                              Frota: <span className="text-green-400">{eq.numero_frota}</span>
                            </h4>
                            <p className="text-sm text-slate-300 mt-1">
                              <span className="font-medium">Localização:</span> {eq.localizacao}
                            </p>
                            {eq.servico && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{eq.servico}</p>}
                            <div
                              className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                                eq.status === "ATIVO"
                                  ? "bg-green-500/20 text-green-400"
                                  : eq.status === "MANUTENÇÃO"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {eq.status}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(eq)}
                              className="text-slate-400 hover:text-slate-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(eq.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
