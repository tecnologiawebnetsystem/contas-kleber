import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar configurações
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("configuracoes").select("*").limit(1)

    if (error) throw error

    // Retornar o primeiro registro ou null se não existir
    return NextResponse.json(data && data.length > 0 ? data[0] : null)
  } catch (error) {
    console.error("[v0] Erro ao buscar configurações:", error)
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 })
  }
}

// POST - Salvar configurações
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: existing } = await supabase.from("configuracoes").select("id").limit(1)

    let result

    if (existing && existing.length > 0) {
      // Atualizar
      result = await supabase
        .from("configuracoes")
        .update({
          email_destino: body.emailDestino,
          notificacoes_ativadas: body.notificacoesAtivadas,
          notificar_vencimento: body.notificarVencimento,
          notificar_atraso: body.notificarAtraso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id)
        .select()
        .single()
    } else {
      // Inserir
      result = await supabase
        .from("configuracoes")
        .insert({
          email_destino: body.emailDestino,
          notificacoes_ativadas: body.notificacoesAtivadas,
          notificar_vencimento: body.notificarVencimento,
          notificar_atraso: body.notificarAtraso,
        })
        .select()
        .single()
    }

    if (result.error) throw result.error

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("[v0] Erro ao salvar configurações:", error)
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 })
  }
}
