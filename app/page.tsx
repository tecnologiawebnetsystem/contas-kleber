"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut } from "lucide-react" // Import the LogOut icon
import {
  Plus,
  Calendar,
  TrendingUp,
  Search,
  AlertCircle,
  Wallet,
  Share2,
  PiggyBank,
  BarChart3,
  Plane,
  PlusCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type { Conta } from "@/types/conta"
import { ListaTransacoes } from "@/components/lista-transacoes"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { offlineStorage } from "@/lib/offline/storage"
import { mutate } from "swr"
import { formatarMoeda } from "@/utils/formatar-moeda" // Import the formatarMoeda function
import { OnlineStatus } from "@/components/online-status"
import { AddContaDialog } from "@/components/add-conta-dialog"

export default function Home() {
  const { user, logout } = useAuth()
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
  const router = useRouter()
  const isOnline = useOnlineStatus()

  const hoje = new Date()
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1)
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear())
  const [mostrarApenasHoje, setMostrarApenasHoje] = useState(false)

  // Permissões baseadas no perfil - Pamela tem apenas visualização
  const isPamela = user?.nome === "Pamela Gonçalves"
  const podeEditar = !isPamela

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
        if (!response.ok) {
          const text = await response.text()
          console.error("[v0] Erro na resposta do saldo:", text)
          throw new Error("Erro ao buscar saldo")
        }
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
        if (!response.ok) {
          const text = await response.text()
          console.error("[v0] Erro na resposta das contas:", text)
          throw new Error("Erro ao buscar contas")
        }
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
        if (!response.ok) {
          const text = await response.text()
          console.error("[v0] Erro na resposta das transações:", text)
          throw new Error("Erro ao buscar transações")
        }
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

  const fetchPoupancaEViagem = async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/contas")
        if (!response.ok) {
          throw new Error("Erro ao buscar contas")
        }
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

      console.log("[v0] Iniciando pagamento para conta:", id, "mes:", mes, "ano:", ano)

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

      console.log("[v0] Pagamento registrado com sucesso, recarregando dados...")

      await Promise.all([fetchTransacoes(), fetchContas()])

      // Força atualização do SWR cache se estiver sendo usado
      mutate("/api/contas")
      mutate("/api/transacoes")

      console.log("[v0] Dados recarregados após pagamento")

      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      })
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

  const handleSair = () => {
    logout()
    router.push("/login")
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
      const hoje = new Date()
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-4 md:p-6">
        <Card className="shadow-2xl border-2">
          <CardContent className="p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-2xl md:text-3xl font-bold ${
                      user?.nome === "Kleber Gonçalves"
                        ? "text-green-700 dark:text-green-500"
                        : user?.nome === "Pamela Gonçalves"
                          ? "text-pink-600 dark:text-pink-400"
                          : ""
                    }`}
                  >
                    {user?.nome || "Usuário"}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <OnlineStatus userName={user?.nome} />
                  <ThemeToggle />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {podeEditar && (
                    <Button
                      onClick={() => setDialogOpen(true)}
                      size="sm"
                      className="w-[155px] bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Nova Conta
                    </Button>
                  )}

                  {podeEditar && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-[155px] bg-transparent"
                      onClick={() => router.push("/relatorios")}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Relatórios
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-[155px] bg-transparent"
                    onClick={() => router.push("/consulta")}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Consultar
                  </Button>

                  {podeEditar && (
                    <Button
                      onClick={() => setCreditoDialogOpen(true)}
                      size="sm"
                      className="w-[155px] bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Crédito
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    logout()
                    router.push("/login")
                  }}
                  className="shrink-0 bg-transparent"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-purple-950 dark:via-violet-950 dark:to-fuchsia-950 border-purple-200 dark:border-purple-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-purple-900 dark:text-purple-100">Poupança</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                      onClick={() =>
                        abrirModalWhatsApp(
                          "💰 Poupança",
                          `📊 *Saldo em Poupança*\n\n💰 *Total Poupado:* ${formatarMoeda(totalPoupanca)}\n\nContinue economizando! 🚀`,
                        )
                      }
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <PiggyBank className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-xl font-bold text-amber-900 dark:text-amber-100">
                    {formatarMoeda(totalPoupanca)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-950 dark:via-cyan-950 dark:to-sky-950 border-blue-300 dark:border-blue-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-blue-900 dark:text-blue-100">Viagem</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      onClick={() =>
                        abrirModalWhatsApp(
                          "✈️ Viagem",
                          `📊 *Fundo para Viagens*\n\n✈️ *Total Economizado:* ${formatarMoeda(totalViagem)}\n\nSua próxima aventura está chegando! 🌍`,
                        )
                      }
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Plane className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatarMoeda(totalViagem)}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-green-900 dark:text-green-100">
                    Crédito Disponível
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      onClick={() => {
                        const percentualPago = totalMes > 0 ? ((totalPago / totalMes) * 100).toFixed(1) : "0"
                        abrirModalWhatsApp(
                          "💳 Crédito Disponível",
                          `💰 *Saldo Atual*\n\n💵 *Valor Disponível:* ${formatarMoeda(saldo)}\n📊 *Status:* ${saldo > 0 ? "✅ Positivo" : saldo < 0 ? "⚠️ Negativo" : "⚡ Zerado"}\n${saldo < 0 ? `\n🔴 *Atenção:* Você está com saldo negativo de ${formatarMoeda(Math.abs(saldo))}` : ""}\n\n_Gerencie bem seus recursos!_ 💪`,
                        )
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Wallet className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">{formatarMoeda(saldo)}</div>
                </CardContent>
              </Card>

              <Card
                className={
                  user?.nome === "Pamela Gonçalves"
                    ? "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-pink-200 dark:border-pink-800"
                    : "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-indigo-200 dark:border-indigo-800"
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle
                    className={`text-xs font-medium ${user?.nome === "Pamela Gonçalves" ? "text-pink-900 dark:text-pink-100" : "text-indigo-900 dark:text-indigo-100"}`}
                  >
                    Total Pago
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 ${user?.nome === "Pamela Gonçalves" ? "text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300" : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"}`}
                      onClick={() => {
                        const percentualPago = totalMes > 0 ? ((totalPago / totalMes) * 100).toFixed(1) : "0"
                        abrirModalWhatsApp(
                          "✅ Total Pago",
                          `📊 *Resumo de Pagamentos - ${meses[mesSelecionado - 1]}/${anoSelecionado}*\n\n✅ *Total Pago:* ${formatarMoeda(totalPago)}\n📝 *Contas Pagas:* ${pagas} de ${contasMesAtual.length}\n📈 *Percentual:* ${percentualPago}%\n💰 *Total do Mês:* ${formatarMoeda(totalMes)}\n\n${pagas === contasMesAtual.length ? "🎉 *Parabéns! Todas as contas foram pagas!*" : `⏳ *Faltam ${contasMesAtual.length - pagas} conta(s) para quitar*`}`,
                        )
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Calendar
                      className={`h-3 w-3 ${user?.nome === "Pamela Gonçalves" ? "text-pink-600 dark:text-pink-400" : "text-indigo-600 dark:text-indigo-400"}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div
                    className={`text-xl font-bold ${user?.nome === "Pamela Gonçalves" ? "text-pink-900 dark:text-pink-100" : "text-indigo-900 dark:text-indigo-100"}`}
                  >
                    {formatarMoeda(totalPago)}
                  </div>
                  <p
                    className={`text-xs mt-1 ${user?.nome === "Pamela Gonçalves" ? "text-pink-700 dark:text-pink-300" : "text-indigo-700 dark:text-indigo-300"}`}
                  >
                    {pagas} de {contasMesAtual.length} contas pagas
                  </p>
                </CardContent>
              </Card>

              <Card
                className={
                  user?.nome === "Pamela Gonçalves"
                    ? "bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-950 dark:to-purple-950 border-fuchsia-200 dark:border-fuchsia-800"
                    : "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 border-teal-200 dark:border-teal-800"
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle
                    className={`text-xs font-medium ${user?.nome === "Pamela Gonçalves" ? "text-fuchsia-900 dark:text-fuchsia-100" : "text-teal-900 dark:text-teal-100"}`}
                  >
                    Total Pendente
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 ${user?.nome === "Pamela Gonçalves" ? "text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300" : "text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"}`}
                      onClick={() =>
                        abrirModalWhatsApp(
                          "⏳ Total Pendente",
                          `📊 *Contas Pendentes - ${meses[mesSelecionado - 1]}/${anoSelecionado}*\n\n⏳ *Total Pendente:* ${formatarMoeda(totalMes - totalPago)}\n📝 *Contas Pendentes:* ${contasMesAtual.length - pagas} de ${contasMesAtual.length}\n${contasAtrasadas.length > 0 ? `\n🔴 *Atenção:* ${contasAtrasadas.length} conta(s) atrasada(s)` : ""}\n\nFique em dia com seus compromissos! 💪`,
                        )
                      }
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <TrendingUp
                      className={`h-3 w-3 ${user?.nome === "Pamela Gonçalves" ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-teal-600 dark:text-teal-400"}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div
                    className={`text-xl font-bold ${user?.nome === "Pamela Gonçalves" ? "text-fuchsia-900 dark:text-fuchsia-100" : "text-teal-900 dark:text-teal-100"}`}
                  >
                    {formatarMoeda(totalMes - totalPago)}
                  </div>
                  <p
                    className={`text-xs mt-1 ${user?.nome === "Pamela Gonçalves" ? "text-fuchsia-700 dark:text-fuchsia-300" : "text-teal-700 dark:text-teal-300"}`}
                  >
                    {contasMesAtual.length - pagas} pendentes
                  </p>
                </CardContent>
              </Card>
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
                  Você tem {contasAtrasadas.length} conta(s) atrasada(s):{" "}
                  {contasAtrasadas.map((c) => c.nome).join(", ")}
                </AlertDescription>
              </Alert>
            )}

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
              abrirModalWhatsApp={abrirModalWhatsApp}
              userName={user?.nome}
            />
          </CardContent>
        </Card>
        {/* Dialog for adding a new account */}
        <AddContaDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addConta} user={user} />
      </div>
    </main>
  )
}
