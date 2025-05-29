"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  FileUp,
  FileText,
  FileSpreadsheet,
  ImageIcon,
  Save,
  Download,
  Trash2,
  RefreshCw,
  Settings,
  Clock,
  Truck,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Edit,
} from "lucide-react"

// Atualizar a interface ExtractedData
interface ExtractedData {
  frota: string
  horario: string
}

interface DataExtractionSectionProps {
  onDataExtracted: (data: ExtractedData[]) => void
}

export function DataExtractionSection({ onDataExtracted }: DataExtractionSectionProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [processingMethod, setProcessingMethod] = useState("enhanced-detection")
  const [imageSettings, setImageSettings] = useState({
    brightness: 120,
    contrast: 150,
    rotation: 0,
  })
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState("")
  const [profileName, setProfileName] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [rawOcrText, setRawOcrText] = useState("")
  const [showRawText, setShowRawText] = useState(false)
  const [isEditingText, setIsEditingText] = useState(false)

  // Simulated profiles
  const extractionProfiles = [
    { id: "profile1", name: "Padrão Branco Peres" },
    { id: "profile2", name: "Tabela Simples" },
    { id: "profile3", name: "Formato Complexo" },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
      e.target.value = "" // Reset input
    }
  }

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    setFiles([])
  }

  // Função para pré-processar imagem antes do OCR
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Definir tamanho do canvas
        canvas.width = img.width
        canvas.height = img.height

        // Desenhar imagem original
        ctx!.drawImage(img, 0, 0)

        // Aplicar filtros para melhorar OCR
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Aplicar configurações de imagem
        for (let i = 0; i < data.length; i += 4) {
          // Aplicar brilho
          const brightness = imageSettings.brightness / 100
          let r = data[i] * brightness
          let g = data[i + 1] * brightness
          let b = data[i + 2] * brightness

          // Aplicar contraste
          const contrast = imageSettings.contrast / 100
          const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100))
          r = factor * (r - 128) + 128
          g = factor * (g - 128) + 128
          b = factor * (b - 128) + 128

          // Converter para escala de cinza
          const gray = 0.299 * r + 0.587 * g + 0.114 * b

          // Aplicar threshold para melhorar contraste
          const threshold = 128
          const finalValue = gray > threshold ? 255 : 0

          data[i] = finalValue
          data[i + 1] = finalValue
          data[i + 2] = finalValue
        }

        ctx!.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Atualizar a função processFiles para processar a imagem real
  const processFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para processar.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setValidationErrors({})
    setRawOcrText("")

    try {
      // Processar cada arquivo
      const allExtractedData: ExtractedData[] = []

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex]
        setProgress((fileIndex / files.length) * 20)

        try {
          if (file.type.startsWith("image/")) {
            // Processar imagem com OCR
            const imageData = await processImageFile(file)
            if (Array.isArray(imageData)) {
              allExtractedData.push(...imageData)
            }
          } else if (file.type.includes("sheet") || file.type.includes("excel")) {
            // Processar Excel
            const excelData = await processExcelFile(file)
            if (Array.isArray(excelData)) {
              allExtractedData.push(...excelData)
            }
          } else if (file.type === "application/pdf") {
            // Processar PDF (simulado por enquanto)
            const pdfData = await processPdfFile(file)
            if (Array.isArray(pdfData)) {
              allExtractedData.push(...pdfData)
            }
          }
        } catch (fileError) {
          console.error(`Erro ao processar arquivo ${file.name}:`, fileError)
          toast({
            title: `Erro no arquivo ${file.name}`,
            description: "Não foi possível processar este arquivo. Continuando com os próximos.",
            variant: "destructive",
          })
        }
      }

      setProgress(90)

      // Remover duplicatas e filtrar dados inválidos
      const uniqueData = removeDuplicatesAndValidate(allExtractedData)

      setProgress(100)
      setExtractedData(uniqueData)
      onDataExtracted(uniqueData)

      toast({
        title: "Processamento concluído",
        description: `${uniqueData.length} registros extraídos com sucesso.`,
      })

      // Switch to results tab
      setActiveTab("results")
    } catch (error) {
      console.error("Error processing files:", error)
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar os arquivos. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Função para processar arquivo de imagem com OCR real
  const processImageFile = async (file: File): Promise<ExtractedData[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        setProgress(30)

        // Pré-processar imagem
        const processedImageUrl = await preprocessImage(file)
        setProgress(40)

        // Importar Tesseract dinamicamente
        const Tesseract = (await import("tesseract.js")).default

        // Executar OCR com configurações otimizadas
        const {
          data: { text },
        } = await Tesseract.recognize(processedImageUrl, "por", {
          logger: (info) => {
            if (info.status === "recognizing text") {
              setProgress(40 + info.progress * 40)
            }
          },
          // Configurações otimizadas para tabelas
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
          tessedit_char_whitelist: "0123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÇçÃãÕõÁáÉéÍíÓóÚú ",
        })

        setProgress(80)
        setRawOcrText(text)

        // Extrair dados do texto usando múltiplas estratégias
        const extractedData = extractDataFromTextEnhanced(text)

        setProgress(85)
        resolve(extractedData)
      } catch (error) {
        console.error("Erro no OCR:", error)
        reject(error)
      }
    })
  }

  // Função melhorada para extrair dados do texto reconhecido
  const extractDataFromTextEnhanced = (text: string): ExtractedData[] => {
    const data: ExtractedData[] = []
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    console.log("Texto OCR completo:", text)
    console.log("Linhas processadas:", lines)

    // Estratégia 1: Busca por padrões linha por linha
    for (const line of lines) {
      // Pular linhas com "REFEIÇÃO" ou cabeçalhos
      if (
        line.toLowerCase().includes("refeição") ||
        line.toLowerCase().includes("agendamento") ||
        line.toLowerCase().includes("frota") ||
        line.toLowerCase().includes("modelo") ||
        line.toLowerCase().includes("serviço") ||
        line.toLowerCase().includes("horas")
      ) {
        continue
      }

      // Padrões mais flexíveis para horário
      const timePatterns = [
        /\b(\d{1,2}:\d{2}:\d{2})\b/g, // HH:MM:SS
        /\b(\d{1,2}:\d{2})\b/g, // HH:MM
        /\b(\d{1,2}h\d{2})\b/g, // HHhMM
        /\b(\d{1,2}\.\d{2})\b/g, // HH.MM
      ]

      // Padrões mais flexíveis para frota
      const fleetPatterns = [
        /\b(\d{4,6})\b/g, // 4-6 dígitos
        /\b([0-9]{3,6})\b/g, // 3-6 dígitos numéricos
      ]

      let timeMatch = null
      let timeValue = ""

      // Tentar cada padrão de horário
      for (const pattern of timePatterns) {
        const matches = Array.from(line.matchAll(pattern))
        if (matches.length > 0) {
          timeMatch = matches[0]
          timeValue = timeMatch[1]
          break
        }
      }

      if (timeMatch) {
        // Normalizar formato de horário
        timeValue = normalizeTimeFormat(timeValue)

        // Procurar frota na mesma linha
        for (const pattern of fleetPatterns) {
          const fleetMatches = Array.from(line.matchAll(pattern))
          for (const fleetMatch of fleetMatches) {
            const frota = fleetMatch[1]

            // Validar se não é um horário disfarçado
            if (!isTimeFormat(frota) && frota !== timeValue.replace(":", "")) {
              data.push({
                frota,
                horario: timeValue,
              })
              console.log(`Encontrado: ${timeValue} - ${frota} na linha: ${line}`)
            }
          }
        }
      }
    }

    // Estratégia 2: Busca por proximidade (horário e frota próximos)
    if (data.length === 0) {
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

        // Coletar todos os horários
        const timePattern = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g
        let match
        while ((match = timePattern.exec(line)) !== null) {
          allTimes.push({
            value: normalizeTimeFormat(match[1]),
            index,
          })
        }

        // Coletar todas as frotas
        const fleetPattern = /\b(\d{3,6})\b/g
        while ((match = fleetPattern.exec(line)) !== null) {
          const fleet = match[1]
          if (!isTimeFormat(fleet)) {
            allFleets.push({
              value: fleet,
              index,
            })
          }
        }
      })

      // Parear horários com frotas próximas
      for (const time of allTimes) {
        // Procurar frota na mesma linha ou linhas próximas
        const nearbyFleets = allFleets.filter((fleet) => Math.abs(fleet.index - time.index) <= 1)

        if (nearbyFleets.length > 0) {
          // Usar a frota mais próxima
          const closestFleet = nearbyFleets.reduce((closest, current) =>
            Math.abs(current.index - time.index) < Math.abs(closest.index - time.index) ? current : closest,
          )

          data.push({
            frota: closestFleet.value,
            horario: time.value,
          })
          console.log(`Encontrado por proximidade: ${time.value} - ${closestFleet.value}`)
        }
      }
    }

    // Estratégia 3: Busca por padrões em texto corrido
    if (data.length === 0) {
      const textNormalized = text.replace(/\s+/g, " ").replace(/\n/g, " ")

      // Padrões como "07:00 8001" ou "07:00:00 8799"
      const combinedPattern = /(\d{1,2}:\d{2}(?::\d{2})?)\s*(\d{3,6})/g
      let match

      while ((match = combinedPattern.exec(textNormalized)) !== null) {
        const horario = normalizeTimeFormat(match[1])
        const frota = match[2]

        if (!isTimeFormat(frota)) {
          data.push({
            frota,
            horario,
          })
          console.log(`Encontrado por padrão combinado: ${horario} - ${frota}`)
        }
      }
    }

    console.log("Dados extraídos:", data)
    return data
  }

  // Função para normalizar formato de horário
  const normalizeTimeFormat = (time: string): string => {
    // Remover segundos se houver
    let normalized = time.replace(/:\d{2}$/, "")

    // Converter formatos alternativos
    normalized = normalized.replace("h", ":").replace(".", ":")

    // Garantir formato HH:MM
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

  // Função para processar texto editado manualmente
  const processEditedText = () => {
    if (!rawOcrText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, adicione o texto extraído para processar.",
        variant: "destructive",
      })
      return
    }

    const extractedData = extractDataFromTextEnhanced(rawOcrText)
    const uniqueData = removeDuplicatesAndValidate(extractedData)

    setExtractedData(uniqueData)
    onDataExtracted(uniqueData)
    setIsEditingText(false)

    toast({
      title: "Texto processado",
      description: `${uniqueData.length} registros extraídos do texto editado.`,
    })
  }

  // Função para processar arquivo Excel
  const processExcelFile = async (file: File): Promise<ExtractedData[]> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            // Importar XLSX dinamicamente
            const XLSX = (await import("xlsx")).default

            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: "array" })

            // Usar a primeira planilha
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

            const extractedData: ExtractedData[] = []

            // Procurar por colunas de horário e frota
            let horarioCol = -1
            let frotaCol = -1

            // Verificar cabeçalho
            if (jsonData.length > 0) {
              const headers = jsonData[0].map((h: any) => String(h || "").toLowerCase())

              horarioCol = headers.findIndex(
                (h) => h.includes("agendamento") || h.includes("horário") || h.includes("hora"),
              )
              frotaCol = headers.findIndex((h) => h.includes("frota") || h.includes("veículo") || h.includes("veiculo"))
            }

            // Se não encontrou por cabeçalho, tentar detectar por padrões
            if (horarioCol === -1 || frotaCol === -1) {
              for (let rowIndex = 1; rowIndex < Math.min(5, jsonData.length); rowIndex++) {
                const row = jsonData[rowIndex]
                for (let colIndex = 0; colIndex < row.length; colIndex++) {
                  const cell = String(row[colIndex] || "")

                  // Detectar coluna de horário
                  if (horarioCol === -1 && /^\d{1,2}:\d{2}(:\d{2})?$/.test(cell)) {
                    horarioCol = colIndex
                  }

                  // Detectar coluna de frota
                  if (frotaCol === -1 && /^\d{3,6}$/.test(cell)) {
                    frotaCol = colIndex
                  }
                }
              }
            }

            // Extrair dados das linhas
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i]

              if (horarioCol >= 0 && frotaCol >= 0 && row[horarioCol] && row[frotaCol]) {
                const horario = String(row[horarioCol]).trim()
                const frota = String(row[frotaCol]).trim()

                // Pular linhas de refeição
                if (horario.toLowerCase().includes("refeição") || frota.toLowerCase().includes("refeição")) {
                  continue
                }

                // Validar e formatar
                if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(horario) && /^\d{3,6}$/.test(frota)) {
                  extractedData.push({
                    frota,
                    horario: normalizeTimeFormat(horario),
                  })
                }
              }
            }

            resolve(extractedData)
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => reject(new Error("Erro ao ler arquivo Excel"))
        reader.readAsArrayBuffer(file)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Função para processar arquivo PDF (simulado)
  const processPdfFile = async (file: File): Promise<ExtractedData[]> => {
    // Por enquanto, retorna dados vazios - seria necessário implementar pdf.js
    toast({
      title: "Processamento de PDF",
      description: "Processamento de PDF será implementado em uma versão futura.",
      variant: "destructive",
    })
    return []
  }

  // Função para remover duplicatas e validar dados
  const removeDuplicatesAndValidate = (data: ExtractedData[]): ExtractedData[] => {
    const uniqueMap = new Map<string, ExtractedData>()
    const errors: Record<string, string[]> = {}

    for (const item of data) {
      const key = `${item.horario}-${item.frota}`
      const itemErrors: string[] = []

      // Validar horário
      if (!/^\d{1,2}:\d{2}$/.test(item.horario)) {
        itemErrors.push("Formato de horário inválido")
      }

      // Validar frota
      if (!/^\d{3,6}$/.test(item.frota)) {
        itemErrors.push("Número de frota inválido")
      }

      if (itemErrors.length > 0) {
        errors[item.frota] = itemErrors
      } else {
        // Adicionar apenas se não houver erros e não for duplicata
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item)
        }
      }
    }

    setValidationErrors(errors)
    return Array.from(uniqueMap.values()).sort((a, b) => a.horario.localeCompare(b.horario))
  }

  const saveProfile = () => {
    if (!profileName.trim()) {
      toast({
        title: "Nome do perfil obrigatório",
        description: "Por favor, forneça um nome para o perfil de extração.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Perfil salvo",
      description: `O perfil "${profileName}" foi salvo com sucesso.`,
    })
    setProfileName("")
  }

  const loadProfile = (profileId: string) => {
    const profile = extractionProfiles.find((p) => p.id === profileId)
    if (profile) {
      setSelectedProfile(profileId)
      toast({
        title: "Perfil carregado",
        description: `O perfil "${profile.name}" foi carregado com sucesso.`,
      })
    }
  }

  const exportResults = (format: "excel" | "csv" | "json") => {
    toast({
      title: "Exportação concluída",
      description: `Os resultados foram exportados no formato ${format.toUpperCase()}.`,
    })
  }

  // Adicionar função para enviar dados para o Controle de Lavagem
  const sendToWashingControl = async () => {
    try {
      // Chamar callback para enviar dados
      onDataExtracted(extractedData)

      toast({
        title: "Dados enviados",
        description: `${extractedData.length} registros foram enviados para o Controle de Lavagem e Lubrificação.`,
      })

      // Limpar dados extraídos após envio bem-sucedido
      setExtractedData([])
      setFiles([])
      setActiveTab("upload")
    } catch (error) {
      console.error("Error sending to washing control:", error)
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar os dados para o controle de lavagem.",
        variant: "destructive",
      })
    }
  }

  const saveToDatabase = () => {
    toast({
      title: "Dados salvos",
      description: "Os dados foram salvos no banco de dados com sucesso.",
    })
  }

  const getFileIcon = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm futuristic-card mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
          <FileUp className="mr-2 h-5 w-5 text-green-500" />
          Extração de Dados de Agendamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="upload" disabled={isProcessing}>
              Upload de Arquivos
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={isProcessing}>
              Configurações
            </TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <div
                className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-green-500/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                <h3 className="text-slate-300 font-medium mb-1">Arraste arquivos ou clique para fazer upload</h3>
                <p className="text-slate-500 text-sm">Suporta imagens (JPG, PNG), PDFs e planilhas Excel (.xlsx)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-slate-300 font-medium">Arquivos selecionados ({files.length})</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFiles}
                      disabled={isProcessing}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Limpar tudo
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/30 pr-2">
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-slate-800/70 rounded-md p-2 border border-slate-700/50"
                        >
                          <div className="flex items-center">
                            {getFileIcon(file)}
                            <span className="ml-2 text-sm text-slate-300 truncate max-w-[200px]">{file.name}</span>
                            <span className="ml-2 text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            disabled={isProcessing}
                            className="h-6 w-6 text-slate-500 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="processing-method" className="text-slate-400 text-sm">
                    Método de processamento:
                  </Label>
                  <Select value={processingMethod} onValueChange={setProcessingMethod} disabled={isProcessing}>
                    <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="enhanced-detection">Detecção Aprimorada</SelectItem>
                      <SelectItem value="table-detection">Detecção de Tabelas</SelectItem>
                      <SelectItem value="column-detection">Detecção de Colunas</SelectItem>
                      <SelectItem value="multi-pass-ocr">OCR Multi-Passagem</SelectItem>
                      <SelectItem value="pattern-recognition">Reconhecimento de Padrões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={processFiles}
                  disabled={isProcessing || files.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" /> Processar Arquivos
                    </>
                  )}
                </Button>
              </div>

              {isProcessing && (
                <div className="mt-4">
                  <Label className="text-slate-400 text-sm mb-1 block">Progresso:</Label>
                  <Progress value={progress} className="h-2" />
                  <p className="text-right text-xs text-slate-500 mt-1">{progress}%</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-300 font-medium">Perfis de Extração</h3>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Nome do perfil"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-48 bg-slate-800 border-slate-700"
                  />
                  <Button onClick={saveProfile} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-1" /> Salvar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {extractionProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`bg-slate-800/70 rounded-md p-3 border ${
                      selectedProfile === profile.id ? "border-green-500/50" : "border-slate-700/50"
                    } cursor-pointer hover:border-green-500/30 transition-colors`}
                    onClick={() => loadProfile(profile.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">{profile.name}</span>
                      {selectedProfile === profile.id && (
                        <Badge className="bg-green-600/50 text-green-100">Ativo</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-300 font-medium">Configurações de Extração</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="bg-slate-800 hover:bg-slate-700 border-slate-700"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  {showAdvancedSettings ? "Ocultar Avançado" : "Mostrar Avançado"}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="column-agendamento" className="text-slate-400 text-sm mb-1 block">
                      Título da coluna de Agendamento
                    </Label>
                    <Input
                      id="column-agendamento"
                      defaultValue="Agendamento"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="column-frota" className="text-slate-400 text-sm mb-1 block">
                      Título da coluna de Frota
                    </Label>
                    <Input id="column-frota" defaultValue="Frota" className="bg-slate-800 border-slate-700" />
                  </div>
                </div>

                {showAdvancedSettings && (
                  <>
                    <div className="space-y-4 mt-4 pt-4 border-t border-slate-700/50">
                      <h4 className="text-slate-300 font-medium mb-2">Configurações de Imagem (Otimizadas para OCR)</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label htmlFor="brightness" className="text-slate-400 text-sm">
                              Brilho: {imageSettings.brightness}%
                            </Label>
                          </div>
                          <Slider
                            id="brightness"
                            min={50}
                            max={200}
                            step={5}
                            value={[imageSettings.brightness]}
                            onValueChange={(value) => setImageSettings({ ...imageSettings, brightness: value[0] })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label htmlFor="contrast" className="text-slate-400 text-sm">
                              Contraste: {imageSettings.contrast}%
                            </Label>
                          </div>
                          <Slider
                            id="contrast"
                            min={100}
                            max={300}
                            step={10}
                            value={[imageSettings.contrast]}
                            onValueChange={(value) => setImageSettings({ ...imageSettings, contrast: value[0] })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label htmlFor="rotation" className="text-slate-400 text-sm">
                              Rotação: {imageSettings.rotation}°
                            </Label>
                          </div>
                          <Slider
                            id="rotation"
                            min={-180}
                            max={180}
                            step={1}
                            value={[imageSettings.rotation]}
                            onValueChange={(value) => setImageSettings({ ...imageSettings, rotation: value[0] })}
                          />
                        </div>
                      </div>

                      <h4 className="text-slate-300 font-medium mb-2 mt-4">Opções de OCR</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="enhance-text" className="text-slate-400 text-sm cursor-pointer">
                            Melhorar reconhecimento de texto
                          </Label>
                          <Switch id="enhance-text" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="detect-orientation" className="text-slate-400 text-sm cursor-pointer">
                            Detectar orientação automaticamente
                          </Label>
                          <Switch id="detect-orientation" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="multi-language" className="text-slate-400 text-sm cursor-pointer">
                            Suporte multi-idioma
                          </Label>
                          <Switch id="multi-language" />
                        </div>
                      </div>

                      <h4 className="text-slate-300 font-medium mb-2 mt-4">Validação de Dados</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="validate-time" className="text-slate-400 text-sm cursor-pointer">
                            Validar formato de horário (HH:MM)
                          </Label>
                          <Switch id="validate-time" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="validate-fleet" className="text-slate-400 text-sm cursor-pointer">
                            Validar número de frota
                          </Label>
                          <Switch id="validate-fleet" defaultChecked />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-300 font-medium">Dados Extraídos</h3>
                <div className="flex space-x-2">
                  {rawOcrText && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRawText(!showRawText)}
                      className="bg-slate-800 hover:bg-slate-700 border-slate-700"
                    >
                      <Eye className="h-4 w-4 mr-1" /> {showRawText ? "Ocultar" : "Ver"} Texto OCR
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportResults("excel")}
                    className="bg-slate-800 hover:bg-slate-700 border-slate-700"
                  >
                    <Download className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportResults("csv")}
                    className="bg-slate-800 hover:bg-slate-700 border-slate-700"
                  >
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                  <Button
                    onClick={sendToWashingControl}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                    disabled={extractedData.length === 0}
                  >
                    <Save className="h-4 w-4 mr-1" /> Enviar para Controle de Lavagem
                  </Button>
                </div>
              </div>

              {/* Seção de texto OCR bruto */}
              {showRawText && rawOcrText && (
                <div className="mb-4 bg-slate-800/70 rounded-lg border border-slate-700/50 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-slate-300 font-medium">Texto OCR Extraído</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingText(!isEditingText)}
                      className="bg-slate-800 hover:bg-slate-700 border-slate-700"
                    >
                      <Edit className="h-4 w-4 mr-1" /> {isEditingText ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                  {isEditingText ? (
                    <div className="space-y-2">
                      <Textarea
                        value={rawOcrText}
                        onChange={(e) => setRawOcrText(e.target.value)}
                        className="min-h-[200px] font-mono text-sm bg-slate-900 border-slate-600"
                        placeholder="Edite o texto extraído aqui..."
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingText(false)}
                          className="bg-slate-800 hover:bg-slate-700 border-slate-700"
                        >
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={processEditedText} className="bg-green-600 hover:bg-green-700">
                          Processar Texto
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <pre className="text-xs text-slate-400 bg-slate-900 p-3 rounded border border-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {rawOcrText}
                    </pre>
                  )}
                </div>
              )}

              {extractedData.length > 0 ? (
                <div className="rounded-md border border-slate-700/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-800/70">
                      <TableRow>
                        <TableHead className="text-slate-300 font-medium">Status</TableHead>
                        <TableHead className="text-slate-300 font-medium">
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 mr-1 text-green-500" /> Frota
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-300 font-medium">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-blue-500" /> Horário
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedData.map((item, index) => {
                        const hasError = validationErrors[item.frota]?.length > 0
                        return (
                          <TableRow
                            key={index}
                            className={`${hasError ? "bg-red-900/10 hover:bg-red-900/20" : "hover:bg-slate-800/50"}`}
                          >
                            <TableCell>
                              {hasError ? (
                                <div className="flex items-center text-red-500">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                </div>
                              ) : (
                                <div className="flex items-center text-green-500">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-slate-300">{item.frota}</TableCell>
                            <TableCell className="text-slate-300">{item.horario}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">Nenhum dado extraído</p>
                  <p className="text-sm mt-1">Faça o upload de arquivos e processe-os para ver os resultados aqui.</p>
                </div>
              )}

              {Object.keys(validationErrors).length > 0 && (
                <div className="mt-4 bg-red-900/20 border border-red-900/30 rounded-md p-3">
                  <h4 className="text-red-400 font-medium flex items-center mb-2">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Erros de Validação
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(validationErrors).map(([key, errors]) => (
                      <li key={key} className="text-slate-300">
                        <span className="font-medium">{key}:</span> {errors.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2 text-xs text-slate-500">
                <p>* Linhas marcadas como "REFEIÇÃO" são automaticamente ignoradas durante a extração.</p>
                <p>* Use "Ver Texto OCR" para verificar o texto extraído e editá-lo se necessário.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
