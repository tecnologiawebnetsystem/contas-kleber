import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: config } = await supabase.from("configuracoes").select("*").limit(1).single()

    if (!config || !config.whatsapp_ativado) {
      return NextResponse.json({ success: true, mensagensEnviadas: [], message: "WhatsApp desativado" })
    }

    const numeros = config.whatsapp_numeros || []
    if (numeros.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhum número configurado" }, { status: 400 })
    }

    // Buscar contas e pagamentos
    const { data: contas, error: contasError } = await supabase.from("contas").select("*")
    if (contasError) throw contasError

    const { data: pagamentos, error: pagamentosError } = await supabase.from("pagamentos").select("*")
    if (pagamentosError) throw pagamentosError

    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()
    const diaAtual = hoje.getDate()

    const contasComPagamentos = contas.map((conta) => ({
      ...conta,
      pagamentos: pagamentos.filter((p) => p.conta_id === conta.id),
    }))

    const contasProximasVencimento = config.notificar_vencimento_whatsapp
      ? contasComPagamentos.filter((conta: any) => {
          if (conta.tipo === "diaria") return false
          const isPago = conta.pagamentos?.some((p: any) => p.mes === mesAtual && p.ano === anoAtual)
          if (isPago) return false

          const diasParaVencimento = conta.vencimento - diaAtual
          return diasParaVencimento > 0 && diasParaVencimento <= 3
        })
      : []

    const contasAtrasadas = config.notificar_atraso_whatsapp
      ? contasComPagamentos.filter((conta: any) => {
          if (conta.tipo === "diaria") return false
          const isPago = conta.pagamentos?.some((p: any) => p.mes === mesAtual && p.ano === anoAtual)
          if (isPago) return false

          return conta.vencimento < diaAtual
        })
      : []

    if (contasProximasVencimento.length === 0 && contasAtrasadas.length === 0) {
      return NextResponse.json({ success: true, mensagensEnviadas: [], message: "Nenhuma notificação necessária" })
    }

    // Construir mensagem
    let mensagem = config.whatsapp_mensagem_template || "🔔 *Alerta de Contas - Talent Money Family*\n\n"

    if (contasProximasVencimento.length > 0) {
      mensagem += "⚠️ *Contas próximas do vencimento:*\n\n"
      contasProximasVencimento.forEach((conta: any) => {
        const diasRestantes = conta.vencimento - diaAtual
        mensagem += `📌 ${conta.nome}\n   Vence em ${diasRestantes} dia(s) - R$ ${Number(conta.valor).toFixed(2)}\n\n`
      })
    }

    if (contasAtrasadas.length > 0) {
      mensagem += "🚨 *Contas atrasadas:*\n\n"
      contasAtrasadas.forEach((conta: any) => {
        const diasAtrasados = diaAtual - conta.vencimento
        mensagem += `❌ ${conta.nome}\n   Atrasada há ${diasAtrasados} dia(s) - R$ ${Number(conta.valor).toFixed(2)}\n\n`
      })
    }

    const totalPendente = [...contasProximasVencimento, ...contasAtrasadas].reduce(
      (acc, conta: any) => acc + Number(conta.valor),
      0,
    )

    mensagem += `\n💰 *Total pendente:* R$ ${totalPendente.toFixed(2)}`

    // Enviar via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/whatsapp/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeros, mensagem }),
    })

    const resultado = await response.json()

    return NextResponse.json({
      success: resultado.success,
      mensagensEnviadas: resultado.mensagensEnviadas || 0,
      resultados: resultado.resultados,
      contasVerificadas: {
        proximasVencimento: contasProximasVencimento.length,
        atrasadas: contasAtrasadas.length,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao verificar contas para WhatsApp:", error)
    return NextResponse.json({ error: "Erro ao processar notificações WhatsApp" }, { status: 500 })
  }
}

export const runtime = "nodejs"
