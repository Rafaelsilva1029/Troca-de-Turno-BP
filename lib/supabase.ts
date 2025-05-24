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

// Tipo para as métricas do sistema
export type SystemMetric = {
  id?: number
  cpu_usage: number
  memory_usage: number
  network_status: number
  system_status: number
  security_level: number
  timestamp?: string
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

// Funções para métricas do sistema
export async function fetchSystemMetrics(limit = 24) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("system_metrics")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching system metrics:", error)
    throw error
  }

  return data || []
}

export async function fetchLatestSystemMetric() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("system_metrics")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching latest system metric:", error)
    // Se não houver métricas, retorne valores padrão em vez de lançar um erro
    if (error.code === "PGRST116") {
      return {
        cpu_usage: 42,
        memory_usage: 68,
        network_status: 92,
        system_status: 85,
        security_level: 75,
        timestamp: new Date().toISOString(),
      }
    }
    throw error
  }

  return data
}

export async function saveSystemMetric(metric: SystemMetric) {
  const supabase = getSupabaseClient()

  const metricToSave = {
    ...metric,
    timestamp: new Date().toISOString(),
  }

  const { error } = await supabase.from("system_metrics").insert(metricToSave)

  if (error) {
    console.error("Error saving system metric:", error)
    throw error
  }

  return true
}

// Tipo para alertas do sistema
export type SystemAlert = {
  id?: number
  title: string
  description: string
  type: "info" | "warning" | "error" | "success" | "update"
  timestamp?: string
}

// Funções para alertas do sistema
export async function fetchSystemAlerts(limit = 10) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("system_alerts")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching system alerts:", error)
    throw error
  }

  return data || []
}

export async function saveSystemAlert(alert: SystemAlert) {
  const supabase = getSupabaseClient()

  const alertToSave = {
    ...alert,
    timestamp: new Date().toISOString(),
  }

  const { error } = await supabase.from("system_alerts").insert(alertToSave)

  if (error) {
    console.error("Error saving system alert:", error)
    throw error
  }

  return true
}

export async function deleteSystemAlert(id: number) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("system_alerts").delete().eq("id", id)

  if (error) {
    console.error("Error deleting system alert:", error)
    throw error
  }

  return true
}

// Adicionar os tipos e funções para o sistema de lembretes após as funções existentes

// Tipos para o sistema de lembretes
export type ReminderPriority = "baixa" | "media" | "alta" | "urgente"
export type ReminderStatus = "pendente" | "concluido" | "atrasado" | "em-andamento" | "arquivado"

// Interface para mapear entre camelCase (código) e snake_case (banco de dados)
interface ReminderDB {
  id: string
  title: string
  description: string
  due_date: string // Nome no banco de dados
  due_time: string // Nome no banco de dados
  priority: ReminderPriority
  status: ReminderStatus
  category: string
  assigned_to?: string // Nome no banco de dados
  created_at: string // Nome no banco de dados
  updated_at: string // Nome no banco de dados
  completed_at?: string // Nome no banco de dados
  notified?: boolean
  one_hour_notified?: boolean // Nome no banco de dados
  user_id?: string // Nome no banco de dados
}

export type Reminder = {
  id: string
  title: string
  description: string
  dueDate: string // Nome no código
  dueTime: string // Nome no código
  priority: ReminderPriority
  status: ReminderStatus
  category: string
  assignedTo?: string // Nome no código
  createdAt: string // Nome no código
  updatedAt: string // Nome no código
  completedAt?: string // Nome no código
  notified?: boolean
  oneHourNotified?: boolean // Nome no código
  userId?: string // Nome no código
}

// Função para converter de snake_case (DB) para camelCase (código)
function dbToReminderModel(dbReminder: ReminderDB): Reminder {
  return {
    id: dbReminder.id,
    title: dbReminder.title,
    description: dbReminder.description,
    dueDate: dbReminder.due_date,
    dueTime: dbReminder.due_time,
    priority: dbReminder.priority as ReminderPriority,
    status: dbReminder.status as ReminderStatus,
    category: dbReminder.category,
    assignedTo: dbReminder.assigned_to,
    createdAt: dbReminder.created_at,
    updatedAt: dbReminder.updated_at,
    completedAt: dbReminder.completed_at,
    notified: dbReminder.notified,
    oneHourNotified: dbReminder.one_hour_notified,
    userId: dbReminder.user_id,
  }
}

