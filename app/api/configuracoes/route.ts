import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar configurações
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("configuracoes").select("*").limit(1).single()

    if (error && error.code !== "PGRST116") throw error

    return NextResponse.json(data || null)
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

    // Verificar se já existe configuração
    const { data: existing } = await supabase.from("configuracoes").select("id").limit(1).single()

    let result

    if (existing) {
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
        .eq("id", existing.id)
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
