import { createClient } from "@/lib/mysql/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Iniciando busca de saldo")
    const supabase = await createClient()

    const { data: saldo, error } = await supabase.from("saldo").select("*").single()

    console.log("[v0] Resultado da busca:", { saldo, error })

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Erro do Supabase:", error)
      throw error
    }

    if (!saldo) {
      console.log("[v0] Criando novo saldo")
      const { data: novoSaldo, error: insertError } = await supabase
        .from("saldo")
        .insert({ valor: 0 })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Erro ao inserir saldo:", insertError)
        throw insertError
      }
      return NextResponse.json(novoSaldo)
    }

    return NextResponse.json(saldo)
  } catch (error: any) {
    console.error("[v0] Erro ao buscar saldo:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar saldo",
        details: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { valor, descricao } = await request.json()
    const supabase = await createClient()

    // Buscar saldo atual
    const { data: saldoAtual, error: saldoError } = await supabase.from("saldo").select("*").single()

    if (saldoError) throw saldoError

    // Calcular novo saldo
    const novoValor = Number(saldoAtual.valor) + Number(valor)

    // Atualizar saldo
    const { error: updateError } = await supabase
      .from("saldo")
      .update({ valor: novoValor, updated_at: new Date().toISOString() })
      .eq("id", saldoAtual.id)

    if (updateError) throw updateError

    // Registrar transação
    const { error: transacaoError } = await supabase.from("transacoes").insert({
      tipo: "credito",
      valor: Number(valor),
      descricao: descricao || "Adição de crédito",
    })

    if (transacaoError) throw transacaoError

    return NextResponse.json({ success: true, novoSaldo: novoValor })
  } catch (error: any) {
    console.error("Erro ao adicionar crédito:", error)
    return NextResponse.json(
      {
        error: "Erro ao adicionar crédito",
        details: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}
