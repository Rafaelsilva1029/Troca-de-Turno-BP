import { createClient } from "@supabase/supabase-js"

// Singleton pattern for Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anonymous Key is missing")
    return createFallbackClient()
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return supabaseClient
}

// Create a fallback client for development or when environment variables are missing
function createFallbackClient() {
  console.warn("Using fallback Supabase client. Data operations will be simulated.")

  // Return a mock client that doesn't actually connect to Supabase
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        order: (column: string, options?: any) => ({
          then: (callback: Function) => callback({ data: [], error: null }),
          eq: (column: string, value: any) => ({
            then: (callback: Function) => callback({ data: [], error: null }),
          }),
          not: (column: string, operator: string, value: any) => ({
            order: (column: string, options?: any) => ({
              then: (callback: Function) => callback({ data: [], error: null }),
            }),
          }),
        }),
        eq: (column: string, value: any) => ({
          then: (callback: Function) => callback({ data: [], error: null }),
        }),
        not: (column: string, operator: string, value: any) => ({
          order: (column: string, options?: any) => ({
            order: (column: string, options?: any) => ({
              then: (callback: Function) => callback({ data: [], error: null }),
            }),
          }),
        }),
        then: (callback: Function) => callback({ data: [], error: null }),
      }),
      insert: (data: any) => ({
        then: (callback: Function) => callback({ data: null, error: null }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          then: (callback: Function) => callback({ data: null, error: null }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: (callback: Function) => callback({ data: null, error: null }),
        }),
        in: (column: string, values: any[]) => ({
          then: (callback: Function) => callback({ data: null, error: null }),
        }),
        then: (callback: Function) => callback({ data: null, error: null }),
      }),
      upsert: (data: any, options?: any) => ({
        then: (callback: Function) => callback({ data: null, error: null }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  } as any
}

// Server-side Supabase client (for API routes)
export function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Role Key is missing")
    return createFallbackClient()
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
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

// Funções auxiliares para interagir com o Supabase
export async function fetchPendencias() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("pendencias").select("*")

    if (error) {
      console.error("Error fetching pendencias:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching pendencias:", error)
    return []
  }
}

export async function savePendencias(category: string, items: string[]) {
  try {
    const supabase = getSupabaseClient()

    // First, delete all existing pendencias for this category
    const { error: deleteError } = await supabase.from("pendencias").delete().eq("category", category)

    if (deleteError) {
      console.error("Error deleting pendencias:", deleteError)
      return false
    }

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

        if (insertError) {
          console.error("Error inserting pendencias:", insertError)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error("Exception saving pendencias:", error)
    return false
  }
}

export async function fetchProgramacaoTurno() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("programacao_turno").select("*").order("item_id", { ascending: true })

    if (error) {
      console.error("Error fetching programacao_turno:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching programacao_turno:", error)
    return []
  }
}

export async function saveProgramacaoTurno(items: { id: string; content: string }[]) {
  try {
    const supabase = getSupabaseClient()

    // Primeiro, buscar os IDs existentes para saber quais excluir
    const { data: existingItems, error: fetchError } = await supabase.from("programacao_turno").select("item_id")

    if (fetchError) {
      console.error("Error fetching existing programacao_turno:", fetchError)
      return false
    }

    // Obter os IDs dos itens existentes
    const existingIds = existingItems?.map((item) => item.item_id) || []

    // Obter os IDs dos novos itens
    const newIds = items.map((item) => item.id)

    // Encontrar IDs que existem no banco mas não estão nos novos itens (para excluir)
    const idsToDelete = existingIds.filter((id) => !newIds.includes(id))

    // Se houver IDs para excluir, excluí-los
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase.from("programacao_turno").delete().in("item_id", idsToDelete)

      if (deleteError) {
        console.error("Error deleting programacao_turno:", deleteError)
        return false
      }
    }

    // Para cada item, atualizar se existir ou inserir se não existir
    for (const item of items) {
      if (existingIds.includes(item.id)) {
        // Atualizar item existente
        const { error: updateError } = await supabase
          .from("programacao_turno")
          .update({ content: item.content })
          .eq("item_id", item.id)

        if (updateError) {
          console.error(`Error updating programacao_turno item ${item.id}:`, updateError)
          return false
        }
      } else {
        // Inserir novo item
        const { error: insertError } = await supabase
          .from("programacao_turno")
          .insert({ item_id: item.id, content: item.content })

        if (insertError) {
          console.error(`Error inserting programacao_turno item ${item.id}:`, insertError)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error("Exception saving programacao_turno:", error)
    return false
  }
}

// Simplified functions for other operations
export async function fetchPendenciasLiberadas() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("pendencias_liberadas")
      .select("*")
      .order("released_at", { ascending: false })

    if (error) {
      console.error("Error fetching pendencias_liberadas:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching pendencias_liberadas:", error)
    return []
  }
}

export async function fetchVeiculosLogistica() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("veiculos_logistica").select("*")

    if (error) {
      console.error("Error fetching veiculos_logistica:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching veiculos_logistica:", error)
    return []
  }
}

export async function generatePendenciasReport() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("pendencias").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error generating pendencias report:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception generating pendencias report:", error)
    return []
  }
}

export async function fetchSavedReports() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("saved_reports").select("*").order("updatedAt", { ascending: false })

    if (error) {
      console.error("Error fetching saved reports:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching saved reports:", error)
    return []
  }
}

