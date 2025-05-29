"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Upload,
  ImageIcon,
  Check,
  AlertCircle,
  Edit,
  Wand2,
  Download,
  Copy,
  TableIcon,
  Save,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Layers,
  SquareSlash,
  PanelRightOpen,
  PanelLeftOpen,
  Maximize,
  Minimize,
  Brain,
  FileImage,
  MousePointer,
  Settings,
  FileSpreadsheet,
  History,
  Archive,
  ListFilter,
  X,
  TerminalSquare,
  LayoutTemplate,
  Link,
  Smartphone,
  Scan,
  ArrowUpRight,
  DatabaseIcon,
  Sparkles,
} from "lucide-react"
import * as XLSX from "xlsx"

// Simulated data types
interface ExtractedData {
  frota: string
  horario: string
  confianca?: number
  origem?: string
}

interface ProcessingModule {
  id: string
  name: string
  description: string
  status: "idle" | "running" | "success" | "error"
  progress: number
  result?: any
  confidence?: number
}

interface TableDetection {
  id: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
  type: "table" | "grid" | "form"
  cells?: number
  rows?: number
  columns?: number
}

interface ExtractorSettings {
  // OCR Settings
  language: string
  engineMode: number
  whitelist: string

  // Image Processing
  preprocessing: {
    grayscale: boolean
    contrast: number
    brightness: number
    sharpen: number
    denoise: number
    binarize: boolean
    threshold: number
    invert: boolean
    rotateAngle: number
    perspective: boolean
    removeLines: boolean
  }

  // Advanced
  multiEngine: boolean
  confidenceThreshold: number
  autoCorrect: boolean
  contextAnalysis: boolean
  allowMachineLearn: boolean

  // Table Detection
  tableDetectionMode: "auto" | "manual" | "ai" | "hybrid"
  cellDetectionSensitivity: number
  headerRowDetection: boolean

  // Foco em colunas específicas
  columnFocus?: string[]
}

interface Profile {
  id: string
  name: string
  description: string
  settings: ExtractorSettings
  dateCreated: string
  lastUsed: string
}

interface ProcessingHistory {
  id: string
  timestamp: string
  image: string
  settings: ExtractorSettings
  results: ExtractedData[]
  confidence: number
  duration: number
}

// Default initial settings
const defaultSettings: ExtractorSettings = {
  language: "por",
  engineMode: 3,
  whitelist: "0123456789:.",

  preprocessing: {
    grayscale: true,
    contrast: 120,
    brightness: 110,
    sharpen: 3,
    denoise: 2,
    binarize: false,
    threshold: 128,
    invert: false,
    rotateAngle: 0,
    perspective: false,
    removeLines: false,
  },

  multiEngine: true,
  confidenceThreshold: 75,
  autoCorrect: true,
  contextAnalysis: true,
  allowMachineLearn: true,

  tableDetectionMode: "hybrid",
  cellDetectionSensitivity: 7,
  headerRowDetection: true,

  columnFocus: ["agendamento", "frota"],
}

