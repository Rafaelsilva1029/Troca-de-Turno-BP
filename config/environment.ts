/**
 * Configurações de ambiente para a aplicação
 * Centraliza todas as variáveis de ambiente e configurações em um único lugar
 */

// Configurações do Supabase
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
}

// Configurações da aplicação
export const appConfig = {
  name: "Branco Peres Agribusiness",
  description: "Sistema de Gestão de Operações Agrícolas",
  version: "1.0.0",
  environment: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
}

// Configurações de autenticação
export const authConfig = {
  cookieName: "bp-auth-token",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  },
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
}

// Configurações de recursos
export const featureFlags = {
  enableNotifications: true,
  enableOfflineMode: true,
  enableAnalytics: process.env.NODE_ENV === "production",
  enableDebugMode: process.env.NODE_ENV !== "production",
  maintenanceMode: false,
}

// Configurações de logs
export const loggingConfig = {
  level: process.env.NODE_ENV === "production" ? "error" : "debug",
  enableConsole: process.env.NODE_ENV !== "production",
  enableRemote: process.env.NODE_ENV === "production",
}
