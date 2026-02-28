import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const body = await request.json()
    const { id } = params
    const { mes, ano, valorAjustado, vencimentoAjustado } = body

    if (!mes || !ano) {
      return NextResponse.json({ error: "Mes e ano sao obrigatorios" }, { status: 400 })
    }

    // Verificar se ja existe um registro de pagamento para esta parcela
    const { data: existente } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("conta_id", id)
      .eq("mes", mes)
      .eq("ano", ano)
      .single()

    if (existente) {
      // Atualizar registro existente
      const { data, error } = await supabase
        .from("pagamentos")
        .update({
          valor_ajustado: valorAjustado || null,
          vencimento_ajustado: vencimentoAjustado || null,
        })
        .eq("id", existente.id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar parcela:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        id: data.id,
        contaId: data.conta_id,
        mes: data.mes,
        ano: data.ano,
        dataPagamento: data.data_pagamento,
        anexo: data.anexo,
        valorAjustado: data.valor_ajustado,
        vencimentoAjustado: data.vencimento_ajustado,
      })
    } else {
      // Criar novo registro apenas com os ajustes (sem data_pagamento = nao pago)
      const { data, error } = await supabase
        .from("pagamentos")
        .insert({
          conta_id: id,
          mes,
          ano,
          valor_ajustado: valorAjustado || null,
          vencimento_ajustado: vencimentoAjustado || null,
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao criar ajuste de parcela:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        id: data.id,
        contaId: data.conta_id,
        mes: data.mes,
        ano: data.ano,
        dataPagamento: data.data_pagamento,
        anexo: data.anexo,
        valorAjustado: data.valor_ajustado,
        vencimentoAjustado: data.vencimento_ajustado,
      })
    }
  } catch (error) {
    console.error("Erro ao ajustar parcela:", error)
    return NextResponse.json({ error: "Erro ao ajustar parcela" }, { status: 500 })
  }
}
