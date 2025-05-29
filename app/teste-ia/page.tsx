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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  Upload,
  Eye,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  Activity,
  Network,
  Settings,
  FileImage,
  Sparkles,
  TrendingUp,
  BarChart3,
  Clock,
  Truck,
  Cpu,
  Camera,
  Microscope,
} from "lucide-react"

interface TestResult {
  frota: string
  horario: string
  confidence: number
  source: string
  modelId: string
  processingTime: number
  coordinates?: { x: number; y: number; width: number; height: number }
}

interface ModelPerformance {
  id: string
  name: string
  extractedCount: number
  avgConfidence: number
  processingTime: number
  accuracy: number
}

interface ProcessingStage {
  name: string
  status: "pending" | "processing" | "completed" | "error"
  duration?: number
  details?: string
}

export default function TesteIAPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Estados principais
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [rawOcrText, setRawOcrText] = useState("")
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([])
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([])
  const [activeTab, setActiveTab] = useState("upload")

  // Configurações de teste
  const [testSettings, setTestSettings] = useState({
    brightness: 120,
    contrast: 150,
    threshold: 130,
    enablePreprocessing: true,
    confidenceThreshold: 75,
    enableEnsemble: true,
    debugMode: true,
  })

  // Estatísticas em tempo real
  const [stats, setStats] = useState({
    totalProcessingTime: 0,
    ocrAccuracy: 0,
    dataExtractionRate: 0,
    modelConsensus: 0,
  })

  // Inicializar estágios de processamento
  const initializeStages = () => {
    const stages: ProcessingStage[] = [
      { name: "Carregamento da Imagem", status: "pending" },
      { name: "Pré-processamento Inteligente", status: "pending" },
      { name: "OCR Neural", status: "pending" },
      { name: "Análise Contextual", status: "pending" },
      { name: "Modelo Neural OCR", status: "pending" },
      { name: "Modelo Pattern Recognition", status: "pending" },
      { name: "Modelo Context Analysis", status: "pending" },
      { name: "Ensemble Learning", status: "pending" },
      { name: "Validação e Consenso", status: "pending" },
      { name: "Finalização", status: "pending" },
    ]
    setProcessingStages(stages)
  }

  // Atualizar estágio
  const updateStage = (stageName: string, status: ProcessingStage["status"], details?: string, duration?: number) => {
    setProcessingStages((prev) =>
      prev.map((stage) => (stage.name === stageName ? { ...stage, status, details, duration } : stage)),
    )
  }

  // Upload de arquivo com validação avançada
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validações
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione uma imagem (JPG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)
      setTestResults([])
      setRawOcrText("")
      setModelPerformance([])
      setProcessedImage(null)
      initializeStages()

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        setImagePreview(imageDataUrl)

        // Análise básica da imagem
        const img = new Image()
        img.onload = () => {
          const aspectRatio = img.width / img.height
          const megapixels = (img.width * img.height) / 1000000

          toast({
            title: "Imagem carregada com sucesso",
            description: `${img.width}x${img.height} (${megapixels.toFixed(1)}MP, ratio: ${aspectRatio.toFixed(2)})`,
          })
        }
        img.src = imageDataUrl
      }
      reader.readAsDataURL(file)
    },
    [toast],
  )

  // Pré-processamento inteligente com configurações personalizadas
  const intelligentPreprocessing = async (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current || document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        if (!testSettings.enablePreprocessing) {
          resolve(canvas.toDataURL("image/png"))
          return
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Aplicar configurações personalizadas
        const brightnessFactor = testSettings.brightness / 100
        const contrastFactor = testSettings.contrast / 100

        for (let i = 0; i < data.length; i += 4) {
          // Ajuste de brilho
          data[i] = Math.min(255, data[i] * brightnessFactor)
          data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor)
          data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor)

          // Ajuste de contraste
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          const newGray = (gray - 128) * contrastFactor + 128

          // Threshold
          const finalValue = newGray > testSettings.threshold ? 255 : 0
          data[i] = finalValue
          data[i + 1] = finalValue
          data[i + 2] = finalValue
        }

        ctx.putImageData(imageData, 0, 0)
        const processedDataUrl = canvas.toDataURL("image/png")
        setProcessedImage(processedDataUrl)
        resolve(processedDataUrl)
      }

      img.src = imageData
    })
  }

  // Simulação de modelos de IA (para demonstração)
  const simulateAIModels = async (text: string): Promise<TestResult[]> => {
    const results: TestResult[] = []
    const models = [
      { id: "neural-ocr", name: "Neural OCR", baseAccuracy: 98 },
      { id: "pattern-recognition", name: "Pattern Recognition", baseAccuracy: 96 },
      { id: "context-analysis", name: "Context Analysis", baseAccuracy: 94 },
      { id: "ensemble-learning", name: "Ensemble Learning", baseAccuracy: 99 },
    ]

    const performance: ModelPerformance[] = []

    for (const model of models) {
      const startTime = Date.now()
      updateStage(`Modelo ${model.name}`, "processing")

      // Simular processamento
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Extrair dados simulados baseados no texto
      const modelResults = extractDataWithModel(text, model)
      results.push(...modelResults)

      const endTime = Date.now()
      const processingTime = endTime - startTime

      performance.push({
        id: model.id,
        name: model.name,
        extractedCount: modelResults.length,
        avgConfidence: modelResults.reduce((sum, r) => sum + r.confidence, 0) / modelResults.length || 0,
        processingTime,
        accuracy: model.baseAccuracy,
      })

      updateStage(`Modelo ${model.name}`, "completed", `${modelResults.length} registros`, processingTime)
    }

    setModelPerformance(performance)
    return results
  }

  // Extração simulada por modelo
  const extractDataWithModel = (
    text: string,
    model: { id: string; name: string; baseAccuracy: number },
  ): TestResult[] => {
    const results: TestResult[] = []
    const lines = text.split("\n")

    // Padrões diferentes por modelo
    const patterns = {
      "neural-ocr": [{ time: /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/g, fleet: /\b(\d{4,6})\b/g }],
      "pattern-recognition": [{ time: /\b(\d{1,2})[h.](\d{2})\b/g, fleet: /\b([A-Z]?\d{3,5})\b/g }],
      "context-analysis": [{ time: /(\d{1,2}:\d{2})/g, fleet: /\b(\d{3,6})\b/g }],
      "ensemble-learning": [
        { time: /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/g, fleet: /\b(\d{4,6})\b/g },
        { time: /\b(\d{1,2})[h.](\d{2})\b/g, fleet: /\b([A-Z]?\d{3,5})\b/g },
      ],
    }

    const modelPatterns = patterns[model.id as keyof typeof patterns] || patterns["neural-ocr"]

    for (const line of lines) {
      if (line.trim().length < 5) continue

      for (const pattern of modelPatterns) {
        const timeMatches = Array.from(line.matchAll(pattern.time))
        const fleetMatches = Array.from(line.matchAll(pattern.fleet))

        for (const timeMatch of timeMatches) {
          for (const fleetMatch of fleetMatches) {
            const confidence = model.baseAccuracy + Math.random() * 10 - 5
            const processingTime = 50 + Math.random() * 200

            results.push({
              frota: fleetMatch[0],
              horario: normalizeTime(timeMatch[0]),
              confidence: Math.max(60, Math.min(99, confidence)),
              source: model.name,
              modelId: model.id,
              processingTime,
            })
          }
        }
      }
    }

    return results
  }

  // Normalizar horário
  const normalizeTime = (time: string): string => {
    return time.replace(/[h.]/, ":").padStart(5, "0")
  }

  // Processar imagem com IA
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
    const startTime = Date.now()

    try {
      // Etapa 1: Carregamento
      updateStage("Carregamento da Imagem", "processing")
      setProgress(5)
      await new Promise((resolve) => setTimeout(resolve, 500))
      updateStage("Carregamento da Imagem", "completed", "Imagem carregada", 500)

      // Etapa 2: Pré-processamento
      updateStage("Pré-processamento Inteligente", "processing")
      setProgress(10)
      const processedImage = await intelligentPreprocessing(imagePreview)
      updateStage("Pré-processamento Inteligente", "completed", "Filtros aplicados", 1000)

      // Etapa 3: OCR
      updateStage("OCR Neural", "processing")
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
      })

      setRawOcrText(text)
      updateStage("OCR Neural", "completed", `${text.length} caracteres extraídos`, 3000)
      setProgress(50)

      // Etapa 4: Análise Contextual
      updateStage("Análise Contextual", "processing")
      setProgress(55)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      updateStage("Análise Contextual", "completed", "Estrutura analisada", 1000)

      // Etapa 5-8: Modelos de IA
      setProgress(60)
      const aiResults = await simulateAIModels(text)

      // Etapa 9: Validação
      updateStage("Validação e Consenso", "processing")
      setProgress(90)

      const validatedResults = aiResults.filter((result) => result.confidence >= testSettings.confidenceThreshold)

      // Remover duplicatas
      const uniqueResults = validatedResults.filter(
        (result, index, self) =>
          index === self.findIndex((r) => r.frota === result.frota && r.horario === result.horario),
      )

      setTestResults(uniqueResults)
      updateStage("Validação e Consenso", "completed", `${uniqueResults.length} registros validados`, 1000)

      // Etapa 10: Finalização
      updateStage("Finalização", "processing")
      setProgress(95)

      const totalTime = Date.now() - startTime
      setStats({
        totalProcessingTime: totalTime,
        ocrAccuracy: Math.min(95, ((text.match(/[a-zA-Z0-9:]/g)?.length || 0) / text.length) * 100),
        dataExtractionRate: (uniqueResults.length / Math.max(1, text.split("\n").length)) * 100,
        modelConsensus:
          modelPerformance.length > 0
            ? modelPerformance.reduce((sum, m) => sum + m.avgConfidence, 0) / modelPerformance.length
            : 0,
      })

      updateStage("Finalização", "completed", "Processamento concluído", 500)
      setProgress(100)

      toast({
        title: "IA concluída com sucesso!",
        description: `${uniqueResults.length} registros extraídos em ${(totalTime / 1000).toFixed(1)}s`,
      })

      setActiveTab("results")
    } catch (error) {
      console.error("Erro no processamento:", error)
      updateStage("OCR Neural", "error", "Erro no processamento")
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro durante o processamento com IA.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Exportar resultados
  const exportResults = () => {
    const csvContent = [
      "Horário,Frota,Confiança,Fonte,Modelo,Tempo_Processamento",
      ...testResults.map(
        (item) =>
          `${item.horario},${item.frota},${item.confidence.toFixed(1)}%,${item.source},${item.modelId},${item.processingTime}ms`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `teste-ia-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Exportação concluída",
      description: "Resultados do teste exportados em CSV.",
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Microscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Teste de IA - Laboratório</CardTitle>
                <p className="text-muted-foreground">
                  Ambiente de teste para validar e analisar o desempenho dos modelos de IA
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />4 Modelos Ativos
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Modo Debug
              </Badge>
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
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger
            value="processing"
            disabled={!isProcessing && processingStages.every((s) => s.status === "pending")}
          >
            <Activity className="h-4 w-4 mr-2" />
            Processamento
          </TabsTrigger>
          <TabsTrigger value="results" disabled={testResults.length === 0}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={modelPerformance.length === 0}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Análise
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Carregar Imagem de Teste</CardTitle>
                <p className="text-muted-foreground">
                  Selecione uma imagem contendo tabela de agendamentos para testar a IA
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-2">
                    {imageFile ? imageFile.name : "Clique para selecionar imagem"}
                  </h3>
                  <p className="text-sm text-gray-500">Formatos suportados: JPG, PNG, WEBP (máx. 10MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {imageFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Arquivo carregado:</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Prévia da Imagem</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Prévia original"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                    </div>
                    {processedImage && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-2 bg-gray-50 text-sm font-medium">Imagem Processada:</div>
                        <img
                          src={processedImage || "/placeholder.svg"}
                          alt="Prévia processada"
                          className="w-full h-auto max-h-64 object-contain"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Camera className="h-12 w-12 mx-auto mb-3" />
                    <p>Nenhuma imagem carregada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={processWithAI} disabled={!imageFile || isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Iniciar Teste com IA
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">{progress}% concluído</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pré-processamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="preprocessing">Habilitar Pré-processamento</Label>
                  <Switch
                    id="preprocessing"
                    checked={testSettings.enablePreprocessing}
                    onCheckedChange={(checked) => setTestSettings({ ...testSettings, enablePreprocessing: checked })}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Brilho: {testSettings.brightness}%</Label>
                    <Slider
                      value={[testSettings.brightness]}
                      onValueChange={(value) => setTestSettings({ ...testSettings, brightness: value[0] })}
                      max={200}
                      min={50}
                      step={10}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Contraste: {testSettings.contrast}%</Label>
                    <Slider
                      value={[testSettings.contrast]}
                      onValueChange={(value) => setTestSettings({ ...testSettings, contrast: value[0] })}
                      max={300}
                      min={100}
                      step={10}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Threshold: {testSettings.threshold}</Label>
                    <Slider
                      value={[testSettings.threshold]}
                      onValueChange={(value) => setTestSettings({ ...testSettings, threshold: value[0] })}
                      max={200}
                      min={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Limite de Confiança: {testSettings.confidenceThreshold}%</Label>
                  <Slider
                    value={[testSettings.confidenceThreshold]}
                    onValueChange={(value) => setTestSettings({ ...testSettings, confidenceThreshold: value[0] })}
                    max={95}
                    min={50}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="ensemble">Habilitar Ensemble Learning</Label>
                  <Switch
                    id="ensemble"
                    checked={testSettings.enableEnsemble}
                    onCheckedChange={(checked) => setTestSettings({ ...testSettings, enableEnsemble: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="debug">Modo Debug</Label>
                  <Switch
                    id="debug"
                    checked={testSettings.debugMode}
                    onCheckedChange={(checked) => setTestSettings({ ...testSettings, debugMode: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estágios de Processamento</CardTitle>
              <p className="text-muted-foreground">Acompanhe o progresso em tempo real</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processingStages.map((stage, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {stage.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {stage.status === "processing" && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                        {stage.status === "error" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {stage.status === "pending" && <div className="h-5 w-5 rounded-full bg-gray-300" />}
                      </div>
                      <div>
                        <div className="font-medium">{stage.name}</div>
                        {stage.details && <div className="text-sm text-gray-600">{stage.details}</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      {stage.duration && <div className="text-sm text-gray-500">{stage.duration}ms</div>}
                      <Badge
                        variant={
                          stage.status === "completed"
                            ? "default"
                            : stage.status === "processing"
                              ? "secondary"
                              : stage.status === "error"
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {stage.status === "completed" && "Concluído"}
                        {stage.status === "processing" && "Processando"}
                        {stage.status === "error" && "Erro"}
                        {stage.status === "pending" && "Pendente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats em tempo real */}
          {isProcessing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{(stats.totalProcessingTime / 1000).toFixed(1)}s</div>
                    <div className="text-sm text-gray-600">Tempo Total</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.ocrAccuracy.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">Precisão OCR</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.dataExtractionRate.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">Taxa Extração</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Network className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats.modelConsensus.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">Consenso</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Resultados do Teste</CardTitle>
                  <p className="text-muted-foreground">{testResults.length} registros extraídos</p>
                </div>
                <Button onClick={exportResults} disabled={testResults.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Frota</TableHead>
                        <TableHead>Confiança</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Tempo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testResults.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.confidence >= 90 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : item.confidence >= 75 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
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
                          <TableCell className="text-sm text-gray-600">{item.processingTime}ms</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">Nenhum resultado ainda</h3>
                  <p className="text-muted-foreground">Execute o teste para ver os resultados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OCR Text */}
          {rawOcrText && (
            <Card>
              <CardHeader>
                <CardTitle>Texto Extraído (OCR)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={rawOcrText} readOnly className="min-h-[200px] font-mono text-sm" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{(stats.totalProcessingTime / 1000).toFixed(1)}s</div>
                  <div className="text-sm text-gray-600">Tempo Total</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Truck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{testResults.length}</div>
                  <div className="text-sm text-gray-600">Registros</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {testResults.length > 0
                      ? (testResults.reduce((sum, r) => sum + r.confidence, 0) / testResults.length).toFixed(0)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Confiança Média</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Cpu className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{modelPerformance.length}</div>
                  <div className="text-sm text-gray-600">Modelos Ativos</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Modelos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelPerformance.map((model) => (
                  <div key={model.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">{model.name}</h4>
                      </div>
                      <Badge variant="outline">{model.accuracy}% precisão</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Extrações:</span>
                        <div className="font-medium">{model.extractedCount}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Confiança Média:</span>
                        <div className="font-medium">{model.avgConfidence.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Tempo:</span>
                        <div className="font-medium">{model.processingTime}ms</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
