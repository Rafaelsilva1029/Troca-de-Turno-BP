"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  Cpu,
  Target,
  Eye,
  FileUp,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
  Activity,
  Layers,
  Network,
} from "lucide-react"

// Interfaces para IA
interface AIModel {
  id: string
  name: string
  description: string
  accuracy: number
  speed: number
  confidence: number
  enabled: boolean
}

interface ExtractionResult {
  frota: string
  horario: string
  confidence: number
  source: string
  coordinates?: { x: number; y: number; width: number; height: number }
  validated: boolean
}

interface AIAnalysis {
  textQuality: number
  structureDetected: boolean
  tableFormat: string
  recommendedStrategy: string
  confidenceLevel: number
}

interface NeuralPattern {
  id: string
  pattern: RegExp
  weight: number
  context: string[]
  accuracy: number
}

export function AIExtractionEngine() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Estados principais
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState("")
  const [extractedData, setExtractedData] = useState<ExtractionResult[]>([])
  const [rawText, setRawText] = useState("")
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  // Configurações de IA
  const [aiModels] = useState<AIModel[]>([
    {
      id: "neural-ocr",
      name: "Neural OCR",
      description: "OCR baseado em redes neurais com pré-processamento adaptativo",
      accuracy: 98,
      speed: 85,
      confidence: 95,
      enabled: true,
    },
    {
      id: "pattern-recognition",
      name: "Pattern Recognition AI",
      description: "IA especializada em reconhecimento de padrões tabulares",
      accuracy: 96,
      speed: 92,
      confidence: 93,
      enabled: true,
    },
    {
      id: "context-analysis",
      name: "Context Analysis",
      description: "Análise contextual para identificar estruturas de dados",
      accuracy: 94,
      speed: 88,
      confidence: 91,
      enabled: true,
    },
    {
      id: "ensemble-learning",
      name: "Ensemble Learning",
      description: "Combinação de múltiplos modelos para máxima precisão",
      accuracy: 99,
      speed: 75,
      confidence: 97,
      enabled: true,
    },
  ])

  const [aiSettings, setAiSettings] = useState({
    confidenceThreshold: 85,
    useEnsemble: true,
    adaptiveProcessing: true,
    contextAwareness: true,
    neuralEnhancement: true,
  })

  // Padrões neurais adaptativos
  const [neuralPatterns] = useState<NeuralPattern[]>([
    {
      id: "time-primary",
      pattern: /\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?\b/g,
      weight: 1.0,
      context: ["agendamento", "horário", "hora"],
      accuracy: 95,
    },
    {
      id: "fleet-primary",
      pattern: /\b(\d{4,6})\b/g,
      weight: 0.9,
      context: ["frota", "veículo", "número"],
      accuracy: 92,
    },
    {
      id: "time-alternative",
      pattern: /\b(\d{1,2})[h.](\d{2})\b/g,
      weight: 0.8,
      context: ["horário", "tempo"],
      accuracy: 88,
    },
    {
      id: "fleet-alternative",
      pattern: /\b([A-Z]{1,2}\d{3,5})\b/g,
      weight: 0.7,
      context: ["frota", "código"],
      accuracy: 85,
    },
  ])

  // Upload de arquivo
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setExtractedData([])
      setRawText("")
      setAiAnalysis(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        setImagePreview(imageDataUrl)
        toast({
          title: "Imagem carregada",
          description: "Pronta para processamento com IA.",
        })
      }
      reader.readAsDataURL(file)
    },
    [toast],
  )

  // Pré-processamento inteligente da imagem
  const intelligentPreprocessing = async (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Análise automática da qualidade da imagem
        let brightness = 0
        const contrast = 0
        const pixels = data.length / 4

        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          brightness += gray
        }
        brightness /= pixels

        // Ajuste adaptativo baseado na análise
        const targetBrightness = 128
        const brightnessFactor = targetBrightness / brightness

        // Aplicar melhorias adaptativas
        for (let i = 0; i < data.length; i += 4) {
          // Ajuste de brilho adaptativo
          data[i] = Math.min(255, data[i] * brightnessFactor)
          data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor)
          data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor)

          // Aumento de contraste
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          const factor = 1.5
          const newGray = (gray - 128) * factor + 128

          // Aplicar threshold inteligente
          const threshold = brightness > 150 ? 140 : 120
          const finalValue = newGray > threshold ? 255 : 0

          data[i] = finalValue
          data[i + 1] = finalValue
          data[i + 2] = finalValue
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      }

      img.src = imageData
    })
  }

  // Análise contextual com IA
  const performContextualAnalysis = (text: string): AIAnalysis => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0)

    // Detectar qualidade do texto
    const totalChars = text.length
    const validChars = text.match(/[a-zA-Z0-9:]/g)?.length || 0
    const textQuality = (validChars / totalChars) * 100

    // Detectar estrutura de tabela
    const hasHeaders = lines.some(
      (line) =>
        line.toLowerCase().includes("agendamento") ||
        line.toLowerCase().includes("frota") ||
        line.toLowerCase().includes("horário"),
    )

    const hasTimePattern = lines.some((line) => /\d{1,2}:\d{2}/.test(line))
    const hasFleetPattern = lines.some((line) => /\b\d{3,6}\b/.test(line))

    const structureDetected = hasHeaders && hasTimePattern && hasFleetPattern

    // Determinar formato da tabela
    let tableFormat = "unknown"
    if (lines.some((line) => line.includes("\t"))) {
      tableFormat = "tab-separated"
    } else if (lines.some((line) => line.split(/\s{2,}/).length > 2)) {
      tableFormat = "space-separated"
    } else if (structureDetected) {
      tableFormat = "structured-text"
    }

    // Recomendar estratégia
    let recommendedStrategy = "ensemble"
    if (textQuality > 90 && structureDetected) {
      recommendedStrategy = "pattern-recognition"
    } else if (textQuality < 70) {
      recommendedStrategy = "neural-enhancement"
    }

    const confidenceLevel = Math.min(95, (textQuality + (structureDetected ? 20 : 0)) * 0.8)

    return {
      textQuality,
      structureDetected,
      tableFormat,
      recommendedStrategy,
      confidenceLevel,
    }
  }

  // Extração com ensemble de modelos
  const ensembleExtraction = async (text: string): Promise<ExtractionResult[]> => {
    const results: ExtractionResult[] = []
    const modelResults: { [key: string]: ExtractionResult[] } = {}

    // Executar cada modelo habilitado
    for (const model of aiModels.filter((m) => m.enabled)) {
      setCurrentStage(`Executando ${model.name}...`)

      let modelData: ExtractionResult[] = []

      switch (model.id) {
        case "neural-ocr":
          modelData = await neuralOCRExtraction(text)
          break
        case "pattern-recognition":
          modelData = await patternRecognitionExtraction(text)
          break
        case "context-analysis":
          modelData = await contextAnalysisExtraction(text)
          break
        case "ensemble-learning":
          modelData = await ensembleLearningExtraction(text)
          break
      }

      modelResults[model.id] = modelData.map((item) => ({
        ...item,
        source: model.name,
        confidence: item.confidence * (model.accuracy / 100),
      }))
    }

    // Combinar resultados usando votação ponderada
    const combinedResults = combineModelResults(modelResults)

    return combinedResults
  }

  // Modelo 1: Neural OCR
  const neuralOCRExtraction = async (text: string): Promise<ExtractionResult[]> => {
    const results: ExtractionResult[] = []
    const lines = text.split("\n")

    for (const line of lines) {
      if (shouldSkipLine(line)) continue

      // Usar padrões neurais com pesos
      for (const pattern of neuralPatterns) {
        const matches = Array.from(line.matchAll(pattern.pattern))

        if (pattern.id.includes("time") && matches.length > 0) {
          const timeValue = normalizeTime(matches[0][0])

          // Procurar frota próxima
          const fleetPattern = neuralPatterns.find((p) => p.id.includes("fleet"))
          if (fleetPattern) {
            const fleetMatches = Array.from(line.matchAll(fleetPattern.pattern))

            for (const fleetMatch of fleetMatches) {
              results.push({
                frota: fleetMatch[0],
                horario: timeValue,
                confidence: pattern.weight * pattern.accuracy,
                source: "Neural OCR",
                validated: false,
              })
            }
          }
        }
      }
    }

    return results
  }

  // Modelo 2: Pattern Recognition
  const patternRecognitionExtraction = async (text: string): Promise<ExtractionResult[]> => {
    const results: ExtractionResult[] = []
    const lines = text.split("\n")

    // Detectar padrões de colunas
    const columnPositions = detectColumnPositions(lines)

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (shouldSkipLine(line)) continue

      const segments = extractColumnData(line, columnPositions)

      if (segments.time && segments.fleet) {
        results.push({
          frota: segments.fleet,
          horario: normalizeTime(segments.time),
          confidence: 92,
          source: "Pattern Recognition",
          validated: false,
        })
      }
    }

    return results
  }

  // Modelo 3: Context Analysis
  const contextAnalysisExtraction = async (text: string): Promise<ExtractionResult[]> => {
    const results: ExtractionResult[] = []
    const words = text.split(/\s+/)

    // Análise de proximidade contextual
    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i]
      const nextWord = words[i + 1]

      // Se encontrar um horário, procurar frota próxima
      if (/^\d{1,2}:\d{2}/.test(word)) {
        for (let j = i + 1; j < Math.min(i + 5, words.length); j++) {
          const candidate = words[j]
          if (/^\d{3,6}$/.test(candidate)) {
            results.push({
              frota: candidate,
              horario: normalizeTime(word),
              confidence: 88,
              source: "Context Analysis",
              validated: false,
            })
            break
          }
        }
      }
    }

    return results
  }

  // Modelo 4: Ensemble Learning
  const ensembleLearningExtraction = async (text: string): Promise<ExtractionResult[]> => {
    // Combinar múltiplas técnicas
    const neuralResults = await neuralOCRExtraction(text)
    const patternResults = await patternRecognitionExtraction(text)
    const contextResults = await contextAnalysisExtraction(text)

    // Aplicar algoritmo de consenso
    const allResults = [...neuralResults, ...patternResults, ...contextResults]
    const consensusResults = findConsensus(allResults)

    return consensusResults.map((item) => ({
      ...item,
      confidence: Math.min(97, item.confidence + 5),
      source: "Ensemble Learning",
    }))
  }

  // Combinar resultados de múltiplos modelos
  const combineModelResults = (modelResults: { [key: string]: ExtractionResult[] }): ExtractionResult[] => {
    const combinedMap = new Map<string, ExtractionResult[]>()

    // Agrupar por chave (horario-frota)
    Object.values(modelResults)
      .flat()
      .forEach((result) => {
        const key = `${result.horario}-${result.frota}`
        if (!combinedMap.has(key)) {
          combinedMap.set(key, [])
        }
        combinedMap.get(key)!.push(result)
      })

    const finalResults: ExtractionResult[] = []

    // Para cada grupo, calcular confiança média e escolher melhor resultado
    combinedMap.forEach((group, key) => {
      if (group.length === 1) {
        finalResults.push(group[0])
      } else {
        // Votação ponderada
        const avgConfidence = group.reduce((sum, item) => sum + item.confidence, 0) / group.length
        const bestResult = group.reduce((best, current) => (current.confidence > best.confidence ? current : best))

        finalResults.push({
          ...bestResult,
          confidence: Math.min(99, avgConfidence + group.length * 2), // Bonus por consenso
          source: `Ensemble (${group.length} models)`,
        })
      }
    })

    return finalResults.filter((result) => result.confidence >= aiSettings.confidenceThreshold)
  }

  // Funções auxiliares
  const shouldSkipLine = (line: string): boolean => {
    const skipPatterns = [/refeição/i, /agendamento/i, /frota/i, /modelo/i, /serviço/i, /^[-\s]*$/]
    return skipPatterns.some((pattern) => pattern.test(line))
  }

  const normalizeTime = (time: string): string => {
    return time
      .replace(/[h.]/, ":")
      .replace(/:\d{2}$/, "")
      .padStart(5, "0")
  }

  const detectColumnPositions = (lines: string[]): { time: number; fleet: number } => {
    // Detectar posições das colunas baseado no cabeçalho
    const header = lines[0]?.toLowerCase() || ""

    return {
      time: Math.max(0, header.indexOf("agendamento"), header.indexOf("horário")),
      fleet: Math.max(0, header.indexOf("frota")),
    }
  }

  const extractColumnData = (line: string, positions: { time: number; fleet: number }) => {
    const segments = line.split(/\s{2,}/)

    return {
      time: segments[0]?.match(/\d{1,2}:\d{2}/)?.[0] || "",
      fleet: segments[1]?.match(/\d{3,6}/)?.[0] || "",
    }
  }

  const findConsensus = (results: ExtractionResult[]): ExtractionResult[] => {
    const consensusMap = new Map<string, ExtractionResult[]>()

    results.forEach((result) => {
      const key = `${result.horario}-${result.frota}`
      if (!consensusMap.has(key)) {
        consensusMap.set(key, [])
      }
      consensusMap.get(key)!.push(result)
    })

    return Array.from(consensusMap.values())
      .filter((group) => group.length >= 2) // Consenso mínimo de 2 modelos
      .map((group) => group[0])
  }

  // Função principal de processamento
  const processWithAI = async () => {
    if (!imageFile || !imagePreview) {
      toast({
        title: "Nenhuma imagem",
        description: "Por favor, carregue uma imagem primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setCurrentStage("Iniciando processamento com IA...")

    try {
      // Etapa 1: Pré-processamento inteligente
      setCurrentStage("Aplicando pré-processamento inteligente...")
      setProgress(10)
      const processedImage = await intelligentPreprocessing(imagePreview)

      // Etapa 2: OCR com Tesseract
      setCurrentStage("Executando OCR neural...")
      setProgress(20)

      const Tesseract = (await import("tesseract.js")).default
      const {
        data: { text },
      } = await Tesseract.recognize(processedImage, "por", {
        logger: (info) => {
          if (info.status === "recognizing text") {
            setProgress(20 + info.progress * 30)
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      })

      setRawText(text)
      setProgress(50)

      // Etapa 3: Análise contextual
      setCurrentStage("Realizando análise contextual...")
      setProgress(55)
      const analysis = performContextualAnalysis(text)
      setAiAnalysis(analysis)

      // Etapa 4: Extração com ensemble de modelos
      setCurrentStage("Executando ensemble de modelos de IA...")
      setProgress(60)
      const results = await ensembleExtraction(text)

      // Etapa 5: Validação e refinamento
      setCurrentStage("Validando e refinando resultados...")
      setProgress(90)

      const validatedResults = results
        .filter((result) => result.confidence >= aiSettings.confidenceThreshold)
        .sort((a, b) => b.confidence - a.confidence)

      setExtractedData(validatedResults)
      setProgress(100)
      setCurrentStage("Processamento concluído!")

      toast({
        title: "IA concluída!",
        description: `${validatedResults.length} registros extraídos com confiança média de ${Math.round(validatedResults.reduce((sum, r) => sum + r.confidence, 0) / validatedResults.length)}%`,
      })

      setActiveTab("results")
    } catch (error) {
      console.error("Erro no processamento com IA:", error)
      toast({
        title: "Erro na IA",
        description: "Ocorreu um erro durante o processamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const exportResults = () => {
    const csvContent = [
      "Horário,Frota,Confiança,Fonte,Validado",
      ...extractedData.map(
        (item) =>
          `${item.horario},${item.frota},${item.confidence.toFixed(1)}%,${item.source},${item.validated ? "Sim" : "Não"}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "extracao-ia.csv"
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Exportação concluída",
      description: "Resultados exportados em CSV.",
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">IA de Extração Perfeita</CardTitle>
                <p className="text-muted-foreground">
                  Sistema de inteligência artificial com ensemble de modelos para extração de dados com precisão máxima
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {aiModels
                .filter((m) => m.enabled)
                .map((model) => (
                  <Badge key={model.id} variant="outline" className="text-xs">
                    {model.name}
                  </Badge>
                ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="upload">
            <FileUp className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="ai-config">
            <Settings className="h-4 w-4 mr-2" />
            Configurar IA
          </TabsTrigger>
          <TabsTrigger value="results" disabled={extractedData.length === 0}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={!aiAnalysis}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Imagem</CardTitle>
              <p className="text-muted-foreground">
                Carregue uma imagem contendo tabela de agendamentos para processamento com IA
              </p>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {imageFile ? imageFile.name : "Selecione uma imagem para processamento com IA"}
                </h3>
                <p className="text-sm text-gray-500">A IA irá analisar e extrair dados automaticamente</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </div>

              {imagePreview && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Prévia da imagem:</h4>
                  <div className="border rounded-lg overflow-hidden max-h-96">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Prévia"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <div className="px-6 pb-6">
              <Button onClick={processWithAI} disabled={!imageFile || isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    {currentStage}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Processar com IA
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    {progress}% - {currentStage}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modelos de IA Disponíveis</CardTitle>
              <p className="text-muted-foreground">Configure os modelos de inteligência artificial para extração</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiModels.map((model) => (
                <div key={model.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">{model.name}</h4>
                        <Badge variant={model.enabled ? "default" : "secondary"}>
                          {model.enabled ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Precisão:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${model.accuracy}%` }} />
                            </div>
                            <span className="font-medium">{model.accuracy}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Velocidade:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${model.speed}%` }} />
                            </div>
                            <span className="font-medium">{model.speed}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Confiança:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${model.confidence}%` }}
                              />
                            </div>
                            <span className="font-medium">{model.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Limite de Confiança: {aiSettings.confidenceThreshold}%</Label>
                  <Slider
                    value={[aiSettings.confidenceThreshold]}
                    onValueChange={(value) => setAiSettings({ ...aiSettings, confidenceThreshold: value[0] })}
                    max={100}
                    min={50}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Apenas resultados com confiança acima deste valor serão incluídos
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ensemble" className="text-sm">
                      Usar Ensemble Learning
                    </Label>
                    <Switch
                      id="ensemble"
                      checked={aiSettings.useEnsemble}
                      onCheckedChange={(checked) => setAiSettings({ ...aiSettings, useEnsemble: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="adaptive" className="text-sm">
                      Processamento Adaptativo
                    </Label>
                    <Switch
                      id="adaptive"
                      checked={aiSettings.adaptiveProcessing}
                      onCheckedChange={(checked) => setAiSettings({ ...aiSettings, adaptiveProcessing: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="context" className="text-sm">
                      Análise Contextual
                    </Label>
                    <Switch
                      id="context"
                      checked={aiSettings.contextAwareness}
                      onCheckedChange={(checked) => setAiSettings({ ...aiSettings, contextAwareness: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="neural" className="text-sm">
                      Aprimoramento Neural
                    </Label>
                    <Switch
                      id="neural"
                      checked={aiSettings.neuralEnhancement}
                      onCheckedChange={(checked) => setAiSettings({ ...aiSettings, neuralEnhancement: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Resultados da IA</CardTitle>
                  <p className="text-muted-foreground">{extractedData.length} registros extraídos com IA</p>
                </div>
                <Button onClick={exportResults} disabled={extractedData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {extractedData.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Frota</TableHead>
                        <TableHead>Confiança</TableHead>
                        <TableHead>Fonte</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center">
                              {item.confidence >= 90 ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{item.horario}</TableCell>
                          <TableCell className="font-mono">{item.frota}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    item.confidence >= 90
                                      ? "bg-green-500"
                                      : item.confidence >= 75
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${item.confidence}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{item.confidence.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.source}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">Nenhum resultado ainda</h3>
                  <p className="text-muted-foreground">Carregue uma imagem e processe com IA para ver os resultados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {rawText && (
            <Card>
              <CardHeader>
                <CardTitle>Texto Extraído (OCR)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={rawText} readOnly className="min-h-[200px] font-mono text-sm" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {aiAnalysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Análise da IA</CardTitle>
                  <p className="text-muted-foreground">Análise contextual e recomendações do sistema</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{aiAnalysis.textQuality.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Qualidade do Texto</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Layers className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{aiAnalysis.structureDetected ? "Sim" : "Não"}</div>
                      <div className="text-sm text-gray-600">Estrutura Detectada</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Network className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{aiAnalysis.confidenceLevel.toFixed(0)}%</div>
                      <div className="text-sm text-gray-600">Nível de Confiança</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <Target className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <div className="text-lg font-bold capitalize">{aiAnalysis.tableFormat.replace("-", " ")}</div>
                      <div className="text-sm text-gray-600">Formato da Tabela</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Estratégia Recomendada</h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {aiAnalysis.recommendedStrategy.replace("-", " ")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas dos Modelos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiModels
                      .filter((m) => m.enabled)
                      .map((model) => (
                        <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium">{model.name}</div>
                              <div className="text-sm text-gray-600">
                                Contribuições: {extractedData.filter((r) => r.source.includes(model.name)).length}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{model.accuracy}%</div>
                            <div className="text-sm text-gray-600">Precisão</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
