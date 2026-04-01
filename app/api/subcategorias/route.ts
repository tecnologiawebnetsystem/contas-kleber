import { NextResponse } from "next/server"
import { createClient } from "@/lib/mysql/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("subcategorias")
      .select("*")
      .order("categoria", { ascending: true })
      .order("nome", { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Erro ao buscar subcategorias:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { categoria, nome } = body

    if (!categoria || !nome) {
      return NextResponse.json(
        { error: "Categoria e nome são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("subcategorias")
      .insert({ categoria, nome })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro ao criar subcategoria:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
