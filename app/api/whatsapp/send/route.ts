import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { number, text } = await request.json()

    if (!number || !text) {
      return NextResponse.json({ error: "Número e texto são obrigatórios" }, { status: 400 })
    }

    const numeroLimpo = number.replace(/\D/g, "")
    if (!numeroLimpo.startsWith("55") || numeroLimpo.length !== 13) {
      return NextResponse.json(
        { error: "Número inválido. Use o formato: 55 + DDD + número (ex: 5531994359434)" },
        { status: 400 },
      )
    }

    const apiToken = process.env.WHATSAPP_API_TOKEN
    const deviceToken = process.env.WHATSAPP_DEVICE_TOKEN

    if (!apiToken || !deviceToken) {
      return NextResponse.json({ error: "Credenciais da API WhatsApp não configuradas" }, { status: 500 })
    }

    const response = await fetch("https://gateway.apibrasil.io/api/v2/whatsapp/sendText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        DeviceToken: deviceToken,
      },
      body: JSON.stringify({
        number: numeroLimpo,
        text: text,
        time_typing: 1000,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Erro ao enviar WhatsApp:", data)
      return NextResponse.json({ error: data.message || "Erro ao enviar mensagem" }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: "Mensagem enviada com sucesso!",
      data: data,
    })
  } catch (error) {
    console.error("[v0] Exceção ao enviar WhatsApp:", error)
    return NextResponse.json({ error: "Erro interno ao enviar mensagem" }, { status: 500 })
  }
}
