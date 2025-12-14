import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar todas as contas
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: contas, error: contasError } = await supabase
      .from("contas")
      .select("*")
      .order("created_at", { ascending: false })

    if (contasError) throw contasError

    // Buscar pagamentos para cada conta
    const { data: pagamentos, error: pagamentosError } = await supabase.from("pagamentos").select("*")

    if (pagamentosError) throw pagamentosError

    const contasComPagamentos = contas.map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      valor: Number(conta.valor),
      vencimento: conta.vencimento,
      tipo: conta.tipo,
      parcelas: conta.parcelas,
      dataInicio: conta.data_inicio,
      dataGasto: conta.data_gasto, // Converter data_gasto para dataGasto
      anexoDiario: conta.anexo_diario, // Converter anexo_diario para anexoDiario
      categoria: conta.categoria,
      createdAt: conta.created_at,
      updatedAt: conta.updated_at,
      pagamentos: pagamentos
        .filter((p) => p.conta_id === conta.id)
        .map((p) => ({
          mes: p.mes,
          ano: p.ano,
          pago: true,
          dataPagamento: p.data_pagamento,
          anexo: p.anexo,
        })),
    }))

    return NextResponse.json(contasComPagamentos)
  } catch (error) {
    console.error("[v0] Erro ao buscar contas:", error)
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 })
  }
}

// POST - Criar nova conta
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const contaData: any = {
      nome: body.nome,
      valor: body.valor,
      vencimento: body.vencimento,
      tipo: body.tipo,
      categoria: body.categoria || "Outros",
    }

    if (body.tipo === "parcelada") {
      contaData.parcelas = body.parcelas
      contaData.data_inicio = body.dataInicio
    }

    if (body.tipo === "diaria" || body.tipo === "poupanca" || body.tipo === "viagem") {
      contaData.data_gasto = body.dataGasto
      if (body.anexoDiario) {
        contaData.anexo_diario = body.anexoDiario
      }
    }

    const { data: conta, error: contaError } = await supabase.from("contas").insert(contaData).select().single()

    if (contaError) throw contaError

    if (body.tipo === "diaria" || body.tipo === "poupanca" || body.tipo === "viagem") {
      const dataGasto = new Date(body.dataGasto)
      const mes = dataGasto.getMonth()
      const ano = dataGasto.getFullYear()

      const pagamentoData: any = {
        conta_id: conta.id,
        mes: mes,
        ano: ano,
        data_pagamento: body.dataGasto,
      }

      if (body.anexoDiario) {
        pagamentoData.anexo = body.anexoDiario
      }

      const { error: pagamentoError } = await supabase.from("pagamentos").insert(pagamentoData)

      if (pagamentoError) throw pagamentoError

      // Buscar saldo atual
      const { data: saldoData, error: saldoError } = await supabase.from("saldo").select("*").single()

      if (saldoError) throw saldoError

      const novoSaldo =
        body.tipo === "poupanca" || body.tipo === "viagem"
          ? Number(saldoData.valor) - Number(body.valor) // Deduz do crédito disponível
          : Number(saldoData.valor) - Number(body.valor) // Gasto diário

      // Atualizar saldo
      const { error: updateSaldoError } = await supabase
        .from("saldo")
        .update({ valor: novoSaldo, updated_at: new Date().toISOString() })
        .eq("id", saldoData.id)

      if (updateSaldoError) throw updateSaldoError

      const { error: transacaoError } = await supabase.from("transacoes").insert({
        tipo: "debito", // Todas deduzem do crédito disponível
        valor: body.valor,
        descricao:
          body.tipo === "poupanca"
            ? `Depósito na poupança: ${body.nome}`
            : body.tipo === "viagem"
              ? `Depósito para viagem: ${body.nome}`
              : `Gasto diário: ${body.nome}`,
        referencia_id: conta.id,
        data_transacao: body.dataGasto,
      })

      if (transacaoError) throw transacaoError
    }

    return NextResponse.json(conta)
  } catch (error) {
    console.error("[v0] Erro ao criar conta:", error)
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
  }
}

// DELETE - Deletar conta
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    const { error } = await supabase.from("contas").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro ao deletar conta:", error)
    return NextResponse.json({ error: "Erro ao deletar conta" }, { status: 500 })
  }
}
