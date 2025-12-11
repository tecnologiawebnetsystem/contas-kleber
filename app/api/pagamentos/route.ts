import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Adicionar pagamento
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: conta, error: contaError } = await supabase
      .from("contas")
      .select("valor")
      .eq("id", body.contaId)
      .single()

    if (contaError) throw contaError

    const { data: saldoAtual, error: saldoError } = await supabase.from("saldo").select("*").single()

    if (saldoError) throw saldoError

    if (Number(saldoAtual.valor) < Number(conta.valor)) {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })
    }

    const novoSaldo = Number(saldoAtual.valor) - Number(conta.valor)

    const { error: updateSaldoError } = await supabase
      .from("saldo")
      .update({ valor: novoSaldo, updated_at: new Date().toISOString() })
      .eq("id", saldoAtual.id)

    if (updateSaldoError) throw updateSaldoError

    // Adicionar pagamento
    const { data, error } = await supabase
      .from("pagamentos")
      .insert({
        conta_id: body.contaId,
        mes: body.mes,
        ano: body.ano,
        data_pagamento: body.dataPagamento,
        anexo: body.anexo,
      })
      .select()
      .single()

    if (error) throw error

    const { error: transacaoError } = await supabase.from("transacoes").insert({
      tipo: "debito",
      valor: Number(conta.valor),
      descricao: `Pagamento: ${body.contaNome || "Conta"}`,
      referencia_id: data.id,
    })

    if (transacaoError) throw transacaoError

    return NextResponse.json({ ...data, novoSaldo })
  } catch (error) {
    console.error("[v0] Erro ao adicionar pagamento:", error)
    return NextResponse.json({ error: "Erro ao adicionar pagamento" }, { status: 500 })
  }
}

// DELETE - Remover pagamento
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const contaId = searchParams.get("contaId")
    const mes = searchParams.get("mes")
    const ano = searchParams.get("ano")

    if (!contaId || mes === null || ano === null) {
      return NextResponse.json({ error: "Parâmetros incompletos" }, { status: 400 })
    }

    const { data: pagamento, error: pagamentoError } = await supabase
      .from("pagamentos")
      .select("id, conta_id")
      .eq("conta_id", contaId)
      .eq("mes", Number.parseInt(mes))
      .eq("ano", Number.parseInt(ano))
      .single()

    if (pagamentoError) throw pagamentoError

    const { data: conta, error: contaError } = await supabase.from("contas").select("valor").eq("id", contaId).single()

    if (contaError) throw contaError

    const { data: saldoAtual, error: saldoError } = await supabase.from("saldo").select("*").single()

    if (saldoError) throw saldoError

    const novoSaldo = Number(saldoAtual.valor) + Number(conta.valor)

    const { error: updateSaldoError } = await supabase
      .from("saldo")
      .update({ valor: novoSaldo, updated_at: new Date().toISOString() })
      .eq("id", saldoAtual.id)

    if (updateSaldoError) throw updateSaldoError

    // Deletar pagamento
    const { error } = await supabase
      .from("pagamentos")
      .delete()
      .eq("conta_id", contaId)
      .eq("mes", Number.parseInt(mes))
      .eq("ano", Number.parseInt(ano))

    if (error) throw error

    await supabase.from("transacoes").delete().eq("referencia_id", pagamento.id)

    return NextResponse.json({ success: true, novoSaldo })
  } catch (error) {
    console.error("[v0] Erro ao remover pagamento:", error)
    return NextResponse.json({ error: "Erro ao remover pagamento" }, { status: 500 })
  }
}
