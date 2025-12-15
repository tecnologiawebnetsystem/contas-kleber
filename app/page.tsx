"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Calendar,
  TrendingUp,
  Search,
  AlertCircle,
  Settings,
  Wallet,
  Share2,
  PiggyBank,
  BarChart3,
  Plane,
} from "lucide-react"
import { AddContaDialog } from "@/components/add-conta-dialog"
import { AddCreditoDialog } from "@/components/add-credito-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Conta } from "@/types/conta"
import { ListaTransacoes } from "@/components/lista-transacoes"
import { LogoutButton } from "@/components/logout-button"
import { formatarMoeda } from "@/lib/utils"
import { getDataAtualBrasil } from "@/lib/date-utils"
import { WhatsAppSendDialog } from "@/components/whatsapp-send-dialog"
import { InstallPrompt } from "./install-prompt"
import { OfflineIndicator } from "@/components/offline-indicator"
import { offlineStorage } from "@/lib/offline/storage"
import { useOffline } from "@/hooks/use-offline"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ContasPage() {
  const { toast } = useToast()
  const [contas, setContas] = useState<Conta[]>([])
  const [saldo, setSaldo] = useState(0)
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creditoDialogOpen, setCreditoDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dataPoupanca, setDataPoupanca] = useState<any | null>(null)
  const [dataViagem, setDataViagem] = useState<any | null>(null)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("")

  const hoje = getDataAtualBrasil()
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1)
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear())
  const [mostrarApenasHoje, setMostrarApenasHoje] = useState(false)

  const { isOnline, syncPendingOperations } = useOffline()

  useEffect(() => {
    fetchContas()
    fetchSaldo()
    fetchTransacoes()
    fetchPoupancaEViagem()
  }, [])

  const fetchSaldo = async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/saldo")
        if (!response.ok) throw new Error("Erro ao buscar saldo")
        const data = await response.json()
        const saldoValue = Number(data.valor)
        setSaldo(saldoValue)
        await offlineStorage.saveSaldo(saldoValue)
      } else {
        const cachedSaldo = await offlineStorage.getSaldo()
        setSaldo(cachedSaldo)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar saldo:", error)
      const cachedSaldo = await offlineStorage.getSaldo()
      setSaldo(cachedSaldo)
    }
  }

  const fetchContas = async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/contas")
        if (!response.ok) throw new Error("Erro ao buscar contas")
        const data = await response.json()
        setContas(data)
        await offlineStorage.saveContas(data)
      } else {
        const cachedContas = await offlineStorage.getContas()
        setContas(cachedContas)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar contas:", error)
      // Tentar buscar do cache se a rede falhar
      const cachedContas = await offlineStorage.getContas()
      if (cachedContas.length > 0) {
        setContas(cachedContas)
        toast({
          title: "Modo Offline",
          description: "Mostrando dados salvos localmente.",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as contas.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchTransacoes = async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/transacoes")
        if (!response.ok) throw new Error("Erro ao buscar transações")
        const data = await response.json()
        setTransacoes(data)
        await offlineStorage.saveTransacoes(data)
      } else {
        const cachedTransacoes = await offlineStorage.getTransacoes()
        setTransacoes(cachedTransacoes)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar transações:", error)
      const cachedTransacoes = await offlineStorage.getTransacoes()
      setTransacoes(cachedTransacoes)
    }
  }

  // Não mais necessário, substituído por fetchPoupancaEViagem
  // const fetchCaixinha = async () => {
  //   try {
  //     if (isOnline) {
  //       const response = await fetch("/api/caixinha")
  //       if (!response.ok) throw new Error("Erro ao buscar caixinha")
  //       const data = await response.json()
  //       setDataCaixinha(data)
  //       await offlineStorage.saveCaixinha(data)
  //     } else {
  //       const cachedCaixinha = await offlineStorage.getCaixinha()
  //       setDataCaixinha(cachedCaixinha)
  //     }
  //   } catch (error) {
  //     console.error("[v0] Erro ao buscar caixinha:", error)
  //     const cachedCaixinha = await offlineStorage.getCaixinha()
  //     setDataCaixinha(cachedCaixinha)
  //   }
  // }

  const fetchPoupancaEViagem = async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/contas")
        if (!response.ok) throw new Error("Erro ao buscar contas")
        const data = await response.json()

        const poupanca = data.filter((c: Conta) => c.tipo === "poupanca")
        const viagem = data.filter((c: Conta) => c.tipo === "viagem")

        const totalPoupanca = poupanca.reduce((sum: number, c: Conta) => sum + c.valor, 0)
        const totalViagem = viagem.reduce((sum: number, c: Conta) => sum + c.valor, 0)

        setDataPoupanca({ totalDepositado: totalPoupanca })
        setDataViagem({ totalDepositado: totalViagem })
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar poupança e viagem:", error)
    }
  }

  const addConta = async (novaConta: Omit<Conta, "id">) => {
    try {
      if (isOnline) {
        const response = await fetch("/api/contas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novaConta),
        })

        if (!response.ok) throw new Error("Erro ao adicionar conta")

        toast({
          title: "Sucesso",
          description: "Conta adicionada com sucesso!",
        })
      } else {
        // Adicionar à fila de operações pendentes
        await offlineStorage.addPendingOperation({
          type: "insert",
          table: "contas",
          data: novaConta,
        })

        toast({
          title: "Salvo Offline",
          description: "Conta será adicionada quando você estiver online.",
        })
      }

      fetchContas()
      fetchSaldo()
      fetchTransacoes()
      fetchPoupancaEViagem()
      setDialogOpen(false)
    } catch (error) {
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
        description: `${formatarMoeda(valor)} adicionado ao seu saldo!`,
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

  const editConta = async (id: string, contaAtualizada: Partial<Conta>) => {
    try {
      const response = await fetch(`/api/contas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contaAtualizada),
      })

      if (!response.ok) throw new Error("Erro ao atualizar conta")

      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso!",
      })

      await fetchContas()
      await fetchTransacoes()
    } catch (error) {
      console.error("[v0] Erro ao editar conta:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta.",
        variant: "destructive",
      })
    }
  }

  const abrirModalWhatsApp = (titulo: string, conteudo: string) => {
    const mensagem = `*${titulo}*\n\n${conteudo}\n\n_Financeiro Gonçalves_`
    setMensagemWhatsApp(mensagem)
    setWhatsappDialogOpen(true)
  }

  const diaAtual = hoje.getDate()

  const contasProximasVencimento = contas.filter((conta) => {
    if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") return false
    const isPago = conta.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)
    if (isPago) return false

    const diasParaVencimento = conta.vencimento - diaAtual
    return diasParaVencimento > 0 && diasParaVencimento <= 3
  })

  const contasAtrasadas = contas.filter((conta) => {
    if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") return false
    const isPago = conta.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)
    if (isPago) return false

    let dataVencimento: Date

    if (conta.tipo === "parcelada") {
      const inicio = conta.dataInicio
        ? new Date(conta.dataInicio + "T00:00:00")
        : new Date(conta.createdAt + "T00:00:00" || new Date())
      const mesInicio = inicio.getMonth()
      const anoInicio = inicio.getFullYear()

      const mesesPassados = (anoSelecionado - anoInicio) * 12 + (mesSelecionado - mesInicio)

      const mesVencimento = mesInicio + mesesPassados
      const anoVencimento = anoInicio + Math.floor(mesVencimento / 12)
      const mesVencimentoFinal = mesVencimento % 12

      dataVencimento = new Date(anoVencimento, mesVencimentoFinal, conta.vencimento)
    } else {
      dataVencimento = new Date(anoSelecionado, mesSelecionado - 1, conta.vencimento)
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return dataVencimento < hoje
  })

  const contasMesAtual = contas.filter((conta) => {
    if (mostrarApenasHoje) {
      const hoje = getDataAtualBrasil()
      const diaHoje = hoje.getDate()
      const mesHoje = hoje.getMonth() + 1
      const anoHoje = hoje.getFullYear()

      if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") {
        if (!conta.dataGasto && !conta.data_gasto) return false
        const dataGasto = new Date((conta.dataGasto || conta.data_gasto!) + "T00:00:00")
        return (
          dataGasto.getDate() === diaHoje && dataGasto.getMonth() + 1 === mesHoje && dataGasto.getFullYear() === anoHoje
        )
      }

      if (conta.tipo === "fixa") {
        return conta.vencimento === diaHoje && mesHoje === mesSelecionado && anoHoje === anoSelecionado
      }

      if (conta.tipo === "parcelada") {
        const dataInicioStr = conta.dataInicio || conta.createdAt
        if (!dataInicioStr) return false

        const inicio = new Date(dataInicioStr + "T00:00:00")
        const mesesDiferenca = (anoHoje - inicio.getFullYear()) * 12 + (mesHoje - inicio.getMonth() - 1)
        const parcelaAtual = mesesDiferenca + 1

        const parcelaVenceHoje = parcelaAtual >= 1 && parcelaAtual <= (conta.parcelas || 0)
        return parcelaVenceHoje && conta.vencimento === diaHoje
      }

      return false
    }

    if (conta.tipo === "fixa") return true

    if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") {
      if (!conta.dataGasto && !conta.data_gasto) return false
      const dataGasto = new Date((conta.dataGasto || conta.data_gasto!) + "T00:00:00")
      return dataGasto.getMonth() + 1 === mesSelecionado && dataGasto.getFullYear() === anoSelecionado
    }

    if (conta.tipo === "caixinha") {
      if (!conta.dataGasto && !conta.data_gasto) return false
      const dataGasto = new Date((conta.dataGasto || conta.data_gasto!) + "T00:00:00")
      return dataGasto.getMonth() + 1 === mesSelecionado && dataGasto.getFullYear() === anoSelecionado
    }

    if (conta.tipo === "parcelada") {
      const dataInicioStr = conta.dataInicio || conta.createdAt

      if (!dataInicioStr) {
        return false
      }

      const inicio = new Date(dataInicioStr + "T00:00:00")
      const dataBase = new Date(anoSelecionado, mesSelecionado - 1, 1)

      const mesesDiferenca =
        (dataBase.getFullYear() - inicio.getFullYear()) * 12 + (dataBase.getMonth() - inicio.getMonth())
      const parcelaAtual = mesesDiferenca + 1

      return parcelaAtual >= 1 && parcelaAtual <= (conta.parcelas || 0)
    }

    return false
  })

  const totalMes = contasMesAtual.reduce((sum, conta) => sum + conta.valor, 0)
  const pagas = contasMesAtual.filter((conta) => {
    if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") return true
    return conta.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)
  }).length

  const totalPago = contasMesAtual
    .filter((conta) => {
      if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") return true
      return conta.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)
    })
    .reduce((sum, conta) => sum + conta.valor, 0)

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

  const totalPoupanca = dataPoupanca?.totalDepositado || 0
  const totalViagem = dataViagem?.totalDepositado || 0

  // Removendo metaCaixinha e totalDepositado pois foram substituídos por totalPoupanca e totalViagem
  // const metaCaixinha = useMemo(() => {
  //   console.log("[v0] Debug meta caixinha:", {
  //     dataCaixinha,
  //     config: dataCaixinha?.config,
  //     meta_valor: dataCaixinha?.config?.meta_valor,
  //   })
  //   if (!dataCaixinha?.config?.meta_valor) return 0
  //   return Number(dataCaixinha.config.meta_valor)
  // }, [dataCaixinha])

  // const totalDepositado = dataCaixinha?.totalDepositado || 0

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <InstallPrompt />
      <OfflineIndicator />

      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Contas a Pagar</h1>
              <p className="text-muted-foreground mt-1">Gerencie suas contas fixas e parceladas</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button onClick={() => setDialogOpen(true)} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta
                </Button>
                {/* <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                >
                  <Link href="/caixinha">
                    <PiggyBank className="mr-2 h-4 w-4" />
                    Caixinha
                  </Link>
                </Button> */}
                <Button asChild size="lg" variant="outline">
                  <Link href="/relatorios">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Relatórios
                  </Link>
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
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
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
            <Alert variant="destructive" className="dark:bg-red-950 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="dark:text-red-100">Alerta: Contas Atrasadas</AlertTitle>
              <AlertDescription className="dark:text-red-200">
                Você tem {contasAtrasadas.length} conta(s) atrasada(s): {contasAtrasadas.map((c) => c.nome).join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 border-amber-300 dark:border-amber-700 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Poupança</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                    onClick={() =>
                      abrirModalWhatsApp(
                        "💰 Poupança",
                        `📊 *Saldo em Poupança*\n\n💰 *Total Poupado:* ${formatarMoeda(totalPoupanca)}\n\nContinue economizando! 🚀`,
                      )
                    }
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <PiggyBank className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {formatarMoeda(totalPoupanca)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-950 dark:via-cyan-950 dark:to-sky-950 border-blue-300 dark:border-blue-700 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Viagem</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={() =>
                      abrirModalWhatsApp(
                        "✈️ Viagem",
                        `📊 *Fundo para Viagens*\n\n✈️ *Total Economizado:* ${formatarMoeda(totalViagem)}\n\nSua próxima aventura está chegando! 🌍`,
                      )
                    }
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Plane className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatarMoeda(totalViagem)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                  Crédito Disponível
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                    onClick={() =>
                      abrirModalWhatsApp(
                        "💳 Crédito Disponível",
                        `💰 *Saldo Atual*\n\n💵 *Valor Disponível:* ${formatarMoeda(saldo)}\n📊 *Status:* ${saldo > 0 ? "✅ Positivo" : saldo < 0 ? "⚠️ Negativo" : "⚡ Zerado"}\n${saldo < 0 ? `\n🔴 *Atenção:* Você está com saldo negativo de ${formatarMoeda(Math.abs(saldo))}` : ""}\n\n_Gerencie bem seus recursos!_ 💪`,
                      )
                    }
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{formatarMoeda(saldo)}</div>
                <Button
                  onClick={() => setCreditoDialogOpen(true)}
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-xs text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar crédito
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card border-border dark:border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Total Pago</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                    onClick={() => {
                      const percentualPago = totalMes > 0 ? ((totalPago / totalMes) * 100).toFixed(1) : "0"
                      abrirModalWhatsApp(
                        "✅ Total Pago",
                        `📊 *Resumo de Pagamentos - ${meses[mesSelecionado - 1]}/${anoSelecionado}*\n\n✅ *Total Pago:* ${formatarMoeda(totalPago)}\n📝 *Contas Pagas:* ${pagas} de ${contasMesAtual.length}\n📈 *Percentual:* ${percentualPago}%\n💰 *Total do Mês:* ${formatarMoeda(totalMes)}\n\n${pagas === contasMesAtual.length ? "🎉 *Parabéns! Todas as contas foram pagas!*" : `⏳ *Faltam ${contasMesAtual.length - pagas} conta(s) para quitar*`}`,
                      )
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Calendar className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground dark:text-foreground">
                  {formatarMoeda(totalPago)}
                </div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  {pagas} de {contasMesAtual.length} contas pagas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card border-border dark:border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">
                  Total Pendente
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                    onClick={() =>
                      abrirModalWhatsApp(
                        "⏳ Total Pendente",
                        `📊 *Contas Pendentes - ${meses[mesSelecionado - 1]}/${anoSelecionado}*\n\n⏳ *Total Pendente:* ${formatarMoeda(totalMes - totalPago)}\n📝 *Contas Pendentes:* ${contasMesAtual.length - pagas} de ${contasMesAtual.length}\n${contasAtrasadas.length > 0 ? `\n🔴 *Atenção:* ${contasAtrasadas.length} conta(s) atrasada(s)` : ""}\n\nFique em dia com seus compromissos! 💪`,
                      )
                    }
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <TrendingUp className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground dark:text-foreground">
                  {formatarMoeda(totalMes - totalPago)}
                </div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  {contasMesAtual.length - pagas} pendentes
                </p>
              </CardContent>
            </Card>
          </div>

          <ListaTransacoes
            transacoes={transacoes}
            contas={contas}
            onTogglePago={togglePago}
            onDelete={deleteConta}
            onAddPagamento={addPagamento}
            onEdit={editConta}
            mesSelecionado={mesSelecionado}
            anoSelecionado={anoSelecionado}
            onMesChange={setMesSelecionado}
            onAnoChange={setAnoSelecionado}
            mostrarApenasHoje={mostrarApenasHoje}
            onToggleMostrarHoje={setMostrarApenasHoje}
          />
        </div>
      </div>

      <AddContaDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addConta} />
      <AddCreditoDialog open={creditoDialogOpen} onOpenChange={setCreditoDialogOpen} onAdd={addCredito} />
      <WhatsAppSendDialog
        open={whatsappDialogOpen}
        onOpenChange={setWhatsappDialogOpen}
        mensagemInicial={mensagemWhatsApp}
      />
    </div>
  )
}
