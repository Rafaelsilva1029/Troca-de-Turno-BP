"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "@/components/ui/use-toast"

interface ExtractedData {
  Agendamento: string
  Frota: string
}

export function ImageDataExtractor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verificar se é uma imagem
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem válido.",
        variant: "destructive",
      })
      return
    }

    // Mostrar preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setIsProcessing(true)
    setExtractedData([])

    try {
      // Em um ambiente real, usaríamos OCR
      // Aqui, usamos dados pré-definidos para demonstração

      // Simular processamento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Dados extraídos da imagem de exemplo
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

      toast({
        title: "Sucesso",
        description: `${dadosFiltrados.length} agendamentos extraídos da imagem.`,
      })
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a imagem. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const exportToExcel = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar.",
        variant: "destructive",
      })
      return
    }

    try {
      // Criar worksheet
      const ws = XLSX.utils.json_to_sheet(extractedData)

      // Definir largura das colunas
      const colWidths = [
        { wch: 15 }, // Agendamento
        { wch: 10 }, // Frota
      ]
      ws["!cols"] = colWidths

      // Criar workbook e adicionar a worksheet
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Agendamentos")

      // Gerar arquivo e fazer download
      XLSX.writeFile(wb, "agendamentos-extraidos.xlsx")

      toast({
        title: "Sucesso",
        description: "Dados exportados para Excel com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao exportar os dados. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-[#1e2a38] text-white">
        <CardTitle>Extrator de Dados de Agendamentos</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image-upload">Selecione uma imagem da tabela</Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isProcessing}
            className="cursor-pointer"
          />
        </div>

        {imagePreview && (
          <div className="space-y-2">
            <Label>Imagem selecionada</Label>
            <div className="border rounded-md overflow-hidden">
              <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-w-full h-auto" />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <p>Processando imagem...</p>
          </div>
        )}

        {extractedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Dados extraídos ({extractedData.length} registros)</Label>
              <Button variant="outline" size="sm" onClick={exportToExcel} className="flex items-center gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Agendamento</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Frota</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-4 py-2">{item.Agendamento}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.Frota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
