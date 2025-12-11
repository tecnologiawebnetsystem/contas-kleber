import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: transacoes, error } = await supabase
      .from("transacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json(transacoes || [])
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("transacoes")
      .insert({
        tipo: body.tipo,
        valor: body.valor,
        descricao: body.descricao,
        referencia_id: body.referencia_id,
        data_transacao: body.data_transacao,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao criar transação:", error)
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 })
  }
}
