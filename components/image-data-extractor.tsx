"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, ImageIcon, FileText, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ImageDataExtractorProps {
  onDataExtracted: (data: { frota: string; horario: string }[]) => void
}

export function ImageDataExtractor({ onDataExtracted }: ImageDataExtractorProps) {
  // Estados
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [extractedData, setExtractedData] = useState<{ frota: string; horario: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    // Criar preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
      setIsUploading(false)

      // Processar a imagem automaticamente
      processImage(file)
    }
    reader.onerror = () => {
      setError("Erro ao ler o arquivo de imagem.")
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // Função para processar a imagem
  const processImage = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Simular processamento OCR
      // Em um cenário real, você enviaria a imagem para um serviço OCR como Tesseract.js, Google Vision API, etc.
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulação de processamento

      // Texto extraído simulado
      const simulatedText = `
      FROTA: 6597 HORÁRIO: 04:00
      FROTA: 8805 HORÁRIO: 08:00
      FROTA: 4597 HORÁRIO: 14:30
      FROTA: 6602 HORÁRIO: 02:00
      `

      setExtractedText(simulatedText)

      // Extrair dados estruturados do texto
      const data = extractDataFromText(simulatedText)
      setExtractedData(data)

      // Notificar o componente pai
      onDataExtracted(data)

      toast({
        title: "Processamento concluído",
        description: `Foram extraídos dados de ${data.length} veículos.`,
      })
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      setError("Ocorreu um erro ao processar a imagem. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Função para extrair dados estruturados do texto
  const extractDataFromText = (text: string): { frota: string; horario: string }[] => {
    const data: { frota: string; horario: string }[] = []

    // Expressão regular para encontrar padrões de frota e horário
    const regex = /FROTA:?\s*(\d+).*?HORÁRIO:?\s*(\d{1,2}:\d{2})/gi

    let match
    while ((match = regex.exec(text)) !== null) {
      data.push({
        frota: match[1].trim(),
        horario: match[2].trim(),
      })
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

  // Função para processar o texto editado
  const processEditedText = () => {
    if (!extractedText.trim()) {
      setError("O texto extraído está vazio.")
      return
    }

    try {
      const data = extractDataFromText(extractedText)

      if (data.length === 0) {
        setError("Não foi possível extrair dados do texto. Verifique o formato.")
        return
      }

      setExtractedData(data)

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

  return (
    <div className="space-y-4">
      {/* Área de upload */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Arraste e solte uma imagem ou clique para selecionar</h3>
        <p className="text-sm text-gray-500 mb-4">Formatos suportados: .jpg, .jpeg, .png</p>
        <Button onClick={handleUploadClick} className="flex items-center">
          <Upload className="mr-2 h-4 w-4" />
          Selecionar Imagem
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview e resultados */}
      {imagePreview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview da imagem */}
          <Card>
            <CardContent className="p-4">
              <Label className="block mb-2 text-sm font-medium">Imagem Carregada</Label>
              <div className="relative border rounded-md overflow-hidden">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Processando imagem...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Texto extraído */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="block text-sm font-medium">Texto Extraído</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={processEditedText}
                  disabled={isProcessing || !extractedText.trim()}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Processar
                </Button>
              </div>
              <Textarea
                value={extractedText}
                onChange={handleTextEdit}
                placeholder="O texto extraído da imagem aparecerá aqui. Você pode editar manualmente se necessário."
                className="min-h-[200px] font-mono text-sm"
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-2">
                Dica: Você pode editar o texto acima e clicar em "Processar" para atualizar os dados extraídos.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dados extraídos */}
      {extractedData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Label className="block text-sm font-medium">Dados Extraídos</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDataExtracted(extractedData)}
                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <Check className="h-3 w-3 mr-1" />
                Continuar com estes dados
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Frota
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Horário
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {extractedData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.frota}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.horario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Nota: Ao continuar, estes dados serão convertidos em registros completos com valores padrão para os campos
              não extraídos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Como usar o extrator de dados de imagem</AlertTitle>
        <AlertDescription className="text-blue-700">
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
            <li>Carregue uma imagem que contenha uma tabela ou lista de frotas e horários</li>
            <li>O sistema tentará extrair automaticamente os dados da imagem</li>
            <li>Você pode editar o texto extraído manualmente se necessário</li>
            <li>Clique em "Processar" para atualizar os dados extraídos</li>
            <li>Verifique os dados extraídos e clique em "Continuar com estes dados"</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default ImageDataExtractor
