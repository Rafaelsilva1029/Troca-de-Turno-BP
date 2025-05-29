"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Upload,
  ImageIcon,
  FileText,
  FileSpreadsheet,
  Download,
  Copy,
  TableIcon,
  RefreshCw,
  Sparkles,
  Brain,
  Target,
  Zap,
  Activity,
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  Code,
  BarChart3,
  TrendingUp,
  Eye,
  Columns,
  Layers,
  FileIcon,
  Printer,
  Database,
  Wand2,
} from "lucide-react"
import * as XLSX from "xlsx"

// Tipos
interface ExtractedData {
  id: string
  horario: string
  frota: string
  confianca: number
  origem: string
  validado?: boolean
}

interface ExtractionSource {
  id: string
  name: string
  type: "excel" | "pdf" | "image" | "text"
  icon: React.ReactNode
  file?: File
  preview?: string
  content?: string
  sheets?: string[]
  pages?: number
  activeSheet?: string
  activePage?: number
  extracted?: boolean
}

interface ExtractionProfile {
  id: string
  name: string
  description: string
  targetColumns: {
    horario: string[]
    frota: string[]
  }
  dateCreated: string
  lastUsed: string
}

interface ProcessingOptions {
  removeEmptyRows: boolean
  trimWhitespace: boolean
  convertToUppercase: boolean
  validateFormat: boolean
  detectDuplicates: boolean
  sortByTime: boolean
  filterRefeicao: boolean
}

// Perfis de extração pré-definidos
const defaultProfiles: ExtractionProfile[] = [
  {
    id: "agendamento-frota",
    name: "Agendamento e Frota",
    description: "Extrai colunas de horário e número de frota",
    targetColumns: {
      horario: ["horário", "agendamento", "hora", "time"],
      frota: ["frota", "veículo", "veiculo", "carro", "caminhão", "caminhao", "id"],
    },
    dateCreated: "2025-05-01T10:00:00Z",
    lastUsed: "2025-05-27T15:30:00Z",
  },
  {
    id: "programacao-turno",
    name: "Programação de Turno",
    description: "Extrai dados de programação de turno",
    targetColumns: {
      horario: ["horário", "hora início", "hora inicio", "início", "inicio"],
      frota: ["frota", "veículo", "veiculo", "equipamento", "id"],
    },
    dateCreated: "2025-05-10T14:20:00Z",
    lastUsed: "2025-05-25T09:15:00Z",
  },
]

// Opções de processamento padrão
const defaultProcessingOptions: ProcessingOptions = {
  removeEmptyRows: true,
  trimWhitespace: true,
  convertToUppercase: false,
  validateFormat: true,
  detectDuplicates: true,
  sortByTime: true,
  filterRefeicao: true,
}

