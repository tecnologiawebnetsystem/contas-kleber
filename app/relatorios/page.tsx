"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import Link from "next/link"
import type { Conta, Categoria } from "@/types/conta"
import { formatarMoeda } from "@/lib/utils"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const COLORS = {
  Moradia: "#8b5cf6",
  Alimentação: "#10b981",
  Transporte: "#f59e0b",
  Saúde: "#ef4444",
  Educação: "#3b82f6",
  Lazer: "#ec4899",
  Vestuário: "#14b8a6",
  Serviços: "#6366f1",
  Outros: "#64748b",
}

export default function RelatoriosPage() {
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContas()
  }, [])

  const fetchContas = async () => {
    try {
      const response = await fetch("/api/contas")
      if (!response.ok) throw new Error("Erro ao buscar contas")
      const data = await response.json()
      setContas(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar contas:", error)
    } finally {
      setLoading(false)
    }
  }

  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  // Calcular gastos por categoria no mês atual
  const contasMesAtual = contas.filter((conta) => {
    if (conta.tipo === "fixa") return true
    if (conta.tipo === "diaria") {
      if (!conta.data_gasto) return false
      const dataGasto = new Date(conta.data_gasto)
      return dataGasto.getMonth() === mesAtual && dataGasto.getFullYear() === anoAtual
    }
    if (conta.tipo === "parcelada") {
      const inicio = new Date(conta.data_inicio!)
      const parcelaAtual = (anoAtual - inicio.getFullYear()) * 12 + (mesAtual - inicio.getMonth()) + 1
      return parcelaAtual > 0 && parcelaAtual <= conta.parcelas!
    }
    return false
  })

  const gastosPorCategoria = contasMesAtual.reduce(
    (acc, conta) => {
      const categoria = conta.categoria || "Outros"
      acc[categoria] = (acc[categoria] || 0) + conta.valor
      return acc
    },
    {} as Record<Categoria, number>,
  )

  const dadosGraficoCategoria = Object.entries(gastosPorCategoria).map(([nome, valor]) => ({
    nome,
    valor,
    fill: COLORS[nome as Categoria],
  }))

  // Calcular gastos dos últimos 6 meses
  const gastosPorMes = []
  for (let i = 5; i >= 0; i--) {
    const mesCalc = (mesAtual - i + 12) % 12
    const anoCalc = anoAtual - Math.floor((i - mesAtual) / 12)

    const contasDoMes = contas.filter((conta) => {
      if (conta.tipo === "fixa") return true
      if (conta.tipo === "diaria") {
        if (!conta.data_gasto) return false
        const dataGasto = new Date(conta.data_gasto)
        return dataGasto.getMonth() === mesCalc && dataGasto.getFullYear() === anoCalc
      }
      if (conta.tipo === "parcelada") {
        const inicio = new Date(conta.data_inicio!)
        const parcelaAtual = (anoCalc - inicio.getFullYear()) * 12 + (mesCalc - inicio.getMonth()) + 1
        return parcelaAtual > 0 && parcelaAtual <= conta.parcelas!
      }
      return false
    })

    const total = contasDoMes.reduce((sum, c) => sum + c.valor, 0)
    gastosPorMes.push({
      mes: meses[mesCalc].substring(0, 3),
      valor: total,
    })
  }

  const totalMesAtual = contasMesAtual.reduce((sum, c) => sum + c.valor, 0)
  const totalMesAnterior = gastosPorMes[gastosPorMes.length - 2]?.valor || 0
  const variacao = totalMesAnterior > 0 ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Relatórios e Gráficos</h1>
              <p className="text-muted-foreground mt-1">Análise detalhada dos seus gastos</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total do Mês Atual</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(totalMesAtual)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {meses[mesAtual]} {anoAtual}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Variação do Mês</CardTitle>
                {variacao >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${variacao >= 0 ? "text-red-500" : "text-green-500"}`}>
                  {variacao >= 0 ? "+" : ""}
                  {variacao.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Comparado ao mês anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maior Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dadosGraficoCategoria.length > 0
                    ? dadosGraficoCategoria.reduce((max, item) => (item.valor > max.valor ? item : max)).nome
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatarMoeda(
                    dadosGraficoCategoria.length > 0
                      ? dadosGraficoCategoria.reduce((max, item) => (item.valor > max.valor ? item : max)).valor
                      : 0,
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {dadosGraficoCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosGraficoCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {dadosGraficoCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                {gastosPorMes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gastosPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                      <Legend />
                      <Bar dataKey="valor" fill="#8b5cf6" name="Total Gasto" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dadosGraficoCategoria
                  .sort((a, b) => b.valor - a.valor)
                  .map((item) => (
                    <div key={item.nome} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.fill }} />
                        <span className="font-medium">{item.nome}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatarMoeda(item.valor)}</p>
                        <p className="text-xs text-muted-foreground">
                          {((item.valor / totalMesAtual) * 100).toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
