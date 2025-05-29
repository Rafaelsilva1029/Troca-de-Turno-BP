"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import Papa from "papaparse" // Corrected import for papaparse
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ExtractedData {
  frota: string
  horario: string
}

interface MultiFormatExtractorProps {
  onDataExtracted?: (data: ExtractedData[]) => Promise<void>
}

export const MultiFormatExtractor: React.FC<MultiFormatExtractorProps> = ({ onDataExtracted }) => {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    const fileName = file.name.toLowerCase()

    try {
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: "buffer" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet)

        const mappedData: ExtractedData[] = jsonData.map((item) => ({
          frota: String(item["Frota"] || item["frota"] || ""),
          horario: String(item["Horario"] || item["horario"] || item["Horário"] || item["horário"] || ""),
        }))

        setExtractedData(mappedData)
        toast({
          title: "Dados extraídos",
          description: `${mappedData.length} registros foram extraídos do arquivo Excel.`,
        })
      } else if (fileName.endsWith(".csv")) {
        const text = await file.text()
        Papa.parse(text, {
          // Using Papa.parse instead of parse
          header: true,
          complete: (results) => {
            const mappedData: ExtractedData[] = results.data
              .filter((item: any) => item && typeof item === "object")
              .map((item: any) => ({
                frota: String(item["Frota"] || item["frota"] || ""),
                horario: String(item["Horario"] || item["horario"] || item["Horário"] || item["horário"] || ""),
              }))

            setExtractedData(mappedData)
            toast({
              title: "Dados extraídos",
              description: `${mappedData.length} registros foram extraídos do arquivo CSV.`,
            })
          },
          error: (error) => {
            console.error("Erro ao processar CSV:", error)
            toast({
              title: "Erro",
              description: "Ocorreu um erro ao processar o arquivo CSV.",
              variant: "destructive",
            })
          },
        })
      } else {
        toast({
          title: "Formato não suportado",
          description: "Apenas arquivos .xlsx, .xls e .csv são suportados.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao processar o arquivo:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
  })

  const handleSendData = async () => {
    if (typeof onDataExtracted === "function" && extractedData.length > 0) {
      try {
        // Garantir que os dados estejam no formato esperado
        const dadosFormatados = extractedData.map((item) => ({
          frota: String(item.frota).trim(),
          horario: String(item.horario).trim(),
        }))

        // Chamar o callback com os dados formatados
        await onDataExtracted(dadosFormatados)

        toast({
          title: "Dados enviados",
          description: `${dadosFormatados.length} registros foram enviados para processamento.`,
        })
      } catch (error) {
        console.error("Erro ao enviar dados extraídos:", error)
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao enviar os dados extraídos.",
          variant: "destructive",
        })
      }
    } else if (extractedData.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para enviar. Por favor, importe um arquivo primeiro.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        {...getRootProps()}
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-md cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-gray-300">Solte os arquivos aqui...</p>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-300">
              Arraste e solte arquivos Excel ou CSV, ou clique para selecionar
            </p>
            <p className="mt-1 text-xs text-gray-500">Suporta arquivos .xlsx, .xls e .csv</p>
          </div>
        )}
      </div>

      {extractedData.length > 0 && (
        <div className="w-full mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-200">Dados Extraídos ({extractedData.length})</h3>
            <Button onClick={handleSendData} className="bg-green-600 hover:bg-green-700">
              Enviar para Controle de Lavagem
            </Button>
          </div>

          <div className="border border-gray-700 rounded-md overflow-hidden">
            <Table>
              <TableCaption>Total de {extractedData.length} registros extraídos</TableCaption>
              <TableHeader className="bg-gray-800">
                <TableRow>
                  <TableHead className="w-[100px] text-gray-200">Frota</TableHead>
                  <TableHead className="text-gray-200">Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractedData.map((item, index) => (
                  <TableRow key={index} className="hover:bg-gray-800/50">
                    <TableCell className="font-medium text-gray-300">{item.frota}</TableCell>
                    <TableCell className="text-gray-300">{item.horario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiFormatExtractor
