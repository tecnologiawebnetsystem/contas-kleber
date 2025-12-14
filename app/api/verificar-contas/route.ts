import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { EmailNotificacao } from "@/components/email-notificacao"

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  console.log("[v0] RESEND_API_KEY existe?", !!apiKey)
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando verificação de contas para envio de e-mail...")

    const body = await request.json().catch(() => ({}))
    const forceTest = body.forceTest || false
    console.log("[v0] Modo de teste forçado?", forceTest)

    const supabase = await createClient()

    const { data: configs } = await supabase.from("configuracoes").select("*").limit(1)
    console.log("[v0] Configurações encontradas:", configs)

    const config = configs?.[0]

    if (!forceTest && (!config || !config.notificacoes_ativadas)) {
      console.log("[v0] Notificações desativadas ou config não existe")
      return NextResponse.json({ success: true, emailsEnviados: [], message: "Notificações desativadas" })
    }

    const configToUse = config || {
      email_destino: "teste@exemplo.com",
      notificar_vencimento: true,
      notificar_atraso: true,
    }

    const resend = getResendClient()
    if (!resend) {
      console.error("[v0] Resend API não configurada")
      return NextResponse.json(
        {
          success: false,
          error: "Resend API não configurada. Adicione RESEND_API_KEY nas variáveis de ambiente.",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Resend client criado com sucesso")
    console.log("[v0] E-mail destino:", configToUse.email_destino)

    if (forceTest) {
      console.log("[v0] Enviando e-mail de teste...")
      try {
        const emailTeste = "tecnologiawebnetsystem@gmail.com"

        const htmlContent = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #f59e0b; margin: 0 0 20px 0; font-size: 24px;">✓ Teste de Notificação</h1>
        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Olá!</p>
        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          Este é um e-mail de teste do sistema Contas a Pagar. Se você recebeu esta mensagem, 
          significa que a integração com o Resend está funcionando corretamente!
        </p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #166534; font-weight: bold;">✓ Configuração bem-sucedida</p>
          <p style="margin: 8px 0 0 0; color: #15803d; font-size: 14px;">
            Você pode agora ativar as notificações automáticas nas configurações.
          </p>
        </div>

        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin-top: 30px;">
          Configurações atuais:
        </p>
        <ul style="color: #666666; font-size: 14px; line-height: 1.8;">
          <li>E-mail configurado: ${configToUse.email_destino}</li>
          <li>E-mail de teste enviado para: ${emailTeste}</li>
          <li>Notificar vencimentos: ${configToUse.notificar_vencimento ? "Sim" : "Não"}</li>
          <li>Notificar atrasos: ${configToUse.notificar_atraso ? "Sim" : "Não"}</li>
        </ul>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-weight: bold;">⚠ Atenção - Plano Gratuito</p>
          <p style="margin: 8px 0 0 0; color: #78350f; font-size: 14px;">
            No plano gratuito do Resend, e-mails só podem ser enviados para ${emailTeste}. 
            Para enviar para outros endereços, verifique um domínio em resend.com/domains.
          </p>
        </div>

        <p style="color: #999999; font-size: 12px; line-height: 1.5; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          Este é um e-mail automático do sistema Contas a Pagar.
        </p>
      </div>
    </div>
  </body>
</html>`

        const { data, error } = await resend.emails.send({
          from: "Contas a Pagar <onboarding@resend.dev>",
          to: [emailTeste],
          subject: "✓ Teste de Notificação - Sistema de Contas",
          html: htmlContent,
        })

        console.log("[v0] Resposta do Resend (teste):", { data, error })

        if (error) {
          console.error("[v0] Erro ao enviar e-mail de teste:", error)
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        } else {
          console.log("[v0] E-mail de teste enviado com sucesso!")
          return NextResponse.json({
            success: true,
            emailsEnviados: [{ tipo: "teste", quantidade: 1 }],
            message: `E-mail de teste enviado com sucesso para ${emailTeste}`,
          })
        }
      } catch (emailError: any) {
        console.error("[v0] Exceção ao enviar e-mail de teste:", emailError)
        return NextResponse.json({ success: false, error: emailError.message }, { status: 500 })
      }
    }

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
      pagamentos: pagamentos
        .filter((p) => p.conta_id === conta.id)
        .map((p) => ({
          mes: p.mes,
          ano: p.ano,
          pago: true,
        })),
    }))

    const contasProximasVencimento = configToUse.notificar_vencimento
      ? contasComPagamentos.filter((conta: any) => {
          const isPago = conta.pagamentos?.some((p: any) => p.mes === mesAtual && p.ano === anoAtual)
          if (isPago) return false

          const diasParaVencimento = conta.vencimento - diaAtual
          return diasParaVencimento >= 0 && diasParaVencimento <= 3
        })
      : []

    const contasAtrasadas = configToUse.notificar_atraso
      ? contasComPagamentos.filter((conta: any) => {
          const isPago = conta.pagamentos?.some((p: any) => p.mes === mesAtual && p.ano === anoAtual)
          if (isPago) return false

          return conta.vencimento < diaAtual
        })
      : []

    console.log("[v0] Contas próximas ao vencimento:", contasProximasVencimento.length)
    console.log("[v0] Contas atrasadas:", contasAtrasadas.length)

    const emailsEnviados = []

    if (contasProximasVencimento.length > 0) {
      console.log("[v0] Tentando enviar e-mail de vencimento...")
      try {
        const { data, error } = await resend.emails.send({
          from: "Contas a Pagar <onboarding@resend.dev>",
          to: [configToUse.email_destino],
          subject: `Alerta: ${contasProximasVencimento.length} conta(s) próxima(s) do vencimento`,
          react: EmailNotificacao({ contas: contasProximasVencimento, tipo: "vencimento" }),
        })

        console.log("[v0] Resposta do Resend (vencimento):", { data, error })

        if (error) {
          console.error("[v0] Erro ao enviar e-mail de vencimento:", error)
        } else {
          console.log("[v0] E-mail de vencimento enviado com sucesso!")
          emailsEnviados.push({ tipo: "vencimento", quantidade: contasProximasVencimento.length })
        }
      } catch (emailError) {
        console.error("[v0] Exceção ao enviar e-mail de vencimento:", emailError)
      }
    }

    if (contasAtrasadas.length > 0) {
      console.log("[v0] Tentando enviar e-mail de atraso...")
      try {
        const { data, error } = await resend.emails.send({
          from: "Contas a Pagar <onboarding@resend.dev>",
          to: [configToUse.email_destino],
          subject: `Alerta: ${contasAtrasadas.length} conta(s) atrasada(s)`,
          react: EmailNotificacao({ contas: contasAtrasadas, tipo: "atrasada" }),
        })

        console.log("[v0] Resposta do Resend (atraso):", { data, error })

        if (error) {
          console.error("[v0] Erro ao enviar e-mail de atraso:", error)
        } else {
          console.log("[v0] E-mail de atraso enviado com sucesso!")
          emailsEnviados.push({ tipo: "atrasada", quantidade: contasAtrasadas.length })
        }
      } catch (emailError) {
        console.error("[v0] Exceção ao enviar e-mail de atraso:", emailError)
      }
    }

    console.log("[v0] Total de e-mails enviados:", emailsEnviados.length)

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
