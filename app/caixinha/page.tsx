"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PiggyBank, TrendingUp, Target, Calendar, Edit2, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatarMoeda } from "@/lib/utils"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

interface Deposito {
  id: string
  data: string
  valor_planejado: number
  valor_depositado: number | null
  observacao: string | null
}

interface Config {
  meta_valor: number
  data_inicio: string
  data_fim: string
}

export default function CaixinhaPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<Config | null>(null)
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [totalDepositado, setTotalDepositado] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [valorEdicao, setValorEdicao] = useState("")

  useEffect(() => {
    fetchCaixinha()
  }, [])

  const fetchCaixinha = async () => {
    try {
      const response = await fetch("/api/caixinha")
      if (!response.ok) throw new Error("Erro ao buscar caixinha")

      const data = await response.json()
      setConfig(data.config)
      setDepositos(data.depositos)
      setTotalDepositado(data.totalDepositado)

      // Se não houver depósitos, gerar automaticamente
      if (data.depositos.length === 0) {
        await gerarDepositos()
      }
    } catch (error) {
      console.error("Erro ao buscar caixinha:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da caixinha.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const gerarDepositos = async () => {
    try {
      const response = await fetch("/api/caixinha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "gerar_depositos" }),
      })

      if (!response.ok) throw new Error("Erro ao gerar depósitos")

      await fetchCaixinha()
      toast({
        title: "Sucesso",
        description: "Depósitos semanais gerados com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao gerar depósitos:", error)
    }
  }

  const salvarDeposito = async (id: string, valor: number) => {
    try {
      const response = await fetch(`/api/caixinha/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor_depositado: valor,
          recalcular: true,
        }),
      })

      if (!response.ok) throw new Error("Erro ao salvar depósito")

      toast({
        title: "Sucesso",
        description: "Depósito atualizado e valores futuros recalculados!",
      })

      await fetchCaixinha()
      setEditando(null)
      setValorEdicao("")
    } catch (error) {
      console.error("Erro ao salvar depósito:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o depósito.",
        variant: "destructive",
      })
    }
  }

  const iniciarEdicao = (deposito: Deposito) => {
    setEditando(deposito.id)
    setValorEdicao(deposito.valor_depositado?.toString() || deposito.valor_planejado.toString())
  }

  const cancelarEdicao = () => {
    setEditando(null)
    setValorEdicao("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando caixinha...</p>
        </div>
      </div>
    )
  }

  if (!config) return null

  const progresso = (totalDepositado / config.meta_valor) * 100
  const faltam = config.meta_valor - totalDepositado

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
                <PiggyBank className="h-10 w-10 text-amber-500" />
                Caixinha
              </h1>
              <p className="text-muted-foreground mt-1">Meta de economia semanal</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Voltar ao Dashboard</Link>
            </Button>
          </div>

          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Meta Total</CardTitle>
                <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {formatarMoeda(config.meta_valor)}
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Até 31/12/2026</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                  Total Depositado
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatarMoeda(totalDepositado)}
                </div>
                <Progress value={progresso} className="mt-2" />
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">{progresso.toFixed(1)}% da meta</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Falta Depositar</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatarMoeda(faltam)}</div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {depositos.filter((d) => !d.valor_depositado).length} depósitos pendentes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Depósitos Semanais */}
          <Card>
            <CardHeader>
              <CardTitle>Depósitos Semanais Planejados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registre seus depósitos semanais. Os valores futuros serão recalculados automaticamente.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {depositos.map((deposito, index) => {
                  const data = new Date(deposito.data + "T00:00:00")
                  const dataFormatada = data.toLocaleDateString("pt-BR")
                  const depositado = deposito.valor_depositado !== null

                  return (
                    <div
                      key={deposito.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        depositado
                          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                          : "bg-white dark:bg-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-lg">
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Semana</span>
                          <span className="text-lg font-bold text-amber-900 dark:text-amber-100">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{dataFormatada}</p>
                          <p className="text-sm text-muted-foreground">
                            Planejado: {formatarMoeda(deposito.valor_planejado)}
                          </p>
                          {depositado && (
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              Depositado: {formatarMoeda(deposito.valor_depositado!)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {editando === deposito.id ? (
                          <>
                            <Input
                              type="number"
                              step="0.01"
                              value={valorEdicao}
                              onChange={(e) => setValorEdicao(e.target.value)}
                              className="w-32"
                              placeholder="Valor"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => salvarDeposito(deposito.id, Number(valorEdicao))}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-600" onClick={cancelarEdicao}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button size="icon" variant="ghost" onClick={() => iniciarEdicao(deposito)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
