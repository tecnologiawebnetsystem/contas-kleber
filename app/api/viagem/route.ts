import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Listar depositos de viagem
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("contas")
      .select("id, nome, valor, data_gasto, created_at")
      .eq("tipo", "viagem")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar viagem:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Erro viagem GET:", error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

// POST - Adicionar deposito de viagem
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const hoje = new Date().toISOString().split("T")[0]

    const { data: conta, error: contaError } = await supabase
      .from("contas")
      .insert({
        nome: body.nome,
        valor: body.valor,
        tipo: "viagem",
        vencimento: new Date().getDate(),
        categoria: "Viagem",
        data_gasto: hoje,
      })
      .select()
      .single()

    if (contaError) {
      console.error("[v0] Erro insert conta viagem:", JSON.stringify(contaError))
      return NextResponse.json({ error: contaError.message }, { status: 500 })
    }

    const { error: pagError } = await supabase.from("pagamentos").insert({
      conta_id: conta.id,
      mes: new Date().getMonth(),
      ano: new Date().getFullYear(),
      data_pagamento: hoje,
    })

    if (pagError) {
      console.error("[v0] Erro insert pagamento viagem:", JSON.stringify(pagError))
    }

    const { data: saldoData } = await supabase.from("saldo").select("*").limit(1).single()
    if (saldoData) {
      const novoSaldo = Number(saldoData.valor) - Number(body.valor)
      await supabase
        .from("saldo")
        .update({ valor: novoSaldo, updated_at: new Date().toISOString() })
        .eq("id", saldoData.id)
    }

    await supabase.from("transacoes").insert({
      tipo: "debito",
      valor: body.valor,
      descricao: `Deposito para viagem: ${body.nome}`,
      referencia_id: conta.id,
      data_transacao: hoje,
    })

    return NextResponse.json(conta)
  } catch (error: any) {
    console.error("[v0] Erro viagem POST catch:", error?.message)
    return NextResponse.json({ error: error?.message || "Erro interno" }, { status: 500 })
  }
}
