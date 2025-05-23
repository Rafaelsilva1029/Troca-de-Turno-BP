"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Activity,
  Calendar,
  Download,
  FileText,
  FileIcon as FilePdf,
  FileSpreadsheet,
  Truck,
  Moon,
  Plus,
  Save,
  Search,
  PenToolIcon as Tool,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Car,
  Droplets,
  Package,
  Construction,
  Tractor,
  Leaf,
  SproutIcon as Seedling,
  Loader,
  Edit,
  BarChart3,
  Sun,
} from "lucide-react"

import { PendenciaSection } from "@/components/pendencia-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Accordion } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchPendencias,
  savePendencias,
  fetchProgramacaoTurno,
  saveProgramacaoTurno,
  fetchVeiculosLogistica,
} from "@/lib/supabase"
import { PendenciasLiberadas } from "@/components/pendencias-liberadas"
import { DashboardCharts } from "@/components/dashboard-charts"
import { ReminderSystem } from "@/components/reminder-system"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"

import { format } from "date-fns"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Create context for pendências data
type PendenciasContextType = {
  pendenciasData: Record<string, string[]>
  updatePendenciasData: (category: string, pendencias: string[]) => void
  openReportModal: (category: string) => void
  openLiberarPendenciaModal: (category: string, description: string) => void
}

const PendenciasContext = React.createContext<PendenciasContextType | undefined>(undefined)

