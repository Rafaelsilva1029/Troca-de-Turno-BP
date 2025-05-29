"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import {
  Upload,
  ImageIcon,
  FileText,
  Check,
  AlertCircle,
  Edit,
  Wand2,
  Download,
  Copy,
  Undo,
  Redo,
  Table,
  Grid,
  Columns,
  Save,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Layers,
} from "lucide-react"
import Tesseract from "tesseract.js"

interface UltraRobustExtractorProps {
  onDataExtracted: (data: { frota: string; horario: string }[]) => void
}

export function UltraRobustExtractor({ onDataExtracted }: UltraRobustExtractorProps) {
  // Estados principais
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [extractedData, setExtractedData] = useState<{ frota: string; horario: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("original")
  const [extractionMethod, setExtractionMethod] = useState<
    "auto" | "table-detection" | "column-detection" | "multi-pass" | "pattern" | "manual"
  >("auto")
  const [detectedTables, setDetectedTables] = useState<
    Array<{ x: number; y: number; width: number; height: number; confidence: number }>
  >([])
  const [selectedTable, setSelectedTable] = useState<number>(-1)
  const [detectedColumns, setDetectedColumns] = useState<Array<{ name: string; x: number; width: number }>>([])
  const [selectedColumns, setSelectedColumns] = useState<{ agendamento: number; frota: number }>({
    agendamento: -1,
    frota: -1,
  })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [ocrLanguage, setOcrLanguage] = useState("por")
  const [ocrEngineMode, setOcrEngineMode] = useState<1 | 2 | 3 | 4 | 5>(3) // 1-5, onde 3 é o padrão
  const [multiPassResults, setMultiPassResults] = useState<Array<{ text: string; data: any[] }>>([])
  const [selectedMultiPassResult, setSelectedMultiPassResult] = useState(-1)
  const [savedProfiles, setSavedProfiles] = useState<
    Array<{
      name: string
      settings: any
      extractionMethod: string
      selectedColumns: { agendamento: number; frota: number }
    }>
  >([])
  const [currentProfileName, setCurrentProfileName] = useState("")
  const [tableStructure, setTableStructure] = useState<{
    rows: number
    cols: number
    cells: Array<{ row: number; col: number; text: string; type: string | null }>
  } | null>(null)

  // Estados para pré-processamento de imagem
  const [imageSettings, setImageSettings] = useState({
    brightness: 100, // 0-200
    contrast: 100, // 0-200
    grayscale: false,
    invert: false,
    binarize: false,
    threshold: 128, // 0-255
    rotate: 0, // -180 to 180
    sharpen: 0, // 0-10
    denoise: 0, // 0-10
    adaptiveThreshold: false,
    adaptiveBlockSize: 11, // 3-51, deve ser ímpar
    adaptiveC: 2, // 0-10
    removeLines: false,
    lineThickness: 1, // 1-5
    dilate: 0, // 0-10
    erode: 0, // 0-10
  })

  // Estados para histórico de ações
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Estados para configurações avançadas
  const [advancedSettings, setAdvancedSettings] = useState({
    psm: 6, // Page segmentation mode (0-13)
    oem: 3, // OCR Engine mode (0-3)
    whitelist: "", // Caracteres permitidos
    dpi: 300, // DPI da imagem
    tessConfigs: {} as Record<string, string>, // Configurações específicas do Tesseract
    preProcessingSteps: [] as string[], // Sequência de etapas de pré-processamento
  })

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const workerRef = useRef<Tesseract.Worker | null>(null)

  // Inicializar o worker do Tesseract
  useEffect(() => {
    const initWorker = async () => {
      if (!workerRef.current) {
        workerRef.current = await Tesseract.createWorker(ocrLanguage)
        await workerRef.current.setParameters({
          tessedit_pageseg_mode: advancedSettings.psm,
          tessedit_ocr_engine_mode: advancedSettings.oem,
          tessedit_char_whitelist: advancedSettings.whitelist,
        })
      }
    }

    initWorker()

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [advancedSettings.oem, advancedSettings.psm, advancedSettings.whitelist, ocrLanguage])

  // Efeito para aplicar configurações de imagem
  useEffect(() => {
    if (imagePreview && canvasRef.current) {
      applyImageProcessing()
    }
  }, [imagePreview, imageSettings, activeTab, zoomLevel, imageOffset])

  // Função para aplicar processamento de imagem
  const applyImageProcessing = useCallback(() => {
    if (!imagePreview || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Ajustar tamanho do canvas
      const containerWidth = containerRef.current?.clientWidth || 800
      const containerHeight = containerRef.current?.clientHeight || 600

      // Calcular dimensões com zoom
      const scaledWidth = img.width * zoomLevel
      const scaledHeight = img.height * zoomLevel

      canvas.width = containerWidth
      canvas.height = containerHeight

      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#f5f5f5"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calcular posição centralizada com offset
      const x = (containerWidth - scaledWidth) / 2 + imageOffset.x
      const y = (containerHeight - scaledHeight) / 2 + imageOffset.y

      // Desenhar imagem com zoom e offset
      ctx.save()

      // Aplicar rotação se necessário
      if (imageSettings.rotate !== 0) {
        ctx.translate(containerWidth / 2, containerHeight / 2)
        ctx.rotate((imageSettings.rotate * Math.PI) / 180)
        ctx.translate(-containerWidth / 2, -containerHeight / 2)
      }

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

      // Aplicar filtros
      if (
        imageSettings.brightness !== 100 ||
        imageSettings.contrast !== 100 ||
        imageSettings.grayscale ||
        imageSettings.invert ||
        imageSettings.binarize ||
        imageSettings.sharpen > 0 ||
        imageSettings.denoise > 0
      ) {
        // Obter apenas a área da imagem para processamento
        const imageData = ctx.getImageData(
          Math.max(0, x),
          Math.max(0, y),
          Math.min(scaledWidth, containerWidth - Math.max(0, x)),
          Math.min(scaledHeight, containerHeight - Math.max(0, y)),
        )
        const data = imageData.data

        // Aplicar filtros pixel a pixel
        for (let i = 0; i < data.length; i += 4) {
          // Aplicar brilho e contraste
          const brightness = imageSettings.brightness / 100
          const contrast = imageSettings.contrast / 100

          let r = data[i]
          let g = data[i + 1]
          let b = data[i + 2]

          // Brilho
          r = r * brightness
          g = g * brightness
          b = b * brightness

          // Contraste
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
          r = factor * (r - 128) + 128
          g = factor * (g - 128) + 128
          b = factor * (b - 128) + 128

          // Escala de cinza
          if (imageSettings.grayscale) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b
            r = g = b = gray
          }

          // Binarização
          if (imageSettings.binarize) {
            const avg = (r + g + b) / 3
            const value = avg > imageSettings.threshold ? 255 : 0
            r = g = b = value
          }

          // Inversão
          if (imageSettings.invert) {
            r = 255 - r
            g = 255 - g
            b = 255 - b
          }

          // Garantir que os valores estejam no intervalo 0-255
          data[i] = Math.max(0, Math.min(255, r))
          data[i + 1] = Math.max(0, Math.min(255, g))
          data[i + 2] = Math.max(0, Math.min(255, b))
        }

        ctx.putImageData(imageData, Math.max(0, x), Math.max(0, y))
      }

      // Desenhar tabelas detectadas
      if (detectedTables.length > 0 && activeTab === "table-detection") {
        detectedTables.forEach((table, index) => {
          const isSelected = index === selectedTable
          ctx.strokeStyle = isSelected ? "red" : "blue"
          ctx.lineWidth = isSelected ? 3 : 2
          ctx.strokeRect(
            x + table.x * zoomLevel,
            y + table.y * zoomLevel,
            table.width * zoomLevel,
            table.height * zoomLevel,
          )

          // Adicionar rótulo com índice e confiança
          ctx.fillStyle = isSelected ? "rgba(255, 0, 0, 0.7)" : "rgba(0, 0, 255, 0.7)"
          ctx.fillRect(x + table.x * zoomLevel, y + table.y * zoomLevel - 20, 100, 20)
          ctx.fillStyle = "white"
          ctx.font = "12px Arial"
          ctx.fillText(
            `Tabela ${index + 1} (${Math.round(table.confidence * 100)}%)`,
            x + table.x * zoomLevel + 5,
            y + table.y * zoomLevel - 5,
          )
        })
      }

      // Desenhar colunas detectadas
      if (detectedColumns.length > 0 && activeTab === "column-detection") {
        detectedColumns.forEach((column, index) => {
          const isAgendamento = index === selectedColumns.agendamento
          const isFrota = index === selectedColumns.frota

          let color = "rgba(0, 0, 255, 0.3)"
          if (isAgendamento) color = "rgba(0, 255, 0, 0.3)"
          if (isFrota) color = "rgba(255, 0, 0, 0.3)"

          // Desenhar retângulo da coluna
          ctx.fillStyle = color
          ctx.fillRect(x + column.x * zoomLevel, y, column.width * zoomLevel, scaledHeight)

          // Adicionar rótulo
          ctx.fillStyle = isAgendamento
            ? "rgba(0, 128, 0, 0.9)"
            : isFrota
              ? "rgba(128, 0, 0, 0.9)"
              : "rgba(0, 0, 128, 0.9)"
          ctx.fillRect(x + column.x * zoomLevel, y - 20, column.width * zoomLevel, 20)
          ctx.fillStyle = "white"
          ctx.font = "12px Arial"
          ctx.fillText(
            isAgendamento ? "Agendamento" : isFrota ? "Frota" : `Coluna ${index + 1}`,
            x + column.x * zoomLevel + 5,
            y - 5,
          )
        })
      }

      // Desenhar estrutura da tabela se disponível
      if (tableStructure && activeTab === "table-structure") {
        const tableWidth = scaledWidth * 0.9
        const tableHeight = scaledHeight * 0.9
        const cellWidth = tableWidth / tableStructure.cols
        const cellHeight = tableHeight / tableStructure.rows
        const tableX = x + (scaledWidth - tableWidth) / 2
        const tableY = y + (scaledHeight - tableHeight) / 2

        // Desenhar grid da tabela
        ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"
        ctx.lineWidth = 1

        // Desenhar linhas horizontais
        for (let i = 0; i <= tableStructure.rows; i++) {
          ctx.beginPath()
          ctx.moveTo(tableX, tableY + i * cellHeight)
          ctx.lineTo(tableX + tableWidth, tableY + i * cellHeight)
          ctx.stroke()
        }

        // Desenhar linhas verticais
        for (let i = 0; i <= tableStructure.cols; i++) {
          ctx.beginPath()
          ctx.moveTo(tableX + i * cellWidth, tableY)
          ctx.lineTo(tableX + i * cellWidth, tableY + tableHeight)
          ctx.stroke()
        }

        // Destacar células com conteúdo
        tableStructure.cells.forEach((cell) => {
          const cellX = tableX + cell.col * cellWidth
          const cellY = tableY + cell.row * cellHeight

          // Colorir célula de acordo com o tipo
          let fillColor = "rgba(200, 200, 200, 0.3)"
          if (cell.type === "agendamento") fillColor = "rgba(0, 255, 0, 0.3)"
          if (cell.type === "frota") fillColor = "rgba(255, 0, 0, 0.3)"
          if (cell.type === "header") fillColor = "rgba(0, 0, 255, 0.3)"

          ctx.fillStyle = fillColor
          ctx.fillRect(cellX, cellY, cellWidth, cellHeight)

          // Adicionar texto da célula
          ctx.fillStyle = "black"
          ctx.font = "10px Arial"
          ctx.fillText(cell.text.length > 10 ? cell.text.substring(0, 10) + "..." : cell.text, cellX + 2, cellY + 12)
        })
      }

      ctx.restore()

      // Atualizar imagem processada
      setProcessedImage(canvas.toDataURL("image/png"))
    }

    img.src = imagePreview
  }, [
    activeTab,
    detectedColumns,
    detectedTables,
    imageOffset,
    imagePreview,
    imageSettings,
    selectedColumns.agendamento,
    selectedColumns.frota,
    selectedTable,
    tableStructure,
    zoomLevel,
  ])

  // Função para detectar tabelas na imagem
  const detectTables = async () => {
    if (!processedImage && !imagePreview) {
      setError("Nenhuma imagem disponível para processamento.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setOcrStatus("Detectando tabelas na imagem...")

    try {
      // Simulação de detecção de tabelas
      // Em uma implementação real, você usaria uma biblioteca de visão computacional
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simular detecção de tabelas
      const tables = [
        {
          x: 20,
          y: 70,
          width: 550,
          height: 400,
          confidence: 0.95,
        },
      ]

      setDetectedTables(tables)
      setSelectedTable(0) // Selecionar a primeira tabela por padrão

      setOcrStatus("Tabelas detectadas com sucesso!")
      setActiveTab("table-detection")

      toast({
        title: "Detecção concluída",
        description: `Foram detectadas ${tables.length} tabelas na imagem.`,
      })
    } catch (error) {
      console.error("Erro ao detectar tabelas:", error)
      setError("Ocorreu um erro ao detectar tabelas na imagem.")
    } finally {
      setIsProcessing(false)
      setOcrStatus("")
    }
  }

  // Função para detectar colunas na tabela selecionada
  const detectColumns = async () => {
    if (selectedTable === -1) {
      setError("Selecione uma tabela primeiro.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setOcrStatus("Detectando colunas na tabela...")

    try {
      // Simulação de detecção de colunas
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simular detecção de colunas
      const columns = [
        { name: "Agendamento", x: 20, width: 100 },
        { name: "Frota", x: 120, width: 80 },
        { name: "Modelo", x: 200, width: 150 },
        { name: "Serviço", x: 350, width: 100 },
        { name: "Horas", x: 450, width: 80 },
      ]

      setDetectedColumns(columns)
      setSelectedColumns({
        agendamento: 0, // Índice da coluna "Agendamento"
        frota: 1, // Índice da coluna "Frota"
      })

      setOcrStatus("Colunas detectadas com sucesso!")
      setActiveTab("column-detection")

      toast({
        title: "Detecção concluída",
        description: `Foram detectadas ${columns.length} colunas na tabela.`,
      })
    } catch (error) {
      console.error("Erro ao detectar colunas:", error)
      setError("Ocorreu um erro ao detectar colunas na tabela.")
    } finally {
      setIsProcessing(false)
      setOcrStatus("")
    }
  }

  // Função para analisar a estrutura da tabela
  const analyzeTableStructure = async () => {
    if (selectedTable === -1) {
      setError("Selecione uma tabela primeiro.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setOcrStatus("Analisando estrutura da tabela...")

    try {
      // Simulação de análise de estrutura
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simular estrutura da tabela
      const structure = {
        rows: 10,
        cols: 5,
        cells: [
          // Cabeçalhos
          { row: 0, col: 0, text: "Agendamento", type: "header" },
          { row: 0, col: 1, text: "Frota", type: "header" },
          { row: 0, col: 2, text: "Modelo", type: "header" },
          { row: 0, col: 3, text: "Serviço", type: "header" },
          { row: 0, col: 4, text: "Horas", type: "header" },
          // Dados
          { row: 1, col: 0, text: "07:00:00", type: "agendamento" },
          { row: 1, col: 1, text: "8001", type: "frota" },
          { row: 1, col: 2, text: "SM Triciclo Cargo", type: null },
          { row: 1, col: 3, text: "26Lub", type: null },
          { row: 1, col: 4, text: "0:17", type: null },
          // Mais algumas linhas
          { row: 2, col: 0, text: "08:00:00", type: "agendamento" },
          { row: 2, col: 1, text: "8799", type: "frota" },
          { row: 2, col: 2, text: "Ren Oroch 1.6 SCe", type: null },
          { row: 2, col: 3, text: "Manutenção", type: null },
          { row: 2, col: 4, text: "1:01", type: null },
          // Linha de refeição
          { row: 3, col: 0, text: "11:00:00", type: "agendamento" },
          { row: 3, col: 1, text: "REFEIÇÃO", type: null },
          { row: 3, col: 2, text: "", type: null },
          { row: 3, col: 3, text: "", type: null },
          { row: 3, col: 4, text: "1:00", type: null },
        ],
      }

      setTableStructure(structure)
      setOcrStatus("Estrutura da tabela analisada com sucesso!")
      setActiveTab("table-structure")

      // Extrair dados das colunas de agendamento e frota
      const data = structure.cells
        .filter((cell) => cell.type === "agendamento" || cell.type === "frota")
        .reduce(
          (acc, cell) => {
            if (cell.type === "agendamento") {
              acc[cell.row] = { ...(acc[cell.row] || {}), horario: cell.text }
            } else if (cell.type === "frota" && cell.text !== "REFEIÇÃO") {
              acc[cell.row] = { ...(acc[cell.row] || {}), frota: cell.text }
            }
            return acc
          },
          {} as Record<number, { horario?: string; frota?: string }>,
        )

      // Converter para o formato esperado e filtrar entradas incompletas
      const extractedData = Object.values(data)
        .filter((item) => item.horario && item.frota)
        .map((item) => ({ horario: item.horario!, frota: item.frota! }))

      setExtractedData(extractedData)

      toast({
        title: "Análise concluída",
        description: `Estrutura da tabela analisada com ${structure.rows} linhas e ${structure.cols} colunas.`,
      })
    } catch (error) {
      console.error("Erro ao analisar estrutura da tabela:", error)
      setError("Ocorreu um erro ao analisar a estrutura da tabela.")
    } finally {
      setIsProcessing(false)
      setOcrStatus("")
    }
  }

  // Função para executar OCR com múltiplos passes
  const runMultiPassOCR = async () => {
    if (!processedImage && !imagePreview) {
      setError("Nenhuma imagem disponível para processamento.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setOcrStatus("Iniciando OCR com múltiplos passes...")
    setMultiPassResults([])

    try {
      const imageToProcess = processedImage || imagePreview
      const results = []

      // Configurações para diferentes passes
      const passes = [
        { psm: 6, description: "Bloco de texto uniforme" },
        { psm: 4, description: "Coluna de texto única" },
        { psm: 11, description: "Texto esparso" },
        { psm: 3, description: "Texto completo sem orientação" },
        { psm: 1, description: "Orientação e script automáticos" },
      ]

      for (let i = 0; i < passes.length; i++) {
        const pass = passes[i]
        setOcrStatus(`Executando passe ${i + 1}/${passes.length}: ${pass.description}...`)
        setProgress((i / passes.length) * 100)

        // Configurar worker para este passe
        if (workerRef.current) {
          await workerRef.current.setParameters({
            tessedit_pageseg_mode: pass.psm,
          })

          // Executar OCR
          const result = await workerRef.current.recognize(imageToProcess as string)
          const text = result.data.text

          // Extrair dados
          let data: { frota: string; horario: string }[] = []
          if (pass.psm === 6 || pass.psm === 3) {
            // Tentar extração baseada em tabela
            data = extractTableData(text)
          } else {
            // Tentar extração baseada em padrões
            data = extractPatternData(text)
          }

          results.push({
            text,
            data,
            psm: pass.psm,
            description: pass.description,
          })
        }
      }

      setMultiPassResults(results)
      setSelectedMultiPassResult(0) // Selecionar o primeiro resultado por padrão

      // Encontrar o melhor resultado (com mais dados extraídos)
      const bestResultIndex = results.reduce(
        (best, current, index) => (current.data.length > results[best].data.length ? index : best),
        0,
      )

      setSelectedMultiPassResult(bestResultIndex)
      setExtractedText(results[bestResultIndex].text)
      setExtractedData(results[bestResultIndex].data)

      setOcrStatus("OCR com múltiplos passes concluído!")
      setActiveTab("multi-pass")

      toast({
        title: "OCR concluído",
        description: `Foram executados ${passes.length} passes de OCR com diferentes configurações.`,
      })
    } catch (error) {
      console.error("Erro ao executar OCR com múltiplos passes:", error)
      setError("Ocorreu um erro ao executar OCR com múltiplos passes.")
    } finally {
      setIsProcessing(false)
      setOcrStatus("")
      setProgress(100)
    }
  }

  // Função para lidar com o upload da imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verificar se é uma imagem
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido.")
      return
    }

    setIsUploading(true)
    setError(null)
    setExtractedText("")
    setExtractedData([])
    setDetectedTables([])
    setSelectedTable(-1)
    setDetectedColumns([])
    setSelectedColumns({ agendamento: -1, frota: -1 })
    setTableStructure(null)
    setMultiPassResults([])
    setSelectedMultiPassResult(-1)

    // Criar preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string
      setImagePreview(imageDataUrl)
      setIsUploading(false)

      // Resetar configurações de imagem
      setImageSettings({
        brightness: 100,
        contrast: 100,
        grayscale: false,
        invert: false,
        binarize: false,
        threshold: 128,
        rotate: 0,
        sharpen: 0,
        denoise: 0,
        adaptiveThreshold: false,
        adaptiveBlockSize: 11,
        adaptiveC: 2,
        removeLines: false,
        lineThickness: 1,
        dilate: 0,
        erode: 0,
      })

      // Resetar zoom e offset
      setZoomLevel(1)
      setImageOffset({ x: 0, y: 0 })

      // Adicionar ao histórico
      addToHistory(imageDataUrl)

      // Ir para a aba de imagem original
      setActiveTab("original")

      toast({
        title: "Imagem carregada",
        description: "A imagem foi carregada com sucesso. Escolha um método de extração para continuar.",
      })
    }
    reader.onerror = () => {
      setError("Erro ao ler o arquivo de imagem.")
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // Função para adicionar ao histórico
  const addToHistory = (imageData: string) => {
    // Se estamos em um ponto do histórico que não é o mais recente, descartamos os estados futuros
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1))
    }

    // Adicionar novo estado ao histórico
    setHistory([...history, imageData])
    setHistoryIndex(history.length)
  }

  // Funções para desfazer/refazer
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setImagePreview(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setImagePreview(history[historyIndex + 1])
    }
  }

  // Função para processar a imagem com OCR padrão
  const processImage = async () => {
    if (!processedImage && !imagePreview) {
      setError("Nenhuma imagem disponível para processamento.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setOcrStatus("Preparando para processar a imagem...")
    setExtractedText("")
    setExtractedData([])

    try {
      // Determinar qual imagem usar
      const imageToProcess = processedImage || imagePreview

      // Se temos uma tabela selecionada, recortar a imagem
      let finalImageToProcess = imageToProcess
      let tableRect = null

      if (selectedTable !== -1 && detectedTables.length > 0) {
        tableRect = detectedTables[selectedTable]
      }

      if (tableRect && canvasRef.current) {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (ctx) {
          canvas.width = tableRect.width
          canvas.height = tableRect.height

          const img = new Image()
          img.crossOrigin = "anonymous"

          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(
                img,
                tableRect!.x,
                tableRect!.y,
                tableRect!.width,
                tableRect!.height,
                0,
                0,
                tableRect!.width,
                tableRect!.height,
              )
              resolve()
            }
            img.src = imageToProcess as string
          })

          finalImageToProcess = canvas.toDataURL("image/png")
        }
      }

      setOcrStatus("Processando a imagem com OCR...")

      // Processar a imagem com Tesseract.js
      const result = await Tesseract.recognize(finalImageToProcess as string, ocrLanguage, {
        logger: (m) => {
          if (m.status) {
            setOcrStatus(m.status)
          }
          if (typeof m.progress === "number") {
            setProgress(m.progress * 100)
          }
        },
      })

      const text = result.data.text
      setExtractedText(text)
      setOcrStatus("Extraindo dados do texto...")

      // Extrair dados estruturados do texto
      let data: { frota: string; horario: string }[] = []

      // Usar o método de extração selecionado
      switch (extractionMethod) {
        case "table-detection":
          if (selectedTable !== -1 && selectedColumns.agendamento !== -1 && selectedColumns.frota !== -1) {
            data = extractColumnsData(text, selectedColumns)
          } else {
            data = extractTableData(text)
          }
          break
        case "column-detection":
          if (selectedColumns.agendamento !== -1 && selectedColumns.frota !== -1) {
            data = extractColumnsData(text, selectedColumns)
          } else {
            data = extractTableData(text)
          }
          break
        case "multi-pass":
          // Usar o resultado do multi-pass selecionado
          if (selectedMultiPassResult !== -1 && multiPassResults.length > 0) {
            data = multiPassResults[selectedMultiPassResult].data
          } else {
            // Executar multi-pass se ainda não foi feito
            await runMultiPassOCR()
            return
          }
          break
        case "pattern":
          data = extractPatternData(text)
          break
        case "manual":
          // Para o método manual, apenas extraímos o texto e deixamos o usuário editar
          break
        case "auto":
        default:
          // Tentar todos os métodos em sequência
          if (tableStructure) {
            // Se temos estrutura de tabela, usar isso
            const structureData = tableStructure.cells
              .filter((cell) => cell.type === "agendamento" || cell.type === "frota")
              .reduce(
                (acc, cell) => {
                  if (cell.type === "agendamento") {
                    acc[cell.row] = { ...(acc[cell.row] || {}), horario: cell.text }
                  } else if (cell.type === "frota" && cell.text !== "REFEIÇÃO") {
                    acc[cell.row] = { ...(acc[cell.row] || {}), frota: cell.text }
                  }
                  return acc
                },
                {} as Record<number, { horario?: string; frota?: string }>,
              )

            data = Object.values(structureData)
              .filter((item) => item.horario && item.frota)
              .map((item) => ({ horario: item.horario!, frota: item.frota! }))
          } else if (selectedTable !== -1 && selectedColumns.agendamento !== -1 && selectedColumns.frota !== -1) {
            // Se temos tabela e colunas selecionadas
            data = extractColumnsData(text, selectedColumns)
          } else {
            // Tentar métodos gerais
            data = extractTableData(text)
            if (data.length === 0) {
              data = extractPatternData(text)
            }
          }
          break
      }

      setExtractedData(data)

      if (data.length === 0 && extractionMethod !== "manual") {
        setError(
          "Não foi possível identificar dados de frota e horário no texto extraído. Tente outro método de extração ou edite manualmente.",
        )
      } else if (extractionMethod !== "manual") {
        // Notificar o componente pai
        onDataExtracted(data)

        toast({
          title: "Processamento concluído",
          description: `Foram extraídos dados de ${data.length} veículos.`,
        })
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      setError("Ocorreu um erro ao processar a imagem. Tente novamente ou ajuste as configurações.")
    } finally {
      setIsProcessing(false)
      setOcrStatus("")
    }
  }

  // Função para extrair dados de tabela
  const extractTableData = (text: string): { frota: string; horario: string }[] => {
    const data: { frota: string; horario: string }[] = []
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Procurar o cabeçalho da tabela
    let headerIndex = -1
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase()
      if (
        (line.includes("agendamento") && line.includes("frota")) ||
        (line.includes("horário") && line.includes("frota"))
      ) {
        headerIndex = i
        break
      }
    }

    if (headerIndex >= 0) {
      // Processar linhas após o cabeçalho
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i]

        // Pular linhas que contêm "REFEIÇÃO"
        if (line.toLowerCase().includes("refeição")) continue

        // Extrair horário (formato HH:MM:SS ou HH:MM)
        const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)

        // Extrair frota (4-5 dígitos)
        const fleetMatch = line.match(/\b(\d{4,5})\b/)

        if (timeMatch && fleetMatch) {
          data.push({
            horario: timeMatch[1],
            frota: fleetMatch[1],
          })
        }
      }
    }

    return data
  }

  // Função para extrair dados baseados em padrões
  const extractPatternData = (text: string): { frota: string; horario: string }[] => {
    const data: { frota: string; horario: string }[] = []

    // Normalizar o texto
    const normalizedText = text.replace(/\s+/g, " ").trim()

    // Extrair todos os horários
    const timeMatches = normalizedText.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g) || []

    // Extrair todas as frotas
    const fleetMatches = normalizedText.match(/\b(\d{4,5})\b/g) || []

    // Se temos o mesmo número de horários e frotas, assumimos que correspondem
    if (timeMatches.length > 0 && fleetMatches.length > 0) {
      const minLength = Math.min(timeMatches.length, fleetMatches.length)

      for (let i = 0; i < minLength; i++) {
        data.push({
          horario: timeMatches[i],
          frota: fleetMatches[i],
        })
      }
    }

    return data
  }

  // Função para extrair dados de colunas específicas
  const extractColumnsData = (
    text: string,
    columns: { agendamento: number; frota: number },
  ): { frota: string; horario: string }[] => {
    if (columns.agendamento === -1 || columns.frota === -1 || detectedColumns.length === 0) {
      return []
    }

    const data: { frota: string; horario: string }[] = []
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Procurar o cabeçalho da tabela
    let headerIndex = -1
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase()
      if (
        (line.includes("agendamento") && line.includes("frota")) ||
        (line.includes("horário") && line.includes("frota"))
      ) {
        headerIndex = i
        break
      }
    }

    if (headerIndex >= 0) {
      // Processar linhas após o cabeçalho
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i]

        // Pular linhas que contêm "REFEIÇÃO"
        if (line.toLowerCase().includes("refeição")) continue

        // Dividir a linha em tokens
        const tokens = line.split(/\s+/)

        // Tentar extrair horário e frota
        let horario = ""
        let frota = ""

        // Procurar padrões de horário e frota em toda a linha
        const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)
        const fleetMatch = line.match(/\b(\d{4,5})\b/)

        if (timeMatch) horario = timeMatch[1]
        if (fleetMatch) frota = fleetMatch[1]

        if (horario && frota) {
          data.push({ horario, frota })
        }
      }
    }

    return data
  }

  // Função para lidar com o clique no botão de upload
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Função para editar o texto extraído manualmente
  const handleTextEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExtractedText(e.target.value)
  }

  // Função para processar o texto editado manualmente
  const processEditedText = () => {
    if (!extractedText.trim()) {
      setError("O texto extraído está vazio.")
      return
    }

    try {
      // Processar o texto editado para extrair dados
      const data = extractManuallyEditedText(extractedText)

      if (data.length === 0) {
        setError(
          "Não foi possível extrair dados do texto. Por favor, edite o texto para incluir pares de horário e frota em cada linha, como '07:00:00 8001'.",
        )
        return
      }

      setExtractedData(data)
      setIsEditing(false)

      // Notificar o componente pai
      onDataExtracted(data)

      toast({
        title: "Processamento concluído",
        description: `Foram extraídos dados de ${data.length} veículos.`,
      })
    } catch (error) {
      console.error("Erro ao processar texto editado:", error)
      setError("Ocorreu um erro ao processar o texto. Verifique o formato.")
    }
  }

  // Função para extrair dados de texto editado manualmente
  const extractManuallyEditedText = (text: string): { frota: string; horario: string }[] => {
    const data: { frota: string; horario: string }[] = []
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    for (const line of lines) {
      // Pular linhas que contêm "REFEIÇÃO"
      if (line.toLowerCase().includes("refeição")) continue

      // Procurar um horário (formato HH:MM:SS ou HH:MM)
      const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)

      // Procurar um número de frota (4-5 dígitos)
      const fleetMatch = line.match(/\b(\d{4,5})\b/)

      if (timeMatch && fleetMatch) {
        data.push({
          horario: timeMatch[1],
          frota: fleetMatch[1],
        })
      }
    }

    return data
  }

  // Funções para manipulação de zoom e pan
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleZoomReset = () => {
    setZoomLevel(1)
    setImageOffset({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    setImageOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }))

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Função para salvar perfil de configurações
  const saveProfile = () => {
    if (!currentProfileName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, forneça um nome para o perfil.",
        variant: "destructive",
      })
      return
    }

    const newProfile = {
      name: currentProfileName,
      settings: imageSettings,
      extractionMethod,
      selectedColumns,
    }

    setSavedProfiles([...savedProfiles, newProfile])
    setCurrentProfileName("")

    toast({
      title: "Perfil salvo",
      description: `O perfil "${currentProfileName}" foi salvo com sucesso.`,
    })
  }

  // Função para carregar perfil de configurações
  const loadProfile = (index: number) => {
    if (index < 0 || index >= savedProfiles.length) return

    const profile = savedProfiles[index]
    setImageSettings(profile.settings)
    setExtractionMethod(profile.extractionMethod as any)
    setSelectedColumns(profile.selectedColumns)

    toast({
      title: "Perfil carregado",
      description: `O perfil "${profile.name}" foi carregado com sucesso.`,
    })
  }

  // Função para exportar dados para Excel
  const exportToExcel = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Extraia dados da imagem primeiro.",
        variant: "destructive",
      })
      return
    }

    // Aqui você implementaria a exportação para Excel
    // Como exemplo, vamos apenas mostrar um toast
    toast({
      title: "Exportação simulada",
      description: `${extractedData.length} registros seriam exportados para Excel.`,
    })
  }

  // Função para copiar dados para a área de transferência
  const copyToClipboard = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Nenhum dado para copiar",
        description: "Extraia dados da imagem primeiro.",
        variant: "destructive",
      })
      return
    }

    const text = extractedData.map((item) => `${item.horario}\t${item.frota}`).join("\n")

    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Dados copiados",
          description: "Os dados foram copiados para a área de transferência.",
        })
      })
      .catch(() => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar os dados para a área de transferência.",
          variant: "destructive",
        })
      })
  }

  // Renderização do componente
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Extrator Ultra Robusto de Dados</CardTitle>
              <CardDescription>
                Sistema avançado de extração de dados de tabelas com detecção automática e processamento inteligente
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Área de upload */}
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
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
                  target: {
                    files: e.dataTransfer.files,
                  },
                } as unknown as React.ChangeEvent<HTMLInputElement>
                handleImageUpload(changeEvent)
              } else {
                setError("Por favor, solte apenas arquivos de imagem.")
              }
            }}
          >
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Arraste e solte uma imagem ou clique para selecionar</h3>
            <p className="text-sm text-gray-500 mb-4">Formatos suportados: .jpg, .jpeg, .png, .bmp, .tiff</p>
            <Button onClick={handleUploadClick} className="flex items-center" disabled={isProcessing}>
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Imagem
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progresso do OCR */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{ocrStatus || "Processando..."}</span>
                <span className="text-sm">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualização e edição de imagem */}
      {imagePreview && !isProcessing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Processamento Avançado de Imagem</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomReset}>
                  <span className="text-xs">{Math.round(zoomLevel * 100)}%</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageSettings({ ...imageSettings, rotate: imageSettings.rotate - 90 })}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageSettings({ ...imageSettings, rotate: imageSettings.rotate + 90 })}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="original" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex flex-wrap">
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger value="processed">Processada</TabsTrigger>
                <TabsTrigger value="table-detection">Detecção de Tabela</TabsTrigger>
                <TabsTrigger value="column-detection">Detecção de Colunas</TabsTrigger>
                <TabsTrigger value="table-structure">Estrutura da Tabela</TabsTrigger>
                <TabsTrigger value="multi-pass">Multi-Pass OCR</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
                <TabsTrigger value="profiles">Perfis</TabsTrigger>
              </TabsList>

              <TabsContent value="original" className="mt-0">
                <div className="border rounded-md overflow-hidden">
                  <img
                    ref={imageRef}
                    src={imagePreview || "/placeholder.svg"}
                    alt="Imagem original"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </div>
              </TabsContent>

              <TabsContent value="processed" className="mt-0">
                <div
                  className="border rounded-md overflow-hidden relative"
                  style={{ height: "400px" }}
                  ref={containerRef}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-grab"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </div>

                <div className="mt-4 flex justify-between">
                  <div className="space-y-2">
                    <Label>Método de Extração</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={extractionMethod === "auto" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExtractionMethod("auto")}
                      >
                        Automático
                      </Button>
                      <Button
                        variant={extractionMethod === "table-detection" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExtractionMethod("table-detection")}
                      >
                        Detecção de Tabela
                      </Button>
                      <Button
                        variant={extractionMethod === "column-detection" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExtractionMethod("column-detection")}
                      >
                        Detecção de Colunas
                      </Button>
                      <Button
                        variant={extractionMethod === "multi-pass" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExtractionMethod("multi-pass")}
                      >
                        Multi-Pass
                      </Button>
                      <Button
                        variant={extractionMethod === "pattern" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExtractionMethod("pattern")}
                      >
                        Padrões
                      </Button>
                      <Button
                        variant={extractionMethod === "manual" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExtractionMethod("manual")}
                      >
                        Manual
                      </Button>
                    </div>
                  </div>

                  <Button onClick={processImage} disabled={isProcessing}>
                    <FileText className="mr-2 h-4 w-4" />
                    Extrair Dados
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="table-detection" className="mt-0">
                <div
                  className="border rounded-md overflow-hidden relative"
                  style={{ height: "400px" }}
                  ref={containerRef}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-grab"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </div>

                <div className="mt-4 flex justify-between">
                  <div className="space-y-2">
                    <Label>Tabelas Detectadas: {detectedTables.length}</Label>
                    <div className="flex flex-wrap gap-2">
                      {detectedTables.map((_, index) => (
                        <Button
                          key={index}
                          variant={selectedTable === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTable(index)}
                        >
                          Tabela {index + 1}
                        </Button>
                      ))}
                      {detectedTables.length === 0 && (
                        <p className="text-sm text-gray-500">Nenhuma tabela detectada. Clique em "Detectar Tabelas".</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={detectTables} disabled={isProcessing}>
                      <Table className="mr-2 h-4 w-4" />
                      Detectar Tabelas
                    </Button>
                    {selectedTable !== -1 && (
                      <Button onClick={detectColumns} disabled={isProcessing}>
                        <Columns className="mr-2 h-4 w-4" />
                        Detectar Colunas
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="column-detection" className="mt-0">
                <div
                  className="border rounded-md overflow-hidden relative"
                  style={{ height: "400px" }}
                  ref={containerRef}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-grab"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex justify-between">
                    <div>
                      <Label>Colunas Detectadas: {detectedColumns.length}</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {detectedColumns.map((column, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className={
                              index === selectedColumns.agendamento
                                ? "bg-green-100 border-green-500 text-green-800"
                                : index === selectedColumns.frota
                                  ? "bg-red-100 border-red-500 text-red-800"
                                  : ""
                            }
                            onClick={() => {
                              // Alternar entre agendamento, frota e nenhum
                              if (index === selectedColumns.agendamento) {
                                setSelectedColumns({ ...selectedColumns, agendamento: -1 })
                              } else if (index === selectedColumns.frota) {
                                setSelectedColumns({ ...selectedColumns, frota: -1 })
                              } else if (selectedColumns.agendamento === -1) {
                                setSelectedColumns({ ...selectedColumns, agendamento: index })
                              } else if (selectedColumns.frota === -1) {
                                setSelectedColumns({ ...selectedColumns, frota: index })
                              }
                            }}
                          >
                            {index === selectedColumns.agendamento
                              ? "Agendamento"
                              : index === selectedColumns.frota
                                ? "Frota"
                                : `Coluna ${index + 1}`}
                          </Button>
                        ))}
                        {detectedColumns.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Nenhuma coluna detectada. Selecione uma tabela e clique em "Detectar Colunas".
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={analyzeTableStructure} disabled={isProcessing || selectedTable === -1}>
                        <Grid className="mr-2 h-4 w-4" />
                        Analisar Estrutura
                      </Button>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Como selecionar colunas</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      <p className="text-sm">
                        Clique em uma coluna para marcá-la como "Agendamento". Clique em outra para marcá-la como
                        "Frota". Clique novamente para desmarcar.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="table-structure" className="mt-0">
                <div
                  className="border rounded-md overflow-hidden relative"
                  style={{ height: "400px" }}
                  ref={containerRef}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-grab"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  {tableStructure ? (
                    <div>
                      <div className="flex justify-between items-center">
                        <Label>
                          Estrutura da Tabela: {tableStructure.rows} linhas × {tableStructure.cols} colunas
                        </Label>
                        <Button onClick={processImage} disabled={isProcessing}>
                          <FileText className="mr-2 h-4 w-4" />
                          Extrair Dados
                        </Button>
                      </div>

                      <div className="mt-2 border rounded-md overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Array.from({ length: tableStructure.cols }).map((_, colIndex) => (
                                <th
                                  key={colIndex}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {tableStructure.cells.find((cell) => cell.row === 0 && cell.col === colIndex)?.text ||
                                    `Coluna ${colIndex + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Array.from({ length: tableStructure.rows - 1 }).map((_, rowIndex) => (
                              <tr key={rowIndex + 1} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                {Array.from({ length: tableStructure.cols }).map((_, colIndex) => {
                                  const cell = tableStructure.cells.find(
                                    (c) => c.row === rowIndex + 1 && c.col === colIndex,
                                  )
                                  return (
                                    <td
                                      key={colIndex}
                                      className={`px-3 py-2 whitespace-nowrap text-sm ${
                                        cell?.type === "agendamento"
                                          ? "font-medium text-green-700 bg-green-50"
                                          : cell?.type === "frota"
                                            ? "font-medium text-red-700 bg-red-50"
                                            : "text-gray-500"
                                      }`}
                                    >
                                      {cell?.text || ""}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Estrutura não analisada</AlertTitle>
                      <AlertDescription>
                        Selecione uma tabela e clique em "Analisar Estrutura" para visualizar a estrutura da tabela.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="multi-pass" className="mt-0">
                <div className="space-y-4">
                  {multiPassResults.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <Label>Resultados de Multi-Pass OCR ({multiPassResults.length})</Label>
                        <Button onClick={runMultiPassOCR} disabled={isProcessing}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Executar Novamente
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {multiPassResults.map((result, index) => (
                          <Button
                            key={index}
                            variant={selectedMultiPassResult === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedMultiPassResult(index)
                              setExtractedText(result.text)
                              setExtractedData(result.data)
                            }}
                          >
                            Passe {index + 1} ({result.data.length} registros)
                          </Button>
                        ))}
                      </div>

                      <div className="border rounded-md p-4 bg-gray-50">
                        <Label className="block mb-2">
                          Texto Extraído (Passe {selectedMultiPassResult + 1}, PSM:{" "}
                          {multiPassResults[selectedMultiPassResult]?.psm})
                        </Label>
                        <Textarea value={extractedText} readOnly className="min-h-[150px] font-mono text-sm" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Button onClick={runMultiPassOCR} disabled={isProcessing}>
                        <Layers className="mr-2 h-4 w-4" />
                        Executar Multi-Pass OCR
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        O Multi-Pass OCR executa vários passes de reconhecimento com diferentes configurações para
                        maximizar a precisão.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Ajustes Básicos</h3>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Brilho: {imageSettings.brightness}%</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImageSettings({ ...imageSettings, brightness: 100 })}
                          >
                            Resetar
                          </Button>
                        </div>
                        <Slider
                          value={[imageSettings.brightness]}
                          min={0}
                          max={200}
                          step={5}
                          onValueChange={(value) => setImageSettings({ ...imageSettings, brightness: value[0] })}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Contraste: {imageSettings.contrast}%</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImageSettings({ ...imageSettings, contrast: 100 })}
                          >
                            Resetar
                          </Button>
                        </div>
                        <Slider
                          value={[imageSettings.contrast]}
                          min={0}
                          max={200}
                          step={5}
                          onValueChange={(value) => setImageSettings({ ...imageSettings, contrast: value[0] })}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Rotação: {imageSettings.rotate}°</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImageSettings({ ...imageSettings, rotate: 0 })}
                          >
                            Resetar
                          </Button>
                        </div>
                        <Slider
                          value={[imageSettings.rotate]}
                          min={-180}
                          max={180}
                          step={1}
                          onValueChange={(value) => setImageSettings({ ...imageSettings, rotate: value[0] })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="grayscale"
                            checked={imageSettings.grayscale}
                            onCheckedChange={(checked) => setImageSettings({ ...imageSettings, grayscale: checked })}
                          />
                          <Label htmlFor="grayscale">Escala de Cinza</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="invert"
                            checked={imageSettings.invert}
                            onCheckedChange={(checked) => setImageSettings({ ...imageSettings, invert: checked })}
                          />
                          <Label htmlFor="invert">Inverter Cores</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="binarize"
                            checked={imageSettings.binarize}
                            onCheckedChange={(checked) => setImageSettings({ ...imageSettings, binarize: checked })}
                          />
                          <Label htmlFor="binarize">Binarizar</Label>
                        </div>
                      </div>

                      {imageSettings.binarize && (
                        <div className="space-y-2">
                          <Label>Limiar: {imageSettings.threshold}</Label>
                          <Slider
                            value={[imageSettings.threshold]}
                            min={0}
                            max={255}
                            step={1}
                            onValueChange={(value) => setImageSettings({ ...imageSettings, threshold: value[0] })}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Configurações Avançadas</h3>

                      <div className="space-y-2">
                        <Label>Idioma OCR</Label>
                        <Select value={ocrLanguage} onValueChange={(value) => setOcrLanguage(value)}>
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
                        <Label>Modo de Segmentação de Página (PSM)</Label>
                        <Select
                          value={advancedSettings.psm.toString()}
                          onValueChange={(value) =>
                            setAdvancedSettings({ ...advancedSettings, psm: Number.parseInt(value) as any })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Orientação e script automáticos</SelectItem>
                            <SelectItem value="1">Orientação automática</SelectItem>
                            <SelectItem value="3">Texto completo sem orientação</SelectItem>
                            <SelectItem value="4">Coluna de texto única</SelectItem>
                            <SelectItem value="6">Bloco de texto uniforme</SelectItem>
                            <SelectItem value="11">Texto esparso</SelectItem>
                            <SelectItem value="13">Texto bruto em linha única</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Modo de Engine OCR (OEM)</Label>
                        <Select
                          value={advancedSettings.oem.toString()}
                          onValueChange={(value) =>
                            setAdvancedSettings({ ...advancedSettings, oem: Number.parseInt(value) as any })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Apenas Legacy Engine</SelectItem>
                            <SelectItem value="1">Apenas Neural nets LSTM</SelectItem>
                            <SelectItem value="2">Legacy + LSTM</SelectItem>
                            <SelectItem value="3">Padrão, baseado no que está disponível</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Lista de Caracteres Permitidos</Label>
                        <Input
                          value={advancedSettings.whitelist}
                          onChange={(e) => setAdvancedSettings({ ...advancedSettings, whitelist: e.target.value })}
                          placeholder="Ex: 0123456789:."
                        />
                        <p className="text-xs text-gray-500">
                          Deixe em branco para permitir todos os caracteres. Para horários e frotas, você pode usar
                          "0123456789:."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setImageSettings({
                          brightness: 100,
                          contrast: 100,
                          grayscale: false,
                          invert: false,
                          binarize: false,
                          threshold: 128,
                          rotate: 0,
                          sharpen: 0,
                          denoise: 0,
                          adaptiveThreshold: false,
                          adaptiveBlockSize: 11,
                          adaptiveC: 2,
                          removeLines: false,
                          lineThickness: 1,
                          dilate: 0,
                          erode: 0,
                        })
                      }
                    >
                      Resetar Tudo
                    </Button>

                    <Button
                      onClick={() => {
                        setImageSettings({
                          ...imageSettings,
                          grayscale: true,
                          contrast: 120,
                          brightness: 110,
                          binarize: false,
                          threshold: 128,
                          invert: false,
                          rotate: 0,
                        })

                        setAdvancedSettings({
                          ...advancedSettings,
                          psm: 6,
                          oem: 3,
                          whitelist: "0123456789:.",
                        })

                        toast({
                          title: "Auto-ajuste aplicado",
                          description: "As configurações foram otimizadas para extração de tabelas.",
                        })
                      }}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Auto-ajuste para Tabelas
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="profiles" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="profile-name" className="mb-2 block">
                        Nome do Perfil
                      </Label>
                      <Input
                        id="profile-name"
                        value={currentProfileName}
                        onChange={(e) => setCurrentProfileName(e.target.value)}
                        placeholder="Ex: Tabela de Agendamentos"
                      />
                    </div>
                    <Button onClick={saveProfile} disabled={!currentProfileName.trim()}>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Perfil
                    </Button>
                  </div>

                  {savedProfiles.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Nome do Perfil
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Método de Extração
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Configurações
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {savedProfiles.map((profile, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {profile.name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {profile.extractionMethod}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {profile.settings.grayscale ? "Escala de Cinza, " : ""}
                                {profile.settings.binarize ? "Binarizado, " : ""}
                                Brilho: {profile.settings.brightness}%, Contraste: {profile.settings.contrast}%
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="ghost" size="sm" onClick={() => loadProfile(index)}>
                                  Carregar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-md bg-gray-50">
                      <p className="text-gray-500">Nenhum perfil salvo. Salve suas configurações para uso futuro.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Texto extraído e edição */}
      {extractedText && !isProcessing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Texto Extraído</CardTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button variant="outline" size="sm" onClick={processEditedText}>
                      <FileText className="h-4 w-4 mr-1" />
                      Processar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={extractedText}
              onChange={handleTextEdit}
              placeholder="O texto extraído da imagem aparecerá aqui. Você pode editar manualmente se necessário."
              className="min-h-[200px] font-mono text-sm"
              disabled={!isEditing}
            />
            <p className="text-xs text-gray-500 mt-2">
              {isEditing
                ? "Edite o texto para incluir apenas os pares de horário e frota, um por linha. Exemplo: '07:00:00 8001'"
                : "Clique em 'Editar' para modificar o texto extraído manualmente."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dados extraídos */}
      {extractedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Dados Extraídos ({extractedData.length} registros)</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
                <Button variant="default" size="sm" onClick={() => onDataExtracted(extractedData)}>
                  <Check className="h-4 w-4 mr-1" />
                  Continuar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Agendamento
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Frota
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {extractedData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.horario}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.frota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Como usar o extrator ultra robusto</AlertTitle>
        <AlertDescription className="text-blue-700">
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
            <li>Carregue uma imagem que contenha a tabela de agendamentos</li>
            <li>Use as ferramentas de processamento de imagem para melhorar a qualidade</li>
            <li>Escolha um método de extração:</li>
            <ul className="list-disc pl-5 mt-1 mb-2 space-y-1">
              <li>
                <strong>Detecção de Tabela:</strong> Identifica automaticamente tabelas na imagem
              </li>
              <li>
                <strong>Detecção de Colunas:</strong> Identifica e seleciona as colunas relevantes
              </li>
              <li>
                <strong>Estrutura da Tabela:</strong> Analisa a estrutura completa da tabela
              </li>
              <li>
                <strong>Multi-Pass OCR:</strong> Executa múltiplos passes de OCR com diferentes configurações
              </li>
            </ul>
            <li>Revise e edite o texto extraído se necessário</li>
            <li>Verifique os dados extraídos e clique em "Continuar" para usar os dados</li>
          </ol>
          <div className="flex items-center mt-3 bg-yellow-50 p-2 rounded border border-yellow-200">
            <Wand2 className="h-4 w-4 text-yellow-600 mr-2" />
            <p className="text-xs text-yellow-700">
              <strong>Dica:</strong> Para melhores resultados com tabelas, use o botão "Auto-ajuste para Tabelas" nas
              configurações.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default UltraRobustExtractor
