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
  HandCoins,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { EmprestimoDialog } from "@/components/emprestimo-dialog"

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
  const [emprestimoDialogOpen, setEmprestimoDialogOpen] = useState(false)
  const [totalEmprestado, setTotalEmprestado] = useState(0)
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
    fetchEmprestimos()
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

  const fetchEmprestimos = async () => {
    try {
      const res = await fetch("/api/emprestimos")
      if (res.ok) {
        const data = await res.json()
        const pendentes = data.filter((e: any) => !e.devolvido)
        const total = pendentes.reduce((sum: number, e: any) => sum + Number(e.valor), 0)
        setTotalEmprestado(total)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar emprestimos:", error)
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
      let isPago = false
      if (conta?.tipo === "parcelada" && conta.pago !== undefined) {
        isPago = conta.pago
      } else {
        isPago = conta?.pagamentos?.some((p) => p.mes === mes && p.ano === ano) || false
      }

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

  // Helper: verifica se uma conta está paga (suporta parceladas expandidas da API)
  const isContaPaga = (conta: any) => {
    if (conta.tipo === "parcelada" && conta.pago !== undefined) {
      return conta.pago
    }
    return conta.pagamentos?.some((p: any) => p.mes === mesSelecionado && p.ano === anoSelecionado) || false
  }

  const contasProximasVencimento = contas.filter((conta) => {
    if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") return false
    if (isContaPaga(conta)) return false

    const diasParaVencimento = conta.vencimento - diaAtual
    return diasParaVencimento > 0 && diasParaVencimento <= 3
  })

  const contasAtrasadas = contas.filter((conta) => {
    if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") return false
    if (isContaPaga(conta)) return false

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
    return isContaPaga(conta)
  }).length

  const totalPago = contasMesAtual
    .filter((conta) => {
      if (conta.tipo === "diaria" || conta.tipo === "poupanca" || conta.tipo === "viagem") return true
      return isContaPaga(conta)
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
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo variant="full" size="sm" />
            <div className="flex items-center gap-1.5">
              <OnlineStatus userName={user?.nome} />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-5">
        {/* Welcome + Actions */}
        <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground text-balance">
              {'Olá, '}<span className="text-gradient">{user?.nome?.split(" ")[0] || "Usuario"}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {meses[mesSelecionado - 1]} de {anoSelecionado}
            </p>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-1">
              {podeEditar && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setDialogOpen(true)}
                      size="icon"
                      className="h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Nova Conta</TooltipContent>
                </Tooltip>
              )}
              {podeEditar && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setCreditoDialogOpen(true)}
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                    >
                      <CircleDollarSign className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Adicionar Credito</TooltipContent>
                </Tooltip>
              )}
              {podeEditar && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push("/relatorios")}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Relatorios</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push("/consulta")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Consultar</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </section>

        {/* Alerts */}
        {contasAtrasadas.length > 0 && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3">
            <div className="rounded-full bg-red-500/10 p-1.5 mt-0.5">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-500">
                {contasAtrasadas.length} conta(s) atrasada(s)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {contasAtrasadas.map((c) => c.nome).join(", ")}
              </p>
            </div>
          </div>
        )}

        {contasProximasVencimento.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
            <div className="rounded-full bg-amber-500/10 p-1.5 mt-0.5">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-500">
                {contasProximasVencimento.length} conta(s) vencendo em breve
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {contasProximasVencimento.map((c) => c.nome).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Hero Card - Credito Disponivel */}
        <section>
          <div className="rounded-xl border border-border/40 bg-card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credito Disponivel</p>
                <p className={`text-3xl md:text-4xl font-bold font-heading mt-1 ${saldo >= 0 ? "text-foreground" : "text-red-500"}`}>
                  {formatarMoeda(saldo)}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {saldo >= 0 ? (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Positivo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Negativo</span>
                    </div>
                  )}

                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Progresso</p>
                  <p className="text-lg font-bold text-primary font-heading">{percentualPago}%</p>
                </div>
                <div className="relative h-14 w-14">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/50" />
                    <circle
                      cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                      className="text-primary"
                      strokeLinecap="round"
                      strokeDasharray={`${percentualPago * 1.508} ${150.8 - percentualPago * 1.508}`}
                    />
                  </svg>
                  <Wallet className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
            {/* Progress Bar - mobile */}
            <div className="mt-4 md:hidden">
              <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
                  style={{ width: `${percentualPago}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                <span>{percentualPago}% concluido</span>
                <span>{contasMesAtual.length - pagas} pendentes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Mini Cards Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Poupanca */}
          <button
            type="button"
            className="rounded-xl border border-border/40 bg-card p-4 text-left transition-all hover:border-amber-500/30 hover:shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <PiggyBank className="h-4 w-4 text-amber-500" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  abrirModalWhatsApp("Poupanca", `Saldo em Poupanca\n\nTotal Poupado: ${formatarMoeda(totalPoupanca)}`)
                }}
              >
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Poupanca</p>
            <p className="text-lg font-bold font-heading text-foreground mt-0.5">{formatarMoeda(totalPoupanca)}</p>
          </button>

          {/* Viagem */}
          <button
            type="button"
            className="rounded-xl border border-border/40 bg-card p-4 text-left transition-all hover:border-sky-500/30 hover:shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-sky-500/10 p-2">
                <Plane className="h-4 w-4 text-sky-500" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  abrirModalWhatsApp("Viagem", `Fundo para Viagens\n\nTotal Economizado: ${formatarMoeda(totalViagem)}`)
                }}
              >
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Viagem</p>
            <p className="text-lg font-bold font-heading text-foreground mt-0.5">{formatarMoeda(totalViagem)}</p>
          </button>

          {/* Carro */}
          <button
            type="button"
            className="rounded-xl border border-border/40 bg-card p-4 text-left transition-all hover:border-muted-foreground/30 hover:shadow-sm group"
            onClick={() => router.push("/carro")}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-muted-foreground/10 p-2">
                <Car className="h-4 w-4 text-muted-foreground" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-muted-foreground">Carro</p>
            <p className="text-lg font-bold font-heading text-foreground mt-0.5">{formatarMoeda(totalPagoCarro)}</p>
          </button>

          {/* Emprestado */}
          <button
            type="button"
            className="rounded-xl border border-border/40 bg-card p-4 text-left transition-all hover:border-violet-500/30 hover:shadow-sm group"
            onClick={() => setEmprestimoDialogOpen(true)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <HandCoins className="h-4 w-4 text-violet-500" />
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-muted-foreground">Emprestado</p>
            <p className="text-lg font-bold font-heading text-foreground mt-0.5">{formatarMoeda(totalEmprestado)}</p>
          </button>
        </section>

        {/* Transactions List */}
        <section>
          <ListaTransacoes
            transacoes={transacoes}
            contas={contas}
            onTogglePago={togglePago}
            onDeleteConta={deleteConta}
            onAddPagamento={addPagamento}
            onUpdateConta={editConta}
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

      {/* Dialogs */}
      <AddContaDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addConta} user={user} />
      <AddCreditoDialog open={creditoDialogOpen} onOpenChange={setCreditoDialogOpen} onAdd={addCredito} />
      <EmprestimoDialog open={emprestimoDialogOpen} onOpenChange={setEmprestimoDialogOpen} onUpdate={fetchEmprestimos} />
      </main>
  )
}
