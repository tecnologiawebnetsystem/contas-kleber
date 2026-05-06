import { NextResponse } from "next/server"
import { query, update } from "@/lib/mysql"

// GET - Listar todos os registros de cabelo
export async function GET() {
  try {
    const rows = await query(
      "SELECT id, tipo, numero, feita, data_realizada, created_at, updated_at FROM cabelo ORDER BY tipo ASC, numero ASC"
    )
    // Normaliza feita para boolean (MySQL retorna 0/1)
    const data = rows.map((r: any) => ({ ...r, feita: Boolean(r.feita) }))
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro cabelo GET:", error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

// PATCH - Marcar/desmarcar um servico como feito e registrar a data
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, feita, data_realizada } = body

    if (!id) {
      return NextResponse.json({ error: "ID obrigatorio" }, { status: 400 })
    }

    const updated = await update("cabelo", id, {
      feita: feita ? 1 : 0,
      data_realizada: feita ? data_realizada : null,
    })

    if (!updated) {
      return NextResponse.json({ error: "Registro nao encontrado" }, { status: 404 })
    }

    return NextResponse.json({ ...updated, feita: Boolean(updated.feita) })
  } catch (error: any) {
    console.error("[v0] Erro cabelo PATCH:", error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
