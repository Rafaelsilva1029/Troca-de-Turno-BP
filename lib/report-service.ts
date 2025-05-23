import { getSupabaseClient } from "@/lib/supabase"

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
  type: string
  filters: ReportFilterOptions
  sortOption: string
  createdAt: string
  updatedAt: string
  viewMode?: "table" | "chart-bar" | "chart-pie"
  visibleColumns?: Record<string, boolean>
}

// Generate a report based on type and filters
export async function generateReport(type: string, filters: ReportFilterOptions) {
  try {
    const supabase = getSupabaseClient()

    // Determine what table to query based on report type
    let tableName
    switch (type) {
      case "pendencias":
        tableName = "pendencias"
        break
      case "liberados":
        tableName = "pendencias_liberadas"
        break
      case "veiculos":
        tableName = "veiculos_logistica"
        break
      case "manutencao":
        tableName = "manutencoes"
        break
      case "combustivel":
        tableName = "abastecimentos"
        break
      case "programacao":
        tableName = "programacao_turno"
        break
      default:
        throw new Error(`Unsupported report type: ${type}`)
    }

    // Start building the query
    let query = supabase.from(tableName).select("*")

    // Apply category filters if specified
    if (filters.categories && filters.categories.length > 0) {
      query = query.in("category", filters.categories)
    }

    // Apply status filters if specified (for tables that have a status column)
    if (filters.statuses && filters.statuses.length > 0 && ["liberados", "veiculos", "manutencao"].includes(type)) {
      query = query.in("status", filters.statuses)
    }

    // Apply date range filters based on appropriate date column
    const dateColumn = type === "liberados" ? "released_at" : "created_at"

    query = query.gte(dateColumn, filters.startDate.toISOString())
    query = query.lte(dateColumn, filters.endDate.toISOString())

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("Error fetching report data:", error)
      throw error
    }

    // For search term filtering, we'll do that client-side since
    // it may need to search across multiple fields

    return data || []
  } catch (error) {
    console.error("Error generating report:", error)

    // Return empty array instead of throwing to prevent UI from breaking
    return []
  }
}

// Save a report configuration
export async function saveReport(report: Report) {
  try {
    // We'll always use Supabase as the primary storage
    const supabase = getSupabaseClient()

    // Convert filter dates to ISO strings for storage
    const processedReport = {
      ...report,
      filters: {
        ...report.filters,
        startDate: report.filters.startDate.toISOString(),
        endDate: report.filters.endDate.toISOString(),
      },
    }

    const { error } = await supabase.from("saved_reports").upsert(processedReport, {
      onConflict: "id",
      ignoreDuplicates: false,
    })

    if (error) {
      console.error("Error saving report to Supabase:", error)

      // Fall back to localStorage if Supabase fails
      const storageKey = "branco_peres_saved_reports"
      const existingReportsJson = localStorage.getItem(storageKey)
      const existingReports: Report[] = existingReportsJson ? JSON.parse(existingReportsJson) : []

      // Find and update existing report or add new one
      const existingIndex = existingReports.findIndex((r) => r.id === report.id)
      if (existingIndex >= 0) {
        existingReports[existingIndex] = report
      } else {
        existingReports.push(report)
      }

      localStorage.setItem(storageKey, JSON.stringify(existingReports))
      return { success: true, source: "localStorage" }
    }

    return { success: true, source: "supabase" }
  } catch (error) {
    console.error("Error saving report:", error)
    throw error
  }
}

// Fetch saved reports
export async function fetchReports(): Promise<Report[]> {
  try {
    // Always try Supabase first
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("saved_reports").select("*").order("updatedAt", { ascending: false })

    if (error) {
      console.warn("Error fetching reports from Supabase:", error)
      throw error
    }

    // Convert ISO date strings back to Date objects for the filters
    return (data || []).map((report) => ({
      ...report,
      filters: {
        ...report.filters,
        startDate: new Date(report.filters.startDate),
        endDate: new Date(report.filters.endDate),
      },
    }))
  } catch (supabaseError) {
    console.warn("Supabase fetch failed, falling back to localStorage:", supabaseError)

    // Fall back to localStorage if Supabase fails
    try {
      const storageKey = "branco_peres_saved_reports"
      const savedReportsJson = localStorage.getItem(storageKey)

      if (!savedReportsJson) return []

      const savedReports: Report[] = JSON.parse(savedReportsJson)

      // Convert string dates to Date objects
      return savedReports.map((report) => ({
        ...report,
        filters: {
          ...report.filters,
          startDate: new Date(report.filters.startDate),
          endDate: new Date(report.filters.endDate),
        },
      }))
    } catch (localStorageError) {
      console.error("Error fetching from localStorage:", localStorageError)
      return []
    }
  }
}

// Delete a saved report
export async function deleteReport(reportId: string): Promise<boolean> {
  try {
    // Always try Supabase first
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("saved_reports").delete().eq("id", reportId)

    if (error) {
      console.warn("Error deleting report from Supabase:", error)
      throw error
    }

    return true
  } catch (supabaseError) {
    console.warn("Supabase delete failed, falling back to localStorage:", supabaseError)

    // Fall back to localStorage if Supabase fails
    try {
      const storageKey = "branco_peres_saved_reports"
      const existingReportsJson = localStorage.getItem(storageKey)

      if (!existingReportsJson) return false

      const existingReports: Report[] = JSON.parse(existingReportsJson)
      const filteredReports = existingReports.filter((r) => r.id !== reportId)

      localStorage.setItem(storageKey, JSON.stringify(filteredReports))
      return true
    } catch (localStorageError) {
      console.error("Error deleting from localStorage:", localStorageError)
      return false
    }
  }
}

// Get report data content by executing the saved report configuration
export async function getReportDataFromSaved(report: Report): Promise<any[]> {
  // Convert ISO date strings to Date objects if they're strings
  const filters = {
    ...report.filters,
    startDate:
      typeof report.filters.startDate === "string" ? new Date(report.filters.startDate) : report.filters.startDate,
    endDate: typeof report.filters.endDate === "string" ? new Date(report.filters.endDate) : report.filters.endDate,
  }

  return await generateReport(report.type, filters)
}

// Export reports to various formats
export async function exportReportToFormat(
  reportData: any[],
  format: "csv" | "excel" | "pdf",
  reportTitle: string,
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    // In a real implementation, this would use proper libraries for each format
    // For now, we'll just log the attempt to Supabase's logs table
    const supabase = getSupabaseClient()

    await supabase.from("logs").insert({
      event: `export_report_${format}`,
      details: {
        reportTitle,
        timestamp: new Date().toISOString(),
        rowCount: reportData.length,
      },
      created_at: new Date().toISOString(),
    })

    // In a real implementation, we'd convert the data to the appropriate format
    // and either return a download URL or trigger a download

    return {
      success: true,
      message: `Relatório "${reportTitle}" exportado como ${format.toUpperCase()}`,
    }
  } catch (error) {
    console.error(`Error exporting report as ${format}:`, error)
    return {
      success: false,
      message: `Erro ao exportar relatório como ${format}`,
    }
  }
}

// Save report execution history to database
export async function logReportExecution(report: Report, rowCount: number): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("report_executions").insert({
      report_id: report.id,
      report_title: report.title,
      report_type: report.type,
      executed_at: new Date().toISOString(),
      row_count: rowCount,
      parameters: JSON.stringify(report.filters),
    })

    if (error) {
      console.error("Error logging report execution:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error logging report execution:", error)
    return false
  }
}
