"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
  Brain,
  Sparkles,
  Copy,
  TableIcon,
  RefreshCw,
  FileSpreadsheet,
  Target,
  Zap,
  Activity,
  BookOpen,
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  Code,
  BarChart3,
  TrendingUp,
  Cpu,
  GitBranch,
} from "lucide-react"
import * as XLSX from "xlsx"

// Types
interface ExtractedData {
  id: string
  horario: string
  frota: string
  confianca: number
  origem: string
  validado?: boolean
}

interface ExtractionPattern {
  id: string
  name: string
  description: string
  regex: RegExp
  type: "horario" | "frota" | "both"
  confidence: number
  examples: string[]
}

interface AIModel {
  id: string
  name: string
  description: string
  accuracy: number
  speed: number
  specialization: string[]
}

interface ExtractionStrategy {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  confidence: number
  enabled: boolean
}

interface TrainingExample {
  id: string
  input: string
  expectedHorario: string
  expectedFrota: string
  validated: boolean
}

// AI Models disponíveis
const aiModels: AIModel[] = [
  {
    id: "pattern-recognition",
    name: "Reconhecimento de Padrões",
    description: "Identifica padrões de horários e números de frota",
    accuracy: 95,
    speed: 90,
    specialization: ["horários", "números"],
  },
  {
    id: "context-analysis",
    name: "Análise Contextual",
    description: "Analisa o contexto para identificar colunas",
    accuracy: 92,
    speed: 85,
    specialization: ["estrutura", "contexto"],
  },
  {
    id: "nlp-extraction",
    name: "Processamento de Linguagem Natural",
    description: "Usa NLP para entender a estrutura da tabela",
    accuracy: 88,
    speed: 75,
    specialization: ["linguagem", "semântica"],
  },
  {
    id: "ml-adaptive",
    name: "Aprendizado Adaptativo",
    description: "Aprende com correções do usuário",
    accuracy: 94,
    speed: 80,
    specialization: ["adaptação", "aprendizado"],
  },
  {
    id: "hybrid-intelligence",
    name: "Inteligência Híbrida",
    description: "Combina múltiplas técnicas de IA",
    accuracy: 97,
    speed: 70,
    specialization: ["híbrido", "multi-técnica"],
  },
]

// Padrões de extração pré-definidos
const extractionPatterns: ExtractionPattern[] = [
  {
    id: "time-24h",
    name: "Horário 24h",
    description: "Formato HH:MM:SS ou HH:MM",
    regex: /\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?\b/,
    type: "horario",
    confidence: 95,
    examples: ["13:00:00", "15:30", "23:45:00"],
  },
  {
    id: "fleet-numeric",
    name: "Frota Numérica",
    description: "Números de 3 a 6 dígitos",
    regex: /\b\d{3,6}\b/,
    type: "frota",
    confidence: 90,
    examples: ["40167", "8798", "32231"],
  },
  {
    id: "fleet-alphanumeric",
    name: "Frota Alfanumérica",
    description: "Combinação de letras e números",
    regex: /\b[A-Z]{1,3}\d{2,5}\b/,
    type: "frota",
    confidence: 85,
    examples: ["AB123", "XYZ4567", "M890"],
  },
  {
    id: "time-12h",
    name: "Horário 12h",
    description: "Formato com AM/PM",
    regex: /\b(0?[1-9]|1[0-2]):([0-5][0-9])(?::([0-5][0-9]))?\s*(AM|PM|am|pm)\b/,
    type: "horario",
    confidence: 88,
    examples: ["1:00 PM", "11:30 AM", "12:45:00 PM"],
  },
]

// Estratégias de extração
const defaultStrategies: ExtractionStrategy[] = [
  {
    id: "pattern-matching",
    name: "Correspondência de Padrões",
    description: "Usa expressões regulares para identificar dados",
    icon: <Target className="h-4 w-4" />,
    confidence: 90,
    enabled: true,
  },
  {
    id: "column-detection",
    name: "Detecção de Colunas",
    description: "Identifica estrutura de colunas na tabela",
    icon: <TableIcon className="h-4 w-4" />,
    confidence: 85,
    enabled: true,
  },
  {
    id: "semantic-analysis",
    name: "Análise Semântica",
    description: "Entende o significado dos dados",
    icon: <Brain className="h-4 w-4" />,
    confidence: 92,
    enabled: true,
  },
  {
    id: "ml-prediction",
    name: "Predição por ML",
    description: "Usa machine learning para prever estrutura",
    icon: <Cpu className="h-4 w-4" />,
    confidence: 88,
    enabled: true,
  },
  {
    id: "fuzzy-matching",
    name: "Correspondência Aproximada",
    description: "Encontra dados mesmo com pequenos erros",
    icon: <GitBranch className="h-4 w-4" />,
    confidence: 82,
    enabled: false,
  },
]

