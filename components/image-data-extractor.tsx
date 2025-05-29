"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Upload, ImageIcon, FileText, Check, AlertCircle, Edit, Table } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import Tesseract from "tesseract.js"

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
  const [progress, setProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState("")
  const [isEditing, setIsEditing] = useState(false)

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
    setExtractedText("")
    setExtractedData([])

    // Criar preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
      setIsUploading(false)

      // Processar a imagem automaticamente
      processImage(e.target?.result as string)
    }
    reader.onerror = () => {
      setError("Erro ao ler o arquivo de imagem.")
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // Função para processar a imagem com OCR
  const processImage = async (imageUrl: string) => {
    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setOcrStatus("Preparando para processar a imagem...")

    try {
      setOcrStatus("Processando a imagem com OCR...")

      // Processar a imagem com Tesseract.js
      const result = await Tesseract.recognize(
        imageUrl,
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
      const data = extractTableColumnsData(text)

      setExtractedData(data)

      if (data.length === 0) {
        setError(
          "Não foi possível identificar dados de frota e horário no texto extraído. Tente editar manualmente para extrair apenas as colunas 'Agendamento' e 'Frota'.",
        )
      } else {
        // Notificar o componente pai
        onDataExtracted(data)

        toast({
          title: "Processamento concluído",
          description: `Foram extraídos dados de ${data.length} veículos.`,
        })
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      setError("Ocorreu um erro ao processar a imagem. Tente novamente ou edite manualmente.")
    } finally {
      setIsProcessing(false)
      setOcrStatus("")
    }
  }

  // Nova função específica para extrair apenas as colunas Agendamento e Frota
  const extractTableColumnsData = (text: string): { frota: string; horario: string }[] => {
    const data: { frota: string; horario: string }[] = []

    // Dividir o texto em linhas
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Procurar o cabeçalho da tabela (linha que contém "Agendamento" e "Frota")
    let headerIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("Agendamento") && lines[i].includes("Frota")) {
        headerIndex = i
        break
      }
    }

    if (headerIndex === -1) {
      console.log("Cabeçalho da tabela não encontrado")
      return data
    }

    // Identificar a posição das colunas no cabeçalho
    const headerLine = lines[headerIndex]
    const agendamentoPos = headerLine.indexOf("Agendamento")
    const frotaPos = headerLine.indexOf("Frota")
    const modeloPos = headerLine.indexOf("Modelo") // Para determinar o fim da coluna Frota

    if (agendamentoPos === -1 || frotaPos === -1) {
      console.log("Não foi possível identificar as posições das colunas")
      return data
    }

    // Determinar a ordem das colunas
    const isAgendamentoPrimeiro = agendamentoPos < frotaPos

    // Processar as linhas de dados (após o cabeçalho)
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i]

      // Pular linhas que contêm "REFEIÇÃO"
      if (line.includes("REFEIÇÃO")) {
        continue
      }

      // Verificar se a linha tem um formato de horário (HH:MM:SS)
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/)
      if (!timeMatch) continue

      const horario = timeMatch[1]

      // Extrair o número da frota com base na posição relativa ao horário
      let frota = ""

      // Tentar extrair a frota usando expressão regular para números de 4-5 dígitos
      const frotaMatches = line.match(/\b(\d{4,5})\b/g)

      if (frotaMatches && frotaMatches.length > 0) {
        // Se o horário vem antes da frota na tabela, pegamos o primeiro número após o horário
        if (isAgendamentoPrimeiro) {
          // Encontrar a posição do horário na linha
          const horarioPos = line.indexOf(horario)

          // Procurar o primeiro número de 4-5 dígitos após o horário
          for (const match of frotaMatches) {
            const matchPos = line.indexOf(match, horarioPos + horario.length)
            if (matchPos > horarioPos) {
              frota = match
              break
            }
          }

          // Se não encontrou após, pega o primeiro da lista
          if (!frota && frotaMatches.length > 0) {
            frota = frotaMatches[0]
          }
        } else {
          // Se a frota vem antes do horário, pegamos o último número antes do horário
          const horarioPos = line.indexOf(horario)
          let lastFrotaBeforeHorario = ""

          for (const match of frotaMatches) {
            const matchPos = line.indexOf(match)
            if (matchPos < horarioPos) {
              lastFrotaBeforeHorario = match
            }
          }

          frota = lastFrotaBeforeHorario || frotaMatches[0]
        }
      }

      // Se encontramos um horário e uma frota válidos, adicionamos aos dados
      if (horario && frota) {
        data.push({ horario, frota })
      }
    }

    // Se não encontramos dados usando o método acima, tentamos uma abordagem mais simples
    if (data.length === 0) {
      // Procurar todos os horários e frotas no texto
      const horarios: string[] = []
      const frotas: string[] = []

      for (const line of lines) {
        // Extrair horários (formato HH:MM:SS)
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/)
        if (timeMatch) {
          horarios.push(timeMatch[1])
        }

        // Extrair frotas (números de 4-5 dígitos)
        const frotaMatch = line.match(/\b(\d{4,5})\b/)
        if (frotaMatch && !line.includes("REFEIÇÃO")) {
          frotas.push(frotaMatch[1])
        }
      }

      // Se temos o mesmo número de horários e frotas, assumimos que correspondem
      const minLength = Math.min(horarios.length, frotas.length)
      for (let i = 0; i < minLength; i++) {
        data.push({
          horario: horarios[i],
          frota: frotas[i],
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

    // Dividir o texto em linhas
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    for (const line of lines) {
      // Pular linhas que contêm "REFEIÇÃO"
      if (line.toLowerCase().includes("refeição")) {
        continue
      }

      // Procurar um horário (formato HH:MM:SS ou HH:MM)
      const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)

      // Procurar um número de frota (4-5 dígitos)
      const frotaMatch = line.match(/\b(\d{4,5})\b/)

      if (timeMatch && frotaMatch) {
        data.push({
          horario: timeMatch[1],
          frota: frotaMatch[1],
        })
      }
    }

    return data
  }

  return (
    <div className="space-y-4">
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progresso do OCR */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{ocrStatus || "Processando..."}</span>
            <span className="text-sm">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Preview e resultados */}
      {imagePreview && !isProcessing && (
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
              </div>
            </CardContent>
          </Card>

          {/* Texto extraído */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="block text-sm font-medium">Texto Extraído</Label>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      disabled={!extractedText.trim()}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button variant="outline" size="sm" onClick={processEditedText} disabled={!extractedText.trim()}>
                        <FileText className="h-3 w-3 mr-1" />
                        Processar
                      </Button>
                    </>
                  )}
                </div>
              </div>
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
                  : extractedText
                    ? "Clique em 'Editar' para modificar o texto extraído manualmente."
                    : "Aguardando processamento da imagem..."}
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
              <Label className="block text-sm font-medium">Dados Extraídos ({extractedData.length} registros)</Label>
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
        <AlertTitle className="text-blue-800">Como extrair dados da tabela</AlertTitle>
        <AlertDescription className="text-blue-700">
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
            <li>Carregue uma imagem que contenha a tabela de agendamentos</li>
            <li>
              O sistema tentará extrair <strong>apenas</strong> os dados das colunas "Agendamento" e "Frota"
            </li>
            <li>As linhas de "REFEIÇÃO" serão automaticamente ignoradas</li>
            <li>Se necessário, edite o texto manualmente para melhorar a extração</li>
            <li>
              <strong>Formato para edição manual:</strong> Coloque cada par de horário e frota em uma linha separada
              <div className="bg-gray-100 p-2 mt-1 rounded text-xs font-mono">
                07:00:00 8001
                <br />
                08:00:00 8799
                <br />
                09:10:00 8794
                <br />
                ...
              </div>
            </li>
          </ol>
          <div className="flex items-center mt-3 bg-yellow-50 p-2 rounded border border-yellow-200">
            <Table className="h-4 w-4 text-yellow-600 mr-2" />
            <p className="text-xs text-yellow-700">
              <strong>Importante:</strong> O sistema extrai apenas os horários (coluna Agendamento) e números de frota
              (coluna Frota). Outros dados da tabela serão ignorados.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default ImageDataExtractor
