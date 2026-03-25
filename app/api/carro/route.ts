import { createClient } from "@/lib/mysql/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: pagamentos, error } = await supabase
      .from("pagamentos_carro")
      .select("*")
      .order("data_pagamento", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar pagamentos do carro:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(pagamentos)
  } catch (error) {
    console.error("[v0] Erro na API de pagamentos do carro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { valor, data_pagamento, descricao, carro } = body

    if (!valor || !data_pagamento || !carro) {
      return NextResponse.json(
        { error: "Valor, data de pagamento e carro são obrigatórios" },
        { status: 400 }
      )
    }

    const { data: novoPagamento, error } = await supabase
      .from("pagamentos_carro")
      .insert({
        valor: Number(valor),
        data_pagamento,
        descricao: descricao || "Pagamento do carro",
        carro,
      })

    if (error) {
      console.error("[v0] Erro ao inserir pagamento do carro:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(novoPagamento, { status: 201 })
  } catch (error) {
    console.error("[v0] Erro na API de pagamentos do carro:", error)
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
      .from("pagamentos_carro")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar pagamento do carro:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro na API de pagamentos do carro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
