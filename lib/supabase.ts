import { createClient } from "@supabase/supabase-js"

// Singleton pattern for Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anonymous Key is missing")
    throw new Error("Supabase environment variables are not set")
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Tipos para as tabelas do Supabase
export type Pendencia = {
  id: number
  category: string
  description: string
  created_at: string
  updated_at: string
}

export type PendenciaLiberada = {
  id: number
  category: string
  description: string
  released_at: string
  equipment_id: string
  released_by: string
  created_at: string
  updated_at: string
}

export type ProgramacaoTurno = {
  id: number
  item_id: string
  content: string
  created_at: string
  updated_at: string
}

export type VeiculoLogistica = {
  id: number
  item_id: string
  frota: string
  status: string
  created_at: string
  updated_at: string
}

// Funções auxiliares para interagir com o Supabase
export async function fetchPendencias() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("pendencias").select("*")
  if (error) throw error
  return data || []
}

export async function savePendencias(category: string, items: string[]) {
  const supabase = getSupabaseClient()

  // First, delete all existing pendencias for this category
  const { error: deleteError } = await supabase.from("pendencias").delete().eq("category", category)
  if (deleteError) throw deleteError

  // Then, insert the new ones
  if (items.length > 0) {
    const pendenciasToInsert = items
      .filter((item) => item.trim() !== "")
      .map((description) => ({
        category,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

    if (pendenciasToInsert.length > 0) {
      const { error: insertError } = await supabase.from("pendencias").insert(pendenciasToInsert)
      if (insertError) throw insertError
    }
  }

  return true
}

// Função para liberar uma pendência
export async function liberarPendencia(pendencia: {
  category: string
  description: string
  released_by: string
  equipment_id: string
}) {
  const supabase = getSupabaseClient()

  // Insert into pendencias_liberadas
  const { error: insertError } = await supabase.from("pendencias_liberadas").insert({
    category: pendencia.category,
    description: pendencia.description,
    released_by: pendencia.released_by,
    equipment_id: pendencia.equipment_id,
    released_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (insertError) throw insertError

  // Delete from pendencias
  const { error: deleteError } = await supabase
    .from("pendencias")
    .delete()
    .eq("category", pendencia.category)
    .eq("description", pendencia.description)
  if (deleteError) throw deleteError

  return true
}

// Função para buscar pendências liberadas
export async function fetchPendenciasLiberadas() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("pendencias_liberadas")
    .select("*")
    .order("released_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchProgramacaoTurno() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("programacao_turno").select("*").order("item_id", { ascending: true })
  if (error) throw error
  return data || []
}

export async function saveProgramacaoTurno(items: { id: string; content: string }[]) {
  const supabase = getSupabaseClient()

  // Primeiro, buscar os IDs existentes para saber quais excluir
  const { data: existingItems, error: fetchError } = await supabase.from("programacao_turno").select("item_id")

  if (fetchError) {
    console.error("Error fetching existing programacao_turno:", fetchError)
    throw fetchError
  }

  // Obter os IDs dos itens existentes
  const existingIds = existingItems?.map((item) => item.item_id) || []

  // Obter os IDs dos novos itens
  const newIds = items.map((item) => item.id)

  // Encontrar IDs que existem no banco mas não estão nos novos itens (para excluir)
  const idsToDelete = existingIds.filter((id) => !newIds.includes(id))

  // Se houver IDs para excluir, excluí-los
  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase.from("programacao_turno").delete().in("item_id", idsToDelete) // Usando cláusula WHERE com IN

    if (deleteError) {
      console.error("Error deleting programacao_turno:", deleteError)
      throw deleteError
    }
  }

  // Para cada item, atualizar se existir ou inserir se não existir
  for (const item of items) {
    if (existingIds.includes(item.id)) {
      // Atualizar item existente
      const { error: updateError } = await supabase
        .from("programacao_turno")
        .update({ content: item.content })
        .eq("item_id", item.id) // Usando cláusula WHERE

      if (updateError) {
        console.error(`Error updating programacao_turno item ${item.id}:`, updateError)
        throw updateError
      }
    } else {
      // Inserir novo item
      const { error: insertError } = await supabase
        .from("programacao_turno")
        .insert({ item_id: item.id, content: item.content })

      if (insertError) {
        console.error(`Error inserting programacao_turno item ${item.id}:`, insertError)
        throw insertError
      }
    }
  }
}

export async function fetchVeiculosLogistica() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("veiculos_logistica").select("*")
  if (error) throw error
  return data || []
}

export async function saveVeiculosLogistica(veiculos: any[]) {
  const supabase = getSupabaseClient()

  // First, delete all existing veiculos
  const { error: deleteError } = await supabase.from("veiculos_logistica").delete()
  if (deleteError) throw deleteError

  // Then, insert the new ones
  if (veiculos.length > 0) {
    const veiculosToInsert = veiculos.map((veiculo) => ({
      ...veiculo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from("veiculos_logistica").insert(veiculosToInsert)
    if (insertError) throw insertError
  }

  return true
}

// Report functions
export async function generatePendenciasReport() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("pendencias").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchSavedReports() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("saved_reports").select("*").order("updatedAt", { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveReport(report: any) {
  const supabase = getSupabaseClient()

  // Process dates for storage
  const processedReport = {
    ...report,
    filters: {
      ...report.filters,
      startDate:
        typeof report.filters.startDate === "object"
          ? report.filters.startDate.toISOString()
          : report.filters.startDate,
      endDate:
        typeof report.filters.endDate === "object" ? report.filters.endDate.toISOString() : report.filters.endDate,
    },
  }

  const { error } = await supabase.from("saved_reports").upsert(processedReport, {
    onConflict: "id",
    ignoreDuplicates: false,
  })
  if (error) throw error
  return true
}

export async function deleteReport(reportId: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("saved_reports").delete().eq("id", reportId)
  if (error) throw error
  return true
}

export async function logReportExecution(reportExecution: any) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("report_executions").insert(reportExecution)
  if (error) throw error
  return true
}

export async function logEvent(event: string, details: any) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("logs").insert({
    event,
    details,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
  return true
}
