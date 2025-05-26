"use client"

import { useState, useEffect } from "react"
import { FuturisticLayout } from "@/components/futuristic-layout"
import { ParticleBackground } from "@/components/particle-background"
import { NotificationProvider } from "@/components/notification-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Truck,
  CheckCircle,
  BarChart3,
  AlertTriangle,
  Users,
  PenToolIcon as Tool,
  FileText,
  Car,
  Package,
  Droplets,
  Tractor,
  Construction,
  Loader,
  Leaf,
  SproutIcon as Seedling,
} from "lucide-react"
import { PendenciaSection } from "@/components/pendencia-section"
import { PendenciasRecentes } from "@/components/pendencias-recentes"
import { PendenciasLiberadas } from "@/components/pendencias-liberadas"
import { DashboardCharts } from "@/components/dashboard-charts"
import { WashingLubricationControl } from "@/components/washing-lubrication-control"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion } from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Save, Download, Search, Eye, Trash2, Edit } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LiberarPendenciaModal } from "@/components/liberar-pendencia-modal"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { useToast } from "@/hooks/use-toast"

// Create context for pendências data
import React from "react"

type PendenciasContextType = {
  pendenciasData: Record<string, string[]>
  updatePendenciasData: (category: string, pendencias: string[]) => void
  openReportModal: (category: string) => void
  openLiberarPendenciaModal: (category: string, description: string) => void
}

const PendenciasContext = React.createContext<PendenciasContextType | undefined>(undefined)

// Define vehicle types and their properties
type VehicleCategory =
  | "veiculos-leves"
  | "carga-seca"
  | "caminhao-pipa"
  | "caminhao-cavalos"
  | "caminhao-munck"
  | "caminhao-cacamba"
  | "caminhao-pranchas"
  | "caminhao-vinhaca"
  | "caminhao-muda"

interface Vehicle {
  id: string
  frota: string
  categoria: VehicleCategory
  placa: string
  modelo: string
  ano: string
  status: string
  ultimaManutencao?: string
  proximaManutencao?: string
  motorista?: string
  observacoes?: string
}

