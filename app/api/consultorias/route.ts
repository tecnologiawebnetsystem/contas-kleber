import { createClient } from "@/lib/mysql/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: consultorias, error } = await supabase
      .from("consultorias")
      .select("*")
      .order("data_inicio", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar consultorias:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(consultorias)
  } catch (error) {
    console.error("[v0] Erro na API de consultorias:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { consultoria, cliente, tipo_contratacao, data_inicio } = body

    if (!consultoria || !cliente || !tipo_contratacao || !data_inicio) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    const { data: nova, error } = await supabase
      .from("consultorias")
      .insert({ consultoria, cliente, tipo_contratacao, data_inicio })

    if (error) {
      console.error("[v0] Erro ao inserir consultoria:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[v0] Erro na API de consultorias:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { id, consultoria, cliente, tipo_contratacao, data_inicio } = body

    if (!id || !consultoria || !cliente || !tipo_contratacao || !data_inicio) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    const { data: atualizada, error } = await supabase
      .from("consultorias")
      .update({ consultoria, cliente, tipo_contratacao, data_inicio })
      .eq("id", id)

    if (error) {
      console.error("[v0] Erro ao atualizar consultoria:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[v0] Erro na API de consultorias:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase
      .from("consultorias")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar consultoria:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro na API de consultorias:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
