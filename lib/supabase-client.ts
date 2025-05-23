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
      select: () => ({
        order: () => ({
          then: (callback: Function) => callback({ data: [], error: null }),
        }),
        eq: () => ({
          then: (callback: Function) => callback({ data: [], error: null }),
        }),
      }),
      insert: () => ({
        then: (callback: Function) => callback({ data: null, error: null }),
      }),
      update: () => ({
        eq: () => ({
          then: (callback: Function) => callback({ data: null, error: null }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          then: (callback: Function) => callback({ data: null, error: null }),
        }),
        in: () => ({
          then: (callback: Function) => callback({ data: null, error: null }),
        }),
      }),
      upsert: () => ({
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