export async function logEvent(event: string, details: any) {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("logs").insert({
      event,
      details,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error logging event:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Exception logging event:", error)
    return false
  }
}

// Reminder types and functions
export type ReminderPriority = "baixa" | "media" | "alta" | "urgente"
export type ReminderStatus = "pendente" | "concluido" | "atrasado" | "em-andamento" | "arquivado"

// Interface for mapping between camelCase (code) and snake_case (database)
interface ReminderDB {
  id: string
  title: string
  description: string
  due_date: string
  due_time: string
  priority: ReminderPriority
  status: ReminderStatus
  category: string
  assigned_to?: string
  created_at: string
  updated_at: string
  completed_at?: string
  notified?: boolean
  one_hour_notified?: boolean
  user_id?: string
}

export type Reminder = {
  id: string
  title: string
  description: string
  dueDate: string
  dueTime: string
  priority: ReminderPriority
  status: ReminderStatus
  category: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  notified?: boolean
  oneHourNotified?: boolean
  userId?: string
}

// Conversion functions
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

// Reminder functions
export async function fetchReminders() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .not("status", "eq", "arquivado")
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true })

    if (error) {
      console.error("Error fetching reminders:", error)
      return []
    }

    return (data || []).map(dbToReminderModel)
  } catch (error) {
    console.error("Exception fetching reminders:", error)
    return []
  }
}

export async function fetchArchivedReminders() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("status", "arquivado")
      .order("completed_at", { ascending: false })

    if (error) {
      console.error("Error fetching archived reminders:", error)
      return []
    }

    return (data || []).map(dbToReminderModel)
  } catch (error) {
    console.error("Exception fetching archived reminders:", error)
    return []
  }
}

export async function saveReminder(reminder: Reminder) {
  try {
    const supabase = getSupabaseClient()

    const reminderToSave = reminderModelToDB({
      ...reminder,
      updatedAt: new Date().toISOString(),
    })

    if (!reminder.id || reminder.id === "") {
      reminderToSave.id = crypto.randomUUID()
      reminderToSave.created_at = new Date().toISOString()

      const { error } = await supabase.from("reminders").insert(reminderToSave)

      if (error) {
        console.error("Error creating reminder:", error)
        throw error
      }

      return dbToReminderModel(reminderToSave)
    } else {
      const { error } = await supabase.from("reminders").update(reminderToSave).eq("id", reminder.id)

      if (error) {
        console.error("Error updating reminder:", error)
        throw error
      }

      return dbToReminderModel(reminderToSave)
    }
  } catch (error) {
    console.error("Exception saving reminder:", error)
    throw error
  }
}

export async function saveReminders(reminders: Reminder[]) {
  try {
    const supabase = getSupabaseClient()

    const remindersToSave = reminders.map((reminder) =>
      reminderModelToDB({
        ...reminder,
        updatedAt: new Date().toISOString(),
      }),
    )

    const { error } = await supabase.from("reminders").upsert(remindersToSave, { onConflict: "id" })

    if (error) {
      console.error("Error saving reminders in bulk:", error)
      throw error
    }

    return reminders
  } catch (error) {
    console.error("Exception saving reminders in bulk:", error)
    throw error
  }
}

export async function deleteReminder(id: string) {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("reminders").delete().eq("id", id)

    if (error) {
      console.error("Error deleting reminder:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Exception deleting reminder:", error)
    throw error
  }
}

export async function archiveReminder(reminder: Reminder) {
  try {
    const supabase = getSupabaseClient()

    const reminderToArchive = reminderModelToDB({
      ...reminder,
      status: "arquivado" as ReminderStatus,
      completedAt: reminder.completedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const { error } = await supabase.from("reminders").update(reminderToArchive).eq("id", reminder.id)

    if (error) {
      console.error("Error archiving reminder:", error)
      throw error
    }

    return dbToReminderModel(reminderToArchive)
  } catch (error) {
    console.error("Exception archiving reminder:", error)
    throw error
  }
}

export async function restoreReminder(id: string) {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from("reminders")
      .update({
        status: "pendente",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error restoring reminder:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Exception restoring reminder:", error)
    throw error
  }
}

// Additional missing functions
export async function liberarPendencia(pendencia: {
  category: string
  description: string
  released_by: string
  equipment_id: string
}) {
  try {
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

    if (insertError) {
      console.error("Error inserting liberated pendencia:", insertError)
      throw insertError
    }

    // Delete from pendencias
    const { error: deleteError } = await supabase
      .from("pendencias")
      .delete()
      .eq("category", pendencia.category)
      .eq("description", pendencia.description)

    if (deleteError) {
      console.error("Error deleting pendencia:", deleteError)
      throw deleteError
    }

    return true
  } catch (error) {
    console.error("Exception liberating pendencia:", error)
    throw error
  }
}

export async function saveVeiculosLogistica(veiculos: any[]) {
  try {
    const supabase = getSupabaseClient()

    // First, delete all existing veiculos
    const { error: deleteError } = await supabase.from("veiculos_logistica").delete()

    if (deleteError) {
      console.error("Error deleting existing veiculos:", deleteError)
      return false
    }

    // Then, insert the new ones
    if (veiculos.length > 0) {
      const veiculosToInsert = veiculos.map((veiculo) => ({
        ...veiculo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase.from("veiculos_logistica").insert(veiculosToInsert)

      if (insertError) {
        console.error("Error inserting veiculos:", insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Exception saving veiculos logistica:", error)
    return false
  }
}

export async function saveReport(report: any) {
  try {
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

    if (error) {
      console.error("Error saving report:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Exception saving report:", error)
    throw error
  }
}

export async function deleteReport(reportId: string) {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("saved_reports").delete().eq("id", reportId)

    if (error) {
      console.error("Error deleting report:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Exception deleting report:", error)
    throw error
  }
}

export async function logReportExecution(reportExecution: any) {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("report_executions").insert(reportExecution)

    if (error) {
      console.error("Error logging report execution:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Exception logging report execution:", error)
    throw error
  }
}