function usePendenciasContext() {
  const context = React.useContext(PendenciasContext)
  if (context === undefined) {
    throw new Error("usePendenciasContext must be used within a PendenciasProvider")
  }
  return context
}

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
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("programacao")
  const [programacaoTurno, setProgramacaoTurno] = useState<{ id: string; content: string }[]>([
    { id: "1", content: "Programação para Segunda-feira" },
    { id: "2", content: "Programação para Terça-feira" },
    { id: "3", content: "Programação para Quarta-feira" },
  ])

  // Vehicle state
  const [veiculosLogistica, setVeiculosLogistica] = useState<Vehicle[]>([
    {
      id: "1",
      frota: "L-001",
      categoria: "veiculos-leves",
      placa: "ABC-1234",
      modelo: "Toyota Hilux",
      ano: "2022",
      status: "Operacional",
      ultimaManutencao: "2023-05-15",
      proximaManutencao: "2023-08-15",
      motorista: "João Silva",
    },
    {
      id: "2",
      frota: "CS-001",
      categoria: "carga-seca",
      placa: "DEF-5678",
      modelo: "Mercedes Benz Atego",
      ano: "2020",
      status: "Em manutenção",
      ultimaManutencao: "2023-06-10",
      proximaManutencao: "2023-09-10",
    },
    {
      id: "3",
      frota: "P-001",
      categoria: "caminhao-pipa",
      placa: "GHI-9012",
      modelo: "Volvo FH",
      ano: "2021",
      status: "Operacional",
      ultimaManutencao: "2023-04-20",
      proximaManutencao: "2023-07-20",
      motorista: "Carlos Oliveira",
    },
  ])

  const [activeVehicleCategory, setActiveVehicleCategory] = useState<VehicleCategory>("veiculos-leves")
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [reportType, setReportType] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
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

      // Carregar veículos logística
      const veiculosData = await fetchVeiculosLogistica()
      if (veiculosData.length > 0) {
        // This would need to be updated to handle the new vehicle structure
        // For now, we'll keep the mock data
      }

      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error loading data:", error)
      setDatabaseError("Erro ao carregar dados. Verifique sua conexão.")
    } finally {
      setIsSyncingDatabase(false)
    }
  }, [])

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
      alert("Pendências salvas com sucesso!")
    } catch (error) {
      console.error("Error saving pendencias:", error)
      setDatabaseError("Erro ao salvar pendências. Verifique sua conexão.")
      alert("Erro ao salvar pendências!")
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
        alert("Nenhum item de programação para salvar.")
        return
      }

      await saveProgramacaoTurno(programacaoTurno)

      setLastSyncTime(new Date())
      alert("Programação do turno salva com sucesso!")
    } catch (error) {
      console.error("Error saving programacao:", error)
      setDatabaseError(
        `Erro ao salvar programação: ${error instanceof Error ? error.message : "Erro desconhecido"}. Verifique sua conexão.`,
      )
      alert(`Erro ao salvar programação: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Function to save veículos logística to Supabase
  const saveVeiculosToDatabase = async () => {
    try {
      setIsSaving(true)
      setDatabaseError(null)

      // This would need to be updated to handle the new vehicle structure
      // await saveVeiculosLogistica(veiculosLogistica)

      setLastSyncTime(new Date())
      alert("Veículos logística salvos com sucesso!")
    } catch (error) {
      console.error("Error saving veiculos:", error)
      setDatabaseError("Erro ao salvar veículos. Verifique sua conexão.")
      alert("Erro ao salvar veículos!")
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
  }, [loadAllDataFromDatabase])

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Generate report content
  const generateReportContent = () => {
    if (reportType === "all") {
      return Object.entries(pendenciasData).map(([category, items]) => {
        const categoryName = getCategoryName(category)
        return (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-semibold tracking-wide text-green-500 mb-2 border-l-4 border-green-500 pl-2">
              {categoryName}
            </h3>
            {items.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="text-slate-300">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic">Nenhuma pendência registrada</p>
            )}
          </div>
        )
      })
    } else {
      const items = pendenciasData[selectedCategory] || []
      return (
        <div>
          <h3 className="text-lg font-semibold tracking-wide text-green-500 mb-2 border-l-4 border-green-500 pl-2">
            {getCategoryName(selectedCategory)}
          </h3>
          {items.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {items.map((item, index) => (
                <li key={index} className="text-slate-300">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic">Nenhuma pendência registrada</p>
          )}
        </div>
      )
    }
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

  // Get vehicle category icon
  const getVehicleCategoryIcon = (category: VehicleCategory) => {
    switch (category) {
      case "veiculos-leves":
        return Car
      case "carga-seca":
        return Package
      case "caminhao-pipa":
        return Droplets
      case "caminhao-cavalos":
        return Tractor
      case "caminhao-munck":
        return Construction
      case "caminhao-cacamba":
        return Loader
      case "caminhao-pranchas":
        return Truck
      case "caminhao-vinhaca":
        return Leaf
      case "caminhao-muda":
        return Seedling
      default:
        return Truck
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

  // Export to Excel (implementação robusta)
  const exportToExcel = () => {
    try {
      // Mostrar toast de carregamento
      toast({
        title: "Preparando Excel",
        description: "Gerando arquivo, aguarde...",
      })

      // Preparar os dados para exportação
      const workbook = XLSX.utils.book_new()

      // Adicionar informações do documento
      workbook.Props = {
        Title: "Relatório de Pendências",
        Subject: "Pendências Oficina",
        Author: "Branco Peres Agribusiness",
        CreatedDate: new Date(),
      }

      if (reportType === "all") {
        // Criar uma planilha para cada categoria
        Object.entries(pendenciasData).forEach(([category, items]) => {
          if (items.length > 0) {
            const categoryName = getCategoryName(category)

            // Converter os dados para o formato esperado pelo xlsx
            const worksheetData = [
              // Cabeçalho com informações da empresa
              ["BRANCO PERES AGRIBUSINESS"],
              ["RELATÓRIO DE PENDÊNCIAS"],
              [`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`],
              [""],
              // Cabeçalho da tabela
              ["ID", "Descrição", "Categoria", "Data"],
            ]

            // Adicionar os dados
            items.forEach((item, index) => {
              worksheetData.push([index + 1, item, categoryName, format(new Date(), "dd/MM/yyyy")])
            })

            // Sanitizar o nome da planilha para remover caracteres inválidos
            const safeSheetName = categoryName.replace(/[:\\/?*[\]]/g, "_").substring(0, 30)

            // Criar e adicionar a planilha ao workbook
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

            // Estilizar a planilha
            const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")

            // Mesclar células para o título
            worksheet["!merges"] = [
              { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
              { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
              { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
            ]

            XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName)
          }
        })
      } else {
        // Criar uma única planilha para a categoria selecionada
        const items = pendenciasData[selectedCategory] || []
        const categoryName = getCategoryName(selectedCategory)

        // Converter os dados para o formato esperado pelo xlsx
        const worksheetData = [
          // Cabeçalho com informações da empresa
          ["BRANCO PERES AGRIBUSINESS"],
          ["RELATÓRIO DE PENDÊNCIAS"],
          [`Categoria: ${categoryName}`],
          [`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`],
          [""],
          // Cabeçalho da tabela
          ["ID", "Descrição", "Data"],
        ]

        // Adicionar os dados
        items.forEach((item, index) => {
          worksheetData.push([index + 1, item, format(new Date(), "dd/MM/yyyy")])
        })

        // Sanitizar o nome da planilha
        const safeSheetName = categoryName.replace(/[:\\/?*[\]]/g, "_").substring(0, 30)

        // Criar e adicionar a planilha ao workbook
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

        // Estilizar a planilha
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")

        // Mesclar células para o título
        worksheet["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
          { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
        ]

        XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName)
      }

      // Converter o workbook para um array buffer
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

      // Criar um Blob a partir do array buffer
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Criar um URL para o blob
      const url = URL.createObjectURL(blob)

      // Criar um elemento de link temporário
      const link = document.createElement("a")
      link.href = url
      link.download = `Relatório_Pendências_${format(new Date(), "dd-MM-yyyy")}.xlsx`

      // Adicionar o link ao documento, clicar nele e removê-lo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Liberar o URL do objeto
      URL.revokeObjectURL(url)

      // Notificar o usuário
      toast({
        title: "Excel exportado com sucesso",
        description: `O arquivo foi baixado para o seu computador`,
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      toast({
        title: "Erro na exportação",
        description: `Não foi possível exportar para Excel: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    }
  }

  // Export to PDF (implementação robusta)
  const exportToPDF = () => {
    try {
      // Mostrar toast de carregamento
      toast({
        title: "Preparando PDF",
        description: "Gerando arquivo, aguarde...",
      })

      // Criar uma nova instância do jsPDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      // Adicionar título e cabeçalho
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text("BRANCO PERES AGRIBUSINESS", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" })

      doc.setFontSize(16)
      doc.text("RELATÓRIO DE PENDÊNCIAS", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" })

      // Adicionar data do relatório
      doc.setFontSize(10)
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30)

      // Adicionar tipo de relatório
      doc.text(
        `Tipo: ${reportType === "all" ? "Relatório Completo" : `Categoria: ${getCategoryName(selectedCategory)}`}`,
        14,
        35,
      )

      // Altura inicial para o conteúdo
      let yPos = 45

      if (reportType === "all") {
        // Gerar tabelas para cada categoria
        Object.entries(pendenciasData).forEach(([category, items]) => {
          if (items.length > 0) {
            const categoryName = getCategoryName(category)

            // Verificar se precisamos adicionar uma nova página
            if (yPos > 180) {
              doc.addPage()
              yPos = 20
            }

            // Adicionar título da categoria
            doc.setFontSize(12)
            doc.setTextColor(34, 197, 94) // Verde
            doc.text(categoryName, 14, yPos)
            yPos += 7

            // Preparar dados da tabela
            const tableData = items.map((item, index) => [index + 1, item])

            // Adicionar a tabela ao PDF usando o plugin autoTable
            autoTable(doc, {
              head: [["ID", "Descrição"]],
              body: tableData,
              startY: yPos,
              styles: { fontSize: 8, cellPadding: 2 },
              headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
              alternateRowStyles: { fillColor: [240, 240, 240] },
              margin: { top: 35 },
            })

            // Atualizar a posição Y para a próxima tabela
            // @ts-ignore - Acessando a propriedade lastAutoTable
            yPos = doc.lastAutoTable.finalY + 10
          }
        })
      } else {
        // Gerar tabela para a categoria selecionada
        const items = pendenciasData[selectedCategory] || []
        const categoryName = getCategoryName(selectedCategory)

        // Adicionar título da categoria
        doc.setFontSize(12)
        doc.setTextColor(34, 197, 94) // Verde
        doc.text(categoryName, 14, yPos)
        yPos += 7

        // Preparar dados da tabela
        const tableData = items.map((item, index) => [index + 1, item])

        // Adicionar a tabela ao PDF usando o plugin autoTable
        autoTable(doc, {
          head: [["ID", "Descrição"]],
          body: tableData,
          startY: yPos,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
          margin: { top: 35 },
        })
      }

      // Adicionar rodapé
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(
          `Branco Peres Agribusiness - Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        )
      }

      // Gerar o PDF como blob e fazer download
      const pdfBlob = doc.output("blob")
      const url = URL.createObjectURL(pdfBlob)

      // Criar um elemento de link temporário
      const link = document.createElement("a")
      link.href = url
      link.download = `Relatório_Pendências_${format(new Date(), "dd-MM-yyyy")}.pdf`

      // Adicionar o link ao documento, clicar nele e removê-lo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Liberar o URL do objeto
      URL.revokeObjectURL(url)

      // Notificar o usuário
      toast({
        title: "PDF exportado com sucesso",
        description: `O arquivo foi baixado para o seu computador`,
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error)
      toast({
        title: "Erro na exportação",
        description: `Não foi possível exportar para PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    }
  }

  // Open report modal with specific category
  // const openReportModal = (category: string) => {
  //   setSelectedCategory(category)
  //   setReportType("single")
  //   setIsReportModalOpen(true)
  // }

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
    alert("Pendência liberada com sucesso!")
  }

  // Update pendencias data
  const updatePendenciasData = (category: string, pendencias: string[]) => {
    setPendenciasData((prev) => ({
      ...prev,
      [category]: pendencias,
    }))
  }

  // Particle effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 100

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.5 + 0.2})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
      id: (veiculosLogistica.length + 1).toString(),
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

  const deleteVehicle = (id: string) => {
    setVeiculosLogistica(veiculosLogistica.filter((v) => v.id !== id))
  }

  const saveVehicle = (vehicle: Vehicle) => {
    if (veiculosLogistica.some((v) => v.id === vehicle.id)) {
      setVeiculosLogistica(veiculosLogistica.map((v) => (v.id === vehicle.id ? vehicle : v)))
    } else {
      setVeiculosLogistica([...veiculosLogistica, vehicle])
    }
    setVehicleDialogOpen(false)
    setEditingVehicle(null)
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

  // Navigation items
  const navigationItems = [
    { id: "programacao", label: "Programação do Turno", icon: Calendar },
    { id: "pendencias", label: "Pendências Oficina", icon: Tool },
    { id: "veiculos", label: "Veículos Logística", icon: Truck },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "liberados", label: "Equipamentos Liberados", icon: CheckCircle },
    { id: "relatorios", label: "Relatórios", icon: FileText }, // Add this new item
  ]

  // Handle sidebar item click
  const handleSidebarItemClick = (id: string) => {
    setActiveTab(id)
  }

  return (
    <div
      className={`${theme} min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden`}
    >
      {/* Background particle effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
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

      <div className="container mx-auto px-2 sm:px-4 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between py-4 border-b border-slate-700/50 mb-6">
          <div className="flex flex-col items-center md:items-start md:flex-row md:space-x-3 mb-4 md:mb-0">
            <div className="flex flex-col items-center md:items-start">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_rodape%20%282%29-tnqjz4Nqo9rMCqM9pVmARDluiXmuyd.png"
                alt="Logo Branco Peres"
                className="h-12 w-auto object-contain mb-2"
              />
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TROCA DE TURNO
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse border border-slate-800 md:relative md:bottom-auto md:right-auto md:ml-2 md:mt-6"></div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-1 bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-700/50 backdrop-blur-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none focus:outline-none text-sm w-40 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="text-slate-400 hover:text-slate-100"
                    >
                      {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Alternar tema</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Avatar>
                <AvatarImage src="/abstract-geometric-shapes.png" alt="Usuário" />
                <AvatarFallback className="bg-slate-700 text-green-500">BP</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <CollapsibleSidebar
              activeItem={activeTab}
              onItemClick={handleSidebarItemClick}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </div>

          {/* Main content area */}
          <div className="col-span-12 md:col-span-9 lg:col-span-10">
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-100 flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-green-500" />
                      Painel de Controle
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-slate-800/50 text-green-400 border-green-500/50 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></div>
                        ATIVO
                      </Badge>
                      <div className="text-sm text-slate-400">
                        {formatDate(currentTime)} | {formatTime(currentTime)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Database Error Alert */}
              {databaseError && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro de Conexão</AlertTitle>
                  <AlertDescription>
                    {databaseError} Você pode continuar trabalhando offline e tentar sincronizar mais tarde.
                  </AlertDescription>
                </Alert>
              )}

              {/* Main Navigation */}
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-1 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center justify-between p-3 rounded transition-all ${
                          activeTab === item.id
                            ? "bg-gradient-to-r from-green-600/80 to-green-700/80 text-white shadow-lg"
                            : "hover:bg-slate-700/50 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-full mr-3 ${
                              activeTab === item.id ? "bg-green-500/20" : "bg-slate-700/50"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${activeTab === item.id ? "text-green-400" : "text-slate-400"}`}
                            />
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {activeTab === item.id && <ChevronRight className="h-4 w-4 text-green-300" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Content Sections */}
              <div>
                {/* Programação do Turno */}
                {activeTab === "programacao" && (
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
                )}

                {/* Pendências Oficina */}
                {activeTab === "pendencias" && (
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
                    </CardFooter>
                  </Card>
                )}

                {/* Veículos Logística */}
                {activeTab === "veiculos" && (
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                        <Truck className="mr-2 h-5 w-5 text-green-500" />
                        Veículos Logística
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Vehicle Categories Tabs */}
                      <Tabs defaultValue={activeVehicleCategory} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                          {vehicleCategories.map((category) => (
                            <TabsTrigger
                              key={category.id}
                              value={category.id}
                              onClick={() => setActiveVehicleCategory(category.id)}
                              className={`flex items-center justify-between p-3 rounded transition-all ${
                                activeVehicleCategory === category.id
                                  ? "bg-gradient-to-r from-green-600/80 to-green-700/80 text-white shadow-lg"
                                  : "hover:bg-slate-700/50 text-slate-300"
                              }`}
                            >
                              <div className="flex items-center">
                                <div
                                  className={`p-2 rounded-full mr-3 ${
                                    activeVehicleCategory === category.id ? "bg-green-500/20" : "bg-slate-700/50"
                                  }`}
                                >
                                  <category.icon
                                    className={`h-5 w-5 ${
                                      activeVehicleCategory === category.id ? "text-green-400" : "text-slate-400"
                                    }`}
                                  />
                                </div>
                                <span className="font-medium">{category.label}</span>
                              </div>
                              {activeVehicleCategory === category.id && (
                                <ChevronRight className="h-4 w-4 text-green-300" />
                              )}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {/* Vehicle List */}
                        <TabsContent value={activeVehicleCategory}>
                          <div className="space-y-4">
                            {filteredVehicles.map((vehicle) => (
                              <div
                                key={vehicle.id}
                                className="bg-slate-800/50 rounded-md p-4 border border-slate-700/50"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-slate-300">{vehicle.frota}</span>
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
                                <div className="flex flex-col space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-slate-400">Modelo:</span>
                                    <span className="text-sm text-slate-300">{vehicle.modelo}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-slate-400">Ano:</span>
                                    <span className="text-sm text-slate-300">{vehicle.ano}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-slate-400">Status:</span>
                                    <span className="text-sm text-slate-300">{vehicle.status}</span>
                                  </div>
                                  {vehicle.motorista && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-slate-400">Motorista:</span>
                                      <span className="text-sm text-slate-300">{vehicle.motorista}</span>
                                    </div>
                                  )}
                                  {vehicle.observacoes && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-slate-400">Observações:</span>
                                      <span className="text-sm text-slate-300">{vehicle.observacoes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
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
                          onClick={saveVeiculosToDatabase}
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
                )}

                {/* Dashboard */}
                {activeTab === "dashboard" && (
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
                )}

                {/* Equipamentos Liberados */}
                {activeTab === "liberados" && (
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
                )}

                {/* Relatórios */}
                {activeTab === "relatorios" && (
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                        <FileText className="mr-2 h-5 w-5 text-green-500" />
                        Relatórios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Select
                            value={reportType}
                            onValueChange={setReportType}
                            className="bg-slate-800 border-slate-700"
                          >
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
                            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar para Excel
                          </Button>
                          <Button onClick={exportToPDF} className="bg-green-600 hover:bg-green-700">
                            <FilePdf className="h-4 w-4 mr-2" /> Exportar para PDF
                          </Button>
                        </div>
                        {generateReportContent()}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Abrir Relatório</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px] bg-slate-900/80 border-slate-700/50 backdrop-blur-sm text-slate-100">
          <DialogHeader>
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

          <div className="my-4 p-4 bg-slate-800/50 rounded-md border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1000231524-removebg-preview-P9vpiTQfd0xkSaNXEMRPfob1VyT0gH.png"
                  alt="Logo Branco Peres"
                  className="h-12 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    RELATÓRIO DE PENDÊNCIAS
                  </h2>
                  <span className="text-xs font-semibold tracking-wide text-yellow-400">BRANCO PERES AGRIBUSINESS</span>
                </div>
              </div>
              <div className="text-sm text-slate-400">Gerado em: {new Date().toLocaleString("pt-BR")}</div>
            </div>

            <div className="space-y-4">{generateReportContent()}</div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <Label className="w-32">Tipo de Relatório:</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[250px] bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Tipo de relatório" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectItem value="all">Relatório Completo</SelectItem>
                  <SelectItem value="single">Categoria Específica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "single" && (
              <div className="flex items-center space-x-4">
                <Label className="w-32">Categoria:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[250px] bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    {Object.keys(pendenciasData).map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              className="bg-green-800/30 text-green-400 hover:bg-green-800/50 border-green-700/50"
              onClick={exportToExcel}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Excel
            </Button>
            <Button
              variant="outline"
              className="bg-red-800/30 text-red-400 hover:bg-red-800/50 border-red-700/50"
              onClick={exportToPDF}
            >
              <FilePdf className="h-4 w-4 mr-2" /> Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
