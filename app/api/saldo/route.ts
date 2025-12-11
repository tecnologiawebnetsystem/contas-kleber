import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: saldo, error } = await supabase.from("saldo").select("*").single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    // Se não existe saldo, criar um
    if (!saldo) {
      const { data: novoSaldo, error: insertError } = await supabase
        .from("saldo")
        .insert({ valor: 0 })
        .select()
        .single()

      if (insertError) throw insertError
      return NextResponse.json(novoSaldo)
    }

    return NextResponse.json(saldo)
  } catch (error) {
    console.error("Erro ao buscar saldo:", error)
    return NextResponse.json({ error: "Erro ao buscar saldo" }, { status: 500 })
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
  } catch (error) {
    console.error("Erro ao adicionar crédito:", error)
    return NextResponse.json({ error: "Erro ao adicionar crédito" }, { status: 500 })
  }
}
