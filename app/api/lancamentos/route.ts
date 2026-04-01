import { createClient } from "@/lib/mysql/server"
import { getPool } from "@/lib/mysql"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const consultoriaId = searchParams.get("consultoria_id")

    let query = supabase
      .from("lancamentos_mensais")
      .select("*")
      .order("mes_referencia", { ascending: false })

    if (consultoriaId) {
      query = query.eq("consultoria_id", consultoriaId)
    }

    const { data: lancamentos, error } = await query

    if (error) {
      console.error("[v0] Erro ao buscar lançamentos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar itens de cada lançamento
    const lancamentosComItens = await Promise.all(
      (lancamentos || []).map(async (lanc) => {
        const pool = getPool()
        const [itens] = await pool.execute(
          `SELECT li.*, id_imp.nome as imposto_nome 
           FROM lancamento_itens li 
           JOIN impostos_descontos id_imp ON li.imposto_desconto_id = id_imp.id 
           WHERE li.lancamento_id = ?`,
          [lanc.id]
        )
        return { ...lanc, itens }
      })
    )

    return NextResponse.json(lancamentosComItens)
  } catch (error: any) {
    console.error("[v0] Erro na API de lançamentos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const pool = getPool()
    const body = await request.json()

    const { consultoria_id, mes_referencia, valor_bruto, itens, observacoes } = body

    if (!consultoria_id || !mes_referencia || !valor_bruto) {
      return NextResponse.json(
        { error: "Consultoria, mês de referência e valor bruto são obrigatórios" },
        { status: 400 }
      )
    }

    // Calcular valor líquido
    let totalDescontos = 0
    const itensCalculados = (itens || []).map((item: any) => {
      let resultado = 0
      if (item.tipo_valor === "percentual") {
        resultado = (valor_bruto * Number(item.valor_aplicado)) / 100
      } else {
        resultado = Number(item.valor_aplicado) || 0
      }
      totalDescontos += resultado
      return {
        ...item,
        resultado,
      }
    })

    const valor_liquido = valor_bruto - totalDescontos

    // Inserir lançamento (colunas corretas: salario_bruto, salario_liquido)
    const lancamentoId = crypto.randomUUID()
    await pool.execute(
      `INSERT INTO lancamentos_mensais (id, consultoria_id, mes_referencia, salario_bruto, salario_liquido, observacoes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [lancamentoId, consultoria_id, mes_referencia, valor_bruto, valor_liquido, observacoes || null]
    )

    // Inserir itens (colunas corretas: nome, tipo, tipo_valor, valor_aplicado, resultado)
    for (const item of itensCalculados) {
      const itemId = crypto.randomUUID()
      await pool.execute(
        `INSERT INTO lancamento_itens (id, lancamento_id, imposto_desconto_id, nome, tipo, tipo_valor, valor_aplicado, resultado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          lancamentoId,
          item.imposto_desconto_id,
          item.nome || "",
          item.tipo || "desconto",
          item.tipo_valor || "percentual",
          item.valor_aplicado || 0,
          item.resultado,
        ]
      )
    }

    // Retornar lançamento com itens
    const [lancamentoRows] = await pool.execute(
      "SELECT *, salario_bruto as valor_bruto, salario_liquido as valor_liquido FROM lancamentos_mensais WHERE id = ?",
      [lancamentoId]
    )
    const [itensRows] = await pool.execute(
      `SELECT li.*, id_imp.nome as imposto_nome 
       FROM lancamento_itens li 
       JOIN impostos_descontos id_imp ON li.imposto_desconto_id = id_imp.id 
       WHERE li.lancamento_id = ?`,
      [lancamentoId]
    )

    return NextResponse.json(
      { ...(lancamentoRows as any[])[0], itens: itensRows },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[v0] Erro na API de lançamentos:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const pool = getPool()
    const body = await request.json()

    const { id, valor_bruto, itens, observacoes } = body

    if (!id || !valor_bruto) {
      return NextResponse.json(
        { error: "ID e valor bruto são obrigatórios" },
        { status: 400 }
      )
    }

    // Calcular valor líquido
    let totalDescontos = 0
    const itensCalculados = (itens || []).map((item: any) => {
      let resultado = 0
      if (item.tipo_valor === "percentual") {
        resultado = (valor_bruto * Number(item.valor_aplicado)) / 100
      } else {
        resultado = Number(item.valor_aplicado) || 0
      }
      totalDescontos += resultado
      return { ...item, resultado }
    })

    const valor_liquido = valor_bruto - totalDescontos

    // Atualizar lançamento (colunas corretas: salario_bruto, salario_liquido)
    await pool.execute(
      `UPDATE lancamentos_mensais 
       SET salario_bruto = ?, salario_liquido = ?, observacoes = ?, updated_at = NOW()
       WHERE id = ?`,
      [valor_bruto, valor_liquido, observacoes || null, id]
    )

    // Remover itens antigos e inserir novos
    await pool.execute("DELETE FROM lancamento_itens WHERE lancamento_id = ?", [id])

    for (const item of itensCalculados) {
      const itemId = crypto.randomUUID()
      await pool.execute(
        `INSERT INTO lancamento_itens (id, lancamento_id, imposto_desconto_id, nome, tipo, tipo_valor, valor_aplicado, resultado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          id,
          item.imposto_desconto_id,
          item.nome || "",
          item.tipo || "desconto",
          item.tipo_valor || "percentual",
          item.valor_aplicado || 0,
          item.resultado,
        ]
      )
    }

    // Retornar lançamento atualizado
    const [lancamentoRows] = await pool.execute(
      "SELECT *, salario_bruto as valor_bruto, salario_liquido as valor_liquido FROM lancamentos_mensais WHERE id = ?",
      [id]
    )
    const [itensRows] = await pool.execute(
      `SELECT li.*, id_imp.nome as imposto_nome 
       FROM lancamento_itens li 
       JOIN impostos_descontos id_imp ON li.imposto_desconto_id = id_imp.id 
       WHERE li.lancamento_id = ?`,
      [id]
    )

    return NextResponse.json({ ...(lancamentoRows as any[])[0], itens: itensRows })
  } catch (error: any) {
    console.error("[v0] Erro na API de lançamentos:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
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

    // Delete cascade já remove os itens
    const { error } = await supabase
      .from("lancamentos_mensais")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar lançamento:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Erro na API de lançamentos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
