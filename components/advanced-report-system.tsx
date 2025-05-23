"use client"

import { useState, useEffect, useRef } from "react"
import {
  FileText,
  FileIcon as FilePdf,
  FileSpreadsheet,
  Printer,
  Share2,
  Filter,
  Download,
  BarChartIcon,
  PieChartIcon,
  TableIcon,
  Save,
  RotateCw,
  Search,
  Sliders,
  CheckSquare,
  ChevronDown,
  Copy,
  Clock,
  Eye,
  Trash,
  AlertCircle,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, addDays } from "date-fns"
import { pt } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  generatePendenciasReport,
  fetchPendenciasLiberadas,
  fetchSavedReports,
  saveReport as saveReportToDb,
  deleteReport as deleteReportFromDb,
  logReportExecution,
  logEvent,
  fetchVeiculosLogistica,
} from "@/lib/supabase"

type ReportType = "pendencias" | "liberados" | "veiculos" | "manutencao" | "combustivel" | "programacao"
type ViewMode = "table" | "chart-bar" | "chart-pie"
type PeriodOption = "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth" | "custom"
type SortOption = "date-desc" | "date-asc" | "category" | "status" | "priority"
type ExportOption = "pdf" | "excel" | "csv"

// Reused utility function to get category names
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

export interface ReportFilterOptions {
  categories: string[]
  statuses: string[]
  startDate: Date
  endDate: Date
  searchTerm: string
}

export interface Report {
  id: string
  title: string
  type: ReportType
  filters: ReportFilterOptions
  sortOption: SortOption
  createdAt: string
  updatedAt: string
  viewMode?: ViewMode
  visibleColumns?: Record<string, boolean>
}

interface AdvancedReportSystemProps {
  buttonLabel?: string
  buttonVariant?: "default" | "outline" | "secondary"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  defaultReportType?: ReportType
  showIcon?: boolean
  className?: string
}

