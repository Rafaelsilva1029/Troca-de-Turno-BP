"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ImageIcon, Download, Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"

interface ExtractedData {
  horario: string
  frota: string
}

export function SimpleImageExtractor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("Aguardando imagem...")
  const [progress, setProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verificar se é uma imagem
    if (!file.type.startsWith("image/")) {
      setStatus("Por favor, selecione um arquivo de imagem válido.")
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
    setStatus("Extraindo texto da imagem...")
    setProgress(10)

    try {
      // Importar Tesseract.js dinamicamente
      const Tesseract = (await import("tesseract.js")).default

      // Processar a imagem com OCR
      const result = await Tesseract.recognize(
        file,
        "eng", // Idioma
        {
          logger: (m) => {
            console.log(m)
            if (m.status === "recognizing text") {
              setProgress(10 + m.progress * 80)
            }
          },
        },
      )

      setProgress(90)
      const text = result.data.text

      // Expressões para capturar horários e códigos de frota
      const horarios = [...text.matchAll(/\b\d{1,2}:\d{2}(:\d{2})?\b/g)].map((m) => m[0])
      const frotas = [...text.matchAll(/\b\d{4,5}\b/g)].map((m) => m[0])

      // Criar pares de horário e frota
      const data: ExtractedData[] = []
      const limite = Math.min(horarios.length, frotas.length)

      for (let i = 0; i < limite; i++) {
        data.push({
          horario: horarios[i],
          frota: frotas[i],
        })
      }

      setExtractedData(data)
      setProgress(100)
      setStatus(`Extração concluída! ${limite} linhas encontradas.`)

      if (limite === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não foi possível identificar horários e frotas na imagem.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Extração concluída",
          description: `Foram extraídos ${limite} registros da imagem.`,
        })
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      setStatus("Ocorreu um erro ao processar a imagem. Por favor, tente novamente.")
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const exportToExcel = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Sem dados",
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
        { wch: 15 }, // Horário
        { wch: 10 }, // Frota
      ]
      ws["!cols"] = colWidths

      // Criar workbook e adicionar a worksheet
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Agendamentos")

      // Gerar arquivo e fazer download
      XLSX.writeFile(wb, "agendamentos-extraidos.xlsx")

      toast({
        title: "Exportado com sucesso",
        description: "Os dados foram exportados para Excel.",
      })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = () => {
    if (extractedData.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para copiar.",
        variant: "destructive",
      })
      return
    }

    try {
      // Formatar dados para copiar
      const formattedData = extractedData.map((item) => `${item.horario}\t${item.frota}`).join("\n")

      navigator.clipboard.writeText(formattedData)

      toast({
        title: "Copiado",
        description: "Os dados foram copiados para a área de transferência.",
      })
    } catch (error) {
      console.error("Erro ao copiar para área de transferência:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao copiar os dados.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Extração de Dados da Imagem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                target: {
                  files: e.dataTransfer.files,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>
              handleImageUpload(changeEvent)
            }
          }}
        >
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Clique ou arraste uma imagem aqui</p>
          <p className="text-sm text-gray-500">Formatos suportados: JPG, PNG, GIF, BMP</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        {imagePreview && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Imagem selecionada:</p>
            <div className="border rounded-md overflow-hidden">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full h-auto max-h-[300px] object-contain mx-auto"
              />
            </div>
          </div>
        )}

        <div className="text-center font-medium">{status}</div>

        {isProcessing && <Progress value={progress} className="h-2" />}

        {extractedData.length > 0 && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Dados extraídos ({extractedData.length} registros):</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar Excel
                </Button>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
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
                      <TableCell>{item.horario}</TableCell>
                      <TableCell>{item.frota}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
