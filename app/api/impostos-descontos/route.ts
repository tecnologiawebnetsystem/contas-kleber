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

    if (tipoAplicacao && tipoAplicacao !== "Ambos") {
      // Buscar registros específicos do tipo ou que se aplicam a ambos (campo: aplicavel_a)
      const result1 = await supabase
        .from("impostos_descontos")
        .select("*")
        .eq("ativo", true)
        .eq("aplicavel_a", tipoAplicacao)
        .order("nome", { ascending: true })

      const result2 = await supabase
        .from("impostos_descontos")
        .select("*")
        .eq("ativo", true)
        .eq("aplicavel_a", "Ambos")
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

    // Aceita tanto nomes novos quanto legados
    const nome = body.nome
    const tipo = body.tipo || "desconto"
    const aplicavel_a = body.aplicavel_a || body.tipo_aplicacao || "Ambos"
    const tipo_valor = body.tipo_valor || body.tipo_calculo?.toLowerCase() || "percentual"
    const valor_padrao = body.valor_padrao || 0

    if (!nome || !aplicavel_a) {
      return NextResponse.json(
        { error: "Nome e tipo de aplicacao sao obrigatorios" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("impostos_descontos")
      .insert({
        nome,
        tipo,
        aplicavel_a,
        tipo_valor,
        valor_padrao,
        ativo: true,
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

    const { id, nome, tipo, aplicavel_a, tipo_valor, valor_padrao, ativo } = body
    // Suporte a nomes legados
    const aplicavel_a_final = aplicavel_a || body.tipo_aplicacao
    const tipo_valor_final = tipo_valor || (body.tipo_calculo ? body.tipo_calculo.toLowerCase() : undefined)

    if (!id) {
      return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (nome !== undefined) updateData.nome = nome
    if (tipo !== undefined) updateData.tipo = tipo
    if (aplicavel_a_final !== undefined) updateData.aplicavel_a = aplicavel_a_final
    if (tipo_valor_final !== undefined) updateData.tipo_valor = tipo_valor_final
    if (valor_padrao !== undefined) updateData.valor_padrao = valor_padrao
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
