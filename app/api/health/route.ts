import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"

export async function GET() {
  try {
    // Check if we can connect to Supabase
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("pendencias").select("id").limit(1)

    const dbStatus = error ? "error" : "connected"

    // Return health status
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: dbStatus,
      version: "1.0.0",
    })
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        version: "1.0.0",
      },
      { status: 500 },
    )
  }
}
