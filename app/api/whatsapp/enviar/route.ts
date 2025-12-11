import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { numeros, mensagem } = await request.json()

    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      return NextResponse.json({ error: "Números de telefone não fornecidos" }, { status: 400 })
    }

    if (!mensagem) {
      return NextResponse.json({ error: "Mensagem não fornecida" }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER

    if (!accountSid || !authToken || !whatsappFrom) {
      return NextResponse.json(
        {
          error:
            "Credenciais do Twilio não configuradas. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_NUMBER nas variáveis de ambiente.",
        },
        { status: 500 },
      )
    }

    const twilio = require("twilio")
    const client = twilio(accountSid, authToken)

    const resultados = []

    for (const numero of numeros) {
      try {
        const message = await client.messages.create({
          body: mensagem,
          from: `whatsapp:${whatsappFrom}`,
          to: `whatsapp:${numero}`,
        })

        resultados.push({
          numero,
          status: "enviado",
          sid: message.sid,
        })
      } catch (error: any) {
        resultados.push({
          numero,
          status: "erro",
          erro: error.message,
        })
      }
    }

    const todosEnviados = resultados.every((r) => r.status === "enviado")

    return NextResponse.json({
      success: todosEnviados,
      resultados,
      mensagensEnviadas: resultados.filter((r) => r.status === "enviado").length,
      mensagensComErro: resultados.filter((r) => r.status === "erro").length,
    })
  } catch (error) {
    console.error("[v0] Erro ao enviar WhatsApp:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagens WhatsApp" }, { status: 500 })
  }
}

export const runtime = "nodejs"
