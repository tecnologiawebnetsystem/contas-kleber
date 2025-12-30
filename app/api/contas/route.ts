import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar todas as contas com filtros
export async function GET(request: Request) {
  try {
    console.log("[v0] Iniciando busca de contas")
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const mesAno = searchParams.get("mes")
    const diaEspecifico = searchParams.get("dia")
    const tipoFiltro = searchParams.get("tipo")
    const categoriaFiltro = searchParams.get("categoria")
    const contaIdFiltro = searchParams.get("conta_id")
    const statusFiltro = searchParams.get("status")

    let query = supabase.from("contas").select("*").order("created_at", { ascending: false })

    // Aplicar filtro de tipo
    if (tipoFiltro && tipoFiltro !== "todos") {
      query = query.eq("tipo", tipoFiltro)
    }

    // Aplicar filtro de categoria
    if (categoriaFiltro && categoriaFiltro !== "todas") {
      query = query.eq("categoria", categoriaFiltro)
    }

    // Aplicar filtro de conta específica
    if (contaIdFiltro && contaIdFiltro !== "todas") {
      query = query.eq("id", contaIdFiltro)
    }

    const { data: contas, error: contasError } = await query

    console.log("[v0] Resultado da busca de contas:", { contas: contas?.length, error: contasError })

    if (contasError) {
      console.error("[v0] Erro do Supabase ao buscar contas:", contasError)
      throw contasError
    }

    // Buscar pagamentos para cada conta
    const { data: pagamentos, error: pagamentosError } = await supabase.from("pagamentos").select("*")

    if (pagamentosError) throw pagamentosError

    const contasExpandidas: any[] = []

    for (const conta of contas) {
      if (conta.tipo === "parcelada" && conta.parcelas > 0 && conta.data_inicio) {
        // Para contas parceladas, criar uma entrada para cada parcela
        const dataInicio = new Date(conta.data_inicio + "T00:00:00")
        const totalParcelas = conta.parcelas

        for (let i = 0; i < totalParcelas; i++) {
          const dataVencimento = new Date(dataInicio)
          dataVencimento.setMonth(dataInicio.getMonth() + i)

          const mesVencimento = dataVencimento.getMonth() // 0-11
          const anoVencimento = dataVencimento.getFullYear()
          const diaVencimento = conta.vencimento || dataInicio.getDate()

          // Verificar se esta parcela foi paga
          const pagamento = pagamentos.find(
            (p) => p.conta_id === conta.id && p.mes === mesVencimento && p.ano === anoVencimento,
          )

          contasExpandidas.push({
            id: conta.id,
            nome: conta.nome,
            valor: Number(conta.valor),
            vencimento: diaVencimento,
            tipo: conta.tipo,
            parcelas: conta.parcelas,
            parcelaAtual: i + 1, // Número da parcela atual (1, 2, 3...)
            dataInicio: conta.data_inicio,
            dataGasto: conta.data_gasto,
            anexoDiario: conta.anexo_diario,
            categoria: conta.categoria,
            createdAt: conta.created_at,
            updatedAt: conta.updated_at,
            // Dados específicos desta parcela
            mesVencimento: mesVencimento + 1, // 1-12 para exibição
            anoVencimento: anoVencimento,
            dataVencimentoCompleta: `${String(diaVencimento).padStart(2, "0")}/${String(mesVencimento + 1).padStart(2, "0")}/${anoVencimento}`,
            pago: !!pagamento,
            dataPagamento: pagamento?.data_pagamento || null,
            anexo: pagamento?.anexo || null,
          })
        }
      } else {
        // Para outras contas, manter como está
        const pagamentosDaConta = pagamentos
          .filter((p) => p.conta_id === conta.id)
          .map((p) => ({
            mes: p.mes + 1,
            ano: p.ano,
            pago: true,
            dataPagamento: p.data_pagamento,
            anexo: p.anexo,
          }))

        contasExpandidas.push({
          id: conta.id,
          nome: conta.nome,
          valor: Number(conta.valor),
          vencimento: conta.vencimento,
          tipo: conta.tipo,
          parcelas: conta.parcelas,
          dataInicio: conta.data_inicio,
          dataGasto: conta.data_gasto,
          anexoDiario: conta.anexo_diario,
          categoria: conta.categoria,
          createdAt: conta.created_at,
          updatedAt: conta.updated_at,
          pagamentos: pagamentosDaConta,
        })
      }
    }

    let contasFiltradas = contasExpandidas

    if (mesAno) {
      const [ano, mes] = mesAno.split("-").map(Number)
      contasFiltradas = contasFiltradas.filter((conta) => {
        if (conta.tipo === "diaria" || conta.tipo === "caixinha") {
          if (!conta.dataGasto) return false
          const data = new Date(conta.dataGasto + "T00:00:00")
          return data.getFullYear() === ano && data.getMonth() + 1 === mes
        } else if (conta.tipo === "parcelada") {
          // Para parceladas expandidas, verificar o mês/ano de vencimento
          return conta.anoVencimento === ano && conta.mesVencimento === mes
        } else {
          // Conta fixa aparece em todos os meses
          return true
        }
      })
    } else if (diaEspecifico) {
      const dataFiltro = new Date(diaEspecifico + "T00:00:00")
      const diaFiltro = dataFiltro.getDate()
      const mesFiltro = dataFiltro.getMonth() + 1
      const anoFiltro = dataFiltro.getFullYear()

      contasFiltradas = contasFiltradas.filter((conta) => {
        if (conta.tipo === "diaria" || conta.tipo === "caixinha") {
          if (!conta.dataGasto) return false
          const data = new Date(conta.dataGasto + "T00:00:00")
          return data.getFullYear() === anoFiltro && data.getMonth() + 1 === mesFiltro && data.getDate() === diaFiltro
        } else if (conta.tipo === "fixa") {
          return conta.vencimento === diaFiltro
        } else if (conta.tipo === "parcelada") {
          return (
            conta.anoVencimento === anoFiltro && conta.mesVencimento === mesFiltro && conta.vencimento === diaFiltro
          )
        }
        return false
      })
    }

    if (statusFiltro === "pagos") {
      contasFiltradas = contasFiltradas.filter((conta) => {
        if (conta.tipo === "parcelada") {
          return conta.pago === true
        } else if (conta.tipo === "diaria" || conta.tipo === "caixinha") {
          return conta.pagamentos?.length > 0
        } else if (mesAno) {
          const [ano, mes] = mesAno.split("-").map(Number)
          return conta.pagamentos?.some((p: any) => p.ano === ano && p.mes === mes)
        }
        return conta.pagamentos?.length > 0
      })
    } else if (statusFiltro === "pendentes") {
      contasFiltradas = contasFiltradas.filter((conta) => {
        if (conta.tipo === "parcelada") {
          return conta.pago === false
        } else if (conta.tipo === "diaria" || conta.tipo === "caixinha") {
          return !conta.pagamentos || conta.pagamentos.length === 0
        } else if (mesAno) {
          const [ano, mes] = mesAno.split("-").map(Number)
          return !conta.pagamentos?.some((p: any) => p.ano === ano && p.mes === mes)
        }
        return !conta.pagamentos || conta.pagamentos.length === 0
      })
    }

    return NextResponse.json(contasFiltradas)
  } catch (error: any) {
    console.error("Erro ao buscar contas:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar contas",
        details: error?.message || String(error),
      },
      { status: 500 },
    )
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
