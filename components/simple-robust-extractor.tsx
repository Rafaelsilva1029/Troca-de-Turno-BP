"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ImageIcon, Check, AlertCircle, Edit, Wand2, Copy, Sparkles } from "lucide-react"
import Tesseract from "tesseract.js"

interface SimpleRobustExtractorProps {
  onDataExtracted: (data: { frota: string; horario: string }[]) => void
}

export function SimpleRobustExtractor({ onDataExtracted }: SimpleRobustExtractorProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedText, setExtractedText] = useState("")
  const [extractedData, setExtractedData] = useState<{ frota: string; horario: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Função para processar a imagem antes do OCR
  const preprocessImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) {
          resolve(imageUrl)
          return
        }

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(imageUrl)
          return
        }

        // Definir tamanho do canvas
        canvas.width = img.width
        canvas.height = img.height

        // Desenhar imagem original
        ctx.drawImage(img, 0, 0)

        // Aplicar filtros para melhorar OCR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Converter para escala de cinza e aumentar contraste
        for (let i = 0; i < data.length; i += 4) {
          // Escala de cinza
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

          // Aumentar contraste
          const contrast = 1.5
          const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100))
          const newGray = factor * (gray - 128) + 128

          // Aplicar threshold suave
          const threshold = 110
          const value = newGray > threshold ? 255 : newGray < 40 ? 0 : newGray

          data[i] = value
          data[i + 1] = value
          data[i + 2] = value
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      }
      img.src = imageUrl
    })
  }

  // Função principal de extração
  const extractDataFromImage = async () => {
    if (!imageFile || !imagePreview) {
      setError("Por favor, selecione uma imagem primeiro.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setExtractedText("")
    setExtractedData([])
    setProgress(0)
    setStatus("Preparando imagem...")

    try {
      // Pré-processar a imagem
      setStatus("Processando imagem...")
      const processedImage = await preprocessImage(imagePreview)
      setProgress(20)

      // Executar OCR
      setStatus("Executando OCR...")
      const result = await Tesseract.recognize(processedImage, "por", {
        logger: (info) => {
          if (info.status === "recognizing text") {
            setProgress(20 + info.progress * 60)
            setStatus(`Reconhecendo texto... ${Math.round(info.progress * 100)}%`)
          }
        },
      })

      const text = result.data.text
      setExtractedText(text)
      setProgress(80)

      // Extrair dados estruturados
      setStatus("Extraindo dados...")
      const data = extractDataFromText(text)
      setExtractedData(data)
      setProgress(100)

      if (data.length === 0) {
        setError("Não foi possível extrair dados da imagem. Tente editar o texto manualmente.")
        setIsEditing(true)
      } else {
        toast({
          title: "Extração concluída!",
          description: `${data.length} registros foram extraídos com sucesso.`,
        })
        onDataExtracted(data)
      }

      setStatus("")
    } catch (err) {
      console.error("Erro na extração:", err)
      setError("Erro ao processar a imagem. Tente novamente.")
      setStatus("")
    } finally {
      setIsProcessing(false)
    }
  }

  // Função melhorada para extrair dados do texto
  const extractDataFromText = (text: string): { frota: string; horario: string }[] => {
    const data: { frota: string; horario: string }[] = []
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Estratégia 1: Procurar por padrões de horário e frota na mesma linha
    for (const line of lines) {
      // Ignorar linhas com "REFEIÇÃO"
      if (line.toLowerCase().includes("refeição")) continue

      // Procurar horário (formatos: HH:MM:SS, HH:MM, H:MM)
      const timePatterns = [/\b(\d{1,2}:\d{2}:\d{2})\b/, /\b(\d{1,2}:\d{2})\b/]

      let timeMatch = null
      for (const pattern of timePatterns) {
        const match = line.match(pattern)
        if (match) {
          timeMatch = match[1]
          break
        }
      }

      // Procurar frota (4-5 dígitos)
      const fleetMatch = line.match(/\b(\d{4,5})\b/)

      if (timeMatch && fleetMatch) {
        // Validar horário
        const [hours, minutes] = timeMatch.split(":").map(Number)
        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          data.push({
            horario: timeMatch,
            frota: fleetMatch[1],
          })
        }
      }
    }

    // Estratégia 2: Se não encontrou dados, tentar padrões mais flexíveis
    if (data.length === 0) {
      // Procurar todos os horários primeiro
      const allTimes: string[] = []
      const allFleets: string[] = []

      for (const line of lines) {
        if (line.toLowerCase().includes("refeição")) continue

        // Coletar horários
        const timeMatches = line.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g) || []
        allTimes.push(...timeMatches)

        // Coletar frotas
        const fleetMatches = line.match(/\b\d{4,5}\b/g) || []
        allFleets.push(...fleetMatches)
      }

      // Parear horários com frotas se tiverem a mesma quantidade
      if (allTimes.length > 0 && allTimes.length === allFleets.length) {
        for (let i = 0; i < allTimes.length; i++) {
          data.push({
            horario: allTimes[i],
            frota: allFleets[i],
          })
        }
      }
    }

    // Estratégia 3: Buscar em texto corrido
    if (data.length === 0) {
      const textNormalized = text.replace(/\s+/g, " ")

      // Procurar padrões como "07:00 8001" ou "07:00:00 8799"
      const matches = textNormalized.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*(\d{4,5})/g) || []

      for (const match of matches) {
        const parts = match.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*(\d{4,5})/)
        if (parts) {
          data.push({
            horario: parts[1],
            frota: parts[2],
          })
        }
      }
    }

    return data
  }

  // Função para processar texto editado manualmente
  const processManualText = () => {
    if (!extractedText.trim()) {
      setError("O texto está vazio. Por favor, adicione o conteúdo extraído.")
      return
    }

    const data = extractDataFromText(extractedText)

    if (data.length === 0) {
      setError(
        "Não foi possível extrair dados. Certifique-se de que cada linha contenha um horário (HH:MM ou HH:MM:SS) e um número de frota (4-5 dígitos).",
      )
      return
    }

    setExtractedData(data)
    setIsEditing(false)
    onDataExtracted(data)

    toast({
      title: "Dados processados!",
      description: `${data.length} registros foram extraídos do texto editado.`,
    })
  }

  // Upload da imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido.")
      return
    }

    setImageFile(file)
    setError(null)
    setExtractedText("")
    setExtractedData([])

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Copiar dados para clipboard
  const copyToClipboard = () => {
    const text = extractedData.map((item) => `${item.horario}\t${item.frota}`).join("\n")

    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Copiado!",
          description: "Os dados foram copiados para a área de transferência.",
        })
      })
      .catch(() => {
        toast({
          title: "Erro",
          description: "Não foi possível copiar os dados.",
          variant: "destructive",
        })
      })
  }

  // Exemplo de formato correto
  const showFormatExample = () => {
    const example = `07:00:00 8001
08:00:00 8799
09:00:00 1234
11:00:00 REFEIÇÃO
12:00:00 5678`

    setExtractedText(example)
    setIsEditing(true)

    toast({
      title: "Exemplo adicionado",
      description: "Use este formato como referência para editar o texto.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload de Imagem */}
      <Card>
        <CardHeader>
          <CardTitle>1. Carregar Imagem</CardTitle>
          <CardDescription>Selecione uma imagem contendo a tabela de agendamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
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
                handleImageUpload(changeEvent)
              }
            }}
          >
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {imageFile ? imageFile.name : "Clique ou arraste uma imagem aqui"}
            </p>
            <p className="text-sm text-gray-500">Formatos suportados: JPG, PNG, BMP</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {imagePreview && (
            <div className="mt-4">
              <Label>Prévia da imagem:</Label>
              <div className="mt-2 border rounded-md overflow-hidden max-h-64">
                <img src={imagePreview || "/placeholder.svg"} alt="Prévia" className="w-full h-auto object-contain" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canvas oculto para processamento */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Botão de Extração */}
      {imageFile && !isProcessing && (
        <div className="flex justify-center">
          <Button size="lg" onClick={extractDataFromImage} className="gap-2">
            <Wand2 className="h-5 w-5" />
            Extrair Dados Automaticamente
          </Button>
        </div>
      )}

      {/* Progresso */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{status}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro na extração</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Texto Extraído */}
      {extractedText && !isProcessing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>2. Texto Extraído</CardTitle>
                <CardDescription>Revise e edite o texto se necessário</CardDescription>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={showFormatExample}>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Exemplo
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={processManualText}>
                      <Check className="h-4 w-4 mr-1" />
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
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="O texto extraído aparecerá aqui..."
              className="min-h-[200px] font-mono text-sm"
              disabled={!isEditing}
            />
            {isEditing && (
              <p className="text-xs text-gray-500 mt-2">
                Formato esperado: Um registro por linha com horário e frota. Exemplo: "07:00:00 8001"
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dados Extraídos */}
      {extractedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>3. Dados Extraídos</CardTitle>
                <CardDescription>{extractedData.length} registros encontrados</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button size="sm" onClick={() => onDataExtracted(extractedData)}>
                  <Check className="h-4 w-4 mr-1" />
                  Usar Dados
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frota</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {extractedData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.horario}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.frota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Como usar</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
            <li>Carregue uma imagem clara da tabela de agendamentos</li>
            <li>Clique em "Extrair Dados Automaticamente"</li>
            <li>Se necessário, edite o texto manualmente para corrigir erros</li>
            <li>Use o formato: um registro por linha (ex: "07:00:00 8001")</li>
            <li>Clique em "Usar Dados" para continuar</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default SimpleRobustExtractor
