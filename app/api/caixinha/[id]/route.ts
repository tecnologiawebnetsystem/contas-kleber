import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const { data, error } = await supabase
      .from("caixinha_depositos")
      .update({
        valor_depositado: body.valor_depositado,
        observacao: body.observacao,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    // Recalcular valores futuros se necessário
    if (body.recalcular) {
      await recalcularDepositos(params.id)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao atualizar depósito:", error)
    return NextResponse.json({ error: "Erro ao atualizar depósito" }, { status: 500 })
  }
}

async function recalcularDepositos(depositoId: string) {
  const supabase = createClient()

  // Buscar configuração e todos os depósitos
  const { data: config } = await supabase.from("caixinha_config").select("*").single()

  const { data: depositos } = await supabase.from("caixinha_depositos").select("*").order("data", { ascending: true })

  if (!config || !depositos) return

  // Calcular total já depositado
  const totalDepositado = depositos.reduce((sum, d) => sum + (d.valor_depositado ? Number(d.valor_depositado) : 0), 0)

  // Encontrar índice do depósito atual
  const indiceAtual = depositos.findIndex((d) => d.id === depositoId)
  const depositosFuturos = depositos.slice(indiceAtual + 1).filter((d) => !d.valor_depositado)

  if (depositosFuturos.length === 0) return

  // Recalcular valor semanal para os próximos depósitos
  const valorRestante = Number(config.meta_valor) - totalDepositado
  const novoValorSemanal = Math.round((valorRestante / depositosFuturos.length) * 100) / 100

  // Atualizar depósitos futuros
  for (const deposito of depositosFuturos) {
    await supabase.from("caixinha_depositos").update({ valor_planejado: novoValorSemanal }).eq("id", deposito.id)
  }
}