export function MultiFormatExtractor() {
  // Estados principais
  const [sources, setSources] = useState<ExtractionSource[]>([])
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [activeTab, setActiveTab] = useState("upload")
  const [extractedText, setExtractedText] = useState("")
  const [profiles, setProfiles] = useState<ExtractionProfile[]>(defaultProfiles)
  const [activeProfile, setActiveProfile] = useState<string>("agendamento-frota")
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>(defaultProcessingOptions)
  const [manualEditMode, setManualEditMode] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [extractionLogs, setExtractionLogs] = useState<string[]>([])
  const [showColumnMappingDialog, setShowColumnMappingDialog] = useState(false)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<string>("excel")

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  // Função para adicionar log
  const addLog = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    const icon = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
    }[type]

    setExtractionLogs((prev) => [`${timestamp} ${icon} ${message}`, ...prev].slice(0, 100))
  }

  // Função para adicionar uma nova fonte
  const addSource = (source: ExtractionSource) => {
    setSources((prev) => [...prev, source])
    setActiveSource(source.id)
    addLog(`Nova fonte adicionada: ${source.name} (${source.type})`, "success")
  }

  // Upload de arquivo de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string

      const newSource: ExtractionSource = {
        id: `img-${Date.now()}`,
        name: file.name,
        type: "image",
        icon: <ImageIcon className="h-4 w-4" />,
        file: file,
        preview: imageDataUrl,
      }

      addSource(newSource)

      toast({
        title: "Imagem carregada",
        description: `${file.name} está pronta para processamento.`,
      })
    }
    reader.readAsDataURL(file)
  }

  // Upload de arquivo PDF
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      })
      return
    }

    // Em uma implementação real, usaríamos uma biblioteca como pdf.js
    // para extrair o conteúdo e o número de páginas
    const simulatedPages = Math.floor(Math.random() * 5) + 1

    const newSource: ExtractionSource = {
      id: `pdf-${Date.now()}`,
      name: file.name,
      type: "pdf",
      icon: <FileText className="h-4 w-4" />,
      file: file,
      pages: simulatedPages,
      activePage: 1,
    }

    addSource(newSource)

    toast({
      title: "PDF carregado",
      description: `${file.name} (${simulatedPages} páginas) está pronto para processamento.`,
    })
  }

  // Upload de arquivo Excel
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (
      !file.type.includes("sheet") &&
      !file.type.includes("excel") &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo Excel.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        const newSource: ExtractionSource = {
          id: `excel-${Date.now()}`,
          name: file.name,
          type: "excel",
          icon: <FileSpreadsheet className="h-4 w-4" />,
          file: file,
          sheets: workbook.SheetNames,
          activeSheet: workbook.SheetNames[0],
        }

        addSource(newSource)

        // Detectar colunas disponíveis na primeira planilha
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]

        if (jsonData.length > 0) {
          const headers = jsonData[0].map((h: any) => String(h || "").trim())
          setAvailableColumns(headers.filter(Boolean))

          // Tentar mapear automaticamente
          const mapping: Record<string, string> = {}
          const profile = profiles.find((p) => p.id === activeProfile)

          if (profile) {
            headers.forEach((header: string, index: number) => {
              const headerLower = header.toLowerCase()

              // Verificar se é uma coluna de horário
              if (profile.targetColumns.horario.some((h) => headerLower.includes(h))) {
                mapping["horario"] = header
              }

              // Verificar se é uma coluna de frota
              if (profile.targetColumns.frota.some((f) => headerLower.includes(f))) {
                mapping["frota"] = header
              }
            })

            setColumnMapping(mapping)
          }
        }

        toast({
          title: "Excel carregado",
          description: `${file.name} (${workbook.SheetNames.length} planilhas) está pronto para processamento.`,
        })
      } catch (error) {
        console.error("Erro ao ler arquivo Excel:", error)
        toast({
          title: "Erro ao ler arquivo",
          description: "Não foi possível processar o arquivo Excel.",
          variant: "destructive",
        })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Processar fonte ativa
  const processActiveSource = async () => {
    if (!activeSource) {
      toast({
        title: "Nenhuma fonte selecionada",
        description: "Por favor, selecione uma fonte para processar.",
        variant: "destructive",
      })
      return
    }

    const source = sources.find((s) => s.id === activeSource)
    if (!source) return

    setIsProcessing(true)
    setProcessingProgress(0)
    setExtractedData([])
    setExtractionLogs([])
    setProcessingStatus("Iniciando processamento...")

    try {
      addLog(`Iniciando processamento de ${source.name}`, "info")

      switch (source.type) {
        case "excel":
          await processExcelSource(source)
          break
        case "pdf":
          await processPdfSource(source)
          break
        case "image":
          await processImageSource(source)
          break
        case "text":
          await processTextSource(source)
          break
      }

      // Marcar fonte como extraída
      setSources((prev) => prev.map((s) => (s.id === source.id ? { ...s, extracted: true } : s)))

      // Mudar para aba de resultados
      setActiveTab("results")
    } catch (error) {
      console.error("Erro no processamento:", error)
      addLog(`Erro ao processar ${source.name}: ${error}`, "error")

      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar a fonte.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(100)
      setProcessingStatus("Processamento concluído")
    }
  }

  // Processar fonte Excel
  const processExcelSource = async (source: ExtractionSource) => {
    if (!source.file || !source.activeSheet) {
      throw new Error("Arquivo Excel ou planilha ativa não definidos")
    }

    setProcessingStatus("Lendo arquivo Excel...")
    await simulateProgress(20)

    const reader = new FileReader()

    const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(source.file as File)
    })

    setProcessingStatus("Processando dados da planilha...")
    await simulateProgress(40)

    const data = new Uint8Array(fileData)
    const workbook = XLSX.read(data, { type: "array" })
    const worksheet = workbook.Sheets[source.activeSheet]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[]

    setProcessingStatus("Extraindo dados relevantes...")
    await simulateProgress(60)

    // Verificar mapeamento de colunas
    if (!columnMapping.horario || !columnMapping.frota) {
      // Se não tiver mapeamento, tentar detectar automaticamente
      const headers = Object.keys(jsonData[0] || {})
      const profile = profiles.find((p) => p.id === activeProfile)

      if (profile) {
        const mapping: Record<string, string> = {}

        headers.forEach((header) => {
          const headerLower = header.toLowerCase()

          // Verificar se é uma coluna de horário
          if (profile.targetColumns.horario.some((h) => headerLower.includes(h))) {
            mapping["horario"] = header
          }

          // Verificar se é uma coluna de frota
          if (profile.targetColumns.frota.some((f) => headerLower.includes(f))) {
            mapping["frota"] = header
          }
        })

        if (mapping.horario && mapping.frota) {
          setColumnMapping(mapping)
        } else {
          // Se não conseguir detectar, mostrar diálogo de mapeamento
          setAvailableColumns(headers)
          setShowColumnMappingDialog(true)
          throw new Error("Mapeamento de colunas necessário")
        }
      }
    }

    // Extrair dados com base no mapeamento
    const extractedItems: ExtractedData[] = []

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const horario = row[columnMapping.horario]
      const frota = row[columnMapping.frota]

      if (horario && frota) {
        // Aplicar opções de processamento
        const horarioStr = String(horario).trim()
        const frotaStr = String(frota).trim()

        // Validar formato de horário
        const isValidHorario = /^\d{1,2}:\d{2}(:\d{2})?$/.test(horarioStr)

        // Validar formato de frota (números)
        const isValidFrota = /^\d+$/.test(frotaStr)

        // Filtrar linhas de refeição
        if (
          processingOptions.filterRefeicao &&
          (horarioStr.toLowerCase().includes("refeição") || frotaStr.toLowerCase().includes("refeição"))
        ) {
          continue
        }

        // Aplicar validação de formato se necessário
        if (processingOptions.validateFormat && (!isValidHorario || !isValidFrota)) {
          addLog(`Linha ${i + 1}: Formato inválido - Horário: ${horarioStr}, Frota: ${frotaStr}`, "warning")
          continue
        }

        extractedItems.push({
          id: `excel-${Date.now()}-${i}`,
          horario: horarioStr,
          frota: frotaStr,
          confianca: 98, // Alta confiança para dados de Excel
          origem: "excel",
          validado: true,
        })
      }
    }

    setProcessingStatus("Aplicando processamento adicional...")
    await simulateProgress(80)

    // Aplicar processamento adicional
    let processedData = [...extractedItems]

    // Remover duplicatas
    if (processingOptions.detectDuplicates) {
      const uniqueMap = new Map<string, ExtractedData>()
      processedData.forEach((item) => {
        const key = `${item.horario}-${item.frota}`
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item)
        }
      })
      processedData = Array.from(uniqueMap.values())
    }

    // Ordenar por horário
    if (processingOptions.sortByTime) {
      processedData.sort((a, b) => {
        // Converter para segundos para comparação
        const getSeconds = (timeStr: string) => {
          const parts = timeStr.split(":").map(Number)
          return parts[0] * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
        }
        return getSeconds(a.horario) - getSeconds(b.horario)
      })
    }

    setExtractedData(processedData)

    addLog(`Extração concluída: ${processedData.length} registros encontrados`, "success")

    toast({
      title: "Extração concluída",
      description: `${processedData.length} registros extraídos do Excel.`,
    })
  }

  // Processar fonte PDF
  const processPdfSource = async (source: ExtractionSource) => {
    setProcessingStatus("Processando arquivo PDF...")
    await simulateProgress(30)

    // Simulação de extração de PDF
    // Em uma implementação real, usaríamos uma biblioteca como pdf.js

    // Texto simulado do PDF
    const simulatedText = `Agendamento    Frota     Modelo             Serviço        Tempo
13:00:00      40167     SM Triciclo        Lubrificação   0:20
15:10:00      32231     Ren Oroch 1.6      Revisão        1:30
16:00:00      8798      VW Delivery        Manutenção     2:00
17:15:00      4611      Mercedes Atego     Lavagem        0:45
REFEIÇÃO      -         -                  -              1:00
20:00:00      4576      Volvo FH 540       Lubrificação   0:30
22:30:00      4599      Scania R450        Manutenção     1:15
23:30:00      4595      Volvo VM 270       Revisão        1:00
00:30:00      4580      VW Constellation   Lubrificação   0:25
01:00:00      4566      Mercedes Axor      Lavagem        0:40
04:00:00      4602      Volvo FH 460       Manutenção     1:45
05:00:00      4620      Scania P310        Revisão        1:30
06:00:00      8818      Iveco Daily        Lubrificação   0:20`

    setExtractedText(simulatedText)

    setProcessingStatus("Extraindo dados do texto...")
    await simulateProgress(60)

    // Processar o texto extraído
    const lines = simulatedText.split("\n")
    const extractedItems: ExtractedData[] = []

    // Pular a linha de cabeçalho
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Dividir por espaços múltiplos
      const parts = line.split(/\s{2,}/)

      if (parts.length >= 2) {
        const horario = parts[0].trim()
        const frota = parts[1].trim()

        // Aplicar filtros
        if (processingOptions.filterRefeicao && (horario.toLowerCase().includes("refeição") || frota === "-")) {
          continue
        }

        // Validar formato
        const isValidHorario = /^\d{1,2}:\d{2}(:\d{2})?$/.test(horario)
        const isValidFrota = /^\d+$/.test(frota)

        if (processingOptions.validateFormat && (!isValidHorario || !isValidFrota)) {
          continue
        }

        extractedItems.push({
          id: `pdf-${Date.now()}-${i}`,
          horario,
          frota,
          confianca: 90,
          origem: "pdf",
          validado: true,
        })
      }
    }

    setProcessingStatus("Finalizando processamento...")
    await simulateProgress(90)

    setExtractedData(extractedItems)

    addLog(`Extração de PDF concluída: ${extractedItems.length} registros encontrados`, "success")

    toast({
      title: "Extração concluída",
      description: `${extractedItems.length} registros extraídos do PDF.`,
    })
  }

  // Processar fonte de imagem
  const processImageSource = async (source: ExtractionSource) => {
    setProcessingStatus("Processando imagem com OCR...")
    await simulateProgress(40)

    // Simulação de OCR
    // Em uma implementação real, usaríamos uma biblioteca como Tesseract.js

    // Texto simulado do OCR
    const simulatedText = `Agendamento    Frota     Modelo             Serviço        Tempo
13:00:00      40167     SM Triciclo        Lubrificação   0:20
15:10:00      32231     Ren Oroch 1.6      Revisão        1:30
16:00:00      8798      VW Delivery        Manutenção     2:00
17:15:00      4611      Mercedes Atego     Lavagem        0:45
REFEIÇÃO      -         -                  -              1:00
20:00:00      4576      Volvo FH 540       Lubrificação   0:30
22:30:00      4599      Scania R450        Manutenção     1:15
23:30:00      4595      Volvo VM 270       Revisão        1:00
00:30:00      4580      VW Constellation   Lubrificação   0:25
01:00:00      4566      Mercedes Axor      Lavagem        0:40
04:00:00      4602      Volvo FH 460       Manutenção     1:45
05:00:00      4620      Scania P310        Revisão        1:30
06:00:00      8818      Iveco Daily        Lubrificação   0:20`

    setExtractedText(simulatedText)

    setProcessingStatus("Analisando estrutura da tabela...")
    await simulateProgress(60)

    // Processar o texto extraído
    const lines = simulatedText.split("\n")
    const extractedItems: ExtractedData[] = []

    // Pular a linha de cabeçalho
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Dividir por espaços múltiplos
      const parts = line.split(/\s{2,}/)

      if (parts.length >= 2) {
        const horario = parts[0].trim()
        const frota = parts[1].trim()

        // Aplicar filtros
        if (processingOptions.filterRefeicao && (horario.toLowerCase().includes("refeição") || frota === "-")) {
          continue
        }

        // Validar formato
        const isValidHorario = /^\d{1,2}:\d{2}(:\d{2})?$/.test(horario)
        const isValidFrota = /^\d+$/.test(frota)

        if (processingOptions.validateFormat && (!isValidHorario || !isValidFrota)) {
          continue
        }

        extractedItems.push({
          id: `img-${Date.now()}-${i}`,
          horario,
          frota,
          confianca: 85,
          origem: "imagem",
          validado: true,
        })
      }
    }

    setProcessingStatus("Finalizando processamento...")
    await simulateProgress(90)

    setExtractedData(extractedItems)

    addLog(`Extração de imagem concluída: ${extractedItems.length} registros encontrados`, "success")

    toast({
      title: "Extração concluída",
      description: `${extractedItems.length} registros extraídos da imagem.`,
    })
  }

  // Processar fonte de texto
  const processTextSource = async (source: ExtractionSource) => {
    if (!source.content) {
      throw new Error("Conteúdo de texto não definido")
    }

    setProcessingStatus("Processando texto...")
    await simulateProgress(50)

    // Processar o texto
    const lines = source.content.split("\n")
    const extractedItems: ExtractedData[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Procurar por padrões de horário e frota
      const horarioMatch = line.match(/\b(\d{1,2}:\d{2}(:\d{2})?)\b/)
      const frotaMatch = line.match(/\b(\d{3,6})\b/)

      if (horarioMatch && frotaMatch) {
        const horario = horarioMatch[1]
        const frota = frotaMatch[1]

        // Aplicar filtros
        if (processingOptions.filterRefeicao && line.toLowerCase().includes("refeição")) {
          continue
        }

        extractedItems.push({
          id: `text-${Date.now()}-${i}`,
          horario,
          frota,
          confianca: 80,
          origem: "texto",
          validado: true,
        })
      }
    }

    setProcessingStatus("Finalizando processamento...")
    await simulateProgress(90)

    setExtractedData(extractedItems)

    addLog(`Extração de texto concluída: ${extractedItems.length} registros encontrados`, "success")

    toast({
      title: "Extração concluída",
      description: `${extractedItems.length} registros extraídos do texto.`,
    })
  }

  // Simular progresso
  const simulateProgress = async (target: number) => {
    const current = processingProgress
    const step = (target - current) / 10

    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      setProcessingProgress((prev) => Math.min(prev + step, target))
    }
  }

  // Validar/Invalidar item extraído
  const toggleItemValidation = (id: string) => {
    setExtractedData((prev) => prev.map((item) => (item.id === id ? { ...item, validado: !item.validado } : item)))
  }

  // Remover item extraído
  const removeItem = (id: string) => {
    setExtractedData((prev) => prev.filter((item) => item.id !== id))
    addLog("Item removido da lista", "info")
  }

  // Adicionar item manualmente
  const addManualItem = (horario: string, frota: string) => {
    const newItem: ExtractedData = {
      id: `manual-${Date.now()}`,
      horario,
      frota,
      confianca: 100,
      origem: "manual",
      validado: true,
    }

    setExtractedData((prev) => [...prev, newItem].sort((a, b) => a.horario.localeCompare(b.horario)))

    addLog(`Item adicionado manualmente: ${horario} - ${frota}`, "success")
  }

  // Exportar dados
  const exportData = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há dados para exportar.",
        variant: "destructive",
      })
      return
    }

    switch (exportFormat) {
      case "excel":
        exportToExcel()
        break
      case "csv":
        exportToCsv()
        break
      case "json":
        exportToJson()
        break
      case "txt":
        exportToTxt()
        break
      case "pdf":
        exportToPdf()
        break
    }
  }

  // Exportar para Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    const wsData = extractedData.map((item) => ({
      Horário: item.horario,
      Frota: item.frota,
      "Confiança (%)": item.confianca,
      Origem: item.origem,
      Validado: item.validado ? "Sim" : "Não",
    }))

    const ws = XLSX.utils.json_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Dados Extraídos")
    XLSX.writeFile(wb, "dados-extraidos.xlsx")

    addLog("Dados exportados para Excel", "success")

    toast({
      title: "Exportação concluída",
      description: "Arquivo Excel gerado com sucesso.",
    })
  }

  // Exportar para CSV
  const exportToCsv = () => {
    const headers = ["Horário", "Frota", "Confiança (%)", "Origem", "Validado"]
    const rows = extractedData.map((item) => [
      item.horario,
      item.frota,
      item.confianca.toString(),
      item.origem,
      item.validado ? "Sim" : "Não",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "dados-extraidos.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addLog("Dados exportados para CSV", "success")

    toast({
      title: "Exportação concluída",
      description: "Arquivo CSV gerado com sucesso.",
    })
  }

  // Exportar para JSON
  const exportToJson = () => {
    const jsonData = JSON.stringify(extractedData, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "dados-extraidos.json")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addLog("Dados exportados para JSON", "success")

    toast({
      title: "Exportação concluída",
      description: "Arquivo JSON gerado com sucesso.",
    })
  }

  // Exportar para TXT
  const exportToTxt = () => {
    const textContent = extractedData.map((item) => `${item.horario}\t${item.frota}`).join("\n")
    const blob = new Blob([textContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "dados-extraidos.txt")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addLog("Dados exportados para TXT", "success")

    toast({
      title: "Exportação concluída",
      description: "Arquivo TXT gerado com sucesso.",
    })
  }

  // Exportar para PDF (simulado)
  const exportToPdf = () => {
    // Em uma implementação real, usaríamos uma biblioteca como jsPDF

    toast({
      title: "Exportação para PDF",
      description: "Esta funcionalidade seria implementada com jsPDF em uma versão completa.",
    })

    addLog("Exportação para PDF (simulada)", "info")
  }

  // Copiar para área de transferência
  const copyToClipboard = () => {
    const text = extractedData.map((item) => `${item.horario}\t${item.frota}`).join("\n")

    navigator.clipboard.writeText(text)

    toast({
      title: "Copiado",
      description: "Dados copiados para a área de transferência.",
    })
  }

  // Adicionar texto manualmente
  const addTextSource = (content: string) => {
    const newSource: ExtractionSource = {
      id: `text-${Date.now()}`,
      name: "Texto Manual",
      type: "text",
      icon: <FileIcon className="h-4 w-4" />,
      content,
    }

    addSource(newSource)

    toast({
      title: "Texto adicionado",
      description: "O texto está pronto para processamento.",
    })
  }

  // Salvar para banco de dados (simulado)
  const saveToDatabase = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há dados para salvar.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingStatus("Salvando no banco de dados...")

    // Simulação de salvamento
    setTimeout(() => {
      setIsProcessing(false)

      addLog(`${extractedData.length} registros salvos no banco de dados`, "success")

      toast({
        title: "Dados salvos",
        description: `${extractedData.length} registros foram salvos no banco de dados.`,
      })
    }, 2000)
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Extrator Multi-Formato</CardTitle>
                <CardDescription>Sistema avançado para extração de dados de Excel, PDF e imagens</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)}>
                <Code className="h-4 w-4 mr-1" />
                {debugMode ? "Ocultar Debug" : "Mostrar Debug"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("settings")}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full mb-6">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="sources">
            <FileIcon className="h-4 w-4 mr-2" />
            Fontes
          </TabsTrigger>
          <TabsTrigger value="process">
            <Brain className="h-4 w-4 mr-2" />
            Processar
          </TabsTrigger>
          <TabsTrigger value="results" disabled={extractedData.length === 0}>
            <TableIcon className="h-4 w-4 mr-2" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload de Excel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Excel
                </CardTitle>
                <CardDescription>Carregue planilhas Excel (.xlsx, .xls)</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
                  onClick={() => excelInputRef.current?.click()}
                >
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Clique para selecionar</p>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => excelInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </CardFooter>
            </Card>

            {/* Upload de PDF */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  PDF
                </CardTitle>
                <CardDescription>Carregue documentos PDF</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors cursor-pointer"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Clique para selecionar</p>
                  <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => pdfInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </CardFooter>
            </Card>

            {/* Upload de Imagem */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  Imagem
                </CardTitle>
                <CardDescription>Carregue imagens de tabelas</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Clique para selecionar</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Entrada de Texto</CardTitle>
              <CardDescription>Cole texto diretamente para processamento</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Cole aqui o texto contendo dados de horário e frota..."
                className="min-h-[150px]"
                id="manual-text-input"
              />
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  const textInput = document.getElementById("manual-text-input") as HTMLTextAreaElement
                  if (textInput && textInput.value.trim()) {
                    addTextSource(textInput.value)
                    textInput.value = ""
                  } else {
                    toast({
                      title: "Texto vazio",
                      description: "Por favor, insira algum texto para processar.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Processar Texto
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fontes de Dados</CardTitle>
              <CardDescription>Arquivos e fontes disponíveis para processamento</CardDescription>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <div className="text-center py-12">
                  <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">Nenhuma fonte disponível</h3>
                  <p className="text-sm text-gray-600 mb-4">Carregue arquivos na aba Upload</p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Ir para Upload
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        activeSource === source.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveSource(source.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded mt-1">{source.icon}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{source.name}</h4>
                              <Badge variant={source.extracted ? "success" : "outline"} className="text-xs">
                                {source.extracted ? "Processado" : "Pendente"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Tipo: {source.type.charAt(0).toUpperCase() + source.type.slice(1)}
                              {source.sheets && ` • ${source.sheets.length} planilhas`}
                              {source.pages && ` • ${source.pages} páginas`}
                            </p>

                            {source.type === "excel" && source.sheets && (
                              <div className="mt-2">
                                <Select
                                  value={source.activeSheet}
                                  onValueChange={(value) => {
                                    setSources((prev) =>
                                      prev.map((s) => (s.id === source.id ? { ...s, activeSheet: value } : s)),
                                    )
                                  }}
                                >
                                  <SelectTrigger className="w-[180px] h-8 text-xs">
                                    <SelectValue placeholder="Selecione a planilha" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {source.sheets.map((sheet) => (
                                      <SelectItem key={sheet} value={sheet}>
                                        {sheet}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {source.type === "pdf" && source.pages && (
                              <div className="mt-2">
                                <Select
                                  value={source.activePage?.toString()}
                                  onValueChange={(value) => {
                                    setSources((prev) =>
                                      prev.map((s) =>
                                        s.id === source.id ? { ...s, activePage: Number.parseInt(value) } : s,
                                      ),
                                    )
                                  }}
                                >
                                  <SelectTrigger className="w-[180px] h-8 text-xs">
                                    <SelectValue placeholder="Selecione a página" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: source.pages }, (_, i) => i + 1).map((page) => (
                                      <SelectItem key={page} value={page.toString()}>
                                        Página {page}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {source.preview && (
                            <Button variant="outline" size="sm" asChild>
                              <DialogTrigger>
                                <Eye className="h-4 w-4" />
                              </DialogTrigger>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSources((prev) => prev.filter((s) => s.id !== source.id))
                              if (activeSource === source.id) {
                                setActiveSource(null)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("upload")}>
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Fonte
              </Button>
              <Button onClick={() => setActiveTab("process")} disabled={sources.length === 0}>
                <Brain className="h-4 w-4 mr-2" />
                Ir para Processamento
              </Button>
            </CardFooter>
          </Card>

          {/* Diálogo de visualização */}
          <Dialog>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Visualização da Fonte</DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-auto">
                {activeSource && sources.find((s) => s.id === activeSource)?.preview && (
                  <img
                    src={sources.find((s) => s.id === activeSource)?.preview || ""}
                    alt="Preview"
                    className="w-full h-auto"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processamento de Dados</CardTitle>
              <CardDescription>Configure e execute a extração de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Fonte Selecionada</h3>

                  {activeSource ? (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded">{sources.find((s) => s.id === activeSource)?.icon}</div>
                        <div>
                          <h4 className="font-medium">{sources.find((s) => s.id === activeSource)?.name}</h4>
                          <p className="text-sm text-gray-600">
                            Tipo:{" "}
                            {sources
                              .find((s) => s.id === activeSource)
                              ?.type.charAt(0)
                              .toUpperCase() + sources.find((s) => s.id === activeSource)?.type.slice(1)}
                            {sources.find((s) => s.id === activeSource)?.sheets &&
                              ` • Planilha: ${sources.find((s) => s.id === activeSource)?.activeSheet}`}
                            {sources.find((s) => s.id === activeSource)?.pages &&
                              ` • Página: ${sources.find((s) => s.id === activeSource)?.activePage}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-gray-50 text-center">
                      <p className="text-sm text-gray-600">Nenhuma fonte selecionada</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab("sources")}>
                        Selecionar Fonte
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Perfil de Extração</Label>
                    <Select value={activeProfile} onValueChange={setActiveProfile}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600">{profiles.find((p) => p.id === activeProfile)?.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Opções de Processamento</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="removeEmptyRows" className="cursor-pointer">
                        Remover linhas vazias
                      </Label>
                      <Switch
                        id="removeEmptyRows"
                        checked={processingOptions.removeEmptyRows}
                        onCheckedChange={(checked) =>
                          setProcessingOptions((prev) => ({ ...prev, removeEmptyRows: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="trimWhitespace" className="cursor-pointer">
                        Remover espaços extras
                      </Label>
                      <Switch
                        id="trimWhitespace"
                        checked={processingOptions.trimWhitespace}
                        onCheckedChange={(checked) =>
                          setProcessingOptions((prev) => ({ ...prev, trimWhitespace: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="validateFormat" className="cursor-pointer">
                        Validar formato dos dados
                      </Label>
                      <Switch
                        id="validateFormat"
                        checked={processingOptions.validateFormat}
                        onCheckedChange={(checked) =>
                          setProcessingOptions((prev) => ({ ...prev, validateFormat: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="detectDuplicates" className="cursor-pointer">
                        Detectar duplicatas
                      </Label>
                      <Switch
                        id="detectDuplicates"
                        checked={processingOptions.detectDuplicates}
                        onCheckedChange={(checked) =>
                          setProcessingOptions((prev) => ({ ...prev, detectDuplicates: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="sortByTime" className="cursor-pointer">
                        Ordenar por horário
                      </Label>
                      <Switch
                        id="sortByTime"
                        checked={processingOptions.sortByTime}
                        onCheckedChange={(checked) =>
                          setProcessingOptions((prev) => ({ ...prev, sortByTime: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="filterRefeicao" className="cursor-pointer">
                        Filtrar linhas de refeição
                      </Label>
                      <Switch
                        id="filterRefeicao"
                        checked={processingOptions.filterRefeicao}
                        onCheckedChange={(checked) =>
                          setProcessingOptions((prev) => ({ ...prev, filterRefeicao: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {activeSource && sources.find((s) => s.id === activeSource)?.type === "excel" && (
                <div className="pt-2">
                  <Button variant="outline" onClick={() => setShowColumnMappingDialog(true)}>
                    <Columns className="h-4 w-4 mr-2" />
                    Configurar Mapeamento de Colunas
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("sources")}>
                Voltar
              </Button>
              <Button onClick={processActiveSource} disabled={!activeSource || isProcessing}>
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Processar Dados
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle>Processamento em Andamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{processingStatus}</span>
                    <span>{Math.round(processingProgress)}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Leitura de Dados</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Brain className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Análise Inteligente</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Extração de Dados</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <Zap className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Processamento</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diálogo de mapeamento de colunas */}
          <Dialog open={showColumnMappingDialog} onOpenChange={setShowColumnMappingDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mapeamento de Colunas</DialogTitle>
                <DialogDescription>
                  Selecione quais colunas da planilha correspondem aos dados de horário e frota
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Coluna de Horário</Label>
                  <Select
                    value={columnMapping.horario}
                    onValueChange={(value) => setColumnMapping((prev) => ({ ...prev, horario: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna de horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Coluna de Frota</Label>
                  <Select
                    value={columnMapping.frota}
                    onValueChange={(value) => setColumnMapping((prev) => ({ ...prev, frota: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna de frota" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowColumnMappingDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!columnMapping.horario || !columnMapping.frota) {
                      toast({
                        title: "Mapeamento incompleto",
                        description: "Por favor, selecione as colunas de horário e frota.",
                        variant: "destructive",
                      })
                      return
                    }

                    setShowColumnMappingDialog(false)

                    toast({
                      title: "Mapeamento configurado",
                      description: "As colunas foram mapeadas com sucesso.",
                    })
                  }}
                >
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Dados Extraídos</CardTitle>
                  <CardDescription>{extractedData.length} registros encontrados</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setManualEditMode(!manualEditMode)}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    {manualEditMode ? "Concluir Edição" : "Editar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="txt">Texto</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={exportData}>
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Frota</TableHead>
                      <TableHead>Confiança</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                      {manualEditMode && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono">{item.horario}</TableCell>
                        <TableCell className="font-mono">{item.frota}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  item.confianca >= 90
                                    ? "bg-green-500"
                                    : item.confianca >= 70
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${item.confianca}%` }}
                              />
                            </div>
                            <span className="text-xs">{item.confianca}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.origem}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => toggleItemValidation(item.id)}>
                            {item.validado ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </TableCell>
                        {manualEditMode && (
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {manualEditMode && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">Adicionar Registro Manual</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Horário (ex: 14:30:00)"
                      className="w-40"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const horario = (e.target as HTMLInputElement).value
                          const frotaInput = document.getElementById("manual-frota") as HTMLInputElement
                          if (horario && frotaInput?.value) {
                            addManualItem(horario, frotaInput.value)
                            ;(e.target as HTMLInputElement).value = ""
                            frotaInput.value = ""
                          }
                        }
                      }}
                    />
                    <Input id="manual-frota" placeholder="Frota (ex: 12345)" className="w-32" />
                    <Button
                      onClick={() => {
                        const horarioInput = document.querySelector('input[placeholder*="Horário"]') as HTMLInputElement
                        const frotaInput = document.getElementById("manual-frota") as HTMLInputElement
                        if (horarioInput?.value && frotaInput?.value) {
                          addManualItem(horarioInput.value, frotaInput.value)
                          horarioInput.value = ""
                          frotaInput.value = ""
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("process")}>
                Voltar
              </Button>
              <Button onClick={saveToDatabase}>
                <Database className="h-4 w-4 mr-2" />
                Salvar no Banco de Dados
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas da Extração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{extractedData.length}</div>
                  <div className="text-xs text-gray-600">Total de Registros</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {extractedData.length > 0
                      ? Math.round(extractedData.reduce((sum, item) => sum + item.confianca, 0) / extractedData.length)
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-gray-600">Confiança Média</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{extractedData.filter((item) => item.validado).length}</div>
                  <div className="text-xs text-gray-600">Validados</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <Printer className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{Object.values(processingOptions).filter(Boolean).length}</div>
                  <div className="text-xs text-gray-600">Filtros Aplicados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {extractedText && (
            <Card>
              <CardHeader>
                <CardTitle>Texto Original</CardTitle>
                <CardDescription>Texto extraído da fonte antes do processamento</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea value={extractedText} readOnly className="font-mono text-sm min-h-[200px]" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Modo de Operação</Label>
                <Select defaultValue="automatic">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automático</SelectItem>
                    <SelectItem value="semi-automatic">Semi-automático</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Opções de Processamento</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-validate">Validação Automática</Label>
                    <p className="text-xs text-gray-600">Validar automaticamente itens com alta confiança</p>
                  </div>
                  <Switch id="auto-validate" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="save-training">Salvar para Treinamento</Label>
                    <p className="text-xs text-gray-600">Usar correções manuais para melhorar a IA</p>
                  </div>
                  <Switch id="save-training" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="parallel-processing">Processamento Paralelo</Label>
                    <p className="text-xs text-gray-600">Executar múltiplas estratégias simultaneamente</p>
                  </div>
                  <Switch id="parallel-processing" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          {debugMode && (
            <Card>
              <CardHeader>
                <CardTitle>Logs de Debug</CardTitle>
                <CardDescription>Informações detalhadas sobre o processamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
                  {extractionLogs.length === 0 ? (
                    <p className="text-gray-500">Nenhum log disponível</p>
                  ) : (
                    extractionLogs.map((log, index) => (
                      <div key={index} className="py-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Alertas e notificações */}
      {isProcessing && (
        <Alert className="fixed bottom-4 right-4 w-80 bg-white shadow-lg">
          <Activity className="h-4 w-4" />
          <AlertTitle>Processamento em andamento</AlertTitle>
          <AlertDescription>
            {processingStatus} ({Math.round(processingProgress)}%)
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
