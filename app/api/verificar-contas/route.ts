import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { EmailNotificacao } from "@/components/email-notificacao"
import { createClient } from "@/lib/supabase/server"

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Buscar configurações
    const { data: config } = await supabase.from("configuracoes").select("*").limit(1).single()

    if (!config || !config.notificacoes_ativadas) {
      return NextResponse.json({ success: true, emailsEnviados: [], message: "Notificações desativadas" })
    }

    const resend = getResendClient()
    if (!resend) {
      return NextResponse.json(
        {
          success: false,
          error: "Resend API não configurada. Adicione RESEND_API_KEY nas variáveis de ambiente.",
        },
        { status: 500 },
      )
    }

    // Buscar todas as contas
    const { data: contas, error: contasError } = await supabase.from("contas").select("*")

    if (contasError) throw contasError

    // Buscar todos os pagamentos
    const { data: pagamentos, error: pagamentosError } = await supabase.from("pagamentos").select("*")

    if (pagamentosError) throw pagamentosError

    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()
    const diaAtual = hoje.getDate()

    // Combinar contas com pagamentos
    const contasComPagamentos = contas.map((conta) => ({
      ...conta,
      pagamentos: pagamentos
        .filter((p) => p.conta_id === conta.id)
        .map((p) => ({
          mes: p.mes,
          ano: p.ano,
          pago: true,
        })),
    }))

    const contasProximasVencimento = config.notificar_vencimento
      ? contasComPagamentos.filter((conta: any) => {
          const isPago = conta.pagamentos?.some((p: any) => p.mes === mesAtual && p.ano === anoAtual)
          if (isPago) return false

          const diasParaVencimento = conta.vencimento - diaAtual
          return diasParaVencimento > 0 && diasParaVencimento <= 3
        })
      : []

    const contasAtrasadas = config.notificar_atraso
      ? contasComPagamentos.filter((conta: any) => {
          const isPago = conta.pagamentos?.some((p: any) => p.mes === mesAtual && p.ano === anoAtual)
          if (isPago) return false

          return conta.vencimento < diaAtual
        })
      : []

    const emailsEnviados = []

    if (contasProximasVencimento.length > 0) {
      const { data, error } = await resend.emails.send({
        from: "Contas a Pagar <onboarding@resend.dev>",
        to: [config.email_destino],
        subject: `Alerta: ${contasProximasVencimento.length} conta(s) próxima(s) do vencimento`,
        react: EmailNotificacao({ contas: contasProximasVencimento, tipo: "vencimento" }),
      })

      if (!error) {
        emailsEnviados.push({ tipo: "vencimento", quantidade: contasProximasVencimento.length })
      }
    }

    if (contasAtrasadas.length > 0) {
      const { data, error } = await resend.emails.send({
        from: "Contas a Pagar <onboarding@resend.dev>",
        to: [config.email_destino],
        subject: `Alerta: ${contasAtrasadas.length} conta(s) atrasada(s)`,
        react: EmailNotificacao({ contas: contasAtrasadas, tipo: "atrasada" }),
      })

      if (!error) {
        emailsEnviados.push({ tipo: "atrasada", quantidade: contasAtrasadas.length })
      }
    }

    return NextResponse.json({
      success: true,
      emailsEnviados,
      contasVerificadas: {
        proximasVencimento: contasProximasVencimento.length,
        atrasadas: contasAtrasadas.length,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao verificar contas:", error)
    return NextResponse.json({ error: "Erro ao verificar contas" }, { status: 500 })
  }
}

export const runtime = "nodejs"
