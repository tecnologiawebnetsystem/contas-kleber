import { NextResponse } from "next/server"
import { createClient } from "@/lib/mysql/server"

// GET - Listar todos os registros de cabelo
export async function GET() {
  try {
    const db = await createClient()
    const { data, error } = await db
      .from("cabelo")
      .select("id, tipo, numero, feita, data_realizada, created_at, updated_at")
      .order("tipo", { ascending: true })
      .order("numero", { ascending: true })

    if (error) {
      console.error("[v0] Erro ao buscar cabelo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Erro cabelo GET:", error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

// PATCH - Marcar/desmarcar um servico como feito e registrar a data
export async function PATCH(request: Request) {
  try {
    const db = await createClient()
    const body = await request.json()
    const { id, feita, data_realizada } = body

    const { data, error } = await db
      .from("cabelo")
      .update({
        feita: feita,
        data_realizada: feita ? data_realizada : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao atualizar cabelo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Erro cabelo PATCH:", error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
