import { NextResponse } from "next/server"
import { createClient } from "@/lib/mysql/server"

// GET - Buscar todos os emprestimos
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("emprestimos")
      .select("*")
      .order("devolvido", { ascending: true })
      .order("data_devolucao", { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar emprestimos:", error)
    return NextResponse.json({ error: "Erro ao buscar emprestimos" }, { status: 500 })
  }
}

// POST - Criar novo emprestimo
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("emprestimos")
      .insert({
        nome_pessoa: body.nomePessoa,
        valor: body.valor,
        data_devolucao: body.dataDevolucao,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao criar emprestimo:", error)
    return NextResponse.json({ error: "Erro ao criar emprestimo" }, { status: 500 })
  }
}
