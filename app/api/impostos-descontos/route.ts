import { createClient } from "@/lib/mysql/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const tipoAplicacao = searchParams.get("tipo_aplicacao")

    let query = supabase
      .from("impostos_descontos")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true })

    if (tipoAplicacao && tipoAplicacao !== "AMBOS") {
      // Buscar registros específicos do tipo ou que se aplicam a ambos
      const result1 = await supabase
        .from("impostos_descontos")
        .select("*")
        .eq("ativo", true)
        .eq("tipo_aplicacao", tipoAplicacao)
        .order("nome", { ascending: true })

      const result2 = await supabase
        .from("impostos_descontos")
        .select("*")
        .eq("ativo", true)
        .eq("tipo_aplicacao", "AMBOS")
        .order("nome", { ascending: true })

      const data = [...(result1.data || []), ...(result2.data || [])]
      return NextResponse.json(data)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Erro ao buscar impostos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro na API de impostos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { nome, tipo_aplicacao, tipo_calculo, valor_padrao, descricao } = body

    if (!nome || !tipo_aplicacao || !tipo_calculo) {
      return NextResponse.json(
        { error: "Nome, tipo de aplicação e tipo de cálculo são obrigatórios" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("impostos_descontos")
      .insert({
        nome,
        tipo_aplicacao,
        tipo_calculo,
        valor_padrao: valor_padrao || 0,
        descricao: descricao || null,
        ativo: true
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao inserir imposto:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Erro na API de impostos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { id, nome, tipo_aplicacao, tipo_calculo, valor_padrao, descricao, ativo } = body

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (nome !== undefined) updateData.nome = nome
    if (tipo_aplicacao !== undefined) updateData.tipo_aplicacao = tipo_aplicacao
    if (tipo_calculo !== undefined) updateData.tipo_calculo = tipo_calculo
    if (valor_padrao !== undefined) updateData.valor_padrao = valor_padrao
    if (descricao !== undefined) updateData.descricao = descricao
    if (ativo !== undefined) updateData.ativo = ativo

    const { data, error } = await supabase
      .from("impostos_descontos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao atualizar imposto:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro na API de impostos:", error)
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

    // Soft delete - apenas desativa
    const { error } = await supabase
      .from("impostos_descontos")
      .update({ ativo: false })
      .eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar imposto:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Erro na API de impostos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
