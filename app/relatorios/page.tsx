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
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Carregando relatorios...</p>
        </div>
      </div>
    )
  }

  const maxTopGasto = topGastos[0]?.valor || 1

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-5xl">
          <div>
            <h1 className="text-base font-heading font-bold text-foreground">Relatorios</h1>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Analise visual das suas financas</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-9 rounded-full gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-5 max-w-5xl space-y-5">

        {/* Cards de Resumo */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {/* Total Gastos */}
          <div className="rounded-2xl border border-border/50 bg-card p-4 relative overflow-hidden shadow-sm card-hover">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-red-500/5 -translate-y-1/2 translate-x-1/2 blur-xl pointer-events-none" />
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-xl bg-red-500/10 p-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                {contas.length} contas
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Total de Gastos</p>
            <p className="text-2xl font-bold font-heading text-red-500">{formatarMoeda(totalGastos)}</p>
          </div>

          {/* Total Creditos */}
          <div className="rounded-2xl border border-border/50 bg-card p-4 relative overflow-hidden shadow-sm card-hover">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/5 -translate-y-1/2 translate-x-1/2 blur-xl pointer-events-none" />
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-xl bg-emerald-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                {transacoes.filter((t) => t.tipo === "credito").length} transacoes
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Total de Creditos</p>
            <p className="text-2xl font-bold font-heading text-emerald-500">{formatarMoeda(totalCreditos)}</p>
          </div>

          {/* Saldo Projetado */}
          <div className="rounded-2xl border border-border/50 bg-card p-4 relative overflow-hidden shadow-sm card-hover">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl pointer-events-none ${saldoProjetado >= 0 ? "bg-primary/5" : "bg-red-500/5"}`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`rounded-xl p-2 ${saldoProjetado >= 0 ? "bg-primary/10" : "bg-red-500/10"}`}>
                <DollarSign className={`h-4 w-4 ${saldoProjetado >= 0 ? "text-primary" : "text-red-500"}`} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                Creditos - Gastos
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Saldo Projetado</p>
            <p className={`text-2xl font-bold font-heading ${saldoProjetado >= 0 ? "text-primary" : "text-red-500"}`}>
              {formatarMoeda(saldoProjetado)}
            </p>
          </div>
        </div>

        {/* Graficos */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Pizza - Gastos por Categoria */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold font-heading text-foreground mb-4">Gastos por Categoria</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dadosPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                >
                  {dadosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={coresPie[index % coresPie.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatarMoeda(value)}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Barras - Gastos por Tipo */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold font-heading text-foreground mb-4">Gastos por Tipo de Conta</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dadosPorTipo} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatarMoeda(value)}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  cursor={{ fill: "hsl(var(--muted))", radius: 6 }}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Linha - Evolucao Mensal */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm md:col-span-2">
            <h2 className="text-sm font-semibold font-heading text-foreground mb-4">Evolucao Mensal dos Gastos</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatarMoeda(value)}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }} />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  name="Gastos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Maiores Gastos */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm md:col-span-2">
            <h2 className="text-sm font-semibold font-heading text-foreground mb-4">Top 5 Maiores Gastos</h2>
            <div className="space-y-3">
              {topGastos.map((conta, index) => {
                const pct = Math.round((conta.valor / maxTopGasto) * 100)
                const rankColors = ["text-amber-500", "text-zinc-400", "text-orange-600", "text-muted-foreground", "text-muted-foreground"]
                return (
                  <div key={conta.id} className="flex items-center gap-3 group">
                    <span className={`text-sm font-bold font-heading w-5 text-right shrink-0 ${rankColors[index]}`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{conta.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{conta.categoria || "Sem categoria"}</p>
                        </div>
                        <span className="text-sm font-bold font-heading text-foreground shrink-0 ml-3 tabular-nums">{formatarMoeda(conta.valor)}</span>
                      </div>
                      <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
