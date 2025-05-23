"use client"

import { useState } from "react"
import { FileText, FileIcon as FilePdf, FileSpreadsheet, Printer, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generatePendenciasReport } from "@/lib/supabase"
import type { Pendencia } from "@/lib/supabase"

type ReportGeneratorProps = {
  category?: string
  buttonLabel?: string
  buttonVariant?: "default" | "outline" | "secondary"
  buttonSize?: "default" | "sm" | "lg"
  buttonIcon?: boolean
}

export function ReportGenerator({
  category,
  buttonLabel = "Gerar Relatório",
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonIcon = true,
}: ReportGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportType, setReportType] = useState(category ? "single" : "all")
  const [selectedCategory, setSelectedCategory] = useState(category || "")
  const [reportData, setReportData] = useState<Pendencia[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadReportData = async () => {
    try {
      setIsLoading(true)
      const data = await generatePendenciasReport(reportType === "single" ? selectedCategory : undefined)
      setReportData(data)
    } catch (error) {
      console.error("Error loading report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      loadReportData()
    }
  }

  const exportToExcel = () => {
    alert("Exportando para Excel... Esta funcionalidade seria implementada com uma biblioteca como ExcelJS ou xlsx.")
  }

  const exportToPDF = () => {
    alert("Exportando para PDF... Esta funcionalidade seria implementada com uma biblioteca como jsPDF ou react-pdf.")
  }

  const printReport = () => {
    window.print()
  }

  const getCategoryName = (slug: string) => {
    const names: Record<string, string> = {
      "veiculos-logistica": "Veículos Logística",
      "caminhoes-pipas": "Caminhões Pipas",
      "caminhoes-munck": "Caminhões Munck",
      "caminhoes-prancha-vinhaca-muda": "Caminhões Prancha/Vinhaça/Muda",
      "caminhoes-cacambas": "Caminhões Caçambas",
      "area-de-vivencias": "Área de Vivências",
      "carretinhas-rtk": "Carretinhas RTK",
      "tanques-e-dolly": "Tanques e Dolly",
      "carretas-canavieira": "Carretas Canavieira",
    }
    return names[slug] || slug
  }

  const groupByCategory = (data: Pendencia[]) => {
    return data.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      },
      {} as Record<string, Pendencia[]>,
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant as any}
          size={buttonSize as any}
          className={
            buttonVariant === "outline" ? "bg-slate-800/70 hover:bg-slate-700 text-green-400 border-green-500/30" : ""
          }
        >
          {buttonIcon && <FileText className="h-4 w-4 mr-1" />} {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <FileText className="mr-2 h-5 w-5 text-green-500" />
            Relatório de Pendências
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {reportType === "all"
              ? "Relatório completo de todas as pendências da oficina"
              : `Relatório de pendências: ${getCategoryName(selectedCategory)}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-8 w-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            <span className="ml-3 text-slate-400">Carregando relatório...</span>
          </div>
        ) : (
          <div className="my-4 p-4 bg-slate-800/50 rounded-md border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-iliieuxhPX3jg8ZHtz6jwLzBhHKw3f.png"
                  alt="Logo Branco Peres"
                  className="h-12 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    RELATÓRIO DE PENDÊNCIAS
                  </h2>
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_rodape%20%281%29-bE0TvyxKLClCUeZK2oJdaOdXUU77uU.png"
                    alt="Branco Peres Agribusiness"
                    className="h-5 w-auto mt-1 object-contain"
                  />
                </div>
              </div>
              <div className="text-sm text-slate-400">Gerado em: {new Date().toLocaleString("pt-BR")}</div>
            </div>

            <div className="space-y-4">
              {reportType === "all" ? (
                Object.entries(groupByCategory(reportData)).map(([category, items]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-lg font-semibold tracking-wide text-green-500 mb-2 border-l-4 border-green-500 pl-2">
                      {getCategoryName(category)}
                    </h3>
                    {items.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {items.map((item) => (
                          <li key={item.id} className="text-slate-300">
                            {item.description}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 italic">Nenhuma pendência registrada</p>
                    )}
                  </div>
                ))
              ) : (
                <div>
                  <h3 className="text-lg font-semibold tracking-wide text-green-500 mb-2 border-l-4 border-green-500 pl-2">
                    {getCategoryName(selectedCategory)}
                  </h3>
                  {reportData.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {reportData.map((item) => (
                        <li key={item.id} className="text-slate-300">
                          {item.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">Nenhuma pendência registrada</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                <SelectValue placeholder="Tipo de relatório" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectItem value="all">Relatório Completo</SelectItem>
                <SelectItem value="single">Categoria Específica</SelectItem>
              </SelectContent>
            </Select>

            {reportType === "single" && (
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value)
                  loadReportData()
                }}
              >
                <SelectTrigger className="w-[220px] bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectItem value="veiculos-logistica">Veículos Logística</SelectItem>
                  <SelectItem value="caminhoes-pipas">Caminhões Pipas</SelectItem>
                  <SelectItem value="caminhoes-munck">Caminhões Munck</SelectItem>
                  <SelectItem value="caminhoes-prancha-vinhaca-muda">Caminhões Prancha/Vinhaça/Muda</SelectItem>
                  <SelectItem value="caminhoes-cacambas">Caminhões Caçambas</SelectItem>
                  <SelectItem value="area-de-vivencias">Área de Vivências</SelectItem>
                  <SelectItem value="carretinhas-rtk">Carretinhas RTK</SelectItem>
                  <SelectItem value="tanques-e-dolly">Tanques e Dolly</SelectItem>
                  <SelectItem value="carretas-canavieira">Carretas Canavieira</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" className="bg-slate-800 hover:bg-slate-700" onClick={printReport}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
            <Button
              variant="outline"
              className="bg-green-800/30 text-green-400 hover:bg-green-800/50 border-green-700/50"
              onClick={exportToExcel}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button
              variant="outline"
              className="bg-red-800/30 text-red-400 hover:bg-red-800/50 border-red-700/50"
              onClick={exportToPDF}
            >
              <FilePdf className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" className="bg-blue-800/30 text-blue-400 hover:bg-blue-800/50 border-blue-700/50">
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
