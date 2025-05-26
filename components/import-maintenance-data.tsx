"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import * as XLSX from "xlsx"
import { AlertCircle, FileSpreadsheet, Loader2, Upload, Check, ImageIcon, Table } from "lucide-react"
import { ImageDataExtractor } from "./image-data-extractor"

// Interface para o registro de manutenção
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

interface ImportMaintenanceDataProps {
  isOpen: boolean
  onClose: () => void
  onImport: (records: Omit<MaintenanceRecord, "id">[]) => Promise<boolean>
}

// Mapeamento de tipos de preventiva
const tiposPreventiva: Record<string, string> = {
  "Lavagem / Lubrificação": "lavagem_lubrificacao",
  Lavagem: "lavagem",
  Lubrificação: "lubrificacao",
  "Troca de Óleo": "troca_oleo",
  "Lavagem Completa": "lavagem_completa",
}

// Mapeamento de situações
const situacoes: Record<string, "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO"> = {
  PENDENTE: "PENDENTE",
  ANDAMENTO: "EM_ANDAMENTO",
  "EM ANDAMENTO": "EM_ANDAMENTO",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  ENCERRADO: "ENCERRADO",
}

export function ImportMaintenanceData({ isOpen, onClose, onImport }: ImportMaintenanceDataProps) {
  // Estados
  const [importando, setImportando] = useState(false)
  const [registrosImportados, setRegistrosImportados] = useState<Omit<MaintenanceRecord, "id">[]>([])
  const [errosValidacao, setErrosValidacao] = useState<string[]>([])
  const [etapa, setEtapa] = useState<"upload" | "revisao" | "concluido">("upload")
  const [tipoImportacao, setTipoImportacao] = useState<"excel" | "imagem">("excel")

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para processar arquivo Excel
  const processarArquivoExcel = (file: File) => {
    setImportando(true)
    setErrosValidacao([])

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Pegar a primeira planilha
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet)

        if (jsonData.length === 0) {
          setErrosValidacao(["Arquivo Excel vazio ou sem dados válidos."])
          setImportando(false)
          return
        }

        // Validar e converter dados
        const { registros, erros } = validarDadosExcel(jsonData)

        if (erros.length > 0) {
          setErrosValidacao(erros)
          setImportando(false)
          return
        }

        setRegistrosImportados(registros)
        setEtapa("revisao")
        setImportando(false)
      } catch (error) {
        console.error("Erro ao processar arquivo Excel:", error)
        setErrosValidacao(["Erro ao processar arquivo Excel. Verifique se o formato está correto."])
        setImportando(false)
      }
    }

    reader.onerror = () => {
      setErrosValidacao(["Erro ao ler o arquivo."])
      setImportando(false)
    }

    reader.readAsArrayBuffer(file)
  }

  // Função para validar dados do Excel
  const validarDadosExcel = (jsonData: any[]) => {
    const registros: Omit<MaintenanceRecord, "id">[] = []
    const erros: string[] = []

    jsonData.forEach((row, index) => {
      try {
        // Verificar campos obrigatórios
        if (!row.Frota) {
          erros.push(`Linha ${index + 2}: Campo 'Frota' é obrigatório.`)
          return
        }

        if (!row.Local) {
          erros.push(`Linha ${index + 2}: Campo 'Local' é obrigatório.`)
          return
        }

        if (!row["Tipo Preventiva"] && !row.Tipo_Preventiva) {
          erros.push(`Linha ${index + 2}: Campo 'Tipo Preventiva' é obrigatório.`)
          return
        }

        if (!row["Data Programada"] && !row.Data_Programada) {
          erros.push(`Linha ${index + 2}: Campo 'Data Programada' é obrigatório.`)
          return
        }

        // Processar tipo preventiva
        const tipoPreventiva = row["Tipo Preventiva"] || row.Tipo_Preventiva
        const tipoPreventivaNormalizado = tiposPreventiva[tipoPreventiva] || "lavagem_lubrificacao"

        // Processar situação
        const situacao = row.Situação || row.Situacao || "PENDENTE"
        const situacaoNormalizada = situacoes[situacao.toUpperCase()] || "PENDENTE"

        // Processar datas
        let dataProgramada = ""
        try {
          const dataRaw = row["Data Programada"] || row.Data_Programada
          if (typeof dataRaw === "string") {
            // Tentar converter string para data
            const parts = dataRaw.split("/")
            if (parts.length === 3) {
              const date = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[0]))
              dataProgramada = format(date, "yyyy-MM-dd")
            } else {
              dataProgramada = dataRaw
            }
          } else if (dataRaw instanceof Date) {
            dataProgramada = format(dataRaw, "yyyy-MM-dd")
          } else {
            // Assumir que é um número serial do Excel
            const excelDate = XLSX.SSF.parse_date_code(dataRaw)
            const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d)
            dataProgramada = format(date, "yyyy-MM-dd")
          }
        } catch (error) {
          erros.push(`Linha ${index + 2}: Formato de 'Data Programada' inválido.`)
          return
        }

        // Processar data realizada (opcional)
        let dataRealizada: string | undefined = undefined
        if (row["Data Realizada"] || row.Data_Realizada) {
          try {
            const dataRaw = row["Data Realizada"] || row.Data_Realizada
            if (typeof dataRaw === "string") {
              // Tentar converter string para data
              const parts = dataRaw.split("/")
              if (parts.length === 3) {
                const date = new Date(
                  Number.parseInt(parts[2]),
                  Number.parseInt(parts[1]) - 1,
                  Number.parseInt(parts[0]),
                )
                dataRealizada = format(date, "yyyy-MM-dd")
              } else {
                dataRealizada = dataRaw
              }
            } else if (dataRaw instanceof Date) {
              dataRealizada = format(dataRaw, "yyyy-MM-dd")
            } else if (dataRaw) {
              // Assumir que é um número serial do Excel
              const excelDate = XLSX.SSF.parse_date_code(dataRaw)
              const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d)
              dataRealizada = format(date, "yyyy-MM-dd")
            }
          } catch (error) {
            // Ignorar erro e deixar undefined
          }
        }

        // Processar horário agendado
        let horarioAgendado = row["Horário Agendado"] || row.Horario_Agendado || "08:00"
        if (typeof horarioAgendado === "string" && !horarioAgendado.includes(":")) {
          horarioAgendado = `${horarioAgendado}:00`
        }

        // Criar registro
        const registro: Omit<MaintenanceRecord, "id"> = {
          frota: String(row.Frota),
          local: String(row.Local),
          tipo_preventiva: tipoPreventivaNormalizado,
          data_programada: dataProgramada,
          data_realizada: dataRealizada,
          situacao: situacaoNormalizada,
          horario_agendado: String(horarioAgendado),
          observacao: row.Observação || row.Observacao || "",
        }

        registros.push(registro)
      } catch (error) {
        erros.push(`Linha ${index + 2}: Erro ao processar dados.`)
      }
    })

    return { registros, erros }
  }

  // Função para lidar com upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (
      file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      file.type !== "application/vnd.ms-excel"
    ) {
      setErrosValidacao(["Formato de arquivo inválido. Por favor, envie um arquivo Excel (.xlsx ou .xls)."])
      return
    }

    processarArquivoExcel(file)
  }

  // Função para lidar com o clique no botão de upload
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Função para finalizar importação
  const finalizarImportacao = async () => {
    try {
      setImportando(true)

      const sucesso = await onImport(registrosImportados)

      if (sucesso) {
        setEtapa("concluido")
        toast({
          title: "Sucesso",
          description: `${registrosImportados.length} registros importados com sucesso!`,
        })
      } else {
        throw new Error("Erro ao importar registros")
      }
    } catch (error) {
      console.error("Erro ao finalizar importação:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao importar os registros.",
        variant: "destructive",
      })
    } finally {
      setImportando(false)
    }
  }

  // Função para reiniciar o processo
  const reiniciarProcesso = () => {
    setRegistrosImportados([])
    setErrosValidacao([])
    setEtapa("upload")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Função para fechar o diálogo
  const handleClose = () => {
    reiniciarProcesso()
    onClose()
  }

  // Função para processar dados da imagem
  const handleImageData = useCallback((extractedData: { frota: string; horario: string }[]) => {
    if (!extractedData || extractedData.length === 0) {
      setErrosValidacao(["Nenhum dado extraído da imagem."])
      return
    }

    // Converter dados extraídos para o formato de registro
    const registros: Omit<MaintenanceRecord, "id">[] = extractedData.map((item) => ({
      frota: item.frota,
      local: "LAVADOR", // Valor padrão
      tipo_preventiva: "lavagem_lubrificacao", // Valor padrão
      data_programada: format(new Date(), "yyyy-MM-dd"), // Data atual como padrão
      situacao: "PENDENTE", // Valor padrão
      horario_agendado: item.horario || "08:00", // Horário extraído ou padrão
      observacao: "", // Vazio por padrão
    }))

    setRegistrosImportados(registros)
    setEtapa("revisao")
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Registros</DialogTitle>
          <DialogDescription>
            Importe registros de lavagem e lubrificação a partir de um arquivo Excel ou imagem.
          </DialogDescription>
        </DialogHeader>

        {etapa === "upload" && (
          <Tabs
            defaultValue="excel"
            className="w-full"
            onValueChange={(value) => setTipoImportacao(value as "excel" | "imagem")}
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="excel" className="flex items-center">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Planilha Excel
              </TabsTrigger>
              <TabsTrigger value="imagem" className="flex items-center">
                <ImageIcon className="mr-2 h-4 w-4" />
                Imagem da Tabela
              </TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Arraste e solte um arquivo Excel ou clique para selecionar</h3>
                <p className="text-sm text-gray-500 mb-4">Formatos suportados: .xlsx, .xls</p>
                <Button onClick={handleUploadClick} className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
              </div>

              {errosValidacao.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro na importação</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {errosValidacao.map((erro, index) => (
                        <li key={index}>{erro}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 flex items-center mb-2">
                  <Table className="h-4 w-4 mr-2 text-blue-600" />
                  Formato esperado da planilha
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  A planilha deve conter as seguintes colunas (cabeçalho na primeira linha):
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-blue-200">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="border border-blue-200 px-2 py-1 text-left">Frota*</th>
                        <th className="border border-blue-200 px-2 py-1 text-left">Local*</th>
                        <th className="border border-blue-200 px-2 py-1 text-left">Tipo Preventiva*</th>
                        <th className="border border-blue-200 px-2 py-1 text-left">Data Programada*</th>
                        <th className="border border-blue-200 px-2 py-1 text-left">Data Realizada</th>
                        <th className="border border-blue-200 px-2 py-1 text-left">Situação</th>
                        <th className="border border-blue-200 px-2 py-1 text-left">Horário Agendado</th>
                        <th className="border border-blue-200 px-2 py-1 text-left">Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="border border-blue-200 px-2 py-1">6597</td>
                        <td className="border border-blue-200 px-2 py-1">LAVADOR</td>
                        <td className="border border-blue-200 px-2 py-1">Lavagem / Lubrificação</td>
                        <td className="border border-blue-200 px-2 py-1">26/01/2025</td>
                        <td className="border border-blue-200 px-2 py-1"></td>
                        <td className="border border-blue-200 px-2 py-1">PENDENTE</td>
                        <td className="border border-blue-200 px-2 py-1">04:00</td>
                        <td className="border border-blue-200 px-2 py-1">TROCA DE ÓLEO</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-blue-700 mt-2">* Campos obrigatórios</p>
              </div>
            </TabsContent>

            <TabsContent value="imagem" className="space-y-4">
              <ImageDataExtractor onDataExtracted={handleImageData} />

              {errosValidacao.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro na extração</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {errosValidacao.map((erro, index) => (
                        <li key={index}>{erro}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}

        {etapa === "revisao" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Revisar Dados ({registrosImportados.length} registros)</h3>
              <Button variant="outline" size="sm" onClick={reiniciarProcesso}>
                Voltar
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
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
                        Local
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tipo
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Data Prog.
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Horário
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Situação
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Observação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrosImportados.map((registro, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {registro.frota}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{registro.local}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {Object.entries(tiposPreventiva).find(
                            ([_, value]) => value === registro.tipo_preventiva,
                          )?.[0] || registro.tipo_preventiva}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(registro.data_programada), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {registro.horario_agendado}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {registro.situacao === "EM_ANDAMENTO" ? "ANDAMENTO" : registro.situacao}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {registro.observacao || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {tipoImportacao === "imagem" && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Dados extraídos da imagem</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Os dados foram extraídos da imagem e preenchidos com valores padrão. Verifique se estão corretos antes
                  de importar.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {etapa === "concluido" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Importação concluída com sucesso!</h3>
              <p className="text-sm text-gray-500 mb-4">
                {registrosImportados.length} registros foram importados com sucesso.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {etapa === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {etapa === "revisao" && (
            <>
              <Button variant="outline" onClick={reiniciarProcesso}>
                Cancelar
              </Button>
              <Button onClick={finalizarImportacao} disabled={importando || registrosImportados.length === 0}>
                {importando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar Importação
                  </>
                )}
              </Button>
            </>
          )}

          {etapa === "concluido" && <Button onClick={handleClose}>Fechar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportMaintenanceData
