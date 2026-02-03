"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { formatarMoeda } from "@/utils/formatar-moeda"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DashboardSummaryProps {
  totalMes: number
  totalPago: number
  totalPendente: number
  contasAtrasadas: number
  contasProximas: number
  saldo: number
  gastosPorCategoria: { categoria: string; valor: number; cor: string }[]
  comparativoMesAnterior?: number
}

export function DashboardSummary({
  totalMes,
  totalPago,
  totalPendente,
  contasAtrasadas,
  contasProximas,
  saldo,
  gastosPorCategoria,
  comparativoMesAnterior = 0,
}: DashboardSummaryProps) {
  const percentualPago = totalMes > 0 ? (totalPago / totalMes) * 100 : 0
  const variacao = comparativoMesAnterior !== 0 
    ? ((totalMes - comparativoMesAnterior) / comparativoMesAnterior) * 100 
    : 0

  const chartConfig = {
    valor: {
      label: "Valor",
    },
  }

  return (
    <div className="space-y-4">
      {/* Cards de resumo principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total do Mes */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Total do Mes
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatarMoeda(totalMes)}
            </div>
            {variacao !== 0 && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${variacao > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {variacao > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(variacao).toFixed(1)}% vs mes anterior</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ja Pago */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">
              Ja Pago
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100">
              {formatarMoeda(totalPago)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 dark:bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentualPago}%` }}
                />
              </div>
              <span className="text-xs text-green-700 dark:text-green-300">{percentualPago.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Pendente */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Pendente
            </CardTitle>
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold text-amber-900 dark:text-amber-100">
              {formatarMoeda(totalPendente)}
            </div>
            {contasProximas > 0 && (
              <p className="text-xs mt-1 text-amber-700 dark:text-amber-300">
                {contasProximas} vencendo em breve
              </p>
            )}
          </CardContent>
        </Card>

        {/* Saldo Disponivel */}
        <Card className={`bg-gradient-to-br ${saldo >= 0 ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800' : 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className={`text-xs font-medium ${saldo >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
              Saldo Disponivel
            </CardTitle>
            {saldo >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-xl md:text-2xl font-bold ${saldo >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
              {formatarMoeda(saldo)}
            </div>
            {contasAtrasadas > 0 && (
              <div className="flex items-center gap-1 text-xs mt-1 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                <span>{contasAtrasadas} conta(s) atrasada(s)</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafico de gastos por categoria */}
      {gastosPorCategoria.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosPorCategoria} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="categoria" 
                    tickLine={false} 
                    axisLine={false}
                    width={80}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => formatarMoeda(Number(value))}
                  />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {gastosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
