import { NextResponse } from "next/server"
import { createClient } from "@/lib/mysql/server"

// PUT - Atualizar emprestimo (marcar devolvido, editar dados)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.nomePessoa !== undefined) updateData.nome_pessoa = body.nomePessoa
    if (body.valor !== undefined) updateData.valor = body.valor
    if (body.dataDevolucao !== undefined) updateData.data_devolucao = body.dataDevolucao
    if (body.devolvido !== undefined) {
      updateData.devolvido = body.devolvido
      updateData.data_devolvido = body.devolvido ? new Date().toISOString().split("T")[0] : null
    }

    const { data, error } = await supabase
      .from("emprestimos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao atualizar emprestimo:", error)
    return NextResponse.json({ error: "Erro ao atualizar emprestimo" }, { status: 500 })
  }
}

// DELETE - Remover emprestimo
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from("emprestimos")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover emprestimo:", error)
    return NextResponse.json({ error: "Erro ao remover emprestimo" }, { status: 500 })
  }
}