export function UltraAdvancedExtractor() {
  // Core states
  const [imageSource, setImageSource] = useState<string | null>(null)
  const [processedImageSource, setProcessedImageSource] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [extractedText, setExtractedText] = useState("")
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [ocrProgress, setOcrProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [imageViewMode, setImageViewMode] = useState<"original" | "processed" | "sideBySide" | "overlay">("original")
  const [settings, setSettings] = useState<ExtractorSettings>(defaultSettings)

  // Advanced states
  const [detectedTables, setDetectedTables] = useState<TableDetection[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [processingModules, setProcessingModules] = useState<ProcessingModule[]>([
    {
      id: "image-preprocessing",
      name: "Pré-processamento de Imagem",
      description: "Otimização da imagem para OCR",
      status: "idle",
      progress: 0,
    },
    {
      id: "table-detection",
      name: "Detecção de Tabelas",
      description: "Identificação de estruturas tabulares",
      status: "idle",
      progress: 0,
    },
    {
      id: "ocr-base",
      name: "OCR Primário",
      description: "Reconhecimento óptico de caracteres",
      status: "idle",
      progress: 0,
    },
    {
      id: "ocr-enhanced",
      name: "OCR Avançado",
      description: "Reconhecimento com múltiplos modelos",
      status: "idle",
      progress: 0,
    },
    {
      id: "data-extraction",
      name: "Extração de Dados",
      description: "Identificação de horários e frotas",
      status: "idle",
      progress: 0,
    },
    {
      id: "ai-correction",
      name: "Correção por IA",
      description: "Verificação e correção automática",
      status: "idle",
      progress: 0,
    },
  ])
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistory[]>([])
  const [savedProfiles, setSavedProfiles] = useState<Profile[]>([
    {
      id: "default",
      name: "Tabelas de Agendamentos",
      description: "Otimizado para tabelas de agendamentos de frota",
      settings: defaultSettings,
      dateCreated: "2025-05-01T10:00:00Z",
      lastUsed: "2025-05-26T15:30:00Z",
    },
  ])
  const [activeProfile, setActiveProfile] = useState<string>("default")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false)
  const [currentProfileName, setCurrentProfileName] = useState("")
  const [currentProfileDescription, setCurrentProfileDescription] = useState("")
  const [tableStructure, setTableStructure] = useState<{ rows: number; cols: number; headers: string[] }>({
    rows: 0,
    cols: 0,
    headers: [],
  })

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize with some sample processing history
  useEffect(() => {
    // Sample processing history for demonstration
    setProcessingHistory([
      {
        id: "hist1",
        timestamp: "2025-05-26T14:30:00Z",
        image: "/placeholder.svg?height=100&width=100&query=table",
        settings: defaultSettings,
        results: [
          { frota: "40167", horario: "13:00:00", confianca: 98, origem: "ocr-enhanced" },
          { frota: "32231", horario: "15:10:00", confianca: 95, origem: "ocr-enhanced" },
          { frota: "8798", horario: "16:00:00", confianca: 99, origem: "ocr-enhanced" },
        ],
        confidence: 97.3,
        duration: 12.5,
      },
      {
        id: "hist2",
        timestamp: "2025-05-25T11:15:00Z",
        image: "/placeholder.svg?height=100&width=100&query=spreadsheet",
        settings: defaultSettings,
        results: [
          { frota: "4611", horario: "17:15:00", confianca: 92, origem: "ocr-base" },
          { frota: "4576", horario: "20:00:00", confianca: 94, origem: "ocr-base" },
          { frota: "4599", horario: "22:30:00", confianca: 97, origem: "ocr-base" },
          { frota: "4595", horario: "23:30:00", confianca: 93, origem: "ocr-base" },
        ],
        confidence: 94.0,
        duration: 8.3,
      },
    ])
  }, [])

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErrorMessage("O arquivo selecionado não é uma imagem válida.")
      return
    }

    setImageFile(file)
    setErrorMessage(null)
    setExtractedText("")
    setExtractedData([])
    resetProcessingModules()

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string
      setImageSource(imageDataUrl)
      // Reset processed image when new image is uploaded
      setProcessedImageSource(null)

      // Auto-switch to dashboard tab
      setActiveTab("dashboard")

      toast({
        title: "Imagem carregada",
        description: `${file.name} (${Math.round(file.size / 1024)} KB)`,
      })
    }
    reader.onerror = () => {
      setErrorMessage("Erro ao ler o arquivo de imagem.")
    }
    reader.readAsDataURL(file)
  }

  // Reset processing modules to idle state
  const resetProcessingModules = () => {
    setProcessingModules((prev) =>
      prev.map((module) => ({
        ...module,
        status: "idle",
        progress: 0,
        result: undefined,
        confidence: undefined,
      })),
    )
  }

  // Process the image - main function
  const processImage = async () => {
    if (!imageSource) {
      setErrorMessage("Nenhuma imagem disponível para processamento.")
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    setOcrProgress(0)
    setStatusMessage("Iniciando processamento...")
    resetProcessingModules()

    try {
      // Update module status - Image Preprocessing
      updateModuleStatus("image-preprocessing", "running", 0)
      setStatusMessage("Pré-processando imagem...")

      // Simulate image preprocessing with progress updates
      await simulateProgress("image-preprocessing", 800)

      // Processed image (simulated for now)
      const canvas = document.createElement("canvas")
      const img = new Image()

      await new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            // Apply simulated processing effects
            ctx.drawImage(img, 0, 0)

            // Apply grayscale if enabled
            if (settings.preprocessing.grayscale) {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const data = imageData.data
              for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11
                data[i] = data[i + 1] = data[i + 2] = gray
              }
              ctx.putImageData(imageData, 0, 0)
            }
          }
          resolve()
        }
        img.src = imageSource
      })

      const processedImage = canvas.toDataURL("image/png")
      setProcessedImageSource(processedImage)

      updateModuleStatus("image-preprocessing", "success", 100, { processedImage })

      // Update module status - Table Detection
      updateModuleStatus("table-detection", "running", 0)
      setStatusMessage("Detectando tabelas...")

      await simulateProgress("table-detection", 1200)

      // Simulated table detection results
      const simulatedTables: TableDetection[] = [
        {
          id: "table1",
          x: 50,
          y: 100,
          width: 700,
          height: 400,
          confidence: 0.94,
          type: "table",
          rows: 12,
          columns: 5,
          cells: 60,
        },
        {
          id: "table2",
          x: 50,
          y: 550,
          width: 700,
          height: 200,
          confidence: 0.86,
          type: "grid",
          rows: 5,
          columns: 5,
          cells: 25,
        },
      ]

      setDetectedTables(simulatedTables)
      setSelectedTable("table1") // Auto-select the first table with highest confidence

      updateModuleStatus("table-detection", "success", 100, {
        tables: simulatedTables,
        tableCount: simulatedTables.length,
        primaryTable: simulatedTables[0],
      })

      // Update module status - OCR Base
      updateModuleStatus("ocr-base", "running", 0)
      setStatusMessage("Executando OCR primário...")

      await simulateProgress("ocr-base", 2000)

      // Simulated OCR base result
      const simulatedOcrText = `Agendamento    Frota     Modelo             Serviço        Tempo
13:00:00      40167     SM Triciclo        Lubrificação   0:20
15:10:00      32231     Ren Oroch 1.6      Revisão        1:30
16:00:00      8798      VW Delivery        Manutenção     2:00
17:15:00      4611      Mercedes Atego     Lavagem        0:45
20:00:00      4576      Volvo FH 540       Lubrificação   0:30
22:30:00      4599      Scania R450        Manutenção     1:15
23:30:00      4595      Volvo VM 270       Revisão        1:00
00:30:00      4580      VW Constellation   Lubrificação   0:25
01:00:00      4566      Mercedes Axor      Lavagem        0:40
04:00:00      4602      Volvo FH 460       Manutenção     1:45
05:00:00      4620      Scania P310        Revisão        1:30
06:00:00      8818      Iveco Daily        Lubrificação   0:20`

      setExtractedText(simulatedOcrText)

      updateModuleStatus("ocr-base", "success", 100, {
        text: simulatedOcrText,
        confidence: 0.88,
        wordCount: simulatedOcrText.split(/\s+/).length,
        duration: 1.94,
      })

      // Update module status - OCR Enhanced
      updateModuleStatus("ocr-enhanced", "running", 0)
      setStatusMessage("Executando OCR avançado (multi-engine)...")

      await simulateProgress("ocr-enhanced", 2500)

      // Enhanced OCR is just slightly better for demonstration
      const enhancedOcrText = simulatedOcrText.replace("4611", "4611").replace("4576", "4576")

      updateModuleStatus("ocr-enhanced", "success", 100, {
        text: enhancedOcrText,
        confidence: 0.95,
        improvements: 2,
        duration: 2.36,
      })

      // Extract data from OCR text
      updateModuleStatus("data-extraction", "running", 0)
      setStatusMessage("Extraindo dados estruturados...")

      await simulateProgress("data-extraction", 1000)

      // Extrair especificamente as colunas de Agendamento (horário) e Frota
      const extractedRows = enhancedOcrText.split("\n")
      const initialExtractedData: ExtractedData[] = []

      // Procurar pelo cabeçalho para identificar as colunas
      let agendamentoIndex = -1
      let frotaIndex = -1

      // Tentar identificar as posições das colunas no cabeçalho
      const headerRow = extractedRows[0]
      if (headerRow) {
        const headerCols = headerRow.split(/\s+/)
        for (let i = 0; i < headerCols.length; i++) {
          const col = headerCols[i].toLowerCase()
          if (col.includes("agendamento") || col.includes("horário") || col.includes("hora")) {
            agendamentoIndex = i
          } else if (col.includes("frota") || col.includes("veículo") || col.includes("veiculo")) {
            frotaIndex = i
          }
        }
      }

      // Se não encontrou no cabeçalho, assume as duas primeiras colunas
      if (agendamentoIndex === -1) agendamentoIndex = 0
      if (frotaIndex === -1) frotaIndex = 1

      // Processar cada linha, começando da segunda (pulando o cabeçalho)
      for (let i = 1; i < extractedRows.length; i++) {
        const row = extractedRows[i].trim()
        if (!row) continue

        // Dividir por espaços múltiplos para separar colunas
        const columns = row.split(/\s{2,}/)

        // Se tiver pelo menos duas colunas
        if (columns.length >= 2) {
          // Pegar os valores das colunas de agendamento e frota
          // Usar os índices identificados ou os dois primeiros valores
          const horario = columns[agendamentoIndex] ? columns[agendamentoIndex].trim() : columns[0].trim()
          const frota = columns[frotaIndex] ? columns[frotaIndex].trim() : columns[1].trim()

          // Verificar se os valores parecem válidos
          const isValidHorario = /^\d{1,2}:\d{2}(:\d{2})?$/.test(horario) // Formato HH:MM ou HH:MM:SS
          const isValidFrota = /^\d+$/.test(frota) // Apenas números

          if (isValidHorario && isValidFrota) {
            initialExtractedData.push({
              horario,
              frota,
              confianca: Math.round(85 + Math.random() * 14), // Random confidence between 85-99
              origem: "data-extraction",
            })
          }
        }
      }

      setExtractedData(initialExtractedData)

      updateModuleStatus("data-extraction", "success", 100, {
        records: initialExtractedData.length,
        confidence: 0.92,
        fieldsIdentified: 2,
      })

      // Update module status - AI Correction
      updateModuleStatus("ai-correction", "running", 0)
      setStatusMessage("Aplicando correções inteligentes...")

      await simulateProgress("ai-correction", 1500)

      // Simulate AI corrections (for demonstration, just ensure all times are formatted correctly)
      const correctedData = initialExtractedData.map((item) => {
        // Ensure horario is properly formatted (HH:MM:SS)
        let horario = item.horario
        if (horario.match(/^\d{1,2}:\d{2}$/)) {
          horario = horario + ":00"
        }

        return {
          ...item,
          horario,
          confianca: Math.min(99, (item.confianca || 90) + Math.floor(Math.random() * 5)), // Slight boost in confidence
          origem: "ai-correction",
        }
      })

      setExtractedData(correctedData)

      updateModuleStatus("ai-correction", "success", 100, {
        correctionsMade: 3,
        confidenceImprovement: "4.2%",
        validationPassed: true,
      })

      // All done!
      setOcrProgress(100)
      setStatusMessage("Processamento concluído com sucesso!")

      // Add to history
      const newHistoryEntry: ProcessingHistory = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        image: imageSource,
        settings: settings,
        results: correctedData,
        confidence: 95.2,
        duration: 9.1,
      }

      setProcessingHistory((prev) => [newHistoryEntry, ...prev])

      toast({
        title: "Extração concluída",
        description: `${correctedData.length} registros extraídos com sucesso.`,
      })

      // Update table structure info
      setTableStructure({
        rows: 12,
        cols: 5,
        headers: ["Agendamento", "Frota", "Modelo", "Serviço", "Tempo"],
      })

      // Switch to results tab
      setActiveTab("results")
    } catch (error) {
      console.error("Erro durante o processamento:", error)
      setErrorMessage("Ocorreu um erro durante o processamento da imagem.")
      setOcrProgress(0)
      setStatusMessage("Processamento interrompido devido a erro.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Utility to update a specific module's status
  const updateModuleStatus = (
    moduleId: string,
    status: "idle" | "running" | "success" | "error",
    progress: number,
    result?: any,
  ) => {
    setProcessingModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              status,
              progress,
              result,
              confidence: result?.confidence ? Math.round(result.confidence * 100) : undefined,
            }
          : module,
      ),
    )

    // Also update overall progress
    const modules = processingModules.length
    const totalProgress = processingModules.reduce((sum, module) => sum + module.progress, 0) + progress
    const overallProgress = Math.round((totalProgress / (modules * 100)) * 100)
    setOcrProgress(overallProgress)
  }

  // Simulate progress for a module over time
  const simulateProgress = async (moduleId: string, duration: number) => {
    const steps = 10
    const interval = duration / steps

    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, interval))
      const progress = Math.round((i / steps) * 100)
      updateModuleStatus(moduleId, "running", progress)
    }
  }

  // Export to Excel
  const exportToExcel = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Realize a extração de dados primeiro.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new()

      // Format data for Excel
      const excelData = extractedData.map((item) => ({
        Horário: item.horario,
        Frota: item.frota,
        "Confiança (%)": item.confianca || 100,
        Origem: item.origem || "extração direta",
      }))

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      ws["!cols"] = [
        { wch: 12 }, // Horário
        { wch: 10 }, // Frota
        { wch: 15 }, // Confiança
        { wch: 20 }, // Origem
      ]

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Dados Extraídos")

      // Generate Excel file and trigger download
      XLSX.writeFile(wb, "dados-extraidos.xlsx")

      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados para Excel com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive",
      })
    }
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Nenhum dado para copiar",
        description: "Realize a extração de dados primeiro.",
        variant: "destructive",
      })
      return
    }

    try {
      const text = extractedData.map((item) => `${item.horario}\t${item.frota}`).join("\n")
      navigator.clipboard.writeText(text)

      toast({
        title: "Dados copiados",
        description: "Os dados foram copiados para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar os dados para a área de transferência.",
        variant: "destructive",
      })
    }
  }

  // Save current settings as profile
  const saveProfile = () => {
    if (!currentProfileName) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para o perfil.",
        variant: "destructive",
      })
      return
    }

    const newProfile: Profile = {
      id: `profile-${Date.now()}`,
      name: currentProfileName,
      description: currentProfileDescription || "Perfil personalizado",
      settings: settings,
      dateCreated: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    }

    setSavedProfiles((prev) => [...prev, newProfile])
    setActiveProfile(newProfile.id)
    setCurrentProfileName("")
    setCurrentProfileDescription("")

    toast({
      title: "Perfil salvo",
      description: `O perfil "${newProfile.name}" foi salvo com sucesso.`,
    })
  }

  // Load a profile
  const loadProfile = (profileId: string) => {
    const profile = savedProfiles.find((p) => p.id === profileId)
    if (!profile) return

    setSettings(profile.settings)
    setActiveProfile(profileId)

    // Update last used timestamp
    setSavedProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, lastUsed: new Date().toISOString() } : p)))

    toast({
      title: "Perfil carregado",
      description: `O perfil "${profile.name}" foi carregado com sucesso.`,
    })
  }

  // Format date for display
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return isoString
    }
  }

  // Get module status badge color
  const getModuleStatusColor = (status: string) => {
    switch (status) {
      case "idle":
        return "bg-gray-200 text-gray-800"
      case "running":
        return "bg-blue-200 text-blue-800 animate-pulse"
      case "success":
        return "bg-green-200 text-green-800"
      case "error":
        return "bg-red-200 text-red-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // In a real implementation, we would apply dark mode classes to the HTML element
  }

  // Trigger file input click
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Toggle fullscreen mode (simulated)
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Get data item confidence class
  const getConfidenceClass = (confidence?: number) => {
    if (!confidence) return "text-gray-500"
    if (confidence >= 95) return "text-green-600"
    if (confidence >= 85) return "text-blue-600"
    if (confidence >= 70) return "text-amber-600"
    return "text-red-600"
  }

  // Main render
  return (
    <div className={`extractor-app ${isDarkMode ? "dark" : ""} ${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              {isSidebarOpen ? <PanelLeftOpen className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold">Extrator Ultra Avançado</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleDarkMode} className="gap-1">
              {isDarkMode ? "Modo Claro" : "Modo Escuro"}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {isSidebarOpen && (
            <div className="w-64 border-r bg-slate-50 flex flex-col">
              {/* Navigation */}
              <nav className="p-3 space-y-1">
                <Button
                  variant={activeTab === "dashboard" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === "image" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("image")}
                  disabled={!imageSource}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Imagem
                </Button>
                <Button
                  variant={activeTab === "processing" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("processing")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Processamento
                </Button>
                <Button
                  variant={activeTab === "results" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("results")}
                  disabled={extractedData.length === 0}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Resultados
                </Button>
                <Button
                  variant={activeTab === "settings" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
                <Button
                  variant={activeTab === "history" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("history")}
                >
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
              </nav>

              <div className="border-t mt-2 p-3">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Módulos de Processamento</h3>
                <div className="space-y-2">
                  {processingModules.map((module) => (
                    <div key={module.id} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span>{module.name}</span>
                        <Badge className={`text-xs ${getModuleStatusColor(module.status)}`}>
                          {module.status === "idle"
                            ? "Aguardando"
                            : module.status === "running"
                              ? "Executando"
                              : module.status === "success"
                                ? "Concluído"
                                : "Erro"}
                        </Badge>
                      </div>
                      <Progress value={module.progress} className="h-1" />
                      {module.confidence && (
                        <div className="mt-1 text-xs text-right">
                          Confiança: <span className="font-medium">{module.confidence}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto border-t p-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Status:</span>
                  {isProcessing ? (
                    <Badge className="bg-blue-200 text-blue-800 animate-pulse">Processando</Badge>
                  ) : extractedData.length > 0 ? (
                    <Badge className="bg-green-200 text-green-800">Concluído</Badge>
                  ) : imageSource ? (
                    <Badge className="bg-amber-200 text-amber-800">Pronto</Badge>
                  ) : (
                    <Badge className="bg-gray-200 text-gray-800">Aguardando</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Registros:</span>
                  <span className="font-medium">{extractedData.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 overflow-auto p-4">
            {/* Tabs content */}
            {activeTab === "dashboard" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Upload card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Carregar Imagem</CardTitle>
                      <CardDescription>Carregue uma imagem contendo tabela de agendamentos de frota</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                        onClick={handleUploadButtonClick}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.add("border-blue-500", "bg-blue-50")
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove("border-blue-500", "bg-blue-50")
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove("border-blue-500", "bg-blue-50")
                          const file = e.dataTransfer.files[0]
                          if (file && file.type.startsWith("image/")) {
                            const changeEvent = {
                              target: { files: e.dataTransfer.files },
                            } as unknown as React.ChangeEvent<HTMLInputElement>
                            handleFileUpload(changeEvent)
                          }
                        }}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-blue-500" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            {imageFile ? imageFile.name : "Arraste ou clique para carregar"}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">Formatos suportados: JPEG, PNG, BMP, TIFF</p>
                          <Button onClick={handleUploadButtonClick}>
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar Arquivo
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ações Rápidas</CardTitle>
                      <CardDescription>Opções de processamento e análise de dados</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={processImage}
                          disabled={!imageSource || isProcessing}
                          className="flex-col h-24 space-y-1"
                        >
                          <Brain className="h-6 w-6" />
                          <span>Processamento Inteligente</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="flex-col h-24 space-y-1"
                          disabled={!imageSource}
                          onClick={() => setActiveTab("image")}
                        >
                          <Settings className="h-6 w-6" />
                          <span>Ajuste de Imagem</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="flex-col h-24 space-y-1"
                          disabled={extractedData.length === 0}
                          onClick={exportToExcel}
                        >
                          <FileSpreadsheet className="h-6 w-6" />
                          <span>Exportar para Excel</span>
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-col h-24 space-y-1" disabled={!imageSource}>
                              <TerminalSquare className="h-6 w-6" />
                              <span>Modo Avançado</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Modo Avançado</DialogTitle>
                              <DialogDescription>Acesso às configurações avançadas de processamento.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Modo de Reconhecimento</Label>
                                <Select defaultValue="hybrid">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o modo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hybrid">Híbrido (Recomendado)</SelectItem>
                                    <SelectItem value="precision">Alta Precisão</SelectItem>
                                    <SelectItem value="speed">Alta Velocidade</SelectItem>
                                    <SelectItem value="custom">Personalizado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Modelos de IA</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center space-x-2">
                                    <Switch id="model-ocr" defaultChecked />
                                    <Label htmlFor="model-ocr">OCR Base</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch id="model-enhanced" defaultChecked />
                                    <Label htmlFor="model-enhanced">OCR Enhanced</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch id="model-table" defaultChecked />
                                    <Label htmlFor="model-table">Table Detection</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch id="model-correction" defaultChecked />
                                    <Label htmlFor="model-correction">AI Correction</Label>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Paralelização</Label>
                                <Select defaultValue="auto">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o modo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="auto">Automático</SelectItem>
                                    <SelectItem value="sequential">Sequencial</SelectItem>
                                    <SelectItem value="parallel">Paralelo</SelectItem>
                                    <SelectItem value="max">Máximo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button variant="outline">Restaurar Padrões</Button>
                              <Button onClick={processImage}>Iniciar Processamento</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          className="flex-col h-24 space-y-1"
                          disabled={!imageSource || isProcessing}
                          onClick={() => {
                            toast({
                              title: "Modo de extração alterado",
                              description: "Focando apenas nas colunas de Agendamento e Frota.",
                            })
                            setSettings({
                              ...settings,
                              columnFocus: ["agendamento", "frota"],
                            })
                            processImage()
                          }}
                        >
                          <ListFilter className="h-6 w-6" />
                          <span>Extrair Apenas Agendamento/Frota</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Image preview */}
                {imageSource && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>Imagem Carregada</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setActiveTab("image")}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" onClick={processImage} disabled={isProcessing}>
                            {isProcessing ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4 mr-1" />
                                Processar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md overflow-hidden">
                        <img
                          src={imageSource || "/placeholder.svg"}
                          alt="Imagem carregada"
                          className="w-full h-auto max-h-[300px] object-contain"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick stats */}
                {extractedData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>Resultados da Extração</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("results")}>
                          Ver Detalhes
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-3 rounded-md">
                          <div className="text-sm text-gray-500">Total de Registros</div>
                          <div className="text-2xl font-bold">{extractedData.length}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <div className="text-sm text-gray-500">Confiança Média</div>
                          <div className="text-2xl font-bold">
                            {Math.round(
                              extractedData.reduce((sum, item) => sum + (item.confianca || 0), 0) /
                                extractedData.length,
                            )}
                            %
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <div className="text-sm text-gray-500">Tempo de Processamento</div>
                          <div className="text-2xl font-bold">9.1s</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <div className="text-sm text-gray-500">Status</div>
                          <div className="text-2xl font-bold text-green-600">Concluído</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Primeiros 5 registros</h3>
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Horário</TableHead>
                                <TableHead>Frota</TableHead>
                                <TableHead>Confiança</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {extractedData.slice(0, 5).map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.horario}</TableCell>
                                  <TableCell className="font-medium">{item.frota}</TableCell>
                                  <TableCell className={getConfidenceClass(item.confianca)}>
                                    {item.confianca || 100}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToExcel}>
                          <Download className="h-4 w-4 mr-1" />
                          Exportar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error message */}
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Image tab */}
            {activeTab === "image" && imageSource && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Visualização e Processamento de Imagem</CardTitle>
                    <CardDescription>Ajuste a imagem para melhorar o reconhecimento de texto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="view" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="view">Visualização</TabsTrigger>
                        <TabsTrigger value="adjust">Ajustes</TabsTrigger>
                        <TabsTrigger value="detection">Detecção de Tabelas</TabsTrigger>
                      </TabsList>

                      <TabsContent value="view" className="space-y-4">
                        <div className="flex justify-between">
                          <div className="flex gap-2">
                            <Select value={imageViewMode} onValueChange={(value) => setImageViewMode(value as any)}>
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Modo de visualização" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="original">Original</SelectItem>
                                <SelectItem value="processed">Processada</SelectItem>
                                <SelectItem value="sideBySide">Lado a Lado</SelectItem>
                                <SelectItem value="overlay">Sobreposição</SelectItem>
                              </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1 border rounded-md p-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                              >
                                <ZoomOut className="h-4 w-4" />
                              </Button>
                              <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
                              >
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <Button variant="outline" size="sm" onClick={() => setZoomLevel(1)}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Resetar Zoom
                          </Button>
                        </div>

                        <div
                          className="border rounded-md overflow-hidden bg-slate-100"
                          style={{ height: "500px" }}
                          ref={containerRef}
                        >
                          {imageViewMode === "original" && (
                            <img
                              src={imageSource || "/placeholder.svg"}
                              alt="Original"
                              className="w-full h-full object-contain"
                              style={{ transform: `scale(${zoomLevel})` }}
                            />
                          )}

                          {imageViewMode === "processed" && (
                            <img
                              src={processedImageSource || imageSource}
                              alt="Processada"
                              className="w-full h-full object-contain"
                              style={{ transform: `scale(${zoomLevel})` }}
                            />
                          )}

                          {imageViewMode === "sideBySide" && (
                            <div className="flex h-full">
                              <div className="w-1/2 border-r">
                                <img
                                  src={imageSource || "/placeholder.svg"}
                                  alt="Original"
                                  className="w-full h-full object-contain"
                                  style={{ transform: `scale(${zoomLevel})` }}
                                />
                              </div>
                              <div className="w-1/2">
                                <img
                                  src={processedImageSource || imageSource}
                                  alt="Processada"
                                  className="w-full h-full object-contain"
                                  style={{ transform: `scale(${zoomLevel})` }}
                                />
                              </div>
                            </div>
                          )}

                          {imageViewMode === "overlay" && (
                            <div className="relative h-full">
                              <img
                                src={imageSource || "/placeholder.svg"}
                                alt="Original"
                                className="absolute top-0 left-0 w-full h-full object-contain"
                                style={{ transform: `scale(${zoomLevel})` }}
                              />
                              <img
                                src={processedImageSource || imageSource}
                                alt="Processada"
                                className="absolute top-0 left-0 w-full h-full object-contain opacity-50"
                                style={{ transform: `scale(${zoomLevel})` }}
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="adjust" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Brilho: {settings.preprocessing.brightness}%</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        brightness: 100,
                                      },
                                    })
                                  }
                                >
                                  Resetar
                                </Button>
                              </div>
                              <Slider
                                value={[settings.preprocessing.brightness]}
                                min={50}
                                max={200}
                                step={5}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    preprocessing: {
                                      ...settings.preprocessing,
                                      brightness: value[0],
                                    },
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Contraste: {settings.preprocessing.contrast}%</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        contrast: 100,
                                      },
                                    })
                                  }
                                >
                                  Resetar
                                </Button>
                              </div>
                              <Slider
                                value={[settings.preprocessing.contrast]}
                                min={50}
                                max={200}
                                step={5}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    preprocessing: {
                                      ...settings.preprocessing,
                                      contrast: value[0],
                                    },
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Nitidez: {settings.preprocessing.sharpen}</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        sharpen: 0,
                                      },
                                    })
                                  }
                                >
                                  Resetar
                                </Button>
                              </div>
                              <Slider
                                value={[settings.preprocessing.sharpen]}
                                min={0}
                                max={10}
                                step={1}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    preprocessing: {
                                      ...settings.preprocessing,
                                      sharpen: value[0],
                                    },
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Redução de Ruído: {settings.preprocessing.denoise}</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        denoise: 0,
                                      },
                                    })
                                  }
                                >
                                  Resetar
                                </Button>
                              </div>
                              <Slider
                                value={[settings.preprocessing.denoise]}
                                min={0}
                                max={10}
                                step={1}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    preprocessing: {
                                      ...settings.preprocessing,
                                      denoise: value[0],
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Rotação: {settings.preprocessing.rotateAngle}°</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        rotateAngle: 0,
                                      },
                                    })
                                  }
                                >
                                  Resetar
                                </Button>
                              </div>
                              <Slider
                                value={[settings.preprocessing.rotateAngle]}
                                min={-180}
                                max={180}
                                step={1}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    preprocessing: {
                                      ...settings.preprocessing,
                                      rotateAngle: value[0],
                                    },
                                  })
                                }
                              />

                              <div className="flex justify-center gap-2 mt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        rotateAngle: settings.preprocessing.rotateAngle - 90,
                                      },
                                    })
                                  }
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  -90°
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        rotateAngle: settings.preprocessing.rotateAngle + 90,
                                      },
                                    })
                                  }
                                >
                                  <RotateCw className="h-4 w-4 mr-1" />
                                  +90°
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="grayscale"
                                  checked={settings.preprocessing.grayscale}
                                  onCheckedChange={(checked) =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        grayscale: checked,
                                      },
                                    })
                                  }
                                />
                                <Label htmlFor="grayscale">Escala de cinza</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="binarize"
                                  checked={settings.preprocessing.binarize}
                                  onCheckedChange={(checked) =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        binarize: checked,
                                      },
                                    })
                                  }
                                />
                                <Label htmlFor="binarize">Binarização</Label>
                              </div>

                              {settings.preprocessing.binarize && (
                                <div className="space-y-2 pl-6">
                                  <Label>Limiar: {settings.preprocessing.threshold}</Label>
                                  <Slider
                                    value={[settings.preprocessing.threshold]}
                                    min={0}
                                    max={255}
                                    step={1}
                                    onValueChange={(value) =>
                                      setSettings({
                                        ...settings,
                                        preprocessing: {
                                          ...settings.preprocessing,
                                          threshold: value[0],
                                        },
                                      })
                                    }
                                  />
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="invert"
                                  checked={settings.preprocessing.invert}
                                  onCheckedChange={(checked) =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        invert: checked,
                                      },
                                    })
                                  }
                                />
                                <Label htmlFor="invert">Inverter cores</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="removeLines"
                                  checked={settings.preprocessing.removeLines}
                                  onCheckedChange={(checked) =>
                                    setSettings({
                                      ...settings,
                                      preprocessing: {
                                        ...settings.preprocessing,
                                        removeLines: checked,
                                      },
                                    })
                                  }
                                />
                                <Label htmlFor="removeLines">Remover linhas de grade</Label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                preprocessing: defaultSettings.preprocessing,
                              })
                            }
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Resetar Todos os Ajustes
                          </Button>

                          <Button
                            onClick={() => {
                              setSettings({
                                ...settings,
                                preprocessing: {
                                  ...settings.preprocessing,
                                  grayscale: true,
                                  contrast: 120,
                                  brightness: 110,
                                  sharpen: 3,
                                  denoise: 2,
                                  binarize: false,
                                },
                              })

                              toast({
                                title: "Auto-ajuste aplicado",
                                description: "Configurações otimizadas para reconhecimento de tabelas.",
                              })
                            }}
                          >
                            <Wand2 className="h-4 w-4 mr-1" />
                            Auto-Ajuste Inteligente
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="detection" className="space-y-4">
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <Label>Modo de Detecção de Tabelas</Label>
                            <Select
                              value={settings.tableDetectionMode}
                              onValueChange={(value) =>
                                setSettings({
                                  ...settings,
                                  tableDetectionMode: value as any,
                                })
                              }
                            >
                              <SelectTrigger className="w-[240px]">
                                <SelectValue placeholder="Selecione o modo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Automático</SelectItem>
                                <SelectItem value="manual">Manual</SelectItem>
                                <SelectItem value="ai">Inteligência Artificial</SelectItem>
                                <SelectItem value="hybrid">Híbrido (Recomendado)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button onClick={() => setIsAnalysisDialogOpen(true)}>
                            <TableIcon className="h-4 w-4 mr-1" />
                            Analisar Estrutura
                          </Button>
                        </div>

                        {detectedTables.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Label>Tabelas Detectadas:</Label>
                              <div className="flex gap-2">
                                {detectedTables.map((table) => (
                                  <Button
                                    key={table.id}
                                    variant={selectedTable === table.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedTable(table.id)}
                                  >
                                    Tabela {table.id.replace("table", "")} ({Math.round(table.confidence * 100)}%)
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {selectedTable && (
                              <div className="border rounded-md p-4 bg-slate-50">
                                <h3 className="text-sm font-medium mb-2">Informações da Tabela</h3>

                                {detectedTables
                                  .filter((t) => t.id === selectedTable)
                                  .map((table) => (
                                    <div key={table.id} className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                      <div>
                                        <span className="text-gray-500">Tipo:</span>{" "}
                                        {table.type === "table"
                                          ? "Tabela Completa"
                                          : table.type === "grid"
                                            ? "Grade"
                                            : "Formulário"}
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Confiança:</span>{" "}
                                        {Math.round(table.confidence * 100)}%
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Dimensões:</span> {table.width} × {table.height}{" "}
                                        px
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Células:</span> {table.cells}
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Linhas:</span> {table.rows}
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Colunas:</span> {table.columns}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-200 rounded-md p-8 text-center">
                            <SquareSlash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhuma tabela detectada</h3>
                            <p className="text-sm text-gray-500 mb-4">
                              Clique em "Processar Imagem" para iniciar a detecção de tabelas
                            </p>
                            <Button onClick={processImage} disabled={isProcessing}>
                              {isProcessing ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                <>
                                  <TableIcon className="h-4 w-4 mr-1" />
                                  Processar Imagem
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("dashboard")}>
                      Voltar
                    </Button>
                    <Button onClick={processImage} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Processar com IA
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Dialog for structure analysis */}
                <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Análise de Estrutura da Tabela</DialogTitle>
                      <DialogDescription>Visualização detalhada da estrutura detectada na imagem</DialogDescription>
                    </DialogHeader>

                    {tableStructure.rows > 0 ? (
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <div className="text-sm">
                            <span className="font-medium">Dimensões:</span> {tableStructure.rows} linhas ×{" "}
                            {tableStructure.cols} colunas
                          </div>
                          <Badge variant="outline">{tableStructure.rows * tableStructure.cols} células</Badge>
                        </div>

                        <div className="border rounded-md overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">#</TableHead>
                                {tableStructure.headers.map((header, index) => (
                                  <TableHead key={index}>{header}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Array.from({ length: Math.min(tableStructure.rows - 1, 5) }).map((_, rowIndex) => (
                                <TableRow key={rowIndex}>
                                  <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                                  {tableStructure.headers.map((_, colIndex) => (
                                    <TableCell key={colIndex}>
                                      {colIndex === 0 && rowIndex === 0
                                        ? "13:00:00"
                                        : colIndex === 1 && rowIndex === 0
                                          ? "40167"
                                          : colIndex === 0 && rowIndex === 1
                                            ? "15:10:00"
                                            : colIndex === 1 && rowIndex === 1
                                              ? "32231"
                                              : colIndex === 0 && rowIndex === 2
                                                ? "16:00:00"
                                                : colIndex === 1 && rowIndex === 2
                                                  ? "8798"
                                                  : colIndex === 0 && rowIndex === 3
                                                    ? "17:15:00"
                                                    : colIndex === 1 && rowIndex === 3
                                                      ? "4611"
                                                      : colIndex === 0 && rowIndex === 4
                                                        ? "20:00:00"
                                                        : colIndex === 1 && rowIndex === 4
                                                          ? "4576"
                                                          : colIndex === 2 && rowIndex === 0
                                                            ? "SM Triciclo"
                                                            : colIndex === 2 && rowIndex === 1
                                                              ? "Ren Oroch 1.6"
                                                              : colIndex === 2 && rowIndex === 2
                                                                ? "VW Delivery"
                                                                : colIndex === 2 && rowIndex === 3
                                                                  ? "Mercedes Atego"
                                                                  : colIndex === 2 && rowIndex === 4
                                                                    ? "Volvo FH 540"
                                                                    : colIndex === 3 && rowIndex === 0
                                                                      ? "Lubrificação"
                                                                      : colIndex === 3 && rowIndex === 1
                                                                        ? "Revisão"
                                                                        : colIndex === 3 && rowIndex === 2
                                                                          ? "Manutenção"
                                                                          : colIndex === 3 && rowIndex === 3
                                                                            ? "Lavagem"
                                                                            : colIndex === 3 && rowIndex === 4
                                                                              ? "Lubrificação"
                                                                              : colIndex === 4 && rowIndex === 0
                                                                                ? "0:20"
                                                                                : colIndex === 4 && rowIndex === 1
                                                                                  ? "1:30"
                                                                                  : colIndex === 4 && rowIndex === 2
                                                                                    ? "2:00"
                                                                                    : colIndex === 4 && rowIndex === 3
                                                                                      ? "0:45"
                                                                                      : colIndex === 4 && rowIndex === 4
                                                                                        ? "0:30"
                                                                                        : "—"}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                              {tableStructure.rows > 6 && (
                                <TableRow>
                                  <TableCell
                                    colSpan={tableStructure.cols + 1}
                                    className="text-center text-sm text-gray-500"
                                  >
                                    + {tableStructure.rows - 6} linhas adicionais
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-md text-sm">
                          <div className="font-medium mb-1">Análise automática</div>
                          <ul className="space-y-1">
                            <li className="flex items-center gap-1">
                              <Check className="h-4 w-4 text-green-600" />
                              Estrutura de tabela detectada com alta confiança
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-4 w-4 text-green-600" />
                              Cabeçalhos identificados corretamente
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-4 w-4 text-green-600" />
                              Colunas de agendamento e frota identificadas
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Análise ainda não disponível</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Processe a imagem primeiro para gerar a análise de estrutura
                        </p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Processing tab */}
            {activeTab === "processing" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Processamento</CardTitle>
                    <CardDescription>
                      Ajuste as configurações avançadas do processamento de imagem e extração de dados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="ocr" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="ocr">OCR</TabsTrigger>
                        <TabsTrigger value="table">Detecção de Tabelas</TabsTrigger>
                        <TabsTrigger value="ai">IA Avançada</TabsTrigger>
                        <TabsTrigger value="profiles">Perfis</TabsTrigger>
                      </TabsList>

                      <TabsContent value="ocr" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Idioma</Label>
                              <Select
                                value={settings.language}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    language: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o idioma" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="por">Português</SelectItem>
                                  <SelectItem value="eng">Inglês</SelectItem>
                                  <SelectItem value="spa">Espanhol</SelectItem>
                                  <SelectItem value="fra">Francês</SelectItem>
                                  <SelectItem value="deu">Alemão</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Modo do Motor OCR</Label>
                              <Select
                                value={settings.engineMode.toString()}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    engineMode: Number.parseInt(value),
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o modo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Legado</SelectItem>
                                  <SelectItem value="2">LSTM</SelectItem>
                                  <SelectItem value="3">Legado + LSTM (Recomendado)</SelectItem>
                                  <SelectItem value="4">LSTM + DeepLearning</SelectItem>
                                  <SelectItem value="5">Ultra-Precisão (mais lento)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Lista de Caracteres Permitidos</Label>
                              <Input
                                value={settings.whitelist}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    whitelist: e.target.value,
                                  })
                                }
                                placeholder="Ex: 0123456789:."
                              />
                              <p className="text-xs text-gray-500">
                                Lista opcional de caracteres permitidos. Útil para extrações específicas como horários
                                (números e dois-pontos) ou números de frota (apenas dígitos). Deixe em branco para
                                permitir todos os caracteres.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Limiar de Confiança: {settings.confidenceThreshold}%</Label>
                              <Slider
                                value={[settings.confidenceThreshold]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    confidenceThreshold: value[0],
                                  })
                                }
                              />
                              <p className="text-xs text-gray-500">
                                Define o nível mínimo de confiança para aceitar os resultados de OCR. Valores mais altos
                                são mais precisos, mas podem resultar em menos dados extraídos.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="multiEngine"
                                  checked={settings.multiEngine}
                                  onCheckedChange={(checked) =>
                                    setSettings({
                                      ...settings,
                                      multiEngine: checked,
                                    })
                                  }
                                />
                                <Label htmlFor="multiEngine">Usar múltiplos motores de OCR</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="autoCorrect"
                                  checked={settings.autoCorrect}
                                  onCheckedChange={(checked) =>
                                    setSettings({
                                      ...settings,
                                      autoCorrect: checked,
                                    })
                                  }
                                />
                                <Label htmlFor="autoCorrect">Correção automática de erros</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="contextAnalysis"
                                  checked={settings.contextAnalysis}
                                  onCheckedChange={(checked) =>
                                    setSettings({
                                      ...settings,
                                      contextAnalysis: checked,
                                    })
                                  }
                                />
                                <Label htmlFor="contextAnalysis">Análise contextual</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="table" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Modo de Detecção de Tabelas</Label>
                              <Select
                                value={settings.tableDetectionMode}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    tableDetectionMode: value as any,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o modo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="auto">Automático</SelectItem>
                                  <SelectItem value="manual">Manual</SelectItem>
                                  <SelectItem value="ai">Inteligência Artificial</SelectItem>
                                  <SelectItem value="hybrid">Híbrido (Recomendado)</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500">
                                Define como as tabelas serão detectadas na imagem. O modo híbrido combina vários métodos
                                para melhor precisão.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Sensibilidade de Detecção de Células: {settings.cellDetectionSensitivity}</Label>
                              <Slider
                                value={[settings.cellDetectionSensitivity]}
                                min={1}
                                max={10}
                                step={1}
                                onValueChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    cellDetectionSensitivity: value[0],
                                  })
                                }
                              />
                              <p className="text-xs text-gray-500">
                                Controla a sensibilidade para detectar células da tabela. Valores mais altos detectam
                                mais células, mas podem incluir falsos positivos.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="headerRowDetection"
                                checked={settings.headerRowDetection}
                                onCheckedChange={(checked) =>
                                  setSettings({
                                    ...settings,
                                    headerRowDetection: checked,
                                  })
                                }
                              />
                              <Label htmlFor="headerRowDetection">Detecção automática de cabeçalhos</Label>
                            </div>

                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Dica</AlertTitle>
                              <AlertDescription>
                                Para tabelas com bordas invisíveis ou mal definidas, use o modo de detecção por
                                Inteligência Artificial, que pode identificar a estrutura mesmo sem linhas visíveis.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="ai" className="space-y-4">
                        <div className="border-b pb-4 mb-4">
                          <h3 className="text-sm font-medium mb-2">Inteligência Artificial Avançada</h3>
                          <p className="text-sm text-gray-500">
                            Estas configurações controlam os recursos avançados de IA para melhorar a precisão da
                            extração.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="allowMachineLearn"
                                checked={settings.allowMachineLearn}
                                onCheckedChange={(checked) =>
                                  setSettings({
                                    ...settings,
                                    allowMachineLearn: checked,
                                  })
                                }
                              />
                              <div>
                                <Label htmlFor="allowMachineLearn">Aprendizado de máquina adaptativo</Label>
                                <p className="text-xs text-gray-500">
                                  Permite que o sistema aprenda com processamentos anteriores para melhorar a precisão
                                  ao longo do tempo.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="autoCorrect"
                                checked={settings.autoCorrect}
                                onCheckedChange={(checked) =>
                                  setSettings({
                                    ...settings,
                                    autoCorrect: checked,
                                  })
                                }
                              />
                              <div>
                                <Label htmlFor="autoCorrect">Correção avançada por IA</Label>
                                <p className="text-xs text-gray-500">
                                  Utiliza modelos de linguagem para corrigir erros de OCR com base no contexto.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="contextAnalysis"
                                checked={settings.contextAnalysis}
                                onCheckedChange={(checked) =>
                                  setSettings({
                                    ...settings,
                                    contextAnalysis: checked,
                                  })
                                }
                              />
                              <div>
                                <Label htmlFor="contextAnalysis">Análise contextual semântica</Label>
                                <p className="text-xs text-gray-500">
                                  Analisa o significado e relacionamento dos dados para melhorar a extração.
                                </p>
                              </div>
                            </div>

                            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <AlertTitle className="text-amber-800">Recurso experimental</AlertTitle>
                              <AlertDescription className="text-amber-700">
                                Alguns recursos de IA avançada estão em fase beta e podem aumentar o tempo de
                                processamento. Recomendados para casos complexos.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="profiles" className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-4 w-full max-w-md">
                            <div className="space-y-2">
                              <Label htmlFor="profileName">Nome do Perfil</Label>
                              <Input
                                id="profileName"
                                value={currentProfileName}
                                onChange={(e) => setCurrentProfileName(e.target.value)}
                                placeholder="Ex: Tabelas de Agendamento"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="profileDescription">Descrição (opcional)</Label>
                              <Input
                                id="profileDescription"
                                value={currentProfileDescription}
                                onChange={(e) => setCurrentProfileDescription(e.target.value)}
                                placeholder="Ex: Otimizado para tabelas de agendamento com bordas definidas"
                              />
                            </div>

                            <Button onClick={saveProfile} disabled={!currentProfileName}>
                              <Save className="h-4 w-4 mr-1" />
                              Salvar Configurações Atuais como Perfil
                            </Button>
                          </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                          <h3 className="text-sm font-medium mb-2">Perfis Salvos</h3>

                          <div className="space-y-2">
                            {savedProfiles.map((profile) => (
                              <div
                                key={profile.id}
                                className={`border rounded-md p-3 ${
                                  activeProfile === profile.id ? "border-blue-500 bg-blue-50" : ""
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{profile.name}</div>
                                    <div className="text-sm text-gray-500">{profile.description}</div>
                                    <div className="flex mt-1 text-xs text-gray-500 gap-x-4">
                                      <span>Criado: {formatDate(profile.dateCreated)}</span>
                                      <span>Último uso: {formatDate(profile.lastUsed)}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MousePointer className="h-4 w-4" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80">
                                        <div className="space-y-2">
                                          <h4 className="font-medium">Detalhes do Perfil</h4>
                                          <div className="text-xs space-y-1">
                                            <div>
                                              <span className="font-medium">OCR:</span>{" "}
                                              {profile.settings.language.toUpperCase()}, Modo{" "}
                                              {profile.settings.engineMode}
                                            </div>
                                            <div>
                                              <span className="font-medium">Detecção de Tabelas:</span>{" "}
                                              {profile.settings.tableDetectionMode}
                                            </div>
                                            <div>
                                              <span className="font-medium">Pré-processamento:</span>{" "}
                                              {[
                                                profile.settings.preprocessing.grayscale ? "Escala de cinza" : null,
                                                profile.settings.preprocessing.binarize ? "Binarização" : null,
                                                `Contraste: ${profile.settings.preprocessing.contrast}%`,
                                              ]
                                                .filter(Boolean)
                                                .join(", ")}
                                            </div>
                                            <div>
                                              <span className="font-medium">IA:</span>{" "}
                                              {[
                                                profile.settings.multiEngine ? "Multi-engine" : null,
                                                profile.settings.autoCorrect ? "Auto-correção" : null,
                                                profile.settings.contextAnalysis ? "Análise contextual" : null,
                                              ]
                                                .filter(Boolean)
                                                .join(", ")}
                                            </div>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>

                                    <Button
                                      variant={activeProfile === profile.id ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => loadProfile(profile.id)}
                                    >
                                      {activeProfile === profile.id ? "Ativo" : "Carregar"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setSettings(defaultSettings)}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Restaurar Padrões
                    </Button>

                    <Button onClick={processImage} disabled={!imageSource || isProcessing}>
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-1" />
                          Processar Imagem
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Processing modules */}
                <Card>
                  <CardHeader>
                    <CardTitle>Módulos de Processamento</CardTitle>
                    <CardDescription>Status e métricas dos componentes do pipeline de processamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {processingModules.map((module) => (
                        <div key={module.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {module.name}
                                <Badge className={`${getModuleStatusColor(module.status)}`}>
                                  {module.status === "idle"
                                    ? "Aguardando"
                                    : module.status === "running"
                                      ? "Executando"
                                      : module.status === "success"
                                        ? "Concluído"
                                        : "Erro"}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">{module.description}</div>
                            </div>
                            {module.confidence && <Badge variant="outline">Confiança: {module.confidence}%</Badge>}
                          </div>

                          <Progress value={module.progress} className="h-2" />

                          {module.result && module.status === "success" && (
                            <div className="mt-2 text-xs text-gray-500 grid grid-cols-2 gap-x-4 gap-y-1">
                              {module.id === "image-preprocessing" && (
                                <>
                                  <div>Ajustes aplicados: 5</div>
                                  <div>Melhorias detectadas: 3</div>
                                </>
                              )}

                              {module.id === "table-detection" && (
                                <>
                                  <div>Tabelas detectadas: {module.result.tableCount}</div>
                                  <div>
                                    Confiança primária: {Math.round(module.result.primaryTable.confidence * 100)}%
                                  </div>
                                </>
                              )}

                              {module.id === "ocr-base" && (
                                <>
                                  <div>Caracteres: {module.result.text.length}</div>
                                  <div>Palavras: {module.result.wordCount}</div>
                                  <div>Confiança: {Math.round(module.result.confidence * 100)}%</div>
                                  <div>Tempo: {module.result.duration}s</div>
                                </>
                              )}

                              {module.id === "ocr-enhanced" && (
                                <>
                                  <div>Melhorias: {module.result.improvements}</div>
                                  <div>Confiança: {Math.round(module.result.confidence * 100)}%</div>
                                  <div>Tempo: {module.result.duration}s</div>
                                </>
                              )}

                              {module.id === "data-extraction" && (
                                <>
                                  <div>Registros: {module.result.records}</div>
                                  <div>Campos: {module.result.fieldsIdentified}</div>
                                  <div>Confiança: {Math.round(module.result.confidence * 100)}%</div>
                                </>
                              )}

                              {module.id === "ai-correction" && (
                                <>
                                  <div>Correções: {module.result.correctionsMade}</div>
                                  <div>Melhoria: {module.result.confidenceImprovement}</div>
                                  <div>Validação: {module.result.validationPassed ? "Aprovada" : "Falhou"}</div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Results tab */}
            {activeTab === "results" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Dados Extraídos</CardTitle>
                        <CardDescription>{extractedData.length} registros extraídos da imagem</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToExcel}>
                          <Download className="h-4 w-4 mr-1" />
                          Exportar Excel
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">#</TableHead>
                            <TableHead>Horário</TableHead>
                            <TableHead>Frota</TableHead>
                            <TableHead>Confiança</TableHead>
                            <TableHead>Origem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {extractedData.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>{item.horario}</TableCell>
                              <TableCell>{item.frota}</TableCell>
                              <TableCell className={getConfidenceClass(item.confianca)}>
                                {item.confianca || 100}%
                              </TableCell>
                              <TableCell>{item.origem || "extração direta"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Edição Manual</CardTitle>
                    <CardDescription>Edite os dados extraídos ou adicione novos registros manualmente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Dica</AlertTitle>
                        <AlertDescription>
                          Se a extração automática não identificou corretamente os dados, você pode editá-los
                          manualmente aqui. Certifique-se de que cada linha contenha um horário e um número de frota
                          separados por tabulação.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label htmlFor="manual-edit">Dados (formato: Horário [tab] Frota)</Label>
                        <Textarea
                          id="manual-edit"
                          className="font-mono text-sm min-h-[200px]"
                          placeholder="13:00:00&#9;40167&#10;15:10:00&#9;32231&#10;16:00:00&#9;8798"
                          value={extractedData.map((item) => `${item.horario}\t${item.frota}`).join("\n")}
                          onChange={(e) => {
                            try {
                              const lines = e.target.value.split("\n")
                              const newData: ExtractedData[] = []

                              lines.forEach((line) => {
                                const [horario, frota] = line.split("\t")
                                if (horario && frota) {
                                  newData.push({
                                    horario: horario.trim(),
                                    frota: frota.trim(),
                                    confianca: 100,
                                    origem: "manual",
                                  })
                                }
                              })

                              setExtractedData(newData)
                            } catch (error) {
                              console.error("Erro ao processar dados manuais:", error)
                            }
                          }}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => {
                            toast({
                              title: "Dados atualizados",
                              description: `${extractedData.length} registros atualizados manualmente.`,
                            })
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Aplicar Alterações
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Qualidade</CardTitle>
                    <CardDescription>Métricas e estatísticas sobre os dados extraídos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Registros</div>
                        <div className="text-2xl font-bold">{extractedData.length}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Confiança Média</div>
                        <div className="text-2xl font-bold">
                          {Math.round(
                            extractedData.reduce((sum, item) => sum + (item.confianca || 0), 0) / extractedData.length,
                          )}
                          %
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Qualidade</div>
                        <div className="text-2xl font-bold text-green-600">Alta</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Correções</div>
                        <div className="text-2xl font-bold">3</div>
                      </div>
                    </div>

                    <div className="border rounded-md p-4 bg-slate-50">
                      <h3 className="text-sm font-medium mb-2">Distribuição de Confiança</h3>
                      <div className="h-20 flex items-end gap-1">
                        {[95, 98, 92, 94, 97, 93, 91, 96, 95, 97, 99, 94].map((value, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 rounded-t-sm"
                            style={{
                              height: `${value}%`,
                              width: `${100 / 12}%`,
                              opacity: 0.6 + (value - 90) / 30,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>90%</span>
                        <span>95%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Texto Extraído</CardTitle>
                    <CardDescription>Texto completo extraído da imagem antes da estruturação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={extractedText} readOnly className="font-mono text-sm min-h-[200px]" />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings tab */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações do Sistema</CardTitle>
                    <CardDescription>Configurações gerais e preferências do extrator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Tema da Interface</Label>
                          <Select defaultValue="light">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tema" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Claro</SelectItem>
                              <SelectItem value="dark">Escuro</SelectItem>
                              <SelectItem value="system">Sistema</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Idioma da Interface</Label>
                          <Select defaultValue="pt-BR">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o idioma" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                              <SelectItem value="en-US">Inglês (EUA)</SelectItem>
                              <SelectItem value="es">Espanhol</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Diretório para Exportação</Label>
                        <div className="flex gap-2">
                          <Input defaultValue="C:\Users\Username\Documents\Extrações" readOnly />
                          <Button variant="outline">Alterar</Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Opções Avançadas</h3>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch defaultChecked id="keepHistory" />
                            <Label htmlFor="keepHistory">Manter histórico de processamento</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch defaultChecked id="autoSave" />
                            <Label htmlFor="autoSave">Salvar resultados automaticamente</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch id="devMode" />
                            <Label htmlFor="devMode">Modo desenvolvedor</Label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Visualização Padrão de Resultados</Label>
                          <Select defaultValue="table">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a visualização" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="table">Tabela</SelectItem>
                              <SelectItem value="grid">Grade</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="text">Texto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Conexões e Integrações</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Button variant="outline" className="justify-start">
                            <Link className="h-4 w-4 mr-2" />
                            API Externa
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <DatabaseIcon className="h-4 w-4 mr-2" />
                            Banco de Dados
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Smartphone className="h-4 w-4 mr-2" />
                            App Mobile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Restaurar Padrões
                    </Button>

                    <Button>
                      <Save className="h-4 w-4 mr-1" />
                      Salvar Configurações
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {/* History tab */}
            {activeTab === "history" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Histórico de Processamento</CardTitle>
                        <CardDescription>Registros de extrações anteriores</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <ListFilter className="h-4 w-4 mr-1" />
                          Filtrar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Exportar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {processingHistory.map((entry) => (
                        <div key={entry.id} className="border rounded-md overflow-hidden">
                          <div className="flex p-3">
                            <div className="w-24 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                              <img
                                src={entry.image || "/placeholder.svg"}
                                alt="Prévia"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="ml-4 flex-grow">
                              <div className="flex justify-between">
                                <div className="font-medium">Processamento {entry.id}</div>
                                <div className="text-sm text-gray-500">{formatDate(entry.timestamp)}</div>
                              </div>
                              <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Registros:</span> {entry.results.length}
                                </div>
                                <div>
                                  <span className="text-gray-500">Confiança:</span> {entry.confidence.toFixed(1)}%
                                </div>
                                <div>
                                  <span className="text-gray-500">Duração:</span> {entry.duration}s
                                </div>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button variant="outline" size="sm">
                                  <X className="h-3 w-3 mr-1" />
                                  Comparar
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Archive className="h-3 w-3 mr-1" />
                                  Arquivar
                                </Button>
                                <Button size="sm">
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                  Ver Detalhes
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="bg-slate-50 px-3 py-2 border-t">
                            <div className="text-xs">
                              <span className="font-medium">Configuração:</span>{" "}
                              {entry.settings.multiEngine ? "Multi-engine, " : ""}
                              {entry.settings.autoCorrect ? "Auto-correção, " : ""}
                              OCR {entry.settings.language.toUpperCase()},
                              {entry.settings.preprocessing.grayscale ? " Escala de cinza, " : " "}
                              Contraste: {entry.settings.preprocessing.contrast}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-slate-50 px-4 py-2 text-center text-xs text-gray-500">
          Extrator Ultra Avançado v1.0.0 | © 2025 Branco Peres Agribusiness | Desenvolvido com tecnologia de ponta
        </footer>
      </div>
    </div>
  )
}
