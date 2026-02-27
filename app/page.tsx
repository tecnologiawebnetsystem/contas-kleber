"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { LogOut } from "lucide-react"
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
  Car,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Clock,
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
import { formatarMoeda } from "@/utils/formatar-moeda"
import { OnlineStatus } from "@/components/online-status"
import { AddContaDialog } from "@/components/add-conta-dialog"
import { AddCreditoDialog } from "@/components/add-credito-dialog"

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
  const [totalPagoCarro, setTotalPagoCarro] = useState(0)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("")
  const router = useRouter()
  const isOnline = useOnlineStatus()

  const hoje = new Date()
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1)
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear())
  const [mostrarApenasHoje, setMostrarApenasHoje] = useState(false)

  const isPamela = user?.nome === "Pamela Goncalves"
  const podeEditar = !isPamela
  const isKleber = user?.pin === "080754"

  useEffect(() => {
    fetchContas()
    fetchSaldo()
    fetchTransacoes()
    fetchPoupancaEViagem()
    fetchTotalCarro()
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
          description: "Nao foi possivel carregar as contas.",
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
          console.error("[v0] Erro na resposta das transacoes:", text)
          throw new Error("Erro ao buscar transacoes")
        }
        const data = await response.json()
        setTransacoes(data)
        await offlineStorage.saveTransacoes(data)
      } else {
        const cachedTransacoes = await offlineStorage.getTransacoes()
        setTransacoes(cachedTransacoes)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar transacoes:", error)
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
      console.error("[v0] Erro ao buscar poupanca e viagem:", error)
    }
  }

  const fetchTotalCarro = async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/carro")
        if (!response.ok) {
          throw new Error("Erro ao buscar pagamentos do carro")
        }
        const data = await response.json()
        const total = data.reduce((sum: number, p: any) => sum + Number(p.valor), 0)
        setTotalPagoCarro(total)
        await offlineStorage.savePagamentosCarro(data)
      } else {
        const cachedData = await offlineStorage.getPagamentosCarro()
        const total = cachedData.reduce((sum: number, p: any) => sum + Number(p.valor), 0)
        setTotalPagoCarro(total)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar total do carro:", error)
      try {
        const cachedData = await offlineStorage.getPagamentosCarro()
        const total = cachedData.reduce((sum: number, p: any) => sum + Number(p.valor), 0)
        setTotalPagoCarro(total)
      } catch {
        console.error("[v0] Erro ao carregar cache do carro")
      }
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
        await offlineStorage.addPendingOperation({
          type: "insert",
          table: "contas",
          data: novaConta,
        })

        toast({
          title: "Salvo Offline",
          description: "Conta sera adicionada quando voce estiver online.",
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
        description: "Nao foi possivel adicionar a conta.",
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

      if (!response.ok) throw new Error("Erro ao adicionar credito")

      const data = await response.json()
      setSaldo(data.novoSaldo)

      toast({
        title: "Sucesso",
        description: `${formatarMoeda(valor)} adicionado ao seu saldo!`,
      })

      await fetchTransacoes()
      setCreditoDialogOpen(false)
    } catch (error) {
      console.error("[v0] Erro ao adicionar credito:", error)
      toast({
        title: "Erro",
        description: "Nao foi possivel adicionar credito.",
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
        description: error instanceof Error ? error.message : "Nao foi possivel atualizar o pagamento.",
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

      await Promise.all([fetchTransacoes(), fetchContas()])

      mutate("/api/contas")
      mutate("/api/transacoes")

      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao adicionar pagamento:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Nao foi possivel registrar o pagamento.",
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
        description: "Nao foi possivel remover a conta.",
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
        description: "Nao foi possivel atualizar a conta.",
        variant: "destructive",
      })
    }
  }

  const abrirModalWhatsApp = (titulo: string, conteudo: string) => {
    const mensagem = `*${titulo}*\n\n${conteudo}\n\n_Talent Money Family_`
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
    "Marco",
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

  const percentualPago = totalMes > 0 ? Math.round((totalPago / totalMes) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando contas...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo variant="full" size="sm" />
            <div className="flex items-center gap-2">
              <OnlineStatus userName={user?.nome} />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section + Quick Actions */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Ola, <span className="text-gradient">{user?.nome?.split(" ")[0] || "Usuario"}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {meses[mesSelecionado - 1]} de {anoSelecionado} - {contasMesAtual.length} contas no mes
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {podeEditar && (
              <Button
                onClick={() => setDialogOpen(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            )}
            {podeEditar && (
              <Button
                onClick={() => setCreditoDialogOpen(true)}
                size="sm"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Credito
              </Button>
            )}
            {podeEditar && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/relatorios")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Relatorios
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/consulta")}
            >
              <Search className="mr-2 h-4 w-4" />
              Consultar
            </Button>
          </div>
        </section>

        {/* Alerts */}
        {contasAtrasadas.length > 0 && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-heading">Alerta: Contas Atrasadas</AlertTitle>
            <AlertDescription>
              Voce tem {contasAtrasadas.length} conta(s) atrasada(s):{" "}
              {contasAtrasadas.map((c) => c.nome).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {contasProximasVencimento.length > 0 && (
          <Alert className="border-accent/50 bg-accent/5">
            <Clock className="h-4 w-4 text-accent" />
            <AlertTitle className="font-heading text-accent">Proximas do vencimento</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {contasProximasVencimento.length} conta(s) vencendo nos proximos 3 dias:{" "}
              {contasProximasVencimento.map((c) => c.nome).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Credito Disponivel - Primary card */}
          <Card className="border-primary/20 bg-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Credito Disponivel</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    abrirModalWhatsApp(
                      "Credito Disponivel",
                      `Saldo Atual\n\nValor Disponivel: ${formatarMoeda(saldo)}\nStatus: ${saldo > 0 ? "Positivo" : saldo < 0 ? "Negativo" : "Zerado"}`
                    )
                  }}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                <Wallet className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className={`text-xl font-bold font-heading ${saldo >= 0 ? "text-foreground" : "text-destructive"}`}>
                {formatarMoeda(saldo)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {saldo >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-primary" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">
                  {saldo >= 0 ? "Positivo" : "Negativo"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Pago */}
          <Card className="border-border/50 bg-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1e3a5f]" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Pago</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-[#1e3a5f]"
                  onClick={() => {
                    abrirModalWhatsApp(
                      "Total Pago",
                      `Resumo de Pagamentos - ${meses[mesSelecionado - 1]}/${anoSelecionado}\n\nTotal Pago: ${formatarMoeda(totalPago)}\nContas Pagas: ${pagas} de ${contasMesAtual.length}\nPercentual: ${percentualPago}%`
                    )
                  }}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                <Calendar className="h-3.5 w-3.5 text-[#1e3a5f] dark:text-[#3b82f6]" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold font-heading text-foreground">
                {formatarMoeda(totalPago)}
              </div>
              <p className="text-xs mt-1 text-muted-foreground">
                {pagas} de {contasMesAtual.length} pagas
              </p>
            </CardContent>
          </Card>

          {/* Total Pendente */}
          <Card className="border-border/50 bg-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Pendente</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-accent"
                  onClick={() =>
                    abrirModalWhatsApp(
                      "Total Pendente",
                      `Contas Pendentes - ${meses[mesSelecionado - 1]}/${anoSelecionado}\n\nTotal Pendente: ${formatarMoeda(totalMes - totalPago)}\nContas Pendentes: ${contasMesAtual.length - pagas} de ${contasMesAtual.length}`
                    )
                  }
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                <TrendingUp className="h-3.5 w-3.5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold font-heading text-foreground">
                {formatarMoeda(totalMes - totalPago)}
              </div>
              <p className="text-xs mt-1 text-muted-foreground">
                {contasMesAtual.length - pagas} pendentes
              </p>
            </CardContent>
          </Card>

          {/* Poupanca */}
          <Card className="border-border/50 bg-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#f59e0b]" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Poupanca</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-[#f59e0b]"
                  onClick={() =>
                    abrirModalWhatsApp(
                      "Poupanca",
                      `Saldo em Poupanca\n\nTotal Poupado: ${formatarMoeda(totalPoupanca)}`
                    )
                  }
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                <PiggyBank className="h-3.5 w-3.5 text-[#f59e0b]" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold font-heading text-foreground">
                {formatarMoeda(totalPoupanca)}
              </div>
            </CardContent>
          </Card>

          {/* Viagem */}
          <Card className="border-border/50 bg-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#0ea5e9]" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Viagem</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-[#0ea5e9]"
                  onClick={() =>
                    abrirModalWhatsApp(
                      "Viagem",
                      `Fundo para Viagens\n\nTotal Economizado: ${formatarMoeda(totalViagem)}`
                    )
                  }
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                <Plane className="h-3.5 w-3.5 text-[#0ea5e9]" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold font-heading text-foreground">
                {formatarMoeda(totalViagem)}
              </div>
            </CardContent>
          </Card>

          {/* Carro */}
          <Card
            className="border-border/50 bg-card relative overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => router.push("/carro")}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-muted-foreground" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Carro</CardTitle>
              <Car className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold font-heading text-foreground">
                {formatarMoeda(totalPagoCarro)}
              </div>
              <p className="text-xs mt-1 text-muted-foreground">Total pago</p>
            </CardContent>
          </Card>
        </section>

        {/* Progress Bar */}
        <section>
          <Card className="border-border/50 bg-card">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground font-heading">Progresso do Mes</span>
                <span className="text-sm font-bold text-primary">{percentualPago}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${percentualPago}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{pagas} pagas</span>
                <span>{contasMesAtual.length - pagas} pendentes</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Transactions List */}
        <section>
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
        </section>
      </div>

      {/* Dialog for adding a new account */}
      <AddContaDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addConta} user={user} />
      <AddCreditoDialog open={creditoDialogOpen} onOpenChange={setCreditoDialogOpen} onAdd={addCredito} />
    </main>
  )
}