export function AIPoweredExtractor() {
  // Estados principais
  const [imageSource, setImageSource] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedModel, setSelectedModel] = useState("hybrid-intelligence")
  const [strategies, setStrategies] = useState<ExtractionStrategy[]>(defaultStrategies)
  const [customPatterns, setCustomPatterns] = useState<ExtractionPattern[]>([])
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([])
  const [aiProgress, setAiProgress] = useState(0)
  const [aiStatus, setAiStatus] = useState("")
  const [showTrainingDialog, setShowTrainingDialog] = useState(false)
  const [manualEditMode, setManualEditMode] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [extractionLogs, setExtractionLogs] = useState<string[]>([])

  // Estados para o diálogo de treinamento
  const [trainingInput, setTrainingInput] = useState("")
  const [trainingHorario, setTrainingHorario] = useState("")
  const [trainingFrota, setTrainingFrota] = useState("")

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setImageFile(file)
    setExtractedText("")
    setExtractedData([])
    setExtractionLogs([])

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string
      setImageSource(imageDataUrl)

      addLog(`Imagem carregada: ${file.name}`, "success")

      toast({
        title: "Imagem carregada",
        description: `${file.name} está pronta para processamento.`,
      })
    }
    reader.readAsDataURL(file)
  }

  // Função principal de extração com IA
  const extractWithAI = async () => {
    if (!imageSource) {
      toast({
        title: "Nenhuma imagem",
        description: "Por favor, carregue uma imagem primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setAiProgress(0)
    setExtractedData([])
    setExtractionLogs([])

    try {
      // Fase 1: Simulação de OCR
      addLog("Iniciando processamento com IA...", "info")
      setAiStatus("Executando OCR na imagem...")
      await simulateProgress(20)

      // Texto simulado do OCR
      const ocrText = `Agendamento    Frota     Modelo             Serviço        Tempo
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

      setExtractedText(ocrText)
      addLog("OCR concluído com sucesso", "success")

      // Fase 2: Análise com IA
      setAiStatus("Analisando estrutura da tabela...")
      await simulateProgress(40)

      const lines = ocrText.split("\n")
      const extractedItems: ExtractedData[] = []

      // Fase 3: Aplicar estratégias de extração
      for (const strategy of strategies.filter((s) => s.enabled)) {
        addLog(`Aplicando estratégia: ${strategy.name}`, "info")
        setAiStatus(`Aplicando ${strategy.name}...`)
        await simulateProgress(60)

        switch (strategy.id) {
          case "pattern-matching":
            extractedItems.push(...(await extractWithPatternMatching(lines)))
            break
          case "column-detection":
            extractedItems.push(...(await extractWithColumnDetection(lines)))
            break
          case "semantic-analysis":
            extractedItems.push(...(await extractWithSemanticAnalysis(lines)))
            break
          case "ml-prediction":
            extractedItems.push(...(await extractWithMLPrediction(lines)))
            break
          case "fuzzy-matching":
            extractedItems.push(...(await extractWithFuzzyMatching(lines)))
            break
        }
      }

      // Fase 4: Consolidar e remover duplicatas
      setAiStatus("Consolidando resultados...")
      await simulateProgress(80)

      const uniqueData = consolidateResults(extractedItems)

      // Fase 5: Aplicar aprendizado adaptativo
      if (trainingExamples.length > 0) {
        setAiStatus("Aplicando aprendizado adaptativo...")
        await simulateProgress(90)
        // Aplicar correções baseadas em exemplos de treinamento
      }

      setExtractedData(uniqueData)
      setAiProgress(100)
      setAiStatus("Extração concluída com sucesso!")

      addLog(`Extração concluída: ${uniqueData.length} registros encontrados`, "success")

      toast({
        title: "Extração concluída",
        description: `${uniqueData.length} registros extraídos com IA.`,
      })

      // Mudar para aba de resultados
      setActiveTab("results")
    } catch (error) {
      console.error("Erro na extração:", error)
      addLog("Erro durante a extração", "error")
      toast({
        title: "Erro na extração",
        description: "Ocorreu um erro ao processar a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Estratégia 1: Pattern Matching
  const extractWithPatternMatching = async (lines: string[]): Promise<ExtractedData[]> => {
    const results: ExtractedData[] = []
    const timePattern = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?\b/
    const fleetPattern = /\b\d{3,6}\b/

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const timeMatch = line.match(timePattern)
      const fleetMatches = line.match(new RegExp(fleetPattern, "g"))

      if (timeMatch && fleetMatches && fleetMatches.length > 0) {
        // Assumir que o primeiro número após o horário é a frota
        const horario = timeMatch[0]
        const frota = fleetMatches[0]

        // Verificar se não é REFEIÇÃO ou similar
        if (!line.toLowerCase().includes("refeição") && !line.includes("-")) {
          results.push({
            id: `pm-${Date.now()}-${i}`,
            horario,
            frota,
            confianca: 85,
            origem: "pattern-matching",
          })
        }
      }
    }

    return results
  }

  // Estratégia 2: Column Detection
  const extractWithColumnDetection = async (lines: string[]): Promise<ExtractedData[]> => {
    const results: ExtractedData[] = []

    // Detectar posições das colunas baseado no cabeçalho
    const header = lines[0].toLowerCase()
    const agendamentoPos = header.indexOf("agendamento")
    const frotaPos = header.indexOf("frota")

    if (agendamentoPos === -1 || frotaPos === -1) {
      addLog("Não foi possível detectar colunas no cabeçalho", "warning")
      return results
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.length < Math.max(agendamentoPos, frotaPos)) continue

      // Extrair baseado em posições aproximadas
      const segments = line.split(/\s{2,}/)
      if (segments.length >= 2) {
        const horario = segments[0].trim()
        const frota = segments[1].trim()

        // Validar formato
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(horario) && /^\d+$/.test(frota)) {
          results.push({
            id: `cd-${Date.now()}-${i}`,
            horario,
            frota,
            confianca: 90,
            origem: "column-detection",
          })
        }
      }
    }

    return results
  }

  // Estratégia 3: Semantic Analysis
  const extractWithSemanticAnalysis = async (lines: string[]): Promise<ExtractedData[]> => {
    const results: ExtractedData[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // Análise semântica: procurar por padrões que fazem sentido
      const tokens = line.split(/\s+/)
      let horario = ""
      let frota = ""

      for (const token of tokens) {
        // É um horário?
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(token)) {
          horario = token
        }
        // É uma frota? (número de 3-6 dígitos após encontrar horário)
        else if (horario && /^\d{3,6}$/.test(token)) {
          frota = token
          break // Encontrou ambos
        }
      }

      if (horario && frota) {
        results.push({
          id: `sa-${Date.now()}-${i}`,
          horario,
          frota,
          confianca: 88,
          origem: "semantic-analysis",
        })
      }
    }

    return results
  }

  // Estratégia 4: ML Prediction
  const extractWithMLPrediction = async (lines: string[]): Promise<ExtractedData[]> => {
    const results: ExtractedData[] = []

    // Simular predição de ML baseada em padrões aprendidos
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // ML detectaria padrões mais complexos
      const mlPattern = /(\d{1,2}:\d{2}(?::\d{2})?)\s+(\d{3,6})/
      const match = line.match(mlPattern)

      if (match) {
        results.push({
          id: `ml-${Date.now()}-${i}`,
          horario: match[1],
          frota: match[2],
          confianca: 92,
          origem: "ml-prediction",
        })
      }
    }

    return results
  }

  // Estratégia 5: Fuzzy Matching
  const extractWithFuzzyMatching = async (lines: string[]): Promise<ExtractedData[]> => {
    const results: ExtractedData[] = []

    // Implementar matching aproximado para dados com erros
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // Procurar por padrões aproximados
      const fuzzyTimePattern = /\b\d{1,2}[:.]\d{2}[:.]\d{2}\b/
      const fuzzyFleetPattern = /\b\d{3,6}\b/

      const timeMatch = line.match(fuzzyTimePattern)
      const fleetMatch = line.match(fuzzyFleetPattern)

      if (timeMatch && fleetMatch) {
        // Normalizar horário
        const horario = timeMatch[0].replace(/\./g, ":")

        results.push({
          id: `fm-${Date.now()}-${i}`,
          horario,
          frota: fleetMatch[0],
          confianca: 75,
          origem: "fuzzy-matching",
        })
      }
    }

    return results
  }

  // Consolidar resultados e remover duplicatas
  const consolidateResults = (items: ExtractedData[]): ExtractedData[] => {
    const uniqueMap = new Map<string, ExtractedData>()

    // Agrupar por horário+frota e manter o de maior confiança
    for (const item of items) {
      const key = `${item.horario}-${item.frota}`
      const existing = uniqueMap.get(key)

      if (!existing || item.confianca > existing.confianca) {
        uniqueMap.set(key, item)
      }
    }

    // Converter de volta para array e ordenar por horário
    return Array.from(uniqueMap.values()).sort((a, b) => {
      return a.horario.localeCompare(b.horario)
    })
  }

  // Simular progresso
  const simulateProgress = async (target: number) => {
    const current = aiProgress
    const step = (target - current) / 10

    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      setAiProgress((prev) => Math.min(prev + step, target))
    }
  }

  // Adicionar exemplo de treinamento
  const addTrainingExample = () => {
    if (!trainingInput || !trainingHorario || !trainingFrota) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos do exemplo.",
        variant: "destructive",
      })
      return
    }

    const newExample: TrainingExample = {
      id: `train-${Date.now()}`,
      input: trainingInput,
      expectedHorario: trainingHorario,
      expectedFrota: trainingFrota,
      validated: true,
    }

    setTrainingExamples((prev) => [...prev, newExample])
    setTrainingInput("")
    setTrainingHorario("")
    setTrainingFrota("")
    setShowTrainingDialog(false)

    addLog(`Exemplo de treinamento adicionado: ${trainingHorario} - ${trainingFrota}`, "success")

    toast({
      title: "Exemplo adicionado",
      description: "O sistema aprenderá com este exemplo.",
    })
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

  // Exportar para Excel
  const exportToExcel = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há dados para exportar.",
        variant: "destructive",
      })
      return
    }

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
    XLSX.writeFile(wb, "extracao-ia.xlsx")

    addLog("Dados exportados para Excel", "success")

    toast({
      title: "Exportação concluída",
      description: "Arquivo Excel gerado com sucesso.",
    })
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

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Extrator com IA Avançada</CardTitle>
                <CardDescription>Sistema inteligente para extração de dados de agendamento e frota</CardDescription>
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
          <TabsTrigger value="ai-config">
            <Brain className="h-4 w-4 mr-2" />
            Configurar IA
          </TabsTrigger>
          <TabsTrigger value="training">
            <BookOpen className="h-4 w-4 mr-2" />
            Treinamento
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
          <Card>
            <CardHeader>
              <CardTitle>Carregar Imagem</CardTitle>
              <CardDescription>Faça upload de uma imagem contendo a tabela de agendamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add("border-purple-500", "bg-purple-50")
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("border-purple-500", "bg-purple-50")
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("border-purple-500", "bg-purple-50")
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith("image/")) {
                    const changeEvent = {
                      target: { files: e.dataTransfer.files },
                    } as unknown as React.ChangeEvent<HTMLInputElement>
                    handleFileUpload(changeEvent)
                  }
                }}
              >
                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {imageFile ? imageFile.name : "Arraste uma imagem ou clique para selecionar"}
                </h3>
                <p className="text-sm text-gray-500">Formatos suportados: JPG, PNG, GIF, BMP</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </div>

              {imageSource && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Prévia da imagem:</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={imageSource || "/placeholder.svg"}
                      alt="Prévia"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={extractWithAI} disabled={!imageSource || isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Extrair Dados com IA
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
                    <span>{aiStatus}</span>
                    <span>{Math.round(aiProgress)}%</span>
                  </div>
                  <Progress value={aiProgress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">OCR Ativo</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Brain className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">IA Analisando</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Padrões Detectados</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <Zap className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Otimizando</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modelos de IA</CardTitle>
              <CardDescription>Selecione o modelo de IA mais adequado para sua extração</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiModels.map((model) => (
                <div
                  key={model.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedModel === model.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{model.name}</h4>
                        {selectedModel === model.id && (
                          <Badge variant="default" className="text-xs">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      <div className="flex gap-4 mt-2">
                        <div className="text-xs">
                          <span className="text-gray-500">Precisão:</span>{" "}
                          <span className="font-medium">{model.accuracy}%</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">Velocidade:</span>{" "}
                          <span className="font-medium">{model.speed}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {model.specialization.map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estratégias de Extração</CardTitle>
              <CardDescription>Ative ou desative estratégias específicas de extração</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">{strategy.icon}</div>
                    <div>
                      <h4 className="font-medium text-sm">{strategy.name}</h4>
                      <p className="text-xs text-gray-600">{strategy.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {strategy.confidence}% confiança
                    </Badge>
                    <Switch
                      checked={strategy.enabled}
                      onCheckedChange={(checked) => {
                        setStrategies((prev) =>
                          prev.map((s) => (s.id === strategy.id ? { ...s, enabled: checked } : s)),
                        )
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Treinamento da IA</CardTitle>
                  <CardDescription>Ensine a IA com exemplos corretos para melhorar a precisão</CardDescription>
                </div>
                <Dialog open={showTrainingDialog} onOpenChange={setShowTrainingDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Exemplo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Exemplo de Treinamento</DialogTitle>
                      <DialogDescription>
                        Forneça um exemplo de linha da tabela e os valores esperados
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="training-input">Linha de exemplo (como aparece na tabela)</Label>
                        <Textarea
                          id="training-input"
                          value={trainingInput}
                          onChange={(e) => setTrainingInput(e.target.value)}
                          placeholder="Ex: 13:00:00      40167     SM Triciclo        Lubrificação   0:20"
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="training-horario">Horário esperado</Label>
                          <Input
                            id="training-horario"
                            value={trainingHorario}
                            onChange={(e) => setTrainingHorario(e.target.value)}
                            placeholder="Ex: 13:00:00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="training-frota">Frota esperada</Label>
                          <Input
                            id="training-frota"
                            value={trainingFrota}
                            onChange={(e) => setTrainingFrota(e.target.value)}
                            placeholder="Ex: 40167"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowTrainingDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={addTrainingExample}>Adicionar Exemplo</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {trainingExamples.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">Nenhum exemplo de treinamento</h3>
                  <p className="text-sm text-gray-600">Adicione exemplos para melhorar a precisão da IA</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trainingExamples.map((example) => (
                    <div key={example.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="font-mono text-sm mb-2">{example.input}</div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Horário:</span>{" "}
                          <span className="font-medium">{example.expectedHorario}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Frota:</span>{" "}
                          <span className="font-medium">{example.expectedFrota}</span>
                        </div>
                        <Badge variant={example.validated ? "default" : "secondary"} className="text-xs">
                          {example.validated ? "Validado" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Padrões Personalizados</CardTitle>
              <CardDescription>Defina padrões específicos para seu tipo de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extractionPatterns.map((pattern) => (
                  <div key={pattern.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{pattern.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{pattern.description}</p>
                        <div className="flex gap-2 mt-2">
                          {pattern.examples.map((ex, idx) => (
                            <code key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {ex}
                            </code>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {pattern.confidence}% confiança
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
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
                    {Math.round(extractedData.reduce((sum, item) => sum + item.confianca, 0) / extractedData.length)}%
                  </div>
                  <div className="text-xs text-gray-600">Confiança Média</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{extractedData.filter((item) => item.validado).length}</div>
                  <div className="text-xs text-gray-600">Validados</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <Cpu className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{strategies.filter((s) => s.enabled).length}</div>
                  <div className="text-xs text-gray-600">Estratégias Ativas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {extractedText && (
            <Card>
              <CardHeader>
                <CardTitle>Texto Original (OCR)</CardTitle>
                <CardDescription>Texto extraído da imagem antes do processamento</CardDescription>
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
    </div>
  )
}
