import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Adicionar pagamento
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validar mês (recebe 1-12, converte para 0-11 para o banco)
    const mesInput = Number.parseInt(body.mes)
    if (isNaN(mesInput) || mesInput < 1 || mesInput > 12) {
      return NextResponse.json({ error: `Mês inválido: ${body.mes}. Deve estar entre 1 e 12.` }, { status: 400 })
    }

    const mes = mesInput - 1 // Converte de 1-12 para 0-11

    // Validar ano
    const ano = Number.parseInt(body.ano)
    if (isNaN(ano) || ano < 2000 || ano > 2100) {
      return NextResponse.json({ error: `Ano inválido: ${body.ano}` }, { status: 400 })
    }

    const { data: conta, error: contaError } = await supabase
      .from("contas")
      .select("valor, tipo")
      .eq("id", body.contaId)
      .single()

    if (contaError) throw contaError

    const { data: saldoAtual, error: saldoError } = await supabase.from("saldo").select("*").single()

    if (saldoError) throw saldoError

    // Contas fixas, variáveis e gastos diários debitam do crédito
    // Poupança e Viagem são apenas controle, não debitam
    const tiposQueDebitam = ["fixa", "variavel", "gasto_diario"]
    const deveValidarSaldo = tiposQueDebitam.includes(conta.tipo)

    const novoSaldo = deveValidarSaldo ? Number(saldoAtual.valor) - Number(conta.valor) : Number(saldoAtual.valor)

    // Atualiza o saldo mesmo que fique negativo
    if (deveValidarSaldo) {
      const { error: updateSaldoError } = await supabase
        .from("saldo")
        .update({ valor: novoSaldo, updated_at: new Date().toISOString() })
        .eq("id", saldoAtual.id)

      if (updateSaldoError) throw updateSaldoError
    }

    const { data, error } = await supabase
      .from("pagamentos")
      .insert({
        conta_id: body.contaId,
        mes: mes,
        ano: ano,
        data_pagamento: body.dataPagamento,
        anexo: body.anexo,
      })
      .select()
      .single()

    if (error) throw error

    if (deveValidarSaldo) {
      const { error: transacaoError } = await supabase.from("transacoes").insert({
        tipo: "debito",
        valor: Number(conta.valor),
        descricao: `Pagamento: ${body.contaNome || "Conta"}`,
        referencia_id: data.id,
      })

      if (transacaoError) throw transacaoError
    }

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

    const mesConvertido = Number.parseInt(mes) - 1

    const { data: pagamento, error: pagamentoError } = await supabase
      .from("pagamentos")
      .select("id, conta_id")
      .eq("conta_id", contaId)
      .eq("mes", mesConvertido)
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
      .eq("mes", mesConvertido)
      .eq("ano", Number.parseInt(ano))

    if (error) throw error

    await supabase.from("transacoes").delete().eq("referencia_id", pagamento.id)

    return NextResponse.json({ success: true, novoSaldo })
  } catch (error) {
    console.error("[v0] Erro ao remover pagamento:", error)
    return NextResponse.json({ error: "Erro ao remover pagamento" }, { status: 500 })
  }
}
