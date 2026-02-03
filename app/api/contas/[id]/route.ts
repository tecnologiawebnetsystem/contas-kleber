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

    // Converter camelCase para snake_case para o banco
    const dadosAtualizados: any = {
      nome: body.nome,
      valor: body.valor,
      tipo: body.tipo,
      vencimento: body.vencimento,
      categoria: body.categoria,
    }

    if (body.tipo === "parcelada") {
      // Garantir que parcelas seja um número inteiro válido
      const numParcelas = parseInt(String(body.parcelas), 10)
      dadosAtualizados.parcelas = isNaN(numParcelas) || numParcelas < 1 ? 1 : numParcelas
      dadosAtualizados.data_inicio = body.dataInicio
      dadosAtualizados.parcela_atual = body.parcelaAtual
    }

    if (body.tipo === "diaria") {
      dadosAtualizados.data_gasto = body.dataGasto
      if (body.anexoDiario !== undefined) {
        dadosAtualizados.anexo_diario = body.anexoDiario
      }
    }

    const { data, error } = await supabase.from("contas").update(dadosAtualizados).eq("id", id).select().single()

    if (error) {
      console.error("Erro ao atualizar conta:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Converter snake_case de volta para camelCase
    const contaFormatada = {
      id: data.id,
      nome: data.nome,
      valor: data.valor,
      tipo: data.tipo,
      vencimento: data.vencimento,
      categoria: data.categoria,
      parcelas: data.parcelas,
      dataInicio: data.data_inicio,
      parcelaAtual: data.parcela_atual,
      dataGasto: data.data_gasto,
      anexoDiario: data.anexo_diario,
      pagamentos: [],
    }

    return NextResponse.json(contaFormatada)
  } catch (error) {
    console.error("Erro ao atualizar conta:", error)
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const { id } = params

    const { error } = await supabase.from("contas").delete().eq("id", id)

    if (error) {
      console.error("Erro ao deletar conta:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar conta:", error)
    return NextResponse.json({ error: "Erro ao deletar conta" }, { status: 500 })
  }
}
