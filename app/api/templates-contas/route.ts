import { NextResponse } from "next/server"
import { createClient } from "@/lib/mysql/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("templates_contas")
      .select("*")
      .order("nome", { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Erro ao buscar templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, tipo, categoria, subcategoria, fornecedor, valor_padrao } = body

    if (!nome || !tipo || !categoria) {
      return NextResponse.json(
        { error: "Nome, tipo e categoria são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("templates_contas")
      .insert({ 
        nome, 
        tipo, 
        categoria, 
        subcategoria: subcategoria || null,
        fornecedor: fornecedor || null,
        valor_padrao: valor_padrao || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro ao criar template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("templates_contas")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Erro ao excluir template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
