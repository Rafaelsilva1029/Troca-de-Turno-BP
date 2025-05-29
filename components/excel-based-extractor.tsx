"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ImageIcon,
  Check,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Edit3,
  X,
  Plus,
  Trash2,
  Copy,
  ClipboardPaste,
  Grid3X3,
  ScanLine,
} from "lucide-react"
import Tesseract from "tesseract.js"
import * as XLSX from "xlsx"

interface ExcelBasedExtractorProps {
  onDataExtracted: (data: { frota: string; horario: string }[]) => void
}

interface CellData {
  value: string
  isEditing?: boolean
}

interface TableData {
  headers: string[]
  rows: CellData[][]
}

export function ExcelBasedExtractor({ onDataExtracted }: ExcelBasedExtractorProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Estados da tabela
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [agendamentoColumn, setAgendamentoColumn] = useState<number>(-1)
  const [frotaColumn, setFrotaColumn] = useState<number>(-1)
  const [extractedData, setExtractedData] = useState<{ frota: string; horario: string }[]>([])

  // Estados de edição
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [editValue, setEditValue] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  // Função para pré-processar imagem
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

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Aplicar filtros para melhorar OCR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Converter para escala de cinza e aumentar contraste
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          const contrast = 1.5
          const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100))
          const newGray = factor * (gray - 128) + 128
          const value = newGray > 110 ? 255 : newGray < 40 ? 0 : newGray
          data[i] = data[i + 1] = data[i + 2] = value
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      }
      img.src = imageUrl
    })
  }

  // Função para processar imagem e criar tabela
  const processImageToTable = async () => {
    if (!imageFile || !imagePreview) {
      setError("Por favor, selecione uma imagem primeiro.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setStatus("Preparando imagem...")

    try {
      // Pré-processar imagem
      const processedImage = await preprocessImage(imagePreview)
      setProgress(20)

      // Executar OCR
      setStatus("Reconhecendo texto...")
      const result = await Tesseract.recognize(processedImage, "por", {
        logger: (info) => {
          if (info.status === "recognizing text") {
            setProgress(20 + info.progress * 50)
            setStatus(`Reconhecendo texto... ${Math.round(info.progress * 100)}%`)
          }
        },
      })

      const text = result.data.text
      setProgress(70)

      // Converter texto em estrutura de tabela
      setStatus("Criando estrutura de tabela...")
      const table = textToTableStructure(text)
      setTableData(table)
      setProgress(85)

      // Tentar identificar colunas automaticamente
      identifyColumns(table)
      setProgress(100)

      toast({
        title: "Tabela criada!",
        description: "Revise e ajuste a tabela conforme necessário.",
      })

      setStatus("")
    } catch (err) {
      console.error("Erro no processamento:", err)
      setError("Erro ao processar a imagem. Tente novamente.")
      setStatus("")
    } finally {
      setIsProcessing(false)
    }
  }

  // Função para converter texto em estrutura de tabela
  const textToTableStructure = (text: string): TableData => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) {
      return { headers: ["Col1", "Col2", "Col3"], rows: [] }
    }

    // Tentar identificar colunas por espaços ou tabs
    const rows: CellData[][] = []
    let maxCols = 0

    for (const line of lines) {
      // Dividir por múltiplos espaços ou tabs
      const cells = line.split(/\s{2,}|\t+/).map((cell) => ({
        value: cell.trim(),
        isEditing: false,
      }))

      if (cells.length > maxCols) {
        maxCols = cells.length
      }

      // Padronizar número de colunas
      while (cells.length < maxCols) {
        cells.push({ value: "", isEditing: false })
      }

      rows.push(cells)
    }

    // Criar headers baseados na primeira linha ou genéricos
    let headers: string[] = []
    if (rows.length > 0) {
      const firstRow = rows[0]
      const hasHeaders = firstRow.some(
        (cell) =>
          cell.value.toLowerCase().includes("agendamento") ||
          cell.value.toLowerCase().includes("frota") ||
          cell.value.toLowerCase().includes("horário"),
      )

      if (hasHeaders) {
        headers = firstRow.map((cell) => cell.value)
        rows.shift() // Remove a linha de headers dos dados
      } else {
        headers = Array.from({ length: maxCols }, (_, i) => `Coluna ${i + 1}`)
      }
    }

    // Garantir que todas as linhas tenham o mesmo número de colunas
    for (const row of rows) {
      while (row.length < headers.length) {
        row.push({ value: "", isEditing: false })
      }
    }

    return { headers, rows }
  }

  // Função para identificar colunas automaticamente
  const identifyColumns = (table: TableData) => {
    // Procurar por headers
    table.headers.forEach((header, index) => {
      const headerLower = header.toLowerCase()
      if (headerLower.includes("agendamento") || headerLower.includes("horário") || headerLower.includes("hora")) {
        setAgendamentoColumn(index)
      } else if (headerLower.includes("frota") || headerLower.includes("veículo")) {
        setFrotaColumn(index)
      }
    })

    // Se não encontrou pelos headers, tentar pelos dados
    if (agendamentoColumn === -1 || frotaColumn === -1) {
      for (let col = 0; col < table.headers.length; col++) {
        let hasTime = 0
        let hasFleet = 0

        for (const row of table.rows.slice(0, 5)) {
          // Verificar primeiras 5 linhas
          if (row[col]) {
            const value = row[col].value
            // Verificar se parece horário
            if (/\d{1,2}:\d{2}(:\d{2})?/.test(value)) {
              hasTime++
            }
            // Verificar se parece frota (4-5 dígitos)
            if (/^\d{4,5}$/.test(value)) {
              hasFleet++
            }
          }
        }

        if (hasTime >= 3 && agendamentoColumn === -1) {
          setAgendamentoColumn(col)
        }
        if (hasFleet >= 3 && frotaColumn === -1) {
          setFrotaColumn(col)
        }
      }
    }
  }

  // Função para carregar arquivo Excel
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]

        if (jsonData.length === 0) {
          setError("O arquivo Excel está vazio.")
          return
        }

        // Converter para estrutura de tabela
        const headers = jsonData[0].map((h: any) => String(h || `Coluna ${jsonData[0].indexOf(h) + 1}`))
        const rows = jsonData.slice(1).map((row) =>
          row.map((cell: any) => ({
            value: String(cell || ""),
            isEditing: false,
          })),
        )

        // Garantir que todas as linhas tenham o mesmo número de colunas
        const maxCols = headers.length
        for (const row of rows) {
          while (row.length < maxCols) {
            row.push({ value: "", isEditing: false })
          }
        }

        const table: TableData = { headers, rows }
        setTableData(table)
        identifyColumns(table)

        toast({
          title: "Excel importado!",
          description: `${rows.length} linhas carregadas com sucesso.`,
        })
      } catch (err) {
        console.error("Erro ao ler Excel:", err)
        setError("Erro ao ler o arquivo Excel.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Função para exportar tabela para Excel
  const exportToExcel = () => {
    if (!tableData) return

    const wsData = [tableData.headers, ...tableData.rows.map((row) => row.map((cell) => cell.value))]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Dados Extraídos")

    // Ajustar largura das colunas
    const colWidths = tableData.headers.map(() => ({ wch: 15 }))
    ws["!cols"] = colWidths

    XLSX.writeFile(wb, "tabela-extraida.xlsx")

    toast({
      title: "Excel exportado!",
      description: "O arquivo foi baixado com sucesso.",
    })
  }

  // Função para extrair dados da tabela
  const extractDataFromTable = () => {
    if (!tableData) {
      setError("Nenhuma tabela disponível.")
      return
    }

    if (agendamentoColumn === -1 || frotaColumn === -1) {
      setError("Por favor, selecione as colunas de Agendamento e Frota.")
      return
    }

    const data: { frota: string; horario: string }[] = []

    // Validar formato de horário (aceitar formatos comuns)
    const isValidTimeFormat = (time: string): boolean => {
      // Aceitar formatos: HH:MM, H:MM, HH:MM:SS, H:MM:SS
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(time.trim())
    }

    for (const row of tableData.rows) {
      const horario = row[agendamentoColumn]?.value || ""
      const frota = row[frotaColumn]?.value || ""

      // Validar e limpar dados
      if (horario && frota && !frota.toLowerCase().includes("refeição")) {
        // Validar formato de horário
        if (isValidTimeFormat(horario)) {
          // Validar frota (deve ter 4-5 dígitos)
          if (/\d{4,5}/.test(frota)) {
            data.push({
              horario: horario.trim(),
              frota: frota.trim(),
            })
          }
        }
      }
    }

    if (data.length === 0) {
      setError("Nenhum dado válido encontrado. Verifique se as colunas estão corretas.")
      return
    }

    setExtractedData(data)
    onDataExtracted(data)

    toast({
      title: "Dados extraídos!",
      description: `${data.length} registros válidos encontrados.`,
    })
  }

  // Funções de edição de célula
  const startEditingCell = (row: number, col: number) => {
    if (!tableData) return
    setEditingCell({ row, col })
    setEditValue(tableData.rows[row][col].value)
  }

  const saveCell = () => {
    if (!editingCell || !tableData) return

    const newTableData = { ...tableData }
    newTableData.rows[editingCell.row][editingCell.col].value = editValue

    setTableData(newTableData)
    setEditingCell(null)
    setEditValue("")
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  // Função para adicionar linha
  const addRow = () => {
    if (!tableData) return

    const newRow = tableData.headers.map(() => ({ value: "", isEditing: false }))
    const newTableData = {
      ...tableData,
      rows: [...tableData.rows, newRow],
    }

    setTableData(newTableData)
  }

  // Função para remover linha
  const removeRow = (index: number) => {
    if (!tableData) return

    const newTableData = {
      ...tableData,
      rows: tableData.rows.filter((_, i) => i !== index),
    }

    setTableData(newTableData)
  }

  // Upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido.")
      return
    }

    setImageFile(file)
    setError(null)
    setTableData(null)
    setExtractedData([])
    setAgendamentoColumn(-1)
    setFrotaColumn(-1)

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Função para colar dados da área de transferência
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const table = textToTableStructure(text)
      setTableData(table)
      identifyColumns(table)

      toast({
        title: "Dados colados!",
        description: "Os dados foram importados da área de transferência.",
      })
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível colar os dados.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload de Imagem ou Excel */}
      <Card>
        <CardHeader>
          <CardTitle>1. Importar Dados</CardTitle>
          <CardDescription>Carregue uma imagem da tabela ou importe um arquivo Excel existente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload de Imagem */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">{imageFile ? imageFile.name : "Carregar Imagem"}</p>
              <p className="text-xs text-gray-500">JPG, PNG ou BMP</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Upload de Excel */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => excelInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Importar Excel</p>
              <p className="text-xs text-gray-500">XLS, XLSX ou CSV</p>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Prévia da imagem */}
          {imagePreview && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <Label>Prévia da imagem:</Label>
                <Button onClick={processImageToTable} disabled={isProcessing}>
                  <ScanLine className="h-4 w-4 mr-2" />
                  Processar Imagem
                </Button>
              </div>
              <div className="border rounded-md overflow-hidden max-h-64">
                <img src={imagePreview || "/placeholder.svg"} alt="Prévia" className="w-full h-auto object-contain" />
              </div>
            </div>
          )}

          {/* Botão para colar da área de transferência */}
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={pasteFromClipboard}>
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Colar da Área de Transferência
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canvas oculto */}
      <canvas ref={canvasRef} className="hidden" />

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
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabela Editável */}
      {tableData && !isProcessing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>2. Revisar e Editar Tabela</CardTitle>
                <CardDescription>
                  Clique em qualquer célula para editar. Selecione as colunas de Agendamento e Frota.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addRow}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Linha
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Seleção de Colunas */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Coluna de Agendamento/Horário</Label>
                <Select
                  value={agendamentoColumn.toString()}
                  onValueChange={(value) => setAgendamentoColumn(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Nenhuma</SelectItem>
                    {tableData.headers.map((header, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {header} (Coluna {index + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Coluna de Frota</Label>
                <Select
                  value={frotaColumn.toString()}
                  onValueChange={(value) => setFrotaColumn(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Nenhuma</SelectItem>
                    {tableData.headers.map((header, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {header} (Coluna {index + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabela */}
            <div className="border rounded-md overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {tableData.headers.map((header, index) => (
                      <TableHead
                        key={index}
                        className={`min-w-[120px] ${
                          index === agendamentoColumn
                            ? "bg-green-50 text-green-700"
                            : index === frotaColumn
                              ? "bg-blue-50 text-blue-700"
                              : ""
                        }`}
                      >
                        {header}
                      </TableHead>
                    ))}
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                      {row.map((cell, colIndex) => (
                        <TableCell
                          key={colIndex}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            colIndex === agendamentoColumn
                              ? "bg-green-50"
                              : colIndex === frotaColumn
                                ? "bg-blue-50"
                                : ""
                          }`}
                          onClick={() => startEditingCell(rowIndex, colIndex)}
                        >
                          {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveCell()
                                  if (e.key === "Escape") cancelEdit()
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveCell}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{cell.value || "-"}</span>
                              <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                            </div>
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeRow(rowIndex)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Botão de Extração */}
            <div className="mt-4 flex justify-center">
              <Button size="lg" onClick={extractDataFromTable}>
                <Grid3X3 className="h-5 w-5 mr-2" />
                Extrair Dados Selecionados
              </Button>
            </div>
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
                <CardDescription>{extractedData.length} registros válidos encontrados</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = extractedData.map((item) => `${item.horario}\t${item.frota}`).join("\n")
                    navigator.clipboard.writeText(text)
                    toast({
                      title: "Copiado!",
                      description: "Dados copiados para a área de transferência.",
                    })
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onDataExtracted(extractedData)
                    toast({
                      title: "Dados prontos para uso!",
                      description: "Os dados extraídos foram enviados para processamento.",
                    })
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Usar Dados
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário/Agendamento</TableHead>
                    <TableHead>Frota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.horario}</TableCell>
                      <TableCell className="font-medium">{item.frota}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Como usar o extrator baseado em Excel</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
            <li>Carregue uma imagem da tabela ou importe um arquivo Excel</li>
            <li>A imagem será convertida em uma tabela editável (tipo Excel)</li>
            <li>Revise e edite os dados clicando nas células</li>
            <li>Selecione as colunas de Agendamento/Horário e Frota</li>
            <li>Clique em "Extrair Dados Selecionados" para obter apenas os dados relevantes</li>
            <li>Os dados serão validados automaticamente (horários válidos e frotas de 4-5 dígitos)</li>
          </ol>
          <p className="text-sm mt-2 font-medium">
            💡 Dica: Você também pode colar dados diretamente da área de transferência!
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default ExcelBasedExtractor
