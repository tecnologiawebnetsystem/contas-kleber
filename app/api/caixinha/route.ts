import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Buscar configuração
    const { data: config, error: configError } = await supabase.from("caixinha_config").select("*").single()

    if (configError) throw configError

    // Buscar todos os depósitos
    const { data: depositos, error: depositosError } = await supabase
      .from("caixinha_depositos")
      .select("*")
      .order("data", { ascending: true })

    if (depositosError) throw depositosError

    // Calcular total depositado
    const totalDepositado = depositos.reduce((sum, d) => sum + (d.valor_depositado ? Number(d.valor_depositado) : 0), 0)

    return NextResponse.json({
      config,
      depositos,
      totalDepositado,
    })
  } catch (error) {
    console.error("Erro ao buscar caixinha:", error)
    return NextResponse.json({ error: "Erro ao buscar dados da caixinha" }, { status: 500 })
  }
}

// Criar ou atualizar depósitos semanais
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { acao, ...data } = body
    const supabase = createClient()

    if (acao === "gerar_depositos") {
      const { data: config } = await supabase.from("caixinha_config").select("meta_valor").single()
      const metaValor = config?.meta_valor || 35000

      // Gerar depósitos semanais automaticamente
      const dataInicio = new Date("2026-01-01")
      const dataFim = new Date("2026-12-31")

      const depositos = []
      const dataAtual = new Date(dataInicio)

      // Calcular número de semanas entre as datas
      const diasTotal = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
      const semanasTotal = Math.ceil(diasTotal / 7)
      const valorSemanal = Math.round((metaValor / semanasTotal) * 100) / 100

      while (dataAtual <= dataFim) {
        depositos.push({
          data: dataAtual.toISOString().split("T")[0],
          valor_planejado: valorSemanal,
        })
        dataAtual.setDate(dataAtual.getDate() + 7)
      }

      // Inserir todos os depósitos
      const { error } = await supabase.from("caixinha_depositos").insert(depositos)

      if (error) throw error

      return NextResponse.json({ success: true, totalDepositos: depositos.length })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("Erro ao processar caixinha:", error)
    return NextResponse.json({ error: "Erro ao processar caixinha" }, { status: 500 })
  }
}
