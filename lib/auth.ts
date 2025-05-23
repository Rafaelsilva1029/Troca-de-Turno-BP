import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export type UserRole = "admin" | "manager" | "operator" | "viewer"

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  department?: string
  avatarUrl?: string
  isActive: boolean
}

/**
 * Cria um cliente Supabase para o servidor com cookies
 */
export function createServerSupabaseClient(request?: NextRequest) {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

/**
 * Obtém o usuário atual a partir do token de autenticação
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("Error getting session:", sessionError)
      return null
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (userError || !userData) {
      console.error("Error getting user data:", userError)
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name,
      role: userData.role as UserRole,
      department: userData.department,
      avatarUrl: userData.avatar_url,
      isActive: userData.is_active,
    }
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 4,
    manager: 3,
    operator: 2,
    viewer: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Middleware para proteger rotas que requerem autenticação
 */
export async function authMiddleware(request: NextRequest) {
  const supabase = createServerSupabaseClient(request)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Se não houver sessão, redirecionar para login
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectTo", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Verificar se o usuário está ativo
  const { data: userData, error } = await supabase.from("users").select("is_active").eq("id", session.user.id).single()

  if (error || !userData || !userData.is_active) {
    // Usuário inativo ou erro, fazer logout e redirecionar
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("error", "account_inactive")
    return NextResponse.redirect(url)
  }

  // Atualizar último login
  await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", session.user.id)

  return NextResponse.next()
}
