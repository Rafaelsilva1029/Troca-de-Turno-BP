"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Calendar,
  Download,
  FileText,
  Truck,
  Plus,
  Save,
  PenToolIcon as Tool,
  Trash2,
  Eye,
  CheckCircle,
  BarChart3,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Accordion } from "@/components/ui/accordion"
import { PendenciaSection } from "@/components/pendencia-section"
import { PendenciasLiberadas } from "@/components/pendencias-liberadas"
import { DashboardCharts } from "@/components/dashboard-charts"
import { ReminderSystem } from "@/components/reminder-system"
import { WashingLubricationControl } from "@/components/washing-lubrication-control"
import { fetchPendencias, savePendencias, fetchProgramacaoTurno, saveProgramacaoTurno } from "@/lib/supabase"

// Create context for pendências data
const PendenciasContext = React.createContext<any | undefined>(undefined)

interface DashboardContentProps {
  activeTab: string
  theme: "dark" | "light"
}

export default function DashboardContent({ activeTab, theme }: DashboardContentProps) {
  const { toast } = useToast()
  const [programacaoTurno, setProgramacaoTurno] = useState<{ id: string; content: string }[]>([
    { id: "1", content: "Programação para Segunda-feira" },
    { id: "2", content: "Programação para Terça-feira" },
    { id: "3", content: "Programação para Quarta-feira" },
  ])
  const [pendenciasData, setPendenciasData] = useState<Record<string, string[]>>({
    "veiculos-logistica": ["Veículo L-001 com problema no freio", "Veículo L-003 necessita troca de óleo"],
    "caminhoes-pipas": ["Caminhão P-002 com vazamento no tanque", "Caminhão P-005 com problema na bomba"],
    "caminhoes-munck": ["Munck M-001 com problema no sistema hidráulico"],
    "caminhoes-prancha-vinhaca-muda": ["Prancha PR-003 com problema na suspensão"],
    "caminhoes-cacambas": ["Caçamba C-002 com problema na tampa traseira"],
    "area-de-vivencias": ["Área A-001 necessita manutenção no ar condicionado"],
    "carretinhas-rtk": ["Carretinha RTK-005 com problema na antena"],
    "tanques-e-dolly": ["Tanque T-003 com vazamento", "Dolly D-001 com problema no engate"],
    "carretas-canavieira": ["Carreta CAN-007 com problema na suspensão"],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncingDatabase, setIsSyncingDatabase] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportType, setReportType] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Function to load all data from Supabase
  const loadAllDataFromDatabase = useCallback(async () => {
    try {
      setIsSyncingDatabase(true)
      setDatabaseError(null)

      // Carregar pendências
      const pendenciasData = await fetchPendencias()
      const transformedPendenciasData: Record<string, string[]> = {}
      pendenciasData.forEach((item) => {
        if (!transformedPendenciasData[item.category]) {
          transformedPendenciasData[item.category] = []
        }
        transformedPendenciasData[item.category].push(item.description)
      })

      // Garantir que todas as categorias existam
      const categories = [
        "veiculos-logistica",
        "caminhoes-pipas",
        "caminhoes-munck",
        "caminhoes-prancha-vinhaca-muda",
        "caminhoes-cacambas",
        "area-de-vivencias",
        "carretinhas-rtk",
        "tanques-e-dolly",
        "carretas-canavieira",
      ]

      categories.forEach((category) => {
        if (!transformedPendenciasData[category]) {
          transformedPendenciasData[category] = []
        }
      })

      setPendenciasData(transformedPendenciasData)

      // Carregar programação do turno
      const programacaoData = await fetchProgramacaoTurno()
      if (programacaoData.length > 0) {
        const transformedProgramacaoData = programacaoData.map((item) => ({
          id: item.item_id,
          content: item.content,
        }))
        setProgramacaoTurno(transformedProgramacaoData)
      }

      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error loading data:", error)
      setDatabaseError("Erro ao carregar dados. Verifique sua conexão.")
    } finally {
      setIsSyncingDatabase(false)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    loadAllDataFromDatabase().catch((err) => {
      console.error("Failed to load initial data:", err)
      setDatabaseError("Falha ao carregar dados iniciais. Usando dados padrão.")
    })
  }, [loadAllDataFromDatabase])

  // Function to save pendencias data to Supabase
  const savePendenciasToDatabase = async () => {
    try {
      setIsSaving(true)
      setDatabaseError(null)

      // Save each category separately
      for (const [category, items] of Object.entries(pendenciasData)) {
        await savePendencias(category, items)
      }

      setLastSyncTime(new Date())
      toast({
        title: "Sucesso",
        description: "Pendências salvas com sucesso!",
      })
    } catch (error) {
      console.error("Error saving pendencias:", error)
      setDatabaseError("Erro ao salvar pendências. Verifique sua conexão.")
      toast({
        title: "Erro",
        description: "Erro ao salvar pendências!",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to save programação do turno to Supabase
  const saveProgramacaoToDatabase = async () => {
    try {
      setIsSaving(true)
      setDatabaseError(null)

      // Verificar se há itens para salvar
      if (programacaoTurno.length === 0) {
        setLastSyncTime(new Date())
        toast({
          title: "Aviso",
          description: "Nenhum item de programação para salvar.",
        })
        return
      }

      await saveProgramacaoTurno(programacaoTurno)

      setLastSyncTime(new Date())
      toast({
        title: "Sucesso",
        description: "Programação do turno salva com sucesso!",
      })
    } catch (error) {
      console.error("Error saving programacao:", error)
      setDatabaseError(
        `Erro ao salvar programação: ${error instanceof Error ? error.message : "Erro desconhecido"}. Verifique sua conexão.`,
      )
      toast({
        title: "Erro",
        description: `Erro ao salvar programação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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

  // Update pendencias data
  const updatePendenciasData = (category: string, pendencias: string[]) => {
    setPendenciasData((prev) => ({
      ...prev,
      [category]: pendencias,
    }))
  }

  // Open liberar pendência modal
  const openLiberarPendenciaModal = (category: string, description: string) => {
    // Implementation would go here
    console.log("Open liberar pendência modal", category, description)
  }

  // Get category display name from slug
  const getCategoryName = (slug: string) => {
    const names: Record<string, string> = {
      "veiculos-logistica": "Veículos Logística",
      "caminhoes-pipas": "Caminhões Pipas",
      "caminhoes-munck": "Caminhões Munck",
      "caminhoes-prancha-vinhaca-muda": "Caminhões Prancha/Vinhaça/Muda",
      "caminhoes-cacambas": "Caminhões Caçambas",
      "area-de-vivencias": "Área de Vivências",
      "carretinhas-rtk": "Carretinhas RTK",
      "tanques-e-dolly": "Tanques e Dolly",
      "carretas-canavieira": "Carretas Canavieira",
    }
    return names[slug] || slug
  }

  // Render the appropriate content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "programacao":
        return (
          <>
            <ReminderSystem />
            <div className="h-6"></div> {/* Espaçador */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
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
                    <div key={item.id} className="bg-slate-800/50 rounded-md p-4 border border-slate-700/50">
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
              <CardFooter className="border-t border-slate-700/50 pt-4 flex justify-between">
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
                    onClick={saveProgramacaoToDatabase}
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
              </CardFooter>
            </Card>
          </>
        )
      case "pendencias":
        return (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
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
                    "Caminhões Prancha/Vinhaça/Muda",
                    "Caminhões Caçambas",
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
            <CardFooter className="border-t border-slate-700/50 pt-4 flex justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => openReportModal()} className="bg-slate-800 hover:bg-slate-700">
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
            </CardFooter>
          </Card>
        )
      case "dashboard":
        return (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
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
        )
      case "liberados":
        return (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
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
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                <FileText className="mr-2 h-5 w-5 text-green-500" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Sistema de Relatórios</h3>
                <p className="text-slate-400 mb-6">
                  O sistema de relatórios está sendo carregado. Por favor, aguarde ou tente novamente mais tarde.
                </p>
                <Button className="bg-green-600 hover:bg-green-700">
                  <FileText className="h-4 w-4 mr-2" /> Carregar Relatórios
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      case "veiculos":
        return (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                <Truck className="mr-2 h-5 w-5 text-green-500" />
                Equipamentos Logística
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Gestão de Equipamentos</h3>
                <p className="text-slate-400 mb-6">
                  O módulo de gestão de equipamentos está sendo carregado. Por favor, aguarde ou tente novamente mais
                  tarde.
                </p>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Truck className="h-4 w-4 mr-2" /> Carregar Equipamentos
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return (
          <div className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm rounded-lg p-8 text-center">
            <Activity className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Módulo não encontrado</h3>
            <p className="text-slate-400">
              O módulo selecionado não está disponível no momento. Por favor, selecione outra opção no menu.
            </p>
          </div>
        )
    }
  }

  return renderContent()
}
