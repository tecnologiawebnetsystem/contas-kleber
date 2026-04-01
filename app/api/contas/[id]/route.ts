import { createClient } from "@/lib/mysql/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Converter camelCase para snake_case para o banco
    const dadosAtualizados: any = {
      nome: body.nome,
      valor: body.valor,
      tipo: body.tipo,
      vencimento: body.vencimento,
      categoria: body.categoria,
    }

    if (body.tipo === "parcelada") {
      dadosAtualizados.parcelas = body.parcelas
      dadosAtualizados.data_inicio = body.dataInicio
      // parcela_atual nao existe na tabela — e calculada dinamicamente pela API
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
      subcategoria: data.subcategoria,
      fornecedor: data.fornecedor,
      parcelas: data.parcelas,
      dataInicio: data.data_inicio,
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Deletar registros dependentes primeiro
    await supabase.from("pagamentos").delete().eq("conta_id", id)
    await supabase.from("transacoes").delete().eq("referencia_id", id)

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