export function AdvancedReportSystem({
  buttonLabel = "Relatórios",
  buttonVariant = "outline",
  buttonSize = "default",
  defaultReportType = "pendencias",
  showIcon = true,
  className,
}: AdvancedReportSystemProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reportType, setReportType] = useState<ReportType>(defaultReportType)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [reportTitle, setReportTitle] = useState("")
  const [reportData, setReportData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [savedReports, setSavedReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  // Period filter state
  const [periodOption, setPeriodOption] = useState<PeriodOption>("last30days")
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), "yyyy-MM-dd"))
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))

  // Sort options
  const [sortOption, setSortOption] = useState<SortOption>("date-desc")

  // Print/export refs
  const reportContentRef = useRef<HTMLDivElement>(null)

  // Columns visibility options
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    id: true,
    category: true,
    description: true,
    date: true,
    status: true,
    equipment: true,
    responsible: true,
  })

  // Filter options
  const [filterOptions, setFilterOptions] = useState<ReportFilterOptions>({
    categories: [],
    statuses: [],
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    searchTerm: "",
  })

  // Load saved reports when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadSavedReports()
    }
  }, [isOpen])

  // Load saved reports from database
  const loadSavedReports = async () => {
    try {
      setDatabaseError(null)
      const reports = await fetchSavedReports()

      // Convert date strings to Date objects
      const processedReports = reports.map((report) => ({
        ...report,
        filters: {
          ...report.filters,
          startDate: new Date(report.filters.startDate),
          endDate: new Date(report.filters.endDate),
        },
      })) as Report[]

      setSavedReports(processedReports)
    } catch (error) {
      console.error("Error loading saved reports:", error)
      setDatabaseError("Erro ao carregar relatórios salvos. Verifique sua conexão com o banco de dados.")
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível carregar os relatórios salvos",
        variant: "destructive",
      })
    }
  }

  // Generate report based on type and filters
  const generateReportData = async () => {
    setIsLoading(true)
    setDatabaseError(null)

    try {
      // Determine date range based on period option
      let startDate = new Date()
      let endDate = new Date()

      switch (periodOption) {
        case "today":
          // Keep startDate and endDate as today
          break
        case "yesterday":
          startDate = subDays(new Date(), 1)
          endDate = subDays(new Date(), 1)
          break
        case "last7days":
          startDate = subDays(new Date(), 7)
          break
        case "last30days":
          startDate = subDays(new Date(), 30)
          break
        case "thisMonth":
          startDate = startOfMonth(new Date())
          endDate = endOfMonth(new Date())
          break
        case "lastMonth":
          const lastMonth = new Date()
          lastMonth.setMonth(lastMonth.getMonth() - 1)
          startDate = startOfMonth(lastMonth)
          endDate = endOfMonth(lastMonth)
          break
        case "custom":
          startDate = new Date(customStartDate)
          endDate = new Date(customEndDate)
          break
      }

      const filters: ReportFilterOptions = {
        categories: selectedCategories,
        statuses: selectedStatuses,
        startDate,
        endDate,
        searchTerm,
      }

      setFilterOptions(filters)

      let data: any[] = []

      switch (reportType) {
        case "pendencias":
          // Generate title if not set manually
          if (!reportTitle) {
            setReportTitle(`Relatório de Pendências - ${format(new Date(), "dd/MM/yyyy")}`)
          }

          // Fetch pendencias data
          data = await generatePendenciasReport()
          break

        case "liberados":
          // Generate title if not set manually
          if (!reportTitle) {
            setReportTitle(`Relatório de Equipamentos Liberados - ${format(new Date(), "dd/MM/yyyy")}`)
          }

          // Fetch liberados data
          data = await fetchPendenciasLiberadas()
          break

        case "veiculos":
          if (!reportTitle) {
            setReportTitle(`Relatório de Veículos - ${format(new Date(), "dd/MM/yyyy")}`)
          }
          // Fetch real vehicle data
          data = await fetchVeiculosLogistica()

          // If no data, use mock data for demo
          if (!data || data.length === 0) {
            data = generateMockVehicleData()
          }
          break

        case "manutencao":
          if (!reportTitle) {
            setReportTitle(`Relatório de Manutenções - ${format(new Date(), "dd/MM/yyyy")}`)
          }
          // Mock maintenance data for now
          data = generateMockMaintenanceData()
          break

        case "combustivel":
          if (!reportTitle) {
            setReportTitle(`Relatório de Consumo de Combustível - ${format(new Date(), "dd/MM/yyyy")}`)
          }
          // Mock fuel consumption data for now
          data = generateMockFuelData()
          break

        case "programacao":
          if (!reportTitle) {
            setReportTitle(`Relatório de Programação de Turno - ${format(new Date(), "dd/MM/yyyy")}`)
          }
          // Mock shift schedule data for now
          data = await generateMockShiftData()
          break
      }

      setReportData(data)
      applyFiltersAndSort(data, filters, sortOption)

      // Log report execution to database
      if (selectedReport) {
        await logReportExecution({
          report_id: selectedReport.id,
          report_title: selectedReport.title,
          report_type: selectedReport.type,
          executed_at: new Date().toISOString(),
          row_count: data.length,
          parameters: JSON.stringify(filters),
        })
      }
    } catch (error) {
      console.error("Error generating report:", error)
      setDatabaseError("Erro ao gerar relatório. Verifique sua conexão com o banco de dados.")
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters and sorting to the data
  const applyFiltersAndSort = (data: any[], filters: ReportFilterOptions, sort: SortOption) => {
    // Start with all data
    let filteredData = [...data]

    // Apply category filters if any are selected
    if (filters.categories && filters.categories.length > 0) {
      filteredData = filteredData.filter((item) => filters.categories.includes(item.category))
    }

    // Apply status filters if any are selected
    if (filters.statuses && filters.statuses.length > 0) {
      filteredData = filteredData.filter((item) => {
        // For pendencias, they don't have a status field
        if (reportType === "pendencias") return true

        // For liberados and other types
        return filters.statuses.includes(item.status || "")
      })
    }

    // Apply date range filter
    filteredData = filteredData.filter((item) => {
      const itemDate =
        reportType === "pendencias"
          ? new Date(item.created_at)
          : reportType === "liberados"
            ? new Date(item.released_at)
            : new Date(item.date || item.created_at || item.updated_at)

      return itemDate >= filters.startDate && itemDate <= filters.endDate
    })

    // Apply search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filteredData = filteredData.filter((item) => {
        // Check description field
        if (item.description && item.description.toLowerCase().includes(searchLower)) return true

        // Check equipment_id field
        if (item.equipment_id && item.equipment_id.toLowerCase().includes(searchLower)) return true

        // Check frota field for vehicles
        if (item.frota && item.frota.toLowerCase().includes(searchLower)) return true

        // Check other relevant fields depending on report type
        if (item.released_by && item.released_by.toLowerCase().includes(searchLower)) return true

        // For veiculos report type
        if (item.placa && item.placa.toLowerCase().includes(searchLower)) return true
        if (item.modelo && item.modelo.toLowerCase().includes(searchLower)) return true

        return false
      })
    }

    // Apply sorting
    filteredData.sort((a, b) => {
      switch (sort) {
        case "date-desc":
          const dateA1 =
            reportType === "pendencias"
              ? new Date(a.created_at)
              : reportType === "liberados"
                ? new Date(a.released_at)
                : new Date(a.date || a.created_at || a.updated_at)

          const dateB1 =
            reportType === "pendencias"
              ? new Date(b.created_at)
              : reportType === "liberados"
                ? new Date(b.released_at)
                : new Date(b.date || b.created_at || b.updated_at)

          return dateB1.getTime() - dateA1.getTime()

        case "date-asc":
          const dateA2 =
            reportType === "pendencias"
              ? new Date(a.created_at)
              : reportType === "liberados"
                ? new Date(a.released_at)
                : new Date(a.date || a.created_at || a.updated_at)

          const dateB2 =
            reportType === "pendencias"
              ? new Date(b.created_at)
              : reportType === "liberados"
                ? new Date(b.released_at)
                : new Date(b.date || b.created_at || b.updated_at)

          return dateA2.getTime() - dateB2.getTime()

        case "category":
          const catA = a.category || ""
          const catB = b.category || ""
          return catA.localeCompare(catB)

        case "status":
          const statusA = a.status || ""
          const statusB = b.status || ""
          return statusA.localeCompare(statusB)

        case "priority":
          const priorityOrder = { urgente: 0, alta: 1, media: 2, baixa: 3 }
          const prioA = priorityOrder[a.priority as keyof typeof priorityOrder] || 4
          const prioB = priorityOrder[b.priority as keyof typeof priorityOrder] || 4
          return prioA - prioB

        default:
          return 0
      }
    })

    // Calculate total pages
    setTotalPages(Math.ceil(filteredData.length / pageSize))

    // Reset to first page when filters change
    setPage(1)

    // Set filtered data
    setFilteredData(filteredData)
  }

  // Get the current page of data for pagination
  const getCurrentPageData = () => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }

  // Save current report configuration
  const saveCurrentReport = async () => {
    if (!reportTitle) {
      toast({
        title: "Erro ao salvar",
        description: "Por favor, forneça um título para o relatório",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setDatabaseError(null)

    try {
      const reportToSave: Report = {
        id: selectedReport?.id || new Date().getTime().toString(),
        title: reportTitle,
        type: reportType,
        filters: filterOptions,
        sortOption,
        createdAt: selectedReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewMode,
        visibleColumns,
      }

      await saveReportToDb(reportToSave)

      // Log the save event
      await logEvent("save_report", {
        report_id: reportToSave.id,
        report_title: reportToSave.title,
        report_type: reportToSave.type,
      })

      // Refresh the saved reports list
      await loadSavedReports()

      // Update the selected report
      setSelectedReport(reportToSave)

      toast({
        title: "Relatório salvo",
        description: "Configurações de relatório salvas com sucesso",
      })
    } catch (error) {
      console.error("Error saving report:", error)
      setDatabaseError("Erro ao salvar relatório. Verifique sua conexão com o banco de dados.")
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o relatório",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Load a saved report
  const loadSavedReport = (report: Report) => {
    setSelectedReport(report)
    setReportTitle(report.title)
    setReportType(report.type)
    setFilterOptions(report.filters)
    setSortOption(report.sortOption)
    setViewMode(report.viewMode || "table")
    setVisibleColumns(
      report.visibleColumns || {
        id: true,
        category: true,
        description: true,
        date: true,
        status: true,
        equipment: true,
        responsible: true,
      },
    )

    // Set filter UI state based on the loaded report
    setSelectedCategories(report.filters.categories || [])
    setSelectedStatuses(report.filters.statuses || [])

    // Set date filter UI state
    // We need to determine what period option this corresponds to or if it's custom
    const startDate = report.filters.startDate
    const endDate = report.filters.endDate

    // Simplify by setting to custom and using the dates directly
    setPeriodOption("custom")
    setCustomStartDate(format(new Date(startDate), "yyyy-MM-dd"))
    setCustomEndDate(format(new Date(endDate), "yyyy-MM-dd"))

    // Search term
    setSearchTerm(report.filters.searchTerm || "")

    // Generate the report data with these filters
    generateReportData()
  }

  // Delete a saved report
  const confirmDeleteReport = (reportId: string) => {
    setReportToDelete(reportId)
    setDeleteConfirmOpen(true)
  }

  const deleteReport = async () => {
    if (!reportToDelete) return

    setIsDeleting(true)
    setDatabaseError(null)

    try {
      await deleteReportFromDb(reportToDelete)

      // Log the delete event
      await logEvent("delete_report", {
        report_id: reportToDelete,
      })

      // Refresh the saved reports list
      await loadSavedReports()

      // If the deleted report was selected, clear the selection
      if (selectedReport?.id === reportToDelete) {
        setSelectedReport(null)
        setReportTitle("")
      }

      toast({
        title: "Relatório excluído",
        description: "O relatório foi excluído com sucesso",
      })
    } catch (error) {
      console.error("Error deleting report:", error)
      setDatabaseError("Erro ao excluir relatório. Verifique sua conexão com o banco de dados.")
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o relatório",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      setReportToDelete(null)
    }
  }

  // Reset all filters to default
  const resetFilters = () => {
    setSelectedCategories([])
    setSelectedStatuses([])
    setPeriodOption("last30days")
    setCustomStartDate(format(subDays(new Date(), 30), "yyyy-MM-dd"))
    setCustomEndDate(format(new Date(), "yyyy-MM-dd"))
    setSearchTerm("")
    setSortOption("date-desc")

    // Reset filter options
    setFilterOptions({
      categories: [],
      statuses: [],
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      searchTerm: "",
    })

    // Apply reset filters
    applyFiltersAndSort(
      reportData,
      {
        categories: [],
        statuses: [],
        startDate: subDays(new Date(), 30),
        endDate: new Date(),
        searchTerm: "",
      },
      "date-desc",
    )

    toast({
      title: "Filtros resetados",
      description: "Todos os filtros foram resetados para o padrão",
    })
  }

  // Print the current report
  const printReport = async () => {
    setIsPrinting(true)

    try {
      // Log the print event
      await logEvent("print_report", {
        report_title: reportTitle,
        report_type: reportType,
        rows: filteredData.length,
      })

      // Use browser print functionality
      window.print()
    } catch (error) {
      console.error("Error printing report:", error)
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível imprimir o relatório",
        variant: "destructive",
      })
    } finally {
      setIsPrinting(false)
    }
  }

  // Export report to different formats
  const exportReport = async (format: ExportOption) => {
    setIsExporting(true)

    try {
      // Log the export event
      await logEvent(`export_report_${format}`, {
        report_title: reportTitle,
        report_type: reportType,
        rows: filteredData.length,
      })

      // These would be actual implementations connecting to libraries in a real app
      switch (format) {
        case "pdf":
          exportToPdf()
          break
        case "excel":
          exportToExcel()
          break
        case "csv":
          exportToCsv()
          break
      }
    } catch (error) {
      console.error(`Error exporting report as ${format}:`, error)
      toast({
        title: "Erro ao exportar",
        description: `Não foi possível exportar o relatório como ${format.toUpperCase()}`,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Prepare data for export
  const prepareDataForExport = () => {
    const headers = getColumnHeaders()
    const data = filteredData.map((item) => {
      const row: Record<string, any> = {}

      if (visibleColumns.id) row.id = item.id || ""
      if (visibleColumns.category) row.categoria = getCategoryName(item.category) || ""
      if (visibleColumns.description) row.descricao = item.description || ""

      if (visibleColumns.date) {
        const date =
          reportType === "pendencias"
            ? new Date(item.created_at)
            : reportType === "liberados"
              ? new Date(item.released_at)
              : new Date(item.date || item.created_at || item.updated_at)

        row.data = format(date, "dd/MM/yyyy HH:mm")
      }

      if (visibleColumns.status) row.status = item.status || "Pendente"
      if (visibleColumns.equipment) row.equipamento = item.equipment_id || item.frota || ""
      if (visibleColumns.responsible) row.responsavel = item.released_by || item.motorista || ""

      return row
    })

    return { headers, data }
  }

  const exportToPdf = () => {
    toast({
      title: "Exportando para PDF",
      description: "O relatório está sendo gerado, aguarde o download",
    })

    try {
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      // Add report title
      doc.setFontSize(18)
      doc.text(reportTitle, 14, 15)

      // Add report date
      doc.setFontSize(10)
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 22)

      // Add report type
      doc.text(`Tipo: ${reportType}`, 14, 27)

      // Prepare data for the table
      const { headers, data } = prepareDataForExport()

      // Convert headers and data to format expected by autoTable
      const tableHeaders = Object.values(headers)
      const tableData = data.map((row) => Object.values(row))

      // Add the table to the PDF
      // @ts-ignore - jspdf-autotable adds this method
      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [22, 197, 94], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 35 },
      })

      // Save the PDF
      doc.save(`${reportTitle.replace(/\s+/g, "_")}.pdf`)

      toast({
        title: "PDF exportado",
        description: "O relatório foi exportado com sucesso",
      })
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar para PDF",
        variant: "destructive",
      })
    }
  }

  const exportToExcel = () => {
    toast({
      title: "Exportando para Excel",
      description: "O relatório está sendo gerado, aguarde o download",
    })

    try {
      // Prepare data for export
      const { headers, data } = prepareDataForExport()

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(data)

      // Add header row
      XLSX.utils.sheet_add_aoa(worksheet, [Object.values(headers)], { origin: "A1" })

      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório")

      // Generate Excel file
      XLSX.writeFile(workbook, `${reportTitle.replace(/\s+/g, "_")}.xlsx`)

      toast({
        title: "Excel exportado",
        description: "O relatório foi exportado com sucesso",
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar para Excel",
        variant: "destructive",
      })
    }
  }

  const exportToCsv = () => {
    toast({
      title: "Exportando para CSV",
      description: "O relatório está sendo gerado, aguarde o download",
    })

    try {
      // Create CSV content
      const { headers, data } = prepareDataForExport()

      // Convert to CSV
      const headerRow = Object.values(headers).join(",")
      const dataRows = data.map((row) => Object.values(row).join(","))
      const csvContent = [headerRow, ...dataRows].join("\n")

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${reportTitle.replace(/\s+/g, "_")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "CSV exportado",
        description: "O relatório foi exportado com sucesso",
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar para CSV",
        variant: "destructive",
      })
    }
  }

  // Get column headers based on report type
  const getColumnHeaders = () => {
    const baseHeaders: Record<string, string> = {
      id: "ID",
      category: "Categoria",
      description: "Descrição",
      date: "Data",
    }

    switch (reportType) {
      case "pendencias":
        return {
          ...baseHeaders,
          status: "Status",
        }
      case "liberados":
        return {
          ...baseHeaders,
          status: "Status",
          equipment: "Equipamento",
          responsible: "Responsável",
        }
      case "veiculos":
        return {
          id: "ID",
          frota: "Frota",
          placa: "Placa",
          modelo: "Modelo",
          status: "Status",
          ultimaManutencao: "Última Manutenção",
          proximaManutencao: "Próxima Manutenção",
        }
      case "manutencao":
        return {
          id: "ID",
          equipamento: "Equipamento",
          tipo: "Tipo",
          data: "Data",
          responsavel: "Responsável",
          observacoes: "Observações",
          custo: "Custo",
        }
      case "combustivel":
        return {
          id: "ID",
          veiculo: "Veículo",
          data: "Data",
          litros: "Litros",
          valor: "Valor",
          odometro: "Odômetro",
          kmL: "Km/L",
        }
      case "programacao":
        return {
          id: "ID",
          turno: "Turno",
          data: "Data",
          responsavel: "Responsável",
          descricao: "Descrição",
        }
      default:
        return baseHeaders
    }
  }

  // Generate mock data for different report types
  const generateMockVehicleData = () => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: `V${i + 1}`.padStart(3, "0"),
      frota: `${["L", "CS", "P", "C", "M", "PR", "VH"][i % 7]}-${(i + 1).toString().padStart(3, "0")}`,
      placa: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 1) % 26))}${String.fromCharCode(65 + ((i + 2) % 26))}-${1000 + i}`,
      modelo: `${["Toyota Hilux", "Mercedes Benz Atego", "Volvo FH", "Scania R450", "Volkswagen Constellation", "Ford Cargo"][i % 6]}`,
      status: ["Operacional", "Em manutenção", "Inoperante"][i % 3],
      ultimaManutencao: format(subDays(new Date(), i % 90), "yyyy-MM-dd"),
      proximaManutencao: format(addDays(new Date(), 90 - (i % 90)), "yyyy-MM-dd"),
      motorista: ["João Silva", "Carlos Oliveira", "Roberto Almeida", "André Santos", "Paulo Mendes"][i % 5],
      category: [
        "veiculos-leves",
        "carga-seca",
        "caminhao-pipa",
        "caminhao-cavalos",
        "caminhao-munck",
        "caminhao-cacamba",
        "caminhao-pranchas",
      ][i % 7],
      created_at: format(subDays(new Date(), i % 365), "yyyy-MM-dd'T'HH:mm:ss"),
      updated_at: format(subDays(new Date(), i % 30), "yyyy-MM-dd'T'HH:mm:ss"),
    }))
  }

  const generateMockMaintenanceData = () => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: `M${i + 1}`.padStart(3, "0"),
      equipamento: `${["L", "CS", "P", "C", "M", "PR", "VH"][i % 7]}-${((i % 20) + 1).toString().padStart(3, "0")}`,
      tipo: ["Preventiva", "Corretiva", "Revisão", "Troca de óleo", "Alinhamento", "Freios"][i % 6],
      data: format(subDays(new Date(), i % 180), "yyyy-MM-dd'T'HH:mm:ss"),
      responsavel: ["João Silva", "Carlos Oliveira", "Roberto Almeida", "André Santos", "Paulo Mendes"][i % 5],
      observacoes: [
        "Manutenção de rotina",
        "Problema no motor",
        "Falha elétrica",
        "Problema no sistema hidráulico",
        "Troca de peças desgastadas",
      ][i % 5],
      custo: Math.floor(Math.random() * 5000) + 100,
      status: ["Concluída", "Em andamento", "Agendada", "Cancelada"][i % 4],
      category: [
        "veiculos-leves",
        "carga-seca",
        "caminhao-pipa",
        "caminhao-cavalos",
        "caminhao-munck",
        "caminhao-cacamba",
        "caminhao-pranchas",
      ][i % 7],
      created_at: format(subDays(new Date(), i % 180), "yyyy-MM-dd'T'HH:mm:ss"),
      updated_at: format(subDays(new Date(), i % 30), "yyyy-MM-dd'T'HH:mm:ss"),
    }))
  }

  const generateMockFuelData = () => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: `F${i + 1}`.padStart(3, "0"),
      veiculo: `${["L", "CS", "P", "C", "M", "PR", "VH"][i % 7]}-${((i % 20) + 1).toString().padStart(3, "0")}`,
      frota: `${["L", "CS", "P", "C", "M", "PR", "VH"][i % 7]}-${((i % 20) + 1).toString().padStart(3, "0")}`,
      data: format(subDays(new Date(), i % 90), "yyyy-MM-dd'T'HH:mm:ss"),
      litros: Math.floor(Math.random() * 200) + 20,
      valor: (Math.random() * 1000 + 100).toFixed(2),
      odometro: 10000 + i * 100,
      kmL: (Math.random() * 10 + 5).toFixed(2),
      motorista: ["João Silva", "Carlos Oliveira", "Roberto Almeida", "André Santos", "Paulo Mendes"][i % 5],
      posto: ["Posto Ipiranga", "Posto Shell", "Posto Petrobras", "Posto Ale", "Interno"][i % 5],
      tipoCombustivel: ["Diesel S10", "Diesel Comum", "Gasolina", "Etanol"][i % 4],
      category: "combustivel",
      created_at: format(subDays(new Date(), i % 90), "yyyy-MM-dd'T'HH:mm:ss"),
      updated_at: format(subDays(new Date(), i % 30), "yyyy-MM-dd'T'HH:mm:ss"),
    }))
  }

  const generateMockShiftData = () => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: `P${i + 1}`.padStart(3, "0"),
      turno: ["Manhã", "Tarde", "Noite"][i % 3],
      data: format(subDays(new Date(), i % 30), "yyyy-MM-dd'T'HH:mm:ss"),
      responsavel: ["João Silva", "Carlos Oliveira", "Roberto Almeida", "André Santos", "Paulo Mendes"][i % 5],
      descricao: [
        "Programação para operação de colheita",
        "Manutenção preventiva de equipamentos",
        "Distribuição de veículos por área",
        "Programação para plantio",
        "Distribuição de pessoal",
      ][i % 5],
      equipamentos: Math.floor(Math.random() * 10) + 1,
      pessoal: Math.floor(Math.random() * 20) + 5,
      status: ["Concluído", "Em andamento", "Planejado", "Cancelado"][i % 4],
      category: "programacao",
      created_at: format(subDays(new Date(), i % 30), "yyyy-MM-dd'T'HH:mm:ss"),
      updated_at: format(subDays(new Date(), i % 15), "yyyy-MM-dd'T'HH:mm:ss"),
    }))
  }

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy HH:mm", { locale: pt })
    } catch (error) {
      return dateString
    }
  }

  // Render color for status badges
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "operacional":
      case "concluído":
      case "concluida":
      case "ativo":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "em manutenção":
      case "em andamento":
      case "planejado":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "inoperante":
      case "cancelado":
      case "aguardando":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "pendente":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Render table columns based on report type
  const renderTableColumns = () => {
    const headers = getColumnHeaders()

    return (
      <TableRow>
        {Object.entries(headers).map(([key, label]) => {
          // Skip if column is not visible
          if (key in visibleColumns && !visibleColumns[key as keyof typeof visibleColumns]) {
            return null
          }

          return (
            <TableHead key={key} className="whitespace-nowrap">
              {label}
            </TableHead>
          )
        })}
        <TableHead>Ações</TableHead>
      </TableRow>
    )
  }

  // Render table rows based on report type
  const renderTableRows = () => {
    const currentPageData = getCurrentPageData()

    if (currentPageData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={Object.keys(getColumnHeaders()).length + 1} className="text-center text-slate-500 py-8">
            Nenhum dado encontrado para os filtros selecionados
          </TableCell>
        </TableRow>
      )
    }

    return currentPageData.map((item) => (
      <TableRow key={item.id} className="hover:bg-slate-800/40">
        {visibleColumns.id && <TableCell className="font-mono text-xs">{item.id}</TableCell>}

        {visibleColumns.category && (
          <TableCell>
            <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50">
              {getCategoryName(item.category)}
            </Badge>
          </TableCell>
        )}

        {visibleColumns.description && (
          <TableCell className="max-w-md">
            <div className="truncate">{item.description}</div>
          </TableCell>
        )}

        {visibleColumns.date && (
          <TableCell className="whitespace-nowrap">
            {reportType === "pendencias"
              ? formatDate(item.created_at)
              : reportType === "liberados"
                ? formatDate(item.released_at)
                : formatDate(item.date || item.created_at || item.updated_at)}
          </TableCell>
        )}

        {visibleColumns.status && (
          <TableCell>
            <Badge variant="outline" className={getStatusColor(item.status || "Pendente")}>
              {item.status || "Pendente"}
            </Badge>
          </TableCell>
        )}

        {visibleColumns.equipment && <TableCell>{item.equipment_id || item.frota || "-"}</TableCell>}

        {visibleColumns.responsible && <TableCell>{item.released_by || item.motorista || "-"}</TableCell>}

        <TableCell>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-300">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-300">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))
  }

  // Prepare chart data for bar charts
  const prepareBarChartData = () => {
    // Group data by category
    const categoryCounts: Record<string, number> = {}

    filteredData.forEach((item) => {
      const category = item.category || "sem-categoria"
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0
      }
      categoryCounts[category]++
    })

    // Convert to chart format
    return Object.entries(categoryCounts).map(([category, count]) => ({
      name: getCategoryName(category),
      valor: count,
    }))
  }

  // Prepare chart data for pie charts
  const preparePieChartData = () => {
    if (reportType === "pendencias" || reportType === "liberados") {
      // Group by category
      const categoryCounts: Record<string, number> = {}

      filteredData.forEach((item) => {
        const category = item.category || "sem-categoria"
        if (!categoryCounts[category]) {
          categoryCounts[category] = 0
        }
        categoryCounts[category]++
      })

      // Convert to chart format
      return Object.entries(categoryCounts).map(([category, count]) => ({
        name: getCategoryName(category),
        value: count,
        color: getColorForCategory(category),
      }))
    } else if (reportType === "veiculos") {
      // Group by status
      const statusCounts: Record<string, number> = {}

      filteredData.forEach((item) => {
        const status = item.status || "Desconhecido"
        if (!statusCounts[status]) {
          statusCounts[status] = 0
        }
        statusCounts[status]++
      })

      // Convert to chart format
      return Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: getColorForStatus(status),
      }))
    } else {
      // Default grouping by some field
      const typeField =
        reportType === "manutencao" ? "tipo" : reportType === "combustivel" ? "tipoCombustivel" : "status"
      const counts: Record<string, number> = {}

      filteredData.forEach((item) => {
        const value = item[typeField] || "Desconhecido"
        if (!counts[value]) {
          counts[value] = 0
        }
        counts[value]++
      })

      // Convert to chart format
      return Object.entries(counts).map(([value, count], index) => ({
        name: value,
        value: count,
        color: [
          "#22c55e",
          "#3b82f6",
          "#ef4444",
          "#f97316",
          "#8b5cf6",
          "#ec4899",
          "#06b6d4",
          "#eab308",
          "#84cc16",
          "#14b8a6",
        ][index % 10],
      }))
    }
  }

  // Get color for category
  const getColorForCategory = (category: string) => {
    const categoryColors: Record<string, string> = {
      "veiculos-logistica": "#22c55e",
      "caminhoes-pipas": "#3b82f6",
      "caminhoes-munck": "#ef4444",
      "caminhoes-prancha-vinhaca-muda": "#f97316",
      "caminhoes-cacambas": "#8b5cf6",
      "area-de-vivencias": "#ec4899",
      "carretinhas-rtk": "#06b6d4",
      "tanques-e-dolly": "#eab308",
      "carretas-canavieira": "#84cc16",
      "sem-categoria": "#6b7280",
    }

    return categoryColors[category] || "#6b7280"
  }

  // Get color for status
  const getColorForStatus = (status: string) => {
    const statusColors: Record<string, string> = {
      Operacional: "#22c55e",
      "Em manutenção": "#eab308",
      Inoperante: "#ef4444",
      Concluído: "#22c55e",
      Concluida: "#22c55e",
      "Em andamento": "#3b82f6",
      Planejado: "#8b5cf6",
      Cancelado: "#ef4444",
      Pendente: "#6b7280",
    }

    return statusColors[status] || "#6b7280"
  }

  // Custom tooltip for recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-lg">
          <p className="text-slate-300 font-medium">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
              {`${entry.name || "Valor"}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }

    return null
  }

  // Render bar chart
  const renderBarChart = () => {
    const data = prepareBarChartData()

    return (
      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#475569" }}
              axisLine={{ stroke: "#475569" }}
              tickFormatter={(value) => value.split(" ")[0]}
            />
            <YAxis tick={{ fill: "#94a3b8" }} tickLine={{ stroke: "#475569" }} axisLine={{ stroke: "#475569" }} />
            <RechartsTooltip content={<CustomChartTooltip />} />
            <Legend />
            <Bar
              dataKey="valor"
              name={reportType === "pendencias" ? "Pendências" : "Quantidade"}
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Render pie chart
  const renderPieChart = () => {
    const data = preparePieChartData()

    return (
      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <RechartsTooltip content={<CustomChartTooltip />} />
            <Legend />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              fill="#8884d8"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Render report content based on view mode
  const renderReportContent = () => {
    // Ensure we have data
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-10 w-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            <p className="text-slate-400">Carregando dados do relatório...</p>
          </div>
        </div>
      )
    }

    if (filteredData.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300">Nenhum dado disponível</h3>
          <p className="text-slate-500 max-w-md mt-2">
            Não foram encontrados dados para os filtros selecionados. Tente ajustar os filtros ou selecionar outro tipo
            de relatório.
          </p>
          <Button variant="outline" onClick={resetFilters} className="mt-4 bg-slate-800/50 hover:bg-slate-700/50">
            <RotateCw className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )
    }

    switch (viewMode) {
      case "chart-bar":
        return renderBarChart()
      case "chart-pie":
        return renderPieChart()
      case "table":
      default:
        return (
          <div className="rounded-md border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>{renderTableColumns()}</TableHeader>
                <TableBody>{renderTableRows()}</TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-700 px-4 py-2">
              <div className="text-sm text-slate-500">
                Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filteredData.length)} de{" "}
                {filteredData.length} registros
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    // Show pages around current page
                    let pageNum

                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <PaginationItem key={i}>
                        <PaginationLink isActive={pageNum === page} onClick={() => setPage(pageNum)}>
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {totalPages > 5 && page < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {totalPages > 5 && page < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(totalPages)}>{totalPages}</PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-500">Itens por página:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number.parseInt(value))}>
                  <SelectTrigger className="h-8 w-[70px] bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={buttonVariant as any}
        size={buttonSize as any}
        className={`${className} ${
          buttonVariant === "outline" ? "bg-slate-800/70 hover:bg-slate-700 text-green-400 border-green-500/30" : ""
        }`}
      >
        {showIcon && <FileText className="h-4 w-4 mr-2" />} {buttonLabel}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <FileText className="mr-2 h-5 w-5 text-green-500" />
              Sistema Avançado de Relatórios
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Gere, personalize e exporte relatórios detalhados sobre todos os aspectos da operação.
            </DialogDescription>
          </DialogHeader>

          {databaseError && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300 mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro de Conexão</AlertTitle>
              <AlertDescription>{databaseError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-12 gap-4 max-h-[calc(90vh-180px)] overflow-hidden">
            {/* Sidebar - Report Options */}
            <div className="col-span-12 md:col-span-3 border-r border-slate-700/50 pr-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Report Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-400">Tipo de Relatório</Label>
                  <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="pendencias">Pendências da Oficina</SelectItem>
                      <SelectItem value="liberados">Equipamentos Liberados</SelectItem>
                      <SelectItem value="veiculos">Veículos e Frota</SelectItem>
                      <SelectItem value="manutencao">Manutenções</SelectItem>
                      <SelectItem value="combustivel">Consumo de Combustível</SelectItem>
                      <SelectItem value="programacao">Programação de Turno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Title */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-400">Título do Relatório</Label>
                  <Input
                    placeholder="Digite o título do relatório"
                    className="bg-slate-800 border-slate-700"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>

                {/* Period Selection */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-400">Período</Label>
                  <Select value={periodOption} onValueChange={(value) => setPeriodOption(value as PeriodOption)}>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="yesterday">Ontem</SelectItem>
                      <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="thisMonth">Este mês</SelectItem>
                      <SelectItem value="lastMonth">Mês anterior</SelectItem>
                      <SelectItem value="custom">Período personalizado</SelectItem>
                    </SelectContent>
                  </Select>

                  {periodOption === "custom" && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Data Inicial</Label>
                        <Input
                          type="date"
                          className="bg-slate-800 border-slate-700"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Data Final</Label>
                        <Input
                          type="date"
                          className="bg-slate-800 border-slate-700"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Saved Reports */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-slate-400">Relatórios Salvos</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-slate-500 hover:text-slate-300"
                      onClick={saveCurrentReport}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Salvar Atual
                    </Button>
                  </div>

                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                    {savedReports.length > 0 ? (
                      savedReports.map((report) => (
                        <div key={report.id} className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`flex-1 justify-start px-2 py-1 h-auto text-left text-sm ${
                              selectedReport?.id === report.id
                                ? "bg-green-900/20 text-green-400 hover:bg-green-900/30"
                                : "text-slate-400 hover:bg-slate-800"
                            }`}
                            onClick={() => loadSavedReport(report)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-full">{report.title}</span>
                              <div className="flex items-center space-x-2 text-xs mt-0.5">
                                <Badge
                                  variant="outline"
                                  className="px-1 h-5 bg-slate-800/50 text-slate-400 border-slate-700/50"
                                >
                                  {report.type}
                                </Badge>
                                <span className="text-slate-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(new Date(report.updatedAt), "dd/MM/yy")}
                                </span>
                              </div>
                            </div>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-slate-500 hover:text-red-500"
                            onClick={() => confirmDeleteReport(report.id)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-500 text-sm">Nenhum relatório salvo</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Report View */}
            <div className="col-span-12 md:col-span-9 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      className="pl-8 bg-slate-800 border-slate-700 w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Popover open={isAdvancedFilterOpen} onOpenChange={setIsAdvancedFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-slate-800 hover:bg-slate-700">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {(selectedCategories.length > 0 || selectedStatuses.length > 0) && (
                          <Badge className="ml-2 h-5 bg-green-900/20 text-green-400 border-green-700/50">
                            {selectedCategories.length + selectedStatuses.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-slate-800 border-slate-700 text-slate-100">
                      <div className="space-y-4">
                        <h4 className="font-medium">Filtros Avançados</h4>

                        {/* Category filter */}
                        <div className="space-y-2">
                          <Label className="text-sm text-slate-400">Categorias</Label>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {[
                              "veiculos-logistica",
                              "caminhoes-pipas",
                              "caminhoes-munck",
                              "caminhoes-prancha-vinhaca-muda",
                              "caminhoes-cacambas",
                              "area-de-vivencias",
                              "carretinhas-rtk",
                              "tanques-e-dolly",
                              "carretas-canavieira",
                            ].map((category) => (
                              <div key={category} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${category}`}
                                  checked={selectedCategories.includes(category)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedCategories([...selectedCategories, category])
                                    } else {
                                      setSelectedCategories(selectedCategories.filter((c) => c !== category))
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`category-${category}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {getCategoryName(category)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Status filter - only for relevant report types */}
                        {(reportType === "liberados" || reportType === "veiculos" || reportType === "manutencao") && (
                          <div className="space-y-2">
                            <Label className="text-sm text-slate-400">Status</Label>
                            <div className="max-h-24 overflow-y-auto space-y-1">
                              {[
                                "Operacional",
                                "Em manutenção",
                                "Inoperante",
                                "Concluído",
                                "Em andamento",
                                "Pendente",
                                "Cancelado",
                              ].map((status) => (
                                <div key={status} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`status-${status}`}
                                    checked={selectedStatuses.includes(status)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedStatuses([...selectedStatuses, status])
                                      } else {
                                        setSelectedStatuses(selectedStatuses.filter((s) => s !== status))
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`status-${status}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {status}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-700 hover:bg-slate-600"
                            onClick={resetFilters}
                          >
                            <RotateCw className="h-3 w-3 mr-1" />
                            Limpar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setIsAdvancedFilterOpen(false)
                              generateReportData()
                            }}
                          >
                            Aplicar Filtros
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* View Mode Selection */}
                  <div className="bg-slate-800 rounded-md flex p-0.5 border border-slate-700">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="icon"
                            className={`h-8 w-8 ${
                              viewMode === "table" ? "bg-slate-700" : "hover:bg-slate-700/50 text-slate-400"
                            }`}
                            onClick={() => setViewMode("table")}
                          >
                            <TableIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Visualização em Tabela</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={viewMode === "chart-bar" ? "default" : "ghost"}
                            size="icon"
                            className={`h-8 w-8 ${
                              viewMode === "chart-bar" ? "bg-slate-700" : "hover:bg-slate-700/50 text-slate-400"
                            }`}
                            onClick={() => setViewMode("chart-bar")}
                          >
                            <BarChartIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gráfico de Barras</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={viewMode === "chart-pie" ? "default" : "ghost"}
                            size="icon"
                            className={`h-8 w-8 ${
                              viewMode === "chart-pie" ? "bg-slate-700" : "hover:bg-slate-700/50 text-slate-400"
                            }`}
                            onClick={() => setViewMode("chart-pie")}
                          >
                            <PieChartIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gráfico de Pizza</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Column visibility */}
                  {viewMode === "table" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-slate-800 hover:bg-slate-700">
                          <Sliders className="h-4 w-4 mr-2" />
                          Colunas
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-100">
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.id}
                          onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, id: checked })}
                        >
                          ID
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.category}
                          onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, category: checked })}
                        >
                          Categoria
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.description}
                          onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, description: checked })}
                        >
                          Descrição
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.date}
                          onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, date: checked })}
                        >
                          Data
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.status}
                          onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, status: checked })}
                        >
                          Status
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.equipment}
                          onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, equipment: checked })}
                        >
                          Equipamento
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.responsible}
                          onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, responsible: checked })}
                        >
                          Responsável
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {/* Sort options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-slate-800 hover:bg-slate-700">
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Ordenar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <DropdownMenuItem
                        onClick={() => setSortOption("date-desc")}
                        className={sortOption === "date-desc" ? "bg-slate-700" : ""}
                      >
                        <CheckSquare
                          className={`h-4 w-4 mr-2 ${sortOption === "date-desc" ? "opacity-100" : "opacity-0"}`}
                        />
                        Data (mais recente)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortOption("date-asc")}
                        className={sortOption === "date-asc" ? "bg-slate-700" : ""}
                      >
                        <CheckSquare
                          className={`h-4 w-4 mr-2 ${sortOption === "date-asc" ? "opacity-100" : "opacity-0"}`}
                        />
                        Data (mais antiga)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortOption("category")}
                        className={sortOption === "category" ? "bg-slate-700" : ""}
                      >
                        <CheckSquare
                          className={`h-4 w-4 mr-2 ${sortOption === "category" ? "opacity-100" : "opacity-0"}`}
                        />
                        Categoria
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortOption("status")}
                        className={sortOption === "status" ? "bg-slate-700" : ""}
                      >
                        <CheckSquare
                          className={`h-4 w-4 mr-2 ${sortOption === "status" ? "opacity-100" : "opacity-0"}`}
                        />
                        Status
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortOption("priority")}
                        className={sortOption === "priority" ? "bg-slate-700" : ""}
                      >
                        <CheckSquare
                          className={`h-4 w-4 mr-2 ${sortOption === "priority" ? "opacity-100" : "opacity-0"}`}
                        />
                        Prioridade
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-700"
                    onClick={generateReportData}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <RotateCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Report Content */}
              <div className="flex-1 overflow-auto" ref={reportContentRef}>
                {renderReportContent()}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between border-t border-slate-700/50 pt-4 mt-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="bg-slate-800 hover:bg-slate-700"
                onClick={printReport}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-slate-800 hover:bg-slate-700" disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" /> Exportar
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <DropdownMenuItem onClick={() => exportReport("pdf")}>
                    <FilePdf className="h-4 w-4 mr-2" /> PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportReport("excel")}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportReport("csv")}>
                    <FileText className="h-4 w-4 mr-2" /> CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" className="bg-slate-800 hover:bg-slate-700">
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar
              </Button>
            </div>

            <Button className="bg-green-600 hover:bg-green-700" onClick={saveCurrentReport} disabled={isSaving}>
              {isSaving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="bg-slate-800 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteReport}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
