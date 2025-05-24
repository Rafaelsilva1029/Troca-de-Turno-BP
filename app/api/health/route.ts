import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"

export async function GET() {
  try {
    // Verificar conexão com o banco de dados
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("health_check").select("*").limit(1)

    if (error) {
      throw new Error(`Database connection error: ${error.message}`)
    }

    // Atualizar o status na tabela health_check
    await supabase
      .from("health_check")
      .update({ status: "ok", timestamp: new Date().toISOString() })
      .eq("id", data?.[0]?.id || 1)

    // Retornar status OK
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    })
  } catch (error) {
    console.error("Health check failed:", error)

    // Retornar erro
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
