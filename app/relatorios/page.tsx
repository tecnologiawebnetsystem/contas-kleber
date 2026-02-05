"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import Link from "next/link"
import { formatarMoeda } from "@/lib/utils"
import type { Conta } from "@/types/conta"

export default function RelatoriosPage() {
  const [contas, setContas] = useState<Conta[]>([])
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [periodo, setPeriodo] = useState("mes-atual")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDados()
  }, [])

  const fetchDados = async () => {
    try {
      const [contasRes, transacoesRes] = await Promise.all([fetch("/api/contas"), fetch("/api/transacoes")])

      const contasData = await contasRes.json()
      const transacoesData = await transacoesRes.json()

      setContas(contasData)
      setTransacoes(transacoesData)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const dadosPorCategoria = contas.reduce((acc: any[], conta) => {
    const categoria = conta.categoria || "Sem categoria"
    const existe = acc.find((item) => item.name === categoria)

    if (existe) {
      existe.value += conta.valor
    } else {
      acc.push({ name: categoria, value: conta.valor })
    }

    return acc
  }, [])

  const coresPie = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]

  const dadosPorTipo = [
    { name: "Fixas", valor: contas.filter((c) => c.tipo === "fixa").reduce((sum, c) => sum + c.valor, 0) },
    { name: "Parceladas", valor: contas.filter((c) => c.tipo === "parcelada").reduce((sum, c) => sum + c.valor, 0) },
    { name: "Diárias", valor: contas.filter((c) => c.tipo === "diaria").reduce((sum, c) => sum + c.valor, 0) },
  ]

  const hoje = new Date()
  const evolucaoMensal = Array.from({ length: 6 }, (_, i) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1)
    const mes = data.toLocaleString("pt-BR", { month: "short" })
    const ano = data.getFullYear()
    const mesNum = data.getMonth() + 1

    const totalMes = contas
      .filter((c) => {
        if (c.tipo === "fixa") return true
        if (c.tipo === "parcelada") {
          const inicio = new Date(c.dataInicio || c.createdAt || new Date())
          const mesesDif = (ano - inicio.getFullYear()) * 12 + (mesNum - inicio.getMonth() - 1)
          return mesesDif >= 0 && mesesDif < (c.parcelas || 0)
        }
        return false
      })
      .reduce((sum, c) => sum + c.valor, 0)

    return { name: `${mes}/${ano}`, valor: totalMes }
  })

  const topGastos = [...contas].sort((a, b) => b.valor - a.valor).slice(0, 5)

  const totalGastos = contas.reduce((sum, c) => sum + c.valor, 0)
  const totalCreditos = transacoes.filter((t) => t.tipo === "credito").reduce((sum, t) => sum + t.valor, 0)
  const saldoProjetado = totalCreditos - totalGastos

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Relatórios e Gráficos</h1>
            <p className="text-muted-foreground mt-1">Análise visual das suas finanças</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatarMoeda(totalGastos)}</div>
              <p className="text-xs text-muted-foreground">{contas.length} contas ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Créditos</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatarMoeda(totalCreditos)}</div>
              <p className="text-xs text-muted-foreground">
                {transacoes.filter((t) => t.tipo === "credito").length} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldoProjetado >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatarMoeda(saldoProjetado)}
              </div>
              <p className="text-xs text-muted-foreground">Créditos - Gastos</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de Pizza - Gastos por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={coresPie[index % coresPie.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Gastos por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Tipo de Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                  <Bar dataKey="valor" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Linha - Evolução Mensal */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Evolução Mensal dos Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} name="Gastos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 5 Maiores Gastos */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top 5 Maiores Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topGastos.map((conta, index) => (
                  <div key={conta.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{conta.nome}</p>
                        <p className="text-xs text-muted-foreground">{conta.categoria || "Sem categoria"}</p>
                      </div>
                    </div>
                    <span className="font-bold text-lg">{formatarMoeda(conta.valor)}</span>
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
