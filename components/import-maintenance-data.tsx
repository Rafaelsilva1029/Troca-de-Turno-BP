"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageDataExtractor } from "./image-data-extractor"
import { toast } from "@/components/ui/use-toast"
import { FileSpreadsheet, ImageIcon, Upload, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import * as XLSX from "xlsx"

interface MaintenanceRecord {
  frota: string
  horario: string
  data?: string
  km?: string
  motorista?: string
  observacao?: string
}

export function ImportMaintenanceData({ onImport }: { onImport: (data: MaintenanceRecord[]) => void }) {
  const [importMethod, setImportMethod] = useState<"excel" | "image">("excel")
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para lidar com o upload de arquivo Excel
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet)

        // Mapear para o formato esperado
        const mappedRecords: MaintenanceRecord[] = jsonData.map((row) => ({
          frota: row.Frota?.toString() || row.frota?.toString() || "",
          horario: row.Horario?.toString() || row.horario?.toString() || row.Agendamento?.toString() || "",
          data: row.Data?.toString() || row.data?.toString() || new Date().toLocaleDateString(),
          km: row.KM?.toString() || row.km?.toString() || "",
          motorista: row.Motorista?.toString() || row.motorista?.toString() || "",
          observacao: row.Observacao?.toString() || row.observacao?.toString() || "",
        }))

        if (mappedRecords.length === 0) {
          setError("Nenhum registro encontrado na planilha ou formato inválido.")
        } else {
          setRecords(mappedRecords)
          toast({
            title: "Arquivo processado",
            description: `${mappedRecords.length} registros encontrados.`,
          })
        }
      } catch (error) {
        console.error("Erro ao processar arquivo Excel:", error)
        setError("Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.")
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setError("Erro ao ler o arquivo.")
      setIsLoading(false)
    }

    reader.readAsArrayBuffer(file)
  }

  // Função para lidar com dados extraídos da imagem
  const handleImageDataExtracted = (data: { frota: string; horario: string }[]) => {
    if (data.length === 0) {
      setError("Nenhum dado extraído da imagem.")
      return
    }

    // Converter para o formato de registro completo
    const today = new Date().toLocaleDateString()
    const mappedRecords: MaintenanceRecord[] = data.map((item) => ({
      frota: item.frota,
      horario: item.horario,
      data: today,
      km: "",
      motorista: "",
      observacao: "",
    }))

    setRecords(mappedRecords)
    toast({
      title: "Dados extraídos",
      description: `${mappedRecords.length} registros processados.`,
    })
  }

  // Função para finalizar a importação
  const handleFinishImport = () => {
    if (records.length === 0) {
      setError("Não há registros para importar.")
      return
    }

    onImport(records)
    toast({
      title: "Importação concluída",
      description: `${records.length} registros importados com sucesso.`,
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-[#1e2a38] text-white">
        <CardTitle>Importar Dados de Manutenção</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue={importMethod} onValueChange={(v) => setImportMethod(v as "excel" | "image")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Planilha Excel
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imagem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel" className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione um arquivo Excel</h3>
              <p className="text-sm text-gray-500 mb-4">Formatos suportados: .xlsx, .xls</p>
              <Button asChild className="flex items-center">
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                  <input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <ImageDataExtractor onDataExtracted={handleImageDataExtracted} />
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {records.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Registros para importar ({records.length})</h3>
              <Button onClick={handleFinishImport} className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" />
                Concluir Importação
              </Button>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frota
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KM
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motorista
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.slice(0, 5).map((record, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{record.frota}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{record.horario}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{record.data}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{record.km || "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{record.motorista || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length > 5 && (
                <div className="px-3 py-2 text-center text-sm text-gray-500 border-t">
                  Mostrando 5 de {records.length} registros
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
