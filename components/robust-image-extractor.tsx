"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Upload,
  ImageIcon,
  FileText,
  Check,
  AlertCircle,
  Edit,
  Wand2,
  Crop,
  Download,
  Copy,
  Undo,
  Redo,
} from "lucide-react"
import Tesseract from "tesseract.js"

interface RobustImageExtractorProps {
  onDataExtracted: (data: { frota: string; horario: string }[]) => void
}

export function RobustImageExtractor({ onDataExtracted }: RobustImageExtractorProps) {
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
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedArea, setSelectedArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [extractionMethod, setExtractionMethod] = useState<"auto" | "table" | "pattern" | "manual">("auto")

  // Estados para pré-processamento de imagem
  const [imageSettings, setImageSettings] = useState({
    brightness: 100, // 0-200
    contrast: 100, // 0-200
    grayscale: false,
    invert: false,
    binarize: false,
    threshold: 128, // 0-255
    rotate: 0, // -180 to 180
  })

  // Estados para histórico de ações
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)

  // Efeito para aplicar configurações de imagem
  useEffect(() => {
    if (imagePreview && canvasRef.current) {
      applyImageProcessing()
    }
  }, [imagePreview, imageSettings, activeTab])

  // Função para aplicar processamento de imagem
  const applyImageProcessing = () => {
    if (!imagePreview || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Ajustar tamanho do canvas
      const maxWidth = 800
      const maxHeight = 600
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Limpar canvas
      ctx.clearRect(0, 0, width, height)

      // Aplicar rotação se necessário
      if (imageSettings.rotate !== 0) {
        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.rotate((imageSettings.rotate * Math.PI) / 180)
        ctx.drawImage(img, -width / 2, -height / 2, width, height)
        ctx.restore()
      } else {
        ctx.drawImage(img, 0, 0, width, height)
      }

      // Aplicar filtros
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

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

      ctx.putImageData(imageData, 0, 0)

      // Desenhar área selecionada, se houver
      if (selectedArea && selectionMode) {
        ctx.strokeStyle = "red"
        ctx.lineWidth = 2
        ctx.strokeRect(selectedArea.x, selectedArea.y, selectedArea.width, selectedArea.height)
      }

      // Atualizar imagem processada
      setProcessedImage(canvas.toDataURL("image/png"))
    }

    img.src = imagePreview
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
    setSelectedArea(null)

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
      })

      // Adicionar ao histórico
      addToHistory(imageDataUrl)
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

  // Função para processar a imagem com OCR
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

      // Se temos uma área selecionada, recortar a imagem
      let finalImageToProcess = imageToProcess

      if (selectedArea && canvasRef.current) {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (ctx) {
          canvas.width = selectedArea.width
          canvas.height = selectedArea.height

          const img = new Image()
          img.crossOrigin = "anonymous"

          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(
                img,
                selectedArea.x,
                selectedArea.y,
                selectedArea.width,
                selectedArea.height,
                0,
                0,
                selectedArea.width,
                selectedArea.height,
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
      const result = await Tesseract.recognize(
        finalImageToProcess as string,
        "por", // Português
        {
          logger: (m) => {
            if (m.status) {
              setOcrStatus(m.status)
            }
            if (typeof m.progress === "number") {
              setProgress(m.progress * 100)
            }
          },
        },
      )

      const text = result.data.text
      setExtractedText(text)
      setOcrStatus("Extraindo dados do texto...")

      // Extrair dados estruturados do texto
      let data: { frota: string; horario: string }[] = []

      // Usar o método de extração selecionado
      switch (extractionMethod) {
        case "table":
          data = extractTableData(text)
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
          data = extractTableData(text)
          if (data.length === 0) {
            data = extractPatternData(text)
          }
          break
      }

      setExtractedData(data)

      if (data.length === 0 && extractionMethod !== "manual") {
        setError(
          "Não foi possível identificar dados de frota e horário no texto extraído. Tente ajustar as configurações da imagem ou editar manualmente.",
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

  // Funções para seleção de área
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectionMode || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    selectionStartRef.current = { x, y }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectionMode || !selectionStartRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const startX = selectionStartRef.current.x
    const startY = selectionStartRef.current.y

    setSelectedArea({
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY),
    })

    // Redesenhar o canvas com a seleção
    applyImageProcessing()
  }

  const handleMouseUp = () => {
    if (!selectionMode) return
    selectionStartRef.current = null
  }

  // Função para limpar a seleção
  const clearSelection = () => {
    setSelectedArea(null)
    applyImageProcessing()
  }

  // Função para aplicar auto-ajuste na imagem
  const autoAdjustImage = () => {
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

    toast({
      title: "Auto-ajuste aplicado",
      description: "As configurações da imagem foram otimizadas para OCR.",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Extrator Avançado de Dados de Imagem</CardTitle>
          <CardDescription>
            Extraia dados de agendamento e frota de imagens de tabelas com processamento avançado
          </CardDescription>
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
            <p className="text-sm text-gray-500 mb-4">Formatos suportados: .jpg, .jpeg, .png</p>
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
              <CardTitle>Processamento de Imagem</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={autoAdjustImage}>
                  <Wand2 className="h-4 w-4 mr-1" />
                  Auto-ajuste
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="original" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="original">Imagem Original</TabsTrigger>
                <TabsTrigger value="processed">Imagem Processada</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
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
                <div className="border rounded-md overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto max-h-[400px] object-contain"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />

                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant={selectionMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectionMode(!selectionMode)}
                      className="bg-white/80 hover:bg-white/90 text-black border border-gray-300"
                    >
                      <Crop className="h-4 w-4 mr-1" />
                      {selectionMode ? "Cancelar Seleção" : "Selecionar Área"}
                    </Button>

                    {selectedArea && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        className="bg-white/80 hover:bg-white/90 text-black border border-gray-300"
                      >
                        Limpar Seleção
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  <div className="space-y-2">
                    <Label>Método de Extração</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={extractionMethod === "auto" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExtractionMethod("auto")}
                      >
                        Automático
                      </Button>
                      <Button
                        variant={extractionMethod === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExtractionMethod("table")}
                      >
                        Tabela
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

              <TabsContent value="settings" className="mt-0">
                <div className="space-y-6">
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

                  <div className="flex justify-between pt-4">
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
                        })
                      }
                    >
                      Resetar Tudo
                    </Button>

                    <Button onClick={autoAdjustImage}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Auto-ajuste para OCR
                    </Button>
                  </div>
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
        <AlertTitle className="text-blue-800">Como usar o extrator avançado</AlertTitle>
        <AlertDescription className="text-blue-700">
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
            <li>Carregue uma imagem que contenha a tabela de agendamentos</li>
            <li>Use as ferramentas de processamento de imagem para melhorar a qualidade (contraste, brilho, etc.)</li>
            <li>Selecione uma área específica da imagem se necessário</li>
            <li>Escolha o método de extração mais adequado para sua imagem</li>
            <li>Clique em "Extrair Dados" para processar a imagem</li>
            <li>Revise e edite o texto extraído se necessário</li>
            <li>Verifique os dados extraídos e clique em "Continuar" para usar os dados</li>
          </ol>
          <div className="flex items-center mt-3 bg-yellow-50 p-2 rounded border border-yellow-200">
            <Wand2 className="h-4 w-4 text-yellow-600 mr-2" />
            <p className="text-xs text-yellow-700">
              <strong>Dica:</strong> Use o botão "Auto-ajuste para OCR" para otimizar automaticamente a imagem para
              reconhecimento de texto.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default RobustImageExtractor
