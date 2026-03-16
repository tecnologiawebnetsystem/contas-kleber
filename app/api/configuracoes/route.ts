import { NextResponse } from "next/server"
import { createClient } from "@/lib/mysql/server"

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

    const emailDestino = body.email_destino || body.emailDestino
    const notificacoesAtivadas = body.notificacoes_ativadas ?? body.notificacoesAtivadas
    const notificarVencimento = body.notificar_vencimento ?? body.notificarVencimento
    const notificarAtraso = body.notificar_atraso ?? body.notificarAtraso
    const whatsappAtivado = body.whatsapp_ativado ?? body.whatsappAtivado ?? false
    const whatsappNumeros = body.whatsapp_numeros || body.whatsappNumeros || []
    const notificarVencimentoWhatsapp = body.notificar_vencimento_whatsapp ?? body.notificarVencimentoWhatsapp ?? true
    const notificarAtrasoWhatsapp = body.notificar_atraso_whatsapp ?? body.notificarAtrasoWhatsapp ?? true
    const whatsappMensagemTemplate =
      body.whatsapp_mensagem_template || body.whatsappMensagemTemplate || "🔔 *Alerta de Contas - Talent Money Family*"

    // Validar que email_destino não está vazio
    if (!emailDestino) {
      return NextResponse.json({ error: "E-mail de destino é obrigatório" }, { status: 400 })
    }

    const { data: existing } = await supabase.from("configuracoes").select("id").limit(1)

    let result

    if (existing && existing.length > 0) {
      // Atualizar
      result = await supabase
        .from("configuracoes")
        .update({
          email_destino: emailDestino,
          notificacoes_ativadas: notificacoesAtivadas,
          notificar_vencimento: notificarVencimento,
          notificar_atraso: notificarAtraso,
          whatsapp_ativado: whatsappAtivado,
          whatsapp_numeros: whatsappNumeros,
          notificar_vencimento_whatsapp: notificarVencimentoWhatsapp,
          notificar_atraso_whatsapp: notificarAtrasoWhatsapp,
          whatsapp_mensagem_template: whatsappMensagemTemplate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id)
        .select()
    } else {
      // Inserir
      result = await supabase
        .from("configuracoes")
        .insert({
          email_destino: emailDestino,
          notificacoes_ativadas: notificacoesAtivadas,
          notificar_vencimento: notificarVencimento,
          notificar_atraso: notificarAtraso,
          whatsapp_ativado: whatsappAtivado,
          whatsapp_numeros: whatsappNumeros,
          notificar_vencimento_whatsapp: notificarVencimentoWhatsapp,
          notificar_atraso_whatsapp: notificarAtrasoWhatsapp,
          whatsapp_mensagem_template: whatsappMensagemTemplate,
        })
        .select()
    }

    if (result.error) throw result.error

    return NextResponse.json(result.data && result.data.length > 0 ? result.data[0] : null)
  } catch (error) {
    console.error("[v0] Erro ao salvar configurações:", error)
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 })
  }
}
