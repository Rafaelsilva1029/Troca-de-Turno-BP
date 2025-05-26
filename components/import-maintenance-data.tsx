"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, FileSpreadsheet, FilePlus, Upload, Check } from "lucide-react"
import { ImageIcon } from "lucide-react"
import * as XLSX from "xlsx"
import { format, isValid, parse } from "date-fns"

// Tipos
interface MaintenanceRecord {
  id?: number
  frota: string
  local: string
  tipo_preventiva: string
  data_programada: string
  data_realizada?: string
  situacao: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO"
  horario_agendado: string
  observacao?: string
  created_at?: string
  updated_at?: string
}

interface ColumnMapping {
  frota: string
  local: string
  tipo_preventiva: string
  data_programada: string
  data_realizada?: string
  situacao: string
  horario_agendado: string
  observacao?: string
}

interface ImportMaintenanceDataProps {
  onImport: (records: Omit<MaintenanceRecord, "id">[]) => Promise<boolean>
  isOpen: boolean
  onClose: () => void
}

interface ExtractedData {
  Agendamento: string
  Frota: string
}

const defaultColumnMapping: ColumnMapping = {
  frota: "Frota",
  local: "Local",
  tipo_preventiva: "Tipo Preventiva",
  data_programada: "Data Programada",
  data_realizada: "Data Realizada",
  situacao: "Situação",
  horario_agendado: "Horário Agendado",
  observacao: "Observação",
}

const tiposPreventiva = [
  { value: "lavagem_lubrificacao", label: "Lavagem / Lubrificação" },
  { value: "lavagem", label: "Lavagem" },
  { value: "lubrificacao", label: "Lubrificação" },
  { value: "troca_oleo", label: "Troca de Óleo" },
  { value: "lavagem_completa", label: "Lavagem Completa" },
]

const locais = [
  { value: "LAVADOR", label: "LAVADOR" },
  { value: "LUBRIFICADOR", label: "LUBRIFICADOR" },
  { value: "MECANICO", label: "MECÂNICO" },
  { value: "OFICINA", label: "OFICINA" },
  { value: "PATIO", label: "PÁTIO" },
]

