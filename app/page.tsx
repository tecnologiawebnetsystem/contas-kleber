"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, Calendar, TrendingUp, Search, AlertCircle, Settings, Wallet } from "lucide-react"
import { AddContaDialog } from "@/components/add-conta-dialog"
import { AddCreditoDialog } from "@/components/add-credito-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Conta } from "@/types/conta"
import { ListaTransacoes } from "@/components/lista-transacoes"
import { LogoutButton } from "@/components/logout-button"

export default function ContasPage() {
  const { toast } = useToast()
  const [contas, setContas] = useState<Conta[]>([])
  const [saldo, setSaldo] = useState(0)
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creditoDialogOpen, setCreditoDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContas()
    fetchSaldo()
    fetchTransacoes()
  }, [])

  const fetchSaldo = async () => {
    try {
      const response = await fetch("/api/saldo")
      if (!response.ok) throw new Error("Erro ao buscar saldo")
      const data = await response.json()
      setSaldo(Number(data.valor))
    } catch (error) {
      console.error("[v0] Erro ao buscar saldo:", error)
    }
  }

  const fetchContas = async () => {
    try {
      const response = await fetch("/api/contas")
      if (!response.ok) throw new Error("Erro ao buscar contas")
      const data = await response.json()
      setContas(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar contas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTransacoes = async () => {
    try {
      const response = await fetch("/api/transacoes")
      if (!response.ok) throw new Error("Erro ao buscar transações")
      const data = await response.json()
      setTransacoes(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar transações:", error)
    }
  }

  const addConta = async (conta: Omit<Conta, "id">) => {
    try {
      const response = await fetch("/api/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(conta),
      })

      if (!response.ok) throw new Error("Erro ao criar conta")

      toast({
        title: "Sucesso",
        description: conta.tipo === "diaria" ? "Gasto diário registrado com sucesso!" : "Conta adicionada com sucesso!",
      })

      if (conta.tipo === "diaria") {
        await fetchSaldo()
        await fetchTransacoes()
      }

      await fetchContas()
      setDialogOpen(false)
    } catch (error) {
      console.error("[v0] Erro ao adicionar conta:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a conta.",
        variant: "destructive",
      })
    }
  }

  const addCredito = async (valor: number, descricao: string, dataTransacao: string) => {
    try {
      const response = await fetch("/api/saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor, descricao, data_transacao: dataTransacao }),
      })

      if (!response.ok) throw new Error("Erro ao adicionar crédito")

      const data = await response.json()
      setSaldo(data.novoSaldo)

      toast({
        title: "Sucesso",
        description: `R$ ${valor.toFixed(2)} adicionado ao seu saldo!`,
      })

      await fetchTransacoes()
      setCreditoDialogOpen(false)
    } catch (error) {
      console.error("[v0] Erro ao adicionar crédito:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar crédito.",
        variant: "destructive",
      })
    }
  }

  const togglePago = async (id: string, mes: number, ano: number) => {
    try {
      const conta = contas.find((c) => c.id === id)
      const isPago = conta?.pagamentos?.some((p) => p.mes === mes && p.ano === ano)

      if (isPago) {
        const response = await fetch(`/api/pagamentos?contaId=${id}&mes=${mes}&ano=${ano}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        const data = await response.json()
        setSaldo(data.novoSaldo)
      }

      await fetchTransacoes()
      await fetchContas()
    } catch (error) {
      console.error("[v0] Erro ao atualizar pagamento:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      })
    }
  }

  const addPagamento = async (id: string, mes: number, ano: number, dataPagamento: string, anexo?: string) => {
    try {
      const conta = contas.find((c) => c.id === id)

      const response = await fetch("/api/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contaId: id,
          contaNome: conta?.nome,
          mes,
          ano,
          dataPagamento,
          anexo,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const data = await response.json()
      setSaldo(data.novoSaldo)

      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      })

      await fetchTransacoes()
      await fetchContas()
    } catch (error) {
      console.error("[v0] Erro ao adicionar pagamento:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível registrar o pagamento.",
        variant: "destructive",
      })
    }
  }

  const deleteConta = async (id: string) => {
    try {
      const response = await fetch(`/api/contas?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao deletar conta")

      toast({
        title: "Sucesso",
        description: "Conta removida com sucesso!",
      })

      await fetchContas()
      await fetchTransacoes()
    } catch (error) {
      console.error("[v0] Erro ao deletar conta:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover a conta.",
        variant: "destructive",
      })
    }
  }

  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()
  const diaAtual = hoje.getDate()

  const contasProximasVencimento = contas.filter((conta) => {
    if (conta.tipo === "diaria") return false
    const isPago = conta.pagamentos?.some((p) => p.mes === mesAtual && p.ano === anoAtual)
    if (isPago) return false

    const diasParaVencimento = conta.vencimento - diaAtual
    return diasParaVencimento > 0 && diasParaVencimento <= 3
  })

  const contasAtrasadas = contas.filter((conta) => {
    if (conta.tipo === "diaria") return false
    const isPago = conta.pagamentos?.some((p) => p.mes === mesAtual && p.ano === anoAtual)
    if (isPago) return false

    return conta.vencimento < diaAtual
  })

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

  const totalMes = contasMesAtual.reduce((sum, conta) => sum + conta.valor, 0)
  const pagas = contasMesAtual.filter((conta) =>
    conta.pagamentos?.some((p) => p.mes === mesAtual && p.ano === anoAtual),
  ).length
  const totalPago = contasMesAtual
    .filter((conta) => conta.pagamentos?.some((p) => p.mes === mesAtual && p.ano === anoAtual))
    .reduce((sum, conta) => sum + conta.valor, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando contas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Contas a Pagar</h1>
              <p className="text-muted-foreground mt-1">Gerencie suas contas fixas e parceladas</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/consulta">
                  <Search className="mr-2 h-4 w-4" />
                  Consultar
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/configuracoes">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </Button>
              <LogoutButton />
            </div>
          </div>

          {contasProximasVencimento.length > 0 && (
            <Alert variant="default" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">
                Atenção: Contas próximas do vencimento
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Você tem {contasProximasVencimento.length} conta(s) vencendo nos próximos 3 dias:{" "}
                {contasProximasVencimento.map((c) => c.nome).join(", ")}
              </AlertDescription>
            </Alert>
          )}

          {contasAtrasadas.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Alerta: Contas Atrasadas</AlertTitle>
              <AlertDescription>
                Você tem {contasAtrasadas.length} conta(s) atrasada(s): {contasAtrasadas.map((c) => c.nome).join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                  Crédito Disponível
                </CardTitle>
                <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">R$ {saldo.toFixed(2)}</div>
                <Button
                  onClick={() => setCreditoDialogOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200 p-0 h-auto"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar crédito
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalMes.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{contasMesAtual.length} contas neste mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contas Pagas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pagas} de {contasMesAtual.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">R$ {totalPago.toFixed(2)} pago</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {(totalMes - totalPago).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{contasMesAtual.length - pagas} contas pendentes</p>
              </CardContent>
            </Card>
          </div>

          <ListaTransacoes
            transacoes={transacoes}
            contas={contas}
            onTogglePago={togglePago}
            onDelete={deleteConta}
            onAddPagamento={addPagamento}
          />
        </div>
      </div>

      <AddContaDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addConta} />
      <AddCreditoDialog open={creditoDialogOpen} onOpenChange={setCreditoDialogOpen} onAdd={addCredito} />
    </div>
  )
}
