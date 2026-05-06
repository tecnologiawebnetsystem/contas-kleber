import { NextResponse } from "next/server"
import { query, insert, removeWhere } from "@/lib/mysql"

// GET - Listar depositos de poupanca
export async function GET() {
  try {
    const rows = await query(
      "SELECT id, nome, valor, data_gasto, created_at FROM contas WHERE tipo = ? ORDER BY created_at DESC",
      ["poupanca"]
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    console.error("[v0] Erro poupanca GET:", error?.message)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

// POST - Adicionar deposito de poupanca
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, valor } = body

    if (!nome || !valor) {
      return NextResponse.json({ error: "Nome e valor sao obrigatorios" }, { status: 400 })
    }

    const hoje = new Date().toISOString().split("T")[0]

    // 1. Inserir na tabela contas
    const conta = await insert("contas", {
      nome,
      valor: parseFloat(valor),
      tipo: "poupanca",
      vencimento: new Date().getDate(),
      categoria: "Poupanca",
      data_gasto: hoje,
    })

    if (!conta) {
      return NextResponse.json({ error: "Erro ao inserir deposito" }, { status: 500 })
    }

    // 2. Inserir pagamento — usa INSERT IGNORE para nao falhar em duplicidade
    try {
      const pool = (await import("@/lib/mysql")).getPool()
      await pool.execute(
        "INSERT IGNORE INTO pagamentos (id, conta_id, mes, ano, data_pagamento) VALUES (UUID(), ?, ?, ?, ?)",
        [conta.id, new Date().getMonth() + 1, new Date().getFullYear(), hoje]
      )
    } catch (e: any) {
      console.error("[v0] Aviso pagamento poupanca:", e?.message)
    }

    return NextResponse.json(conta)
  } catch (error: any) {
    console.error("[v0] Erro poupanca POST:", error?.message)
    return NextResponse.json({ error: error?.message || "Erro interno" }, { status: 500 })
  }
}

// DELETE - Excluir deposito de poupanca
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID obrigatorio" }, { status: 400 })
    }

    // Remover dependentes primeiro
    try {
      await removeWhere("pagamentos", { conta_id: id })
    } catch (e: any) {
      console.error("[v0] Aviso ao remover pagamentos poupanca:", e?.message)
    }

    await removeWhere("contas", { id })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Erro poupanca DELETE:", error?.message)
    return NextResponse.json({ error: error?.message || "Erro ao excluir" }, { status: 500 })
  }
}
