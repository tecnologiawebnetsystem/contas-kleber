import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { EmailNotificacao } from "@/components/email-notificacao"

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const { emailDestino, contas, tipo } = await request.json()

    if (!emailDestino || !contas || !tipo) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const resend = getResendClient()
    if (!resend) {
      return NextResponse.json(
        { error: "Resend API não configurada. Adicione RESEND_API_KEY nas variáveis de ambiente." },
        { status: 500 },
      )
    }

    const assunto =
      tipo === "vencimento"
        ? `Alerta: ${contas.length} conta(s) próxima(s) do vencimento`
        : `Alerta: ${contas.length} conta(s) atrasada(s)`

    const { data, error } = await resend.emails.send({
      from: "Contas a Pagar <onboarding@resend.dev>",
      to: [emailDestino],
      subject: assunto,
      react: EmailNotificacao({ contas, tipo }),
    })

    if (error) {
      console.error("[v0] Erro ao enviar e-mail:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Erro ao processar requisição:", error)
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 })
  }
}
