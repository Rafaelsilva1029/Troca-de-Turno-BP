"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  ImageIcon,
  Eye,
  Settings,
  Play,
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Truck,
  FileText,
  Zap,
} from "lucide-react"

interface ExtractedData {
  frota: string
  horario: string
  confidence?: number
  source?: string
}

interface DebugInfo {
  originalText: string
  processedLines: string[]
  timeMatches: Array<{ value: string; line: string; strategy: string }>
  fleetMatches: Array<{ value: string; line: string; strategy: string }>
  finalPairs: Array<{ horario: string; frota: string; strategy: string }>
}

export default function TesteDeteccaoPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  // Configurações de processamento
  const [settings, setSettings] = useState({
    brightness: 120,
    contrast: 150,
    threshold: 128,
    enablePreprocessing: true,
    ocrEngine: "lstm",
    multiStrategy: true,
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)

      // Criar preview da imagem
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      toast({
        title: "Imagem carregada",
        description: `Arquivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      })
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem (JPG, PNG, etc.)",
        variant: "destructive",
      })
    }
  }

  // Função para pré-processar imagem
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.onload = () => {
        // Redimensionar se necessário (máximo 2000px)
        const maxSize = 2000
        let { width, height } = img

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem original
        ctx.drawImage(img, 0, 0, width, height)

        if (settings.enablePreprocessing) {
          // Aplicar filtros para melhorar OCR
          const imageData = ctx.getImageData(0, 0, width, height)
          const data = imageData.data

          for (let i = 0; i < data.length; i += 4) {
            // Aplicar brilho
            const brightness = settings.brightness / 100
            let r = data[i] * brightness
            let g = data[i + 1] * brightness
            let b = data[i + 2] * brightness

            // Aplicar contraste
            const contrast = settings.contrast / 100
            const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100))
            r = factor * (r - 128) + 128
            g = factor * (g - 128) + 128
            b = factor * (b - 128) + 128

            // Converter para escala de cinza
            const gray = 0.299 * r + 0.587 * g + 0.114 * b

            // Aplicar threshold
            const finalValue = gray > settings.threshold ? 255 : 0

            data[i] = finalValue
            data[i + 1] = finalValue
            data[i + 2] = finalValue
          }

          ctx.putImageData(imageData, 0, 0)
        }

        resolve(canvas.toDataURL("image/png"))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Função de extração com debug detalhado
  const extractDataWithDebug = (text: string): { data: ExtractedData[]; debug: DebugInfo } => {
    const debug: DebugInfo = {
      originalText: text,
      processedLines: [],
      timeMatches: [],
      fleetMatches: [],
      finalPairs: [],
    }

    const data: ExtractedData[] = []
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    debug.processedLines = lines

    console.log("=== INÍCIO DA EXTRAÇÃO ===")
    console.log("Texto original:", text)
    console.log("Linhas processadas:", lines)

    // Estratégia 1: Busca linha por linha
    console.log("\n--- ESTRATÉGIA 1: LINHA POR LINHA ---")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Pular cabeçalhos
      if (
        line.toLowerCase().includes("refeição") ||
        line.toLowerCase().includes("agendamento") ||
        line.toLowerCase().includes("frota") ||
        line.toLowerCase().includes("modelo") ||
        line.toLowerCase().includes("serviço")
      ) {
        console.log(`Pulando linha ${i}: ${line}`)
        continue
      }

      // Buscar horários
      const timePatterns = [
        { pattern: /\b(\d{1,2}:\d{2}:\d{2})\b/g, name: "HH:MM:SS" },
        { pattern: /\b(\d{1,2}:\d{2})\b/g, name: "HH:MM" },
        { pattern: /\b(\d{1,2}h\d{2})\b/g, name: "HHhMM" },
        { pattern: /\b(\d{1,2}\.\d{2})\b/g, name: "HH.MM" },
      ]

      for (const { pattern, name } of timePatterns) {
        const matches = Array.from(line.matchAll(pattern))
        for (const match of matches) {
          const timeValue = normalizeTimeFormat(match[1])
          debug.timeMatches.push({
            value: timeValue,
            line: `Linha ${i}: ${line}`,
            strategy: `Estratégia 1 - ${name}`,
          })
          console.log(`Horário encontrado (${name}): ${timeValue} na linha ${i}`)
        }
      }

      // Buscar frotas
      const fleetPatterns = [
        { pattern: /\b(\d{4,6})\b/g, name: "4-6 dígitos" },
        { pattern: /\b(\d{3})\b/g, name: "3 dígitos" },
      ]

      for (const { pattern, name } of fleetPatterns) {
        const matches = Array.from(line.matchAll(pattern))
        for (const match of matches) {
          const fleetValue = match[1]
          if (!isTimeFormat(fleetValue)) {
            debug.fleetMatches.push({
              value: fleetValue,
              line: `Linha ${i}: ${line}`,
              strategy: `Estratégia 1 - ${name}`,
            })
            console.log(`Frota encontrada (${name}): ${fleetValue} na linha ${i}`)
          }
        }
      }
    }

    // Estratégia 2: Busca por proximidade
    console.log("\n--- ESTRATÉGIA 2: PROXIMIDADE ---")
    const allTimes: { value: string; index: number }[] = []
    const allFleets: { value: string; index: number }[] = []

    lines.forEach((line, index) => {
      if (
        line.toLowerCase().includes("refeição") ||
        line.toLowerCase().includes("agendamento") ||
        line.toLowerCase().includes("frota")
      ) {
        return
      }

      // Coletar horários
      const timePattern = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g
      let match
      while ((match = timePattern.exec(line)) !== null) {
        const timeValue = normalizeTimeFormat(match[1])
        allTimes.push({ value: timeValue, index })
        console.log(`Horário coletado: ${timeValue} na linha ${index}`)
      }

      // Coletar frotas
      const fleetPattern = /\b(\d{3,6})\b/g
      while ((match = fleetPattern.exec(line)) !== null) {
        const fleet = match[1]
        if (!isTimeFormat(fleet)) {
          allFleets.push({ value: fleet, index })
          console.log(`Frota coletada: ${fleet} na linha ${index}`)
        }
      }
    })

    // Parear por proximidade
    for (const time of allTimes) {
      const nearbyFleets = allFleets.filter((fleet) => Math.abs(fleet.index - time.index) <= 1)

      if (nearbyFleets.length > 0) {
        const closestFleet = nearbyFleets.reduce((closest, current) =>
          Math.abs(current.index - time.index) < Math.abs(closest.index - time.index) ? current : closest,
        )

        const pair = {
          horario: time.value,
          frota: closestFleet.value,
          strategy: "Proximidade",
        }

        debug.finalPairs.push(pair)
        data.push({
          frota: closestFleet.value,
          horario: time.value,
          source: "Proximidade",
          confidence: 0.8,
        })

        console.log(`Par encontrado por proximidade: ${time.value} - ${closestFleet.value}`)
      }
    }

    // Estratégia 3: Padrões combinados
    console.log("\n--- ESTRATÉGIA 3: PADRÕES COMBINADOS ---")
    const textNormalized = text.replace(/\s+/g, " ").replace(/\n/g, " ")
    const combinedPattern = /(\d{1,2}:\d{2}(?::\d{2})?)\s*(\d{3,6})/g
    let match

    while ((match = combinedPattern.exec(textNormalized)) !== null) {
      const horario = normalizeTimeFormat(match[1])
      const frota = match[2]

      if (!isTimeFormat(frota)) {
        const pair = {
          horario,
          frota,
          strategy: "Padrão Combinado",
        }

        debug.finalPairs.push(pair)
        data.push({
          frota,
          horario,
          source: "Padrão Combinado",
          confidence: 0.9,
        })

        console.log(`Par encontrado por padrão combinado: ${horario} - ${frota}`)
      }
    }

    // Remover duplicatas
    const uniqueData = removeDuplicates(data)
    console.log(`\nDados finais (${uniqueData.length} registros):`, uniqueData)

    return { data: uniqueData, debug }
  }

  // Função para normalizar formato de horário
  const normalizeTimeFormat = (time: string): string => {
    const normalized = time
      .replace(/:\d{2}$/, "")
      .replace("h", ":")
      .replace(".", ":")
    const parts = normalized.split(":")
    if (parts.length === 2) {
      const hours = parts[0].padStart(2, "0")
      const minutes = parts[1].padStart(2, "0")
      return `${hours}:${minutes}`
    }
    return normalized
  }

  // Função para verificar se uma string parece um horário
  const isTimeFormat = (str: string): boolean => {
    return /^\d{1,2}:?\d{2}$/.test(str) || /^\d{3,4}$/.test(str)
  }

  // Função para remover duplicatas
  const removeDuplicates = (data: ExtractedData[]): ExtractedData[] => {
    const uniqueMap = new Map<string, ExtractedData>()

    for (const item of data) {
      const key = `${item.horario}-${item.frota}`
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item)
      }
    }

    return Array.from(uniqueMap.values()).sort((a, b) => a.horario.localeCompare(b.horario))
  }

  // Função principal de processamento
  const processImage = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhuma imagem selecionada",
        description: "Por favor, selecione uma imagem primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setExtractedData([])
    setDebugInfo(null)

    try {
      // Pré-processar imagem
      setProgress(20)
      const processedImageUrl = await preprocessImage(selectedFile)

      // Importar Tesseract
      setProgress(30)
      const Tesseract = (await import("tesseract.js")).default

      // Executar OCR
      const {
        data: { text },
      } = await Tesseract.recognize(processedImageUrl, "por", {
        logger: (info) => {
          if (info.status === "recognizing text") {
            setProgress(30 + info.progress * 50)
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: settings.ocrEngine === "lstm" ? Tesseract.OEM.LSTM_ONLY : Tesseract.OEM.DEFAULT,
        tessedit_char_whitelist: "0123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÇçÃãÕõÁáÉéÍíÓóÚú ",
      })

      setProgress(80)

      // Extrair dados com debug
      const { data, debug } = extractDataWithDebug(text)

      setProgress(100)
      setExtractedData(data)
      setDebugInfo(debug)
      setActiveTab("results")

      toast({
        title: "Processamento concluído",
        description: `${data.length} registros extraídos com sucesso.`,
      })
    } catch (error) {
      console.error("Erro no processamento:", error)
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadResults = () => {
    const csvContent = [
      "Frota,Horário,Fonte,Confiança",
      ...extractedData.map(
        (item) => `${item.frota},${item.horario},${item.source || "N/A"},${item.confidence || "N/A"}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "dados_extraidos.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center text-xl font-bold tracking-wide">
              <Zap className="mr-3 h-6 w-6 text-yellow-500" />
              Teste de Detecção Aprimorada
            </CardTitle>
            <p className="text-slate-400">
              Carregue uma imagem para testar as melhorias na detecção de dados de agendamentos
            </p>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="upload">Upload & Config</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          {/* Tab Upload & Configurações */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center">
                    <Upload className="mr-2 h-5 w-5 text-green-500" />
                    Upload de Imagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-green-500/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-medium mb-2">
                      {selectedFile ? selectedFile.name : "Clique para selecionar uma imagem"}
                    </h3>
                    <p className="text-slate-500 text-sm">Suporta JPG, PNG e outros formatos de imagem</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {selectedFile && (
                    <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-300 font-medium">{selectedFile.name}</p>
                          <p className="text-slate-500 text-sm">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Badge className="bg-green-600/50 text-green-100">Carregado</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Configurações */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center">
                    <Settings className="mr-2 h-5 w-5 text-blue-500" />
                    Configurações de Processamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-400 text-sm mb-2 block">Brilho: {settings.brightness}%</Label>
                    <Slider
                      value={[settings.brightness]}
                      onValueChange={(value) => setSettings({ ...settings, brightness: value[0] })}
                      min={50}
                      max={200}
                      step={5}
                    />
                  </div>

                  <div>
                    <Label className="text-slate-400 text-sm mb-2 block">Contraste: {settings.contrast}%</Label>
                    <Slider
                      value={[settings.contrast]}
                      onValueChange={(value) => setSettings({ ...settings, contrast: value[0] })}
                      min={100}
                      max={300}
                      step={10}
                    />
                  </div>

                  <div>
                    <Label className="text-slate-400 text-sm mb-2 block">Threshold: {settings.threshold}</Label>
                    <Slider
                      value={[settings.threshold]}
                      onValueChange={(value) => setSettings({ ...settings, threshold: value[0] })}
                      min={50}
                      max={200}
                      step={5}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-slate-400 text-sm">Pré-processamento</Label>
                    <input
                      type="checkbox"
                      checked={settings.enablePreprocessing}
                      onChange={(e) => setSettings({ ...settings, enablePreprocessing: e.target.checked })}
                      className="rounded"
                    />
                  </div>

                  <Button
                    onClick={processImage}
                    disabled={!selectedFile || isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Processar Imagem
                      </>
                    )}
                  </Button>

                  {isProcessing && (
                    <div className="mt-4">
                      <Progress value={progress} className="h-2" />
                      <p className="text-right text-xs text-slate-500 mt-1">{progress}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Preview */}
          <TabsContent value="preview">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-purple-500" />
                  Preview da Imagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Imagem Original */}
                  <div>
                    <h3 className="text-slate-300 font-medium mb-3">Imagem Original</h3>
                    {imagePreview ? (
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview original"
                        className="w-full max-h-96 object-contain bg-slate-800 rounded-lg border border-slate-700"
                      />
                    ) : (
                      <div className="w-full h-96 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
                        <p className="text-slate-500">Nenhuma imagem carregada</p>
                      </div>
                    )}
                  </div>

                  {/* Imagem Processada */}
                  <div>
                    <h3 className="text-slate-300 font-medium mb-3">Imagem Processada</h3>
                    <canvas
                      ref={canvasRef}
                      className="w-full max-h-96 object-contain bg-slate-800 rounded-lg border border-slate-700"
                      style={{ display: selectedFile ? "block" : "none" }}
                    />
                    {!selectedFile && (
                      <div className="w-full h-96 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
                        <p className="text-slate-500">Processamento não iniciado</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Resultados */}
          <TabsContent value="results">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-slate-100 flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Resultados da Extração
                  </CardTitle>
                  {extractedData.length > 0 && (
                    <Button
                      onClick={downloadResults}
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 hover:bg-slate-700 border-slate-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {extractedData.length > 0 ? (
                  <div className="rounded-md border border-slate-700/50 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-800/70">
                        <TableRow>
                          <TableHead className="text-slate-300">
                            <Truck className="h-4 w-4 inline mr-1" />
                            Frota
                          </TableHead>
                          <TableHead className="text-slate-300">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Horário
                          </TableHead>
                          <TableHead className="text-slate-300">Fonte</TableHead>
                          <TableHead className="text-slate-300">Confiança</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedData.map((item, index) => (
                          <TableRow key={index} className="hover:bg-slate-800/50">
                            <TableCell className="font-medium text-slate-300">{item.frota}</TableCell>
                            <TableCell className="text-slate-300">{item.horario}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {item.source || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-16 bg-slate-700 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${(item.confidence || 0) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-400">
                                  {((item.confidence || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhum resultado ainda</p>
                    <p className="text-sm mt-1">Processe uma imagem para ver os resultados aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Debug */}
          <TabsContent value="debug">
            <div className="space-y-6">
              {debugInfo ? (
                <>
                  {/* Texto Original */}
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-slate-100 text-sm">Texto OCR Original</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={debugInfo.originalText}
                        readOnly
                        className="min-h-[200px] font-mono text-xs bg-slate-800 border-slate-700"
                      />
                    </CardContent>
                  </Card>

                  {/* Matches Encontrados */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-slate-900/50 border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="text-slate-100 text-sm">Horários Detectados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {debugInfo.timeMatches.map((match, index) => (
                            <div key={index} className="bg-slate-800/50 p-2 rounded text-xs">
                              <div className="text-green-400 font-medium">{match.value}</div>
                              <div className="text-slate-500">{match.strategy}</div>
                              <div className="text-slate-400 truncate">{match.line}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="text-slate-100 text-sm">Frotas Detectadas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {debugInfo.fleetMatches.map((match, index) => (
                            <div key={index} className="bg-slate-800/50 p-2 rounded text-xs">
                              <div className="text-blue-400 font-medium">{match.value}</div>
                              <div className="text-slate-500">{match.strategy}</div>
                              <div className="text-slate-400 truncate">{match.line}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pares Finais */}
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-slate-100 text-sm">Pares Horário-Frota Encontrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {debugInfo.finalPairs.map((pair, index) => (
                          <div key={index} className="bg-slate-800/50 p-3 rounded flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                              <span className="text-green-400 font-medium">{pair.horario}</span>
                              <span className="text-slate-500">→</span>
                              <span className="text-blue-400 font-medium">{pair.frota}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {pair.strategy}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardContent className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-slate-500 opacity-30" />
                    <p className="text-slate-500">Nenhuma informação de debug disponível</p>
                    <p className="text-slate-600 text-sm mt-1">Processe uma imagem primeiro</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