// Função para converter de camelCase (código) para snake_case (DB)
function reminderModelToDB(reminder: Reminder): ReminderDB {
  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    due_date: reminder.dueDate,
    due_time: reminder.dueTime,
    priority: reminder.priority,
    status: reminder.status,
    category: reminder.category,
    assigned_to: reminder.assignedTo,
    created_at: reminder.createdAt,
    updated_at: reminder.updatedAt,
    completed_at: reminder.completedAt,
    notified: reminder.notified,
    one_hour_notified: reminder.oneHourNotified,
    user_id: reminder.userId,
  }
}

// Funções para interagir com os lembretes no Supabase
export async function fetchReminders() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .not("status", "eq", "arquivado")
    .order("due_date", { ascending: true })
    .order("due_time", { ascending: true })

  if (error) {
    console.error("Erro ao buscar lembretes:", error)
    throw error
  }

  // Converter de snake_case para camelCase
  return (data || []).map(dbToReminderModel)
}

export async function fetchArchivedReminders() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("status", "arquivado")
    .order("completed_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar lembretes arquivados:", error)
    throw error
  }

  // Converter de snake_case para camelCase
  return (data || []).map(dbToReminderModel)
}

export async function saveReminder(reminder: Reminder) {
  const supabase = getSupabaseClient()

  // Converter de camelCase para snake_case
  const reminderToSave = reminderModelToDB({
    ...reminder,
    updatedAt: new Date().toISOString(),
  })

  // Se o ID for uma string vazia ou não existir, é um novo lembrete
  if (!reminder.id || reminder.id === "") {
    // Gerar um ID único para novos lembretes
    reminderToSave.id = crypto.randomUUID()
    reminderToSave.created_at = new Date().toISOString()

    const { error } = await supabase.from("reminders").insert(reminderToSave)

    if (error) {
      console.error("Erro ao criar lembrete:", error)
      throw error
    }

    return dbToReminderModel(reminderToSave)
  } else {
    // Atualizar lembrete existente
    const { error } = await supabase.from("reminders").update(reminderToSave).eq("id", reminder.id)

    if (error) {
      console.error("Erro ao atualizar lembrete:", error)
      throw error
    }

    return dbToReminderModel(reminderToSave)
  }
}

export async function saveReminders(reminders: Reminder[]) {
  const supabase = getSupabaseClient()

  // Converter de camelCase para snake_case
  const remindersToSave = reminders.map((reminder) =>
    reminderModelToDB({
      ...reminder,
      updatedAt: new Date().toISOString(),
    }),
  )

  // Usar upsert para inserir ou atualizar em massa
  const { error } = await supabase.from("reminders").upsert(remindersToSave, { onConflict: "id" })

  if (error) {
    console.error("Erro ao salvar lembretes em massa:", error)
    throw error
  }

  return reminders
}

export async function deleteReminder(id: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("reminders").delete().eq("id", id)

  if (error) {
    console.error("Erro ao excluir lembrete:", error)
    throw error
  }

  return true
}

export async function archiveReminder(reminder: Reminder) {
  const supabase = getSupabaseClient()

  const reminderToArchive = reminderModelToDB({
    ...reminder,
    status: "arquivado" as ReminderStatus,
    completedAt: reminder.completedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const { error } = await supabase.from("reminders").update(reminderToArchive).eq("id", reminder.id)

  if (error) {
    console.error("Erro ao arquivar lembrete:", error)
    throw error
  }

  return dbToReminderModel(reminderToArchive)
}

export async function restoreReminder(id: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from("reminders")
    .update({
      status: "pendente",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Erro ao restaurar lembrete:", error)
    throw error
  }

  return true
}
