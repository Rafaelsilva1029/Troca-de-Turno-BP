import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializa o cliente Supabase com variáveis de ambiente
// Na produção, estas variáveis seriam configuradas no painel do Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-url.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key"

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data, error } = await supabase.from("pendencias").select("*").order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching pendencias:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validação básica
    if (!body || !Array.isArray(body.pendencias)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Primeiro, excluir registros existentes da categoria, se especificado
    if (body.category) {
      await supabase.from("pendencias").delete().eq("category", body.category)
    }

    // Inserir novos registros
    const { data, error } = await supabase.from("pendencias").insert(
      body.pendencias.map((item: string) => ({
        category: body.category,
        description: item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error saving pendencias:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json({ error: "Category parameter is required" }, { status: 400 })
    }

    const { error } = await supabase.from("pendencias").delete().eq("category", category)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting pendencias:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
