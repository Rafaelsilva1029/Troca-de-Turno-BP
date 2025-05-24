import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { supabaseConfig } from "@/config/environment"
import type { Database } from "@/types/supabase"

// Singleton pattern para o cliente Supabase
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Retorna uma instância do cliente Supabase
 * Usa o padrão singleton para evitar múltiplas instâncias
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) return supabaseInstance

  const { url, anonKey } = supabaseConfig

  if (!url || !anonKey) {
    throw new Error("Supabase URL or Anonymous Key is missing")
  }

  supabaseInstance = createClient<Database>(url, anonKey)
  return supabaseInstance
}

/**
 * Retorna uma instância do cliente Supabase com a chave de serviço
 * Usar apenas no servidor para operações administrativas
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  const { url, serviceRoleKey } = supabaseConfig

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase URL or Service Role Key is missing")
  }

  return createClient<Database>(url, serviceRoleKey)
}

/**
 * Cria um cliente Supabase com um token de acesso específico
 * Útil para operações autenticadas no lado do cliente
 */
export function createSupabaseClientWithToken(accessToken: string): SupabaseClient<Database> {
  const { url, anonKey } = supabaseConfig

  if (!url || !anonKey) {
    throw new Error("Supabase URL or Anonymous Key is missing")
  }

  return createClient<Database>(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

/**
 * Verifica a conexão com o Supabase
 * Útil para testes de conectividade
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("health_check").select("*").limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Failed to check Supabase connection:", err)
    return false
  }
}