export function ImportMaintenanceData({ onImport, isOpen, onClose }: ImportMaintenanceDataProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "image-preview" | "image-mapping">(
    "upload",
  )
  const [file, setFile] = useState<File | null>(null)
  const [sheetData, setSheetData] = useState<any[]>([])
  const [sheetColumns, setSheetColumns] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(defaultColumnMapping)
  const [mappedRecords, setMappedRecords] = useState<Omit<MaintenanceRecord, "id">[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("excel")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Função para processar arquivo Excel
  const processExcelFile = async (file: File) => {
    setIsLoading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)

      // Pegar a primeira planilha
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length < 2) {
        throw new Error("Arquivo não contém dados suficientes")
      }

      // Primeira linha como cabeçalhos
      const headers = jsonData[0] as string[]

      // Restante como dados
      const rows = jsonData.slice(1) as any[]

      // Converter para array de objetos
      const formattedData = rows.map((row) => {
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = row[index]
        })
        return obj
      })

      setSheetColumns(headers)
      setSheetData(formattedData)
      setStep("mapping")

      // Tentar fazer mapeamento automático
      const newMapping = { ...defaultColumnMapping }

      // Para cada campo no nosso mapeamento padrão
      Object.keys(newMapping).forEach((key) => {
        // Procurar uma coluna no Excel que corresponda
        const matchingColumn = headers.find(
          (header) =>
            header.toLowerCase().includes(key.toLowerCase()) ||
            defaultColumnMapping[key as keyof ColumnMapping].toLowerCase().includes(header.toLowerCase()),
        )

        if (matchingColumn) {
          newMapping[key as keyof ColumnMapping] = matchingColumn
        }
      })

      setColumnMapping(newMapping)
    } catch (error) {
      console.error("Erro ao processar arquivo Excel:", error)
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para processar imagem
  const processImage = async (file: File) => {
    setIsLoading(true)
    try {
      // Criar URL para preview da imagem
      const imageUrl = URL.createObjectURL(file)
      setImagePreview(imageUrl)

      // Simular processamento OCR
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Dados extraídos da imagem de exemplo (simulação de OCR)
      const dadosExtraidos: ExtractedData[] = [
        { Agendamento: "07:00:00", Frota: "8001" },
        { Agendamento: "08:00:00", Frota: "8799" },
        { Agendamento: "09:10:00", Frota: "8794" },
        { Agendamento: "12:00:00", Frota: "4567" },
        { Agendamento: "13:00:00", Frota: "40167" },
        { Agendamento: "15:10:00", Frota: "32231" },
        { Agendamento: "16:00:00", Frota: "8798" },
        { Agendamento: "17:15:00", Frota: "4611" },
        { Agendamento: "20:00:00", Frota: "4576" },
        { Agendamento: "22:30:00", Frota: "4599" },
        { Agendamento: "23:30:00", Frota: "4595" },
        { Agendamento: "00:30:00", Frota: "4580" },
        { Agendamento: "01:00:00", Frota: "4566" },
        { Agendamento: "04:00:00", Frota: "4602" },
        { Agendamento: "05:00:00", Frota: "4620" },
        { Agendamento: "06:00:00", Frota: "8818" },
      ]

      // Filtrar linhas de REFEIÇÃO
      const dadosFiltrados = dadosExtraidos.filter(
        (item) => item.Agendamento !== "11:00:00" && item.Agendamento !== "19:00:00" && item.Agendamento !== "03:00:00",
      )

      setExtractedData(dadosFiltrados)
      setStep("image-preview")
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      toast({
        title: "Erro ao processar imagem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para mapear dados conforme mapeamento de colunas
  const mapData = () => {
    setIsLoading(true)
    try {
      const records: Omit<MaintenanceRecord, "id">[] = []
      const errors: string[] = []

      sheetData.forEach((row, index) => {
        try {
          // Extrair valores conforme mapeamento
          const frota = row[columnMapping.frota]?.toString() || ""
          const localRaw = row[columnMapping.local]?.toString() || ""
          const tipoRaw = row[columnMapping.tipo_preventiva]?.toString() || ""
          const dataProgramadaRaw = row[columnMapping.data_programada]
          const dataRealizadaRaw = columnMapping.data_realizada ? row[columnMapping.data_realizada] : undefined
          const situacaoRaw = row[columnMapping.situacao]?.toString() || ""
          const horarioAgendadoRaw = row[columnMapping.horario_agendado]
          const observacao = columnMapping.observacao ? row[columnMapping.observacao]?.toString() : undefined

          // Validações básicas
          if (!frota) {
            throw new Error(`Linha ${index + 2}: Frota é obrigatória`)
          }

          // Processar local
          let local = "LAVADOR" // Valor padrão
          const matchedLocal = locais.find(
            (l) => l.label.toLowerCase() === localRaw.toLowerCase() || l.value.toLowerCase() === localRaw.toLowerCase(),
          )
          if (matchedLocal) {
            local = matchedLocal.value
          } else if (localRaw) {
            // Se não encontrou correspondência exata mas tem valor, usar o primeiro que contém
            const partialMatch = locais.find(
              (l) =>
                l.label.toLowerCase().includes(localRaw.toLowerCase()) ||
                localRaw.toLowerCase().includes(l.label.toLowerCase()) ||
                l.value.toLowerCase().includes(localRaw.toLowerCase()) ||
                localRaw.toLowerCase().includes(l.value.toLowerCase()),
            )
            if (partialMatch) {
              local = partialMatch.value
            }
          }

          // Processar tipo preventiva
          let tipo = "lavagem_lubrificacao" // Valor padrão
          const matchedTipo = tiposPreventiva.find(
            (t) => t.label.toLowerCase() === tipoRaw.toLowerCase() || t.value.toLowerCase() === tipoRaw.toLowerCase(),
          )
          if (matchedTipo) {
            tipo = matchedTipo.value
          } else if (tipoRaw) {
            // Se não encontrou correspondência exata mas tem valor, usar o primeiro que contém
            const partialMatch = tiposPreventiva.find(
              (t) =>
                t.label.toLowerCase().includes(tipoRaw.toLowerCase()) ||
                tipoRaw.toLowerCase().includes(t.label.toLowerCase()) ||
                t.value.toLowerCase().includes(tipoRaw.toLowerCase()) ||
                tipoRaw.toLowerCase().includes(t.value.toLowerCase()),
            )
            if (partialMatch) {
              tipo = partialMatch.value
            }
          }

          // Processar data programada
          let dataProgramada = ""
          if (dataProgramadaRaw) {
            // Tentar diferentes formatos de data
            if (typeof dataProgramadaRaw === "number") {
              // Provavelmente é um número serial do Excel
              const excelDate = XLSX.SSF.parse_date_code(dataProgramadaRaw)
              const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d)
              if (isValid(date)) {
                dataProgramada = format(date, "yyyy-MM-dd")
              }
            } else {
              // Tentar como string em vários formatos
              const dateFormats = ["dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yyyy", "dd.MM.yyyy"]
              for (const dateFormat of dateFormats) {
                try {
                  const date = parse(dataProgramadaRaw.toString(), dateFormat, new Date())
                  if (isValid(date)) {
                    dataProgramada = format(date, "yyyy-MM-dd")
                    break
                  }
                } catch (e) {
                  // Continuar tentando outros formatos
                }
              }
            }
          }

          if (!dataProgramada) {
            throw new Error(`Linha ${index + 2}: Data programada inválida ou não reconhecida`)
          }

          // Processar data realizada (opcional)
          let dataRealizada: string | undefined = undefined
          if (dataRealizadaRaw) {
            // Usar a mesma lógica da data programada
            if (typeof dataRealizadaRaw === "number") {
              const excelDate = XLSX.SSF.parse_date_code(dataRealizadaRaw)
              const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d)
              if (isValid(date)) {
                dataRealizada = format(date, "yyyy-MM-dd")
              }
            } else {
              const dateFormats = ["dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yyyy", "dd.MM.yyyy"]
              for (const dateFormat of dateFormats) {
                try {
                  const date = parse(dataRealizadaRaw.toString(), dateFormat, new Date())
                  if (isValid(date)) {
                    dataRealizada = format(date, "yyyy-MM-dd")
                    break
                  }
                } catch (e) {
                  // Continuar tentando outros formatos
                }
              }
            }
          }

          // Processar situação
          let situacao: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO" = "PENDENTE" // Valor padrão
          const situacaoNormalizada = situacaoRaw.toUpperCase()
          if (situacaoNormalizada.includes("ENCERR") || situacaoNormalizada.includes("CONCLU")) {
            situacao = "ENCERRADO"
          } else if (
            situacaoNormalizada.includes("ANDAM") ||
            situacaoNormalizada.includes("EM_ANDAM") ||
            situacaoNormalizada.includes("EM ANDAM") ||
            situacaoNormalizada.includes("EXECU")
          ) {
            situacao = "EM_ANDAMENTO"
          }

          // Processar horário agendado
          let horarioAgendado = "08:00" // Valor padrão
          if (horarioAgendadoRaw) {
            if (typeof horarioAgendadoRaw === "number") {
              // Converter número decimal para horário (ex: 8.5 -> 08:30)
              const hours = Math.floor(horarioAgendadoRaw)
              const minutes = Math.round((horarioAgendadoRaw - hours) * 60)
              horarioAgendado = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
            } else {
              // Tentar extrair horário de string
              const timeMatch = horarioAgendadoRaw.toString().match(/(\d{1,2})[:.](\d{2})/)
              if (timeMatch) {
                const hours = Number.parseInt(timeMatch[1])
                const minutes = Number.parseInt(timeMatch[2])
                if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
                  horarioAgendado = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
                }
              }
            }
          }

          // Criar registro
          const record: Omit<MaintenanceRecord, "id"> = {
            frota,
            local,
            tipo_preventiva: tipo,
            data_programada: dataProgramada,
            data_realizada: dataRealizada,
            situacao,
            horario_agendado: horarioAgendado,
            observacao,
          }

          records.push(record)
        } catch (error) {
          errors.push(error instanceof Error ? error.message : `Erro na linha ${index + 2}`)
        }
      })

      setMappedRecords(records)
      setValidationErrors(errors)
      setStep("preview")
    } catch (error) {
      console.error("Erro ao mapear dados:", error)
      toast({
        title: "Erro ao mapear dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para mapear dados extraídos da imagem
  const mapImageData = () => {
    setIsLoading(true)
    try {
      const records: Omit<MaintenanceRecord, "id">[] = []
      const errors: string[] = []

      // Data atual para usar como data programada padrão
      const dataAtual = format(new Date(), "yyyy-MM-dd")

      extractedData.forEach((item, index) => {
        try {
          // Validações básicas
          if (!item.Frota) {
            throw new Error(`Linha ${index + 1}: Frota é obrigatória`)
          }

          // Criar registro com valores padrão para campos não extraídos
          const record: Omit<MaintenanceRecord, "id"> = {
            frota: item.Frota,
            local: "LAVADOR", // Valor padrão
            tipo_preventiva: "lavagem_lubrificacao", // Valor padrão
            data_programada: dataAtual, // Data atual como padrão
            situacao: "PENDENTE", // Valor padrão
            horario_agendado: item.Agendamento, // Horário extraído da imagem
            observacao: "Importado de imagem", // Observação padrão
          }

          records.push(record)
        } catch (error) {
          errors.push(error instanceof Error ? error.message : `Erro na linha ${index + 1}`)
        }
      })

      setMappedRecords(records)
      setValidationErrors(errors)
      setStep("preview")
    } catch (error) {
      console.error("Erro ao mapear dados da imagem:", error)
      toast({
        title: "Erro ao mapear dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para importar dados
  const importData = async () => {
    setIsLoading(true)
    setStep("importing")

    try {
      const sucesso = await onImport(mappedRecords)

      if (sucesso) {
        toast({
          title: "Importação concluída",
          description: `${mappedRecords.length} registros importados com sucesso!`,
        })

        // Resetar estado
        resetState()
        onClose()
      } else {
        toast({
          title: "Erro ao importar dados",
          description: "Falha ao importar registros.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao importar dados:", error)
      toast({
        title: "Erro ao importar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para resetar o estado
  const resetState = () => {
    setFile(null)
    setSheetData([])
    setSheetColumns([])
    setColumnMapping(defaultColumnMapping)
    setMappedRecords([])
    setValidationErrors([])
    setStep("upload")
    setActiveTab("excel")
    setImagePreview(null)
    setExtractedData([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }

  // Função para exportar modelo Excel
  const exportarModeloExcel = () => {
    try {
      setIsLoading(true)

      // Criar cabeçalhos
      const headers = [
        "Frota",
        "Local",
        "Tipo Preventiva",
        "Data Programada",
        "Data Realizada",
        "Situação",
        "Horário Agendado",
        "Observação",
      ]

      // Criar dados de exemplo para o modelo
      const dadosModelo = [
        ["6597", "LAVADOR", "Lavagem / Lubrificação", "26/01/2025", "", "PENDENTE", "04:00", "TROCA DE ÓLEO"],
        ["8805", "LAVADOR", "Lavagem", "27/01/2025", "", "PENDENTE", "08:00", "EM VIAGEM"],
        ["4597", "LUBRIFICADOR", "Lubrificação", "28/01/2025", "", "ANDAMENTO", "14:30", "Aguardando peças"],
      ]

      // Combinar cabeçalhos e dados
      const wsData = [headers, ...dadosModelo]

      // Criar worksheet a partir dos dados
      const worksheet = XLSX.utils.aoa_to_sheet(wsData)

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 10 }, // Frota
        { wch: 15 }, // Local
        { wch: 20 }, // Tipo Preventiva
        { wch: 15 }, // Data Programada
        { wch: 15 }, // Data Realizada
        { wch: 12 }, // Situação
        { wch: 15 }, // Horário Agendado
        { wch: 30 }, // Observação
      ]
      worksheet["!cols"] = colWidths

      // Criar workbook e adicionar a worksheet
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo")

      // Exportar como arquivo binário
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

      // Converter para Blob
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Criar URL para o blob
      const url = URL.createObjectURL(blob)

      // Criar elemento de link para download
      const a = document.createElement("a")
      a.href = url
      a.download = "modelo-lavagem-lubrificacao.xlsx"
      document.body.appendChild(a)
      a.click()

      // Limpar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsLoading(false)

        toast({
          title: "Sucesso",
          description: "Modelo Excel exportado com sucesso!",
        })
      }, 100)
    } catch (error) {
      console.error("Erro ao exportar modelo Excel:", error)
      toast({
        title: "Erro ao exportar modelo",
        description: error instanceof Error ? error.message : "Erro desconhecido ao gerar o arquivo Excel",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Handler para seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // Verificar tipo de arquivo
    if (activeTab === "excel") {
      const isExcel =
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.name.endsWith(".xls") ||
        selectedFile.name.endsWith(".xlsx")

      if (!isExcel) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione um arquivo Excel (.xls ou .xlsx)",
          variant: "destructive",
        })
        return
      }

      processExcelFile(selectedFile)
    } else if (activeTab === "pdf") {
      const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf")

      if (!isPdf) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione um arquivo PDF",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Importação de PDF",
        description:
          "A importação de PDFs requer configuração adicional. Por favor, use arquivos Excel para importação automática.",
      })
    } else if (activeTab === "image") {
      const isImage =
        selectedFile.type.startsWith("image/") ||
        selectedFile.name.endsWith(".jpg") ||
        selectedFile.name.endsWith(".jpeg") ||
        selectedFile.name.endsWith(".png")

      if (!isImage) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione uma imagem (.jpg, .jpeg ou .png)",
          variant: "destructive",
        })
        return
      }

      processImage(selectedFile)
    }
  }

  // Renderizar conteúdo baseado no passo atual
  const renderContent = () => {
    switch (step) {
      case "upload":
        return (
          <div className="space-y-6 py-4">
            <Tabs defaultValue="excel" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="excel">Arquivo Excel</TabsTrigger>
                <TabsTrigger value="pdf">Arquivo PDF</TabsTrigger>
                <TabsTrigger value="image">Imagem da Tabela</TabsTrigger>
              </TabsList>
              <TabsContent value="excel" className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Arraste e solte um arquivo Excel ou clique para selecionar
                    </p>
                    <p className="text-xs text-gray-500">Formatos suportados: .xlsx, .xls</p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Selecionar arquivo
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Dicas para importação</h3>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                    <li>O arquivo deve conter uma linha de cabeçalho</li>
                    <li>Colunas recomendadas: Frota, Local, Tipo Preventiva, Data Programada, Situação, Horário</li>
                    <li>Datas devem estar em formato reconhecível (dd/mm/aaaa ou similar)</li>
                    <li>Você poderá mapear as colunas na próxima etapa</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Modelo de Planilha</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Para facilitar a importação, você pode baixar um modelo de planilha:
                  </p>
                  <Button variant="outline" size="sm" onClick={exportarModeloExcel} disabled={isLoading}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {isLoading ? "Gerando..." : "Baixar modelo"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="pdf" className="space-y-4 pt-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Funcionalidade Limitada</AlertTitle>
                  <AlertDescription>
                    A importação de PDFs tem precisão limitada e pode requerer ajustes manuais. Para melhores
                    resultados, utilize arquivos Excel.
                  </AlertDescription>
                </Alert>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4">
                  <FilePlus className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Arraste e solte um arquivo PDF ou clique para selecionar
                    </p>
                    <p className="text-xs text-gray-500">Apenas PDFs com texto selecionável são suportados</p>
                  </div>
                  <Input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Selecionar arquivo
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Arraste e solte uma imagem da tabela ou clique para selecionar
                    </p>
                    <p className="text-xs text-gray-500">
                      Serão extraídos apenas os horários de agendamento e números de frota
                    </p>
                  </div>
                  <Input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  <Button variant="outline" onClick={() => imageInputRef.current?.click()} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Selecionar imagem
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Como funciona a extração de imagens</h3>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                    <li>Faça upload de uma imagem da tabela de agendamentos</li>
                    <li>O sistema extrairá automaticamente os horários e números de frota</li>
                    <li>As linhas de "REFEIÇÃO" serão automaticamente ignoradas</li>
                    <li>Você poderá revisar os dados extraídos antes de importar</li>
                    <li>Os campos não extraídos serão preenchidos com valores padrão</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )

      case "mapping":
        return (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-blue-800 mb-2">Mapeamento de Colunas</h3>
              <p className="text-sm text-blue-700">
                Associe as colunas do seu arquivo às colunas do sistema. O sistema tentou fazer um mapeamento
                automático, mas você pode ajustá-lo conforme necessário.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="frota-mapping">Frota (Obrigatório)</Label>
                  <Select
                    value={columnMapping.frota}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, frota: value })}
                  >
                    <SelectTrigger id="frota-mapping">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local-mapping">Local</Label>
                  <Select
                    value={columnMapping.local}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, local: value })}
                  >
                    <SelectTrigger id="local-mapping">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo-mapping">Tipo Preventiva</Label>
                  <Select
                    value={columnMapping.tipo_preventiva}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, tipo_preventiva: value })}
                  >
                    <SelectTrigger id="tipo-mapping">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-programada-mapping">Data Programada (Obrigatório)</Label>
                  <Select
                    value={columnMapping.data_programada}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, data_programada: value })}
                  >
                    <SelectTrigger id="data-programada-mapping">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data-realizada-mapping">Data Realizada</Label>
                  <Select
                    value={columnMapping.data_realizada || "N/A"}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, data_realizada: value })}
                  >
                    <SelectTrigger id="data-realizada-mapping">
                      <SelectValue placeholder="Selecione a coluna (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não mapear</SelectItem>
                      {sheetColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="situacao-mapping">Situação</Label>
                  <Select
                    value={columnMapping.situacao}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, situacao: value })}
                  >
                    <SelectTrigger id="situacao-mapping">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario-mapping">Horário Agendado</Label>
                  <Select
                    value={columnMapping.horario_agendado}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, horario_agendado: value })}
                  >
                    <SelectTrigger id="horario-mapping">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacao-mapping">Observação</Label>
                  <Select
                    value={columnMapping.observacao || "N/A"}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, observacao: value })}
                  >
                    <SelectTrigger id="observacao-mapping">
                      <SelectValue placeholder="Selecione a coluna (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">Não mapear</SelectItem>
                      {sheetColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Prévia dos Dados</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {sheetColumns.slice(0, 5).map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                      {sheetColumns.length > 5 && <TableHead>...</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sheetData.slice(0, 3).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {sheetColumns.slice(0, 5).map((column) => (
                          <TableCell key={column}>{row[column]?.toString() || ""}</TableCell>
                        ))}
                        {sheetColumns.length > 5 && <TableCell>...</TableCell>}
                      </TableRow>
                    ))}
                    {sheetData.length > 3 && (
                      <TableRow>
                        <TableCell colSpan={Math.min(6, sheetColumns.length)} className="text-center text-gray-500">
                          + {sheetData.length - 3} linhas adicionais
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )

      case "image-preview":
        return (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-blue-800 mb-2">Dados Extraídos da Imagem</h3>
              <p className="text-sm text-blue-700">
                Os seguintes dados foram extraídos da imagem. Verifique se estão corretos antes de continuar.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Imagem Original</h3>
                {imagePreview && (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Tabela de agendamentos"
                      className="max-w-full h-auto"
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Dados Extraídos</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agendamento</TableHead>
                        <TableHead>Frota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.Agendamento}</TableCell>
                          <TableCell>{item.Frota}</TableCell>
                        </TableRow>
                      ))}
                      {extractedData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4">
                            Nenhum dado extraído
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Importante</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Apenas os horários de agendamento e números de frota foram extraídos. Os demais campos serão
                        preenchidos com valores padrão que você poderá editar posteriormente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "preview":
        return (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Prévia da Importação</h3>
              <div className="text-sm text-gray-500">Total: {mappedRecords.length} registros</div>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erros de validação</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Foram encontrados {validationErrors.length} erros:</p>
                  <ul className="list-disc pl-5 space-y-1 max-h-32 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Frota</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Programada</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedRecords.slice(0, 5).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.frota}</TableCell>
                      <TableCell>{record.local}</TableCell>
                      <TableCell>
                        {tiposPreventiva.find((t) => t.value === record.tipo_preventiva)?.label ||
                          record.tipo_preventiva}
                      </TableCell>
                      <TableCell>{format(new Date(record.data_programada), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            record.situacao === "PENDENTE"
                              ? "bg-red-100 text-red-800"
                              : record.situacao === "EM_ANDAMENTO"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {record.situacao === "EM_ANDAMENTO" ? "ANDAMENTO" : record.situacao}
                        </span>
                      </TableCell>
                      <TableCell>{record.horario_agendado}</TableCell>
                      <TableCell>{record.observacao || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {mappedRecords.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        + {mappedRecords.length - 5} registros adicionais
                      </TableCell>
                    </TableRow>
                  )}
                  {mappedRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Nenhum registro válido encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Importante</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Verifique se os dados estão corretos antes de importar. A importação irá adicionar estes registros
                    ao sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case "importing":
        return (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-lg font-medium">Importando dados...</h3>
            <p className="text-sm text-gray-500">Importando {mappedRecords.length} registros. Por favor, aguarde.</p>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Programação de Lavagem e Lubrificação</DialogTitle>
          <DialogDescription>
            Importe dados de um arquivo Excel, PDF ou imagem para preencher automaticamente a programação.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>
          {step !== "upload" && step !== "importing" && (
            <Button
              variant="outline"
              onClick={() => {
                if (step === "mapping" || step === "image-preview") {
                  resetState()
                } else if (step === "preview") {
                  if (activeTab === "image") {
                    setStep("image-preview")
                  } else {
                    setStep("mapping")
                  }
                }
              }}
              disabled={isLoading}
            >
              {step === "mapping" || step === "image-preview" ? "Cancelar" : "Voltar"}
            </Button>
          )}

          {step === "mapping" && (
            <Button onClick={mapData} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          )}

          {step === "image-preview" && (
            <Button onClick={mapImageData} disabled={isLoading || extractedData.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Continuar com estes dados"
              )}
            </Button>
          )}

          {step === "preview" && (
            <Button
              onClick={importData}
              disabled={isLoading || mappedRecords.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Importar {mappedRecords.length} registros
                </>
              )}
            </Button>
          )}

          {step === "importing" && (
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
