import { NextResponse } from "next/server"
import { query } from "@/lib/mysql"

interface Usuario {
  id: number
  nome: string
  pin: string
  perfil: number
  tema: string
  ativo: number
}

export async function POST(request: Request) {
  try {
    const { pin } = await request.json()

    if (!pin || pin.length !== 6) {
      return NextResponse.json(
        { success: false, error: "PIN inválido" },
        { status: 400 }
      )
    }

    // Buscar usuário pelo PIN
    const usuarios = await query<Usuario[]>(
      "SELECT id, nome, pin, perfil, tema, ativo FROM usuarios WHERE pin = ? AND ativo = 1",
      [pin]
    )

    if (usuarios.length === 0) {
      return NextResponse.json(
        { success: false, error: "PIN incorreto" },
        { status: 401 }
      )
    }

    const usuario = usuarios[0]

    // Retornar dados do usuário (sem o PIN por segurança)
    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        perfil: usuario.perfil,
        tema: usuario.tema,
      },
    })
  } catch (error) {
    console.error("Erro ao autenticar:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
