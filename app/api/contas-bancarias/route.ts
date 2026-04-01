import { NextResponse } from "next/server"
import { createClient } from "@/lib/mysql/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("contas_bancarias")
      .select("*")
      .eq("ativa", true)
      .order("nome", { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Erro ao buscar contas bancárias:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, banco, agencia, conta, tipo, cor } = body

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("contas_bancarias")
      .insert({ 
        nome, 
        banco: banco || null,
        agencia: agencia || null,
        conta: conta || null,
        tipo: tipo || "Corrente",
        cor: cor || "#3B82F6"
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro ao criar conta bancária:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, nome, banco, agencia, conta, tipo, cor, ativa } = body

    if (!id || !nome) {
      return NextResponse.json(
        { error: "ID e nome são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("contas_bancarias")
      .update({ 
        nome, 
        banco: banco || null,
        agencia: agencia || null,
        conta: conta || null,
        tipo: tipo || "Corrente",
        cor: cor || "#3B82F6",
        ativa: ativa !== false
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro ao atualizar conta bancária:", error)
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
    // Soft delete - apenas desativa
    const { error } = await supabase
      .from("contas_bancarias")
      .update({ ativa: false })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Erro ao excluir conta bancária:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
