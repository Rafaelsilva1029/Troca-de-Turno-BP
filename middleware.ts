import { type NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "./lib/auth"

export async function middleware(request: NextRequest) {
  // Rotas protegidas que requerem autenticação
  const protectedRoutes = ["/dashboard"]

  // Verificar se a rota atual está protegida
  const isProtectedRoute = protectedRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  // Log para debug
  console.log("Middleware - URL:", request.nextUrl.pathname)
  console.log("Middleware - Is Protected:", isProtectedRoute)

  if (isProtectedRoute) {
    return authMiddleware(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/protected/:path*"],
}