export default function TrocaDeTurno() {
  const { toast } = useToast()
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("programacao")
  const [programacaoTurno, setProgramacaoTurno] = useState<{ id: string; content: string }[]>([
    { id: "1", content: "Programação para Segunda-feira" },
    { id: "2", content: "Programação para Terça-feira" },
    { id: "3", content: "Programação para Quarta-feira" },
  ])

  // Vehicle state
  const [veiculosLogistica, setVeiculosLogistica] = useState<Vehicle[]>([])
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<VehicleCategory>("veiculos-leves")
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [reportType, setReportType] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [pendenciasData, setPendenciasData] = useState<Record<string, string[]>>({
    "veiculos-logistica": ["Veículo L-001 com problema no freio", "Veículo L-003 necessita troca de óleo"],
    "caminhoes-pipas": ["Caminhão P-002 com vazamento no tanque", "Caminhão P-005 com problema na bomba"],
    "caminhoes-munck": ["Munck M-001 com problema no sistema hidráulico"],
    "caminhoes-coletas": [
      "Caminhão C-001 com problema na compactação",
      "Caminhão C-003 necessita manutenção hidráulica",
    ],
    "carretas-pranchas-ls-outros": [
      "Carreta CR-001 com problema na suspensão",
      "Prancha PR-002 necessita manutenção no sistema hidráulico",
      "LS-003 com problema no engate",
    ],
    "caminhoes-prancha-vinhaca-muda": ["Prancha PR-003 com problema na suspensão"],
    "caminhoes-cacambas": ["Caçamba C-002 com problema na tampa traseira"],
    "trator-reboque": ["Trator TR-001 com problema no motor", "Reboque RB-002 necessita manutenção nos freios"],
    "area-de-vivencias": ["Área A-001 necessita manutenção no ar condicionado"],
    "carretinhas-rtk": ["Carretinha RTK-005 com problema na antena"],
    "tanques-e-dolly": ["Tanque T-003 com vazamento", "Dolly D-001 com problema no engate"],
    "carretas-canavieira": ["Carreta CAN-007 com problema na suspensão"],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncingDatabase, setIsSyncingDatabase] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [databaseError, setDatabaseError] = useState<string | null>(null)

  // Estado para o modal de liberação de pendência
  const [liberarPendenciaProps, setLiberarPendenciaProps] = useState<{
    isOpen: boolean
    category: string
    description: string
  }>({
    isOpen: false,
    category: "",
    description: "",
  })

  // Function to load all data from Supabase
  const loadAllDataFromDatabase = async () => {
    try {
      setIsSyncingDatabase(true)
      setDatabaseError(null)

      // Simulando carregamento de dados
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setLastSyncTime(new Date())
      toast({
        title: "Dados sincronizados",
        description: "Todos os dados foram atualizados com sucesso",
      })
    } catch (error) {
      console.error("Error loading data:", error)
      setDatabaseError("Erro ao carregar dados. Verifique sua conexão.")
      toast({
        title: "Erro de sincronização",
        description: "Não foi possível sincronizar os dados",
        variant: "destructive",
      })
    } finally {
      setIsSyncingDatabase(false)
    }
  }

  // Function to save pendencias data to Supabase
  const savePendenciasToDatabase = async () => {
    try {
      setIsSaving(true)
      setDatabaseError(null)

      // Simulando salvamento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setLastSyncTime(new Date())
      toast({
        title: "Pendências salvas",
        description: "Todas as pendências foram salvas com sucesso",
      })
    } catch (error) {
      console.error("Error saving pendencias:", error)
      setDatabaseError("Erro ao salvar pendências. Verifique sua conexão.")
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as pendências",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    // Simulate loading screen for a better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
      // Load data after loading screen is dismissed
      loadAllDataFromDatabase().catch((err) => {
        console.error("Failed to load initial data:", err)
        setDatabaseError("Falha ao carregar dados iniciais. Usando dados padrão.")
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Get category display name from slug
  const getCategoryName = (slug: string) => {
    const names: Record<string, string> = {
      "veiculos-logistica": "Veículos Logística",
      "caminhoes-pipas": "Caminhões Pipas",
      "caminhoes-munck": "Caminhões Munck",
      "caminhoes-coletas": "Caminhões Coletas",
      "carretas-pranchas-ls-outros": "Carretas / Pranchas / LS e outros",
      "caminhoes-prancha-vinhaca-muda": "Caminhões Prancha/Vinhaça/Muda",
      "caminhoes-cacambas": "Caminhões Caçambas",
      "trator-reboque": "Trator Reboque",
      "area-de-vivencias": "Área de Vivências",
      "carretinhas-rtk": "Carretinhas RTK",
      "tanques-e-dolly": "Tanques e Dolly",
      "carretas-canavieira": "Carretas Canavieira",
      // Vehicle categories
      "veiculos-leves": "Veículos Leves",
      "carga-seca": "Carga Seca",
      "caminhao-pipa": "Caminhão Pipa",
      "caminhao-cavalos": "Caminhão Cavalos",
      "caminhao-munck": "Caminhão Munck",
      "caminhao-cacamba": "Caminhão Caçamba",
      "caminhao-pranchas": "Caminhão Pranchas",
      "caminhao-vinhaca": "Caminhão Vinhaça",
      "caminhao-muda": "Caminhão Muda",
    }
    return names[slug] || slug
  }

  // Generate report content
  const generateReportContent = () => {
    if (reportType === "all") {
      return Object.entries(pendenciasData).map(([category, items]) => {
        const categoryName = getCategoryName(category)
        return (
          <div
            key={category}
            className="mb-8 bg-slate-800/70 rounded-lg border border-slate-700/50 overflow-hidden futuristic-card"
          >
            <h3 className="text-lg font-semibold tracking-wide text-green-400 p-3 bg-slate-800/90 border-b border-slate-700/50 flex items-center">
              <div className="w-1 h-6 bg-green-500 mr-2 rounded-full"></div>
              {categoryName}
              <Badge className="ml-2 bg-slate-700/50 text-slate-300 border-slate-600/50">
                {items.length} {items.length === 1 ? "item" : "itens"}
              </Badge>
            </h3>
            <div className="p-3">
              {items.length > 0 ? (
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <li
                      key={index}
                      className="text-slate-300 bg-slate-800/30 p-2 rounded-md border border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start">
                        <div className="mt-1 mr-2 h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></div>
                        <span>{item}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic p-2">Nenhuma pendência registrada</p>
              )}
            </div>
          </div>
        )
      })
    } else {
      const items = pendenciasData[selectedCategory] || []
      const categoryName = getCategoryName(selectedCategory)
      return (
        <div className="mb-8 bg-slate-800/70 rounded-lg border border-slate-700/50 overflow-hidden futuristic-card">
          <h3 className="text-lg font-semibold tracking-wide text-green-400 p-3 bg-slate-800/90 border-b border-slate-700/50 flex items-center">
            <div className="w-1 h-6 bg-green-500 mr-2 rounded-full"></div>
            {categoryName}
            <Badge className="ml-2 bg-slate-700/50 text-slate-300 border-slate-600/50">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </Badge>
          </h3>
          <div className="p-3">
            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li
                    key={index}
                    className="text-slate-300 bg-slate-800/30 p-2 rounded-md border border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></div>
                      <span>{item}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic p-2">Nenhuma pendência registrada</p>
            )}
          </div>
        </div>
      )
    }
  }

  // Open report modal with specific category or all categories
  const openReportModal = (category?: string) => {
    if (category) {
      setSelectedCategory(category)
      setReportType("single")
    } else {
      setReportType("all")
    }
    setIsReportModalOpen(true)
  }

  // Export to Excel
  const exportToExcel = () => {
    toast({
      title: "Excel exportado",
      description: "O arquivo foi baixado para o seu computador",
    })
  }

  // Export to PDF
  const exportToPDF = () => {
    toast({
      title: "PDF exportado",
      description: "O arquivo foi baixado para o seu computador",
    })
  }

  // Open liberar pendência modal
  const openLiberarPendenciaModal = (category: string, description: string) => {
    setLiberarPendenciaProps({
      isOpen: true,
      category,
      description,
    })
  }

  // Handle success after liberating a pendência
  const handleLiberacaoSuccess = () => {
    // Recarregar os dados do banco de dados
    loadAllDataFromDatabase().catch((err) => {
      console.error("Failed to reload data after liberation:", err)
      setDatabaseError("Falha ao atualizar dados após liberação. Tente sincronizar manualmente.")
    })

    // Exibir mensagem de sucesso
    toast({
      title: "Pendência liberada",
      description: "A pendência foi liberada com sucesso",
    })
  }

  // Update pendencias data
  const updatePendenciasData = (category: string, pendencias: string[]) => {
    setPendenciasData((prev) => ({
      ...prev,
      [category]: pendencias,
    }))
  }

  // Add new programação item
  const addProgramacaoItem = () => {
    const newId = (programacaoTurno.length + 1).toString()
    setProgramacaoTurno([...programacaoTurno, { id: newId, content: "" }])
  }

  // Update programação item
  const updateProgramacaoItem = (id: string, content: string) => {
    setProgramacaoTurno(programacaoTurno.map((item) => (item.id === id ? { ...item, content } : item)))
  }

  // Delete programação item
  const deleteProgramacaoItem = (id: string) => {
    setProgramacaoTurno(programacaoTurno.filter((item) => item.id !== id))
  }

  // Vehicle management functions
  const addVehicle = () => {
    setEditingVehicle({
      id: "", // ID vazio para indicar novo veículo
      frota: "",
      categoria: activeVehicleCategory,
      placa: "",
      modelo: "",
      ano: "",
      status: "Operacional",
    })
    setVehicleDialogOpen(true)
  }

  const editVehicle = (vehicle: Vehicle) => {
    setEditingVehicle({ ...vehicle })
    setVehicleDialogOpen(true)
  }

  const deleteVehicle = async (id: string) => {
    try {
      // Simulando exclusão
      await new Promise((resolve) => setTimeout(resolve, 500))

      setVeiculosLogistica(veiculosLogistica.filter((v) => v.id !== id))

      toast({
        title: "Veículo excluído",
        description: "O veículo foi excluído com sucesso",
      })
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o veículo",
        variant: "destructive",
      })
    }
  }

  const saveVehicle = async (vehicle: Vehicle) => {
    try {
      // Simulando salvamento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const savedVehicle = {
        ...vehicle,
        id: vehicle.id || Math.random().toString(36).substring(2, 9),
      }

      if (veiculosLogistica.some((v) => v.id === vehicle.id)) {
        setVeiculosLogistica(veiculosLogistica.map((v) => (v.id === vehicle.id ? savedVehicle : v)))
      } else {
        setVeiculosLogistica([...veiculosLogistica, savedVehicle])
      }

      setVehicleDialogOpen(false)
      setEditingVehicle(null)

      toast({
        title: "Veículo salvo",
        description: "O veículo foi salvo com sucesso",
      })
    } catch (error) {
      console.error("Error saving vehicle:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o veículo",
        variant: "destructive",
      })
    }
  }

  // Filter vehicles by category and search term
  const filteredVehicles = veiculosLogistica.filter(
    (vehicle) =>
      vehicle.categoria === activeVehicleCategory &&
      (searchTerm === "" ||
        vehicle.frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Vehicle categories for tabs
  const vehicleCategories: { id: VehicleCategory; label: string; icon: React.ElementType }[] = [
    { id: "veiculos-leves", label: "Veículos Leves", icon: Car },
    { id: "carga-seca", label: "Carga Seca", icon: Package },
    { id: "caminhao-pipa", label: "Caminhão Pipa", icon: Droplets },
    { id: "caminhao-cavalos", label: "Caminhão Cavalos", icon: Tractor },
    { id: "caminhao-munck", label: "Caminhão Munck", icon: Construction },
    { id: "caminhao-cacamba", label: "Caminhão Caçamba", icon: Loader },
    { id: "caminhao-pranchas", label: "Caminhão Pranchas", icon: Truck },
    { id: "caminhao-vinhaca", label: "Caminhão Vinhaça", icon: Leaf },
    { id: "caminhao-muda", label: "Caminhão Muda", icon: Seedling },
  ]

  // Função para navegar para uma categoria específica das pendências
  const handleViewCategory = (category: string) => {
    setActiveTab("pendencias")
    // Pequeno delay para garantir que a aba foi alterada antes de abrir o accordion
    setTimeout(() => {
      const accordionElement = document.querySelector(`[data-state="closed"][data-radix-collection-item]`)
      if (accordionElement) {
        ;(accordionElement as HTMLElement).click()
      }
    }, 100)
  }

  // Render dashboard cards
  const renderDashboardCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden relative futuristic-card">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-sm font-medium flex items-center">
            <Truck className="h-4 w-4 mr-2 text-blue-500" />
            Veículos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold">42</div>
          <p className="text-xs text-muted-foreground">+2 desde ontem</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden relative futuristic-card">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            Pendências
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold">7</div>
          <p className="text-xs text-muted-foreground">3 urgentes</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden relative futuristic-card">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-green-500" />
            Programações
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">Para hoje</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden relative futuristic-card">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-purple-500" />
            Usuários Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold">18</div>
          <p className="text-xs text-muted-foreground">+5 desde ontem</p>
        </CardContent>
      </Card>
    </div>
  )

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "programacao":
        return (
          <>
            <div className="h-6"></div>
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                    <Calendar className="mr-2 h-5 w-5 text-green-500" />
                    Programação do Turno
                  </CardTitle>
                  <Button onClick={addProgramacaoItem} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programacaoTurno.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/50 rounded-md p-4 border border-slate-700/50 hover:border-green-500/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Label className="text-sm text-slate-300 mb-1">Programação #{item.id}</Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-500 hover:text-red-500"
                          onClick={() => deleteProgramacaoItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={item.content}
                        onChange={(e) => updateProgramacaoItem(item.id, e.target.value)}
                        placeholder="Descreva a programação do turno..."
                        className="bg-slate-800 border-slate-700 min-h-[100px]"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between">
                <div className="flex items-center space-x-2">
                  {lastSyncTime && (
                    <span className="text-xs text-slate-500">
                      Última sincronização: {lastSyncTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={loadAllDataFromDatabase}
                    disabled={isSyncingDatabase}
                  >
                    {isSyncingDatabase ? (
                      <>
                        <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" /> Sincronizar Dados
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={savePendenciasToDatabase}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )
      case "pendencias":
        return (
          <div className="space-y-6">
            <PendenciasRecentes
              onViewCategory={handleViewCategory}
              onGenerateReport={(category) => openReportModal(category)}
            />

            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                  <Tool className="mr-2 h-5 w-5 text-green-500" />
                  Pendências Oficina
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PendenciasContext.Provider
                  value={{
                    pendenciasData,
                    updatePendenciasData,
                    openReportModal,
                    openLiberarPendenciaModal,
                  }}
                >
                  <Accordion type="multiple" className="w-full">
                    {[
                      "Veículos Logística",
                      "Caminhões Pipas",
                      "Caminhões Munck",
                      "Caminhões Coletas",
                      "Carretas / Pranchas / LS e outros",
                      "Caminhões Prancha/Vinhaça/Muda",
                      "Caminhões Caçambas",
                      "Trator Reboque",
                      "Área de Vivências",
                      "Carretinhas RTK",
                      "Tanques e Dolly",
                      "Carretas Canavieira",
                    ].map((title) => (
                      <PendenciaSection
                        key={title}
                        title={title}
                        context={{
                          pendenciasData,
                          updatePendenciasData,
                          openReportModal,
                          openLiberarPendenciaModal,
                        }}
                        onAutoSave={(category, pendencias) => {
                          setLastSyncTime(new Date())
                        }}
                      />
                    ))}
                  </Accordion>
                </PendenciasContext.Provider>
              </CardContent>
              <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => openReportModal()}
                    className="bg-slate-800 hover:bg-slate-700"
                  >
                    <Eye className="h-4 w-4 mr-2" /> Ver Relatório Completo
                  </Button>
                  {lastSyncTime && (
                    <span className="text-xs text-slate-500">
                      Última sincronização: {lastSyncTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={loadAllDataFromDatabase}
                    disabled={isSyncingDatabase}
                  >
                    {isSyncingDatabase ? (
                      <>
                        <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" /> Sincronizar Dados
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={savePendenciasToDatabase}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )
      case "veiculos":
        return (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                <Truck className="mr-2 h-5 w-5 text-green-500" />
                Equipamentos Logística
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Vehicle Categories Tabs */}
              <div className="mb-4">
                <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                  <div className="flex space-x-1 min-w-max">
                    {vehicleCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={activeVehicleCategory === category.id ? "default" : "outline"}
                        className={`flex items-center space-x-2 ${
                          activeVehicleCategory === category.id
                            ? "bg-gradient-to-r from-green-600/80 to-green-700/80 text-white"
                            : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                        }`}
                        onClick={() => setActiveVehicleCategory(category.id)}
                      >
                        <span>{category.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Search and Add buttons */}
                <div className="flex justify-between items-center mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar equipamento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-4 py-2 w-full bg-slate-800/50 border border-slate-700/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                  </div>
                  <Button onClick={addVehicle} className="bg-green-600 hover:bg-green-700 ml-2">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>

                {/* Vehicle List */}
                <div className="bg-slate-800/30 rounded-md border border-slate-700/50 overflow-hidden">
                  {/* Header com contador */}
                  <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{getCategoryName(activeVehicleCategory)}</span>
                      <Badge variant="outline" className="bg-slate-700/50 text-green-400 border-green-500/50">
                        {filteredVehicles.length} {filteredVehicles.length === 1 ? "veículo" : "veículos"}
                      </Badge>
                    </div>
                  </div>

                  {/* Lista com scroll melhorado */}
                  <div className="max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/30 hover:scrollbar-thumb-slate-500">
                    {filteredVehicles.length > 0 ? (
                      <div className="space-y-3 p-4">
                        {filteredVehicles.map((vehicle, index) => (
                          <div
                            key={`${vehicle.id}-${index}`}
                            className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50 hover:bg-slate-800 hover:border-green-500/30 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="bg-slate-700/50 text-green-400 border-green-500/50">
                                  {vehicle.frota}
                                </Badge>
                                <span className="text-sm text-slate-300">{vehicle.placa}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-slate-500 hover:text-green-500"
                                  onClick={() => editVehicle(vehicle)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-slate-500 hover:text-red-500"
                                  onClick={() => deleteVehicle(vehicle.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400">Modelo:</span>
                                <span className="text-xs text-slate-300">{vehicle.modelo}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400">Ano:</span>
                                <span className="text-xs text-slate-300">{vehicle.ano}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400">Status:</span>
                                <span className="text-xs text-slate-300">{vehicle.status}</span>
                              </div>
                              {vehicle.motorista && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-slate-400">Motorista:</span>
                                  <span className="text-xs text-slate-300">{vehicle.motorista}</span>
                                </div>
                              )}
                              {vehicle.observacoes && (
                                <div className="flex items-center space-x-2 col-span-1 md:col-span-2">
                                  <span className="text-xs text-slate-400">Observações:</span>
                                  <span className="text-xs text-slate-300">{vehicle.observacoes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-400 p-4">
                        <Truck className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-base font-medium">Nenhum equipamento encontrado</p>
                        <p className="text-sm text-center mt-1">
                          {searchTerm
                            ? "Tente ajustar sua busca ou limpe o filtro"
                            : "Adicione um novo equipamento para começar"}
                        </p>
                        {searchTerm && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                            className="mt-3 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border-slate-600/50"
                          >
                            Limpar busca
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between">
              <div className="flex items-center space-x-2">
                {lastSyncTime && (
                  <span className="text-xs text-slate-500">
                    Última sincronização: {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={loadAllDataFromDatabase}
                  disabled={isSyncingDatabase}
                >
                  {isSyncingDatabase ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" /> Sincronizar Dados
                    </>
                  )}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={savePendenciasToDatabase}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )
      case "dashboard":
        return (
          <>
            {renderDashboardCards()}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                  <BarChart3 className="mr-2 h-5 w-5 text-green-500" />
                  Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardCharts />
              </CardContent>
            </Card>
          </>
        )
      case "liberados":
        return (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Equipamentos Liberados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PendenciasLiberadas />
            </CardContent>
          </Card>
        )
      case "lavagem":
        return <WashingLubricationControl />
      case "relatorios":
        return (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                <FileText className="mr-2 h-5 w-5 text-green-500" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Select value={reportType} onValueChange={setReportType} className="bg-slate-800 border-slate-700">
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione o tipo de relatório" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">Relatório Completo</SelectItem>
                      <SelectItem value="single">Relatório por Categoria</SelectItem>
                    </SelectContent>
                  </Select>
                  {reportType === "single" && (
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                      className="bg-slate-800 border-slate-700"
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {Object.keys(pendenciasData).map((category) => (
                          <SelectItem key={category} value={category}>
                            {getCategoryName(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-2" /> Exportar para Excel
                  </Button>
                  <Button onClick={exportToPDF} className="bg-green-600 hover:bg-green-700">
                    <FileText className="h-4 w-4 mr-2" /> Exportar para PDF
                  </Button>
                </div>
                {generateReportContent()}
              </div>
            </CardContent>
          </Card>
        )
      default:
        return (
          <>
            {renderDashboardCards()}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                  <BarChart3 className="mr-2 h-5 w-5 text-green-500" />
                  Visão Geral do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardCharts />
              </CardContent>
            </Card>
          </>
        )
    }
  }

  return (
    <FuturisticLayout theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} setActiveTab={setActiveTab}>
      <NotificationProvider>
        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-4 border-r-yellow-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
                <div className="absolute inset-6 border-4 border-b-red-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
                <div className="absolute inset-8 border-4 border-l-yellow-500 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
              </div>
              <div className="mt-4 text-green-500 font-mono text-sm tracking-wider">INICIALIZANDO SISTEMA</div>
            </div>
          </div>
        )}

        <div className="relative">
          <ParticleBackground />
          <div className="relative z-10 futuristic-grid">{renderContent()}</div>
        </div>

        {/* Report Modal */}
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogContent className="sm:max-w-[625px] bg-slate-900/80 border-slate-700/50 backdrop-blur-sm text-slate-100 max-h-[90vh] flex flex-col glass-effect">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl flex items-center">
                <FileText className="mr-2 h-5 w-5 text-green-500" />
                Relatório de Pendências
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {reportType === "all"
                  ? "Relatório completo de todas as pendências da oficina"
                  : `Relatório de pendências: ${getCategoryName(selectedCategory)}`}
              </DialogDescription>
            </DialogHeader>

            <div className="relative flex-grow my-4 overflow-hidden rounded-md border border-slate-700/50">
              <div className="h-[calc(70vh-180px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 p-4 bg-slate-800/50">
                <div className="space-y-4 pb-4">{generateReportContent()}</div>
              </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2 mt-4 flex-shrink-0">
              <Button
                variant="outline"
                className="bg-blue-800/30 text-blue-400 hover:bg-blue-800/50 border-blue-700/50"
                onClick={exportToExcel}
              >
                <FileText className="h-4 w-4 mr-2" /> Exportar Excel
              </Button>
              <Button
                variant="outline"
                className="bg-green-800/30 text-green-400 hover:bg-green-800/50 border-green-700/50"
                onClick={exportToPDF}
              >
                <FileText className="h-4 w-4 mr-2" /> Exportar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Vehicle Dialog */}
        <VehicleDialog
          isOpen={vehicleDialogOpen}
          onClose={() => {
            setVehicleDialogOpen(false)
            setEditingVehicle(null)
          }}
          vehicle={editingVehicle}
          onSave={saveVehicle}
        />

        {/* Modal de Liberação de Pendência */}
        <LiberarPendenciaModal
          isOpen={liberarPendenciaProps.isOpen}
          onClose={() => setLiberarPendenciaProps({ isOpen: false, category: "", description: "" })}
          category={liberarPendenciaProps.category}
          description={liberarPendenciaProps.description}
          onSuccess={handleLiberacaoSuccess}
        />
      </NotificationProvider>
    </FuturisticLayout>
  )
}
