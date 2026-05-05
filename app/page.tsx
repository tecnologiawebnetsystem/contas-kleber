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
  Scale,
  Briefcase,
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
import { PoupancaDialog } from "@/components/poupanca-dialog"
import { ViagemDialog } from "@/components/viagem-dialog"

export default function Home() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [contas, setContas] = useState<Conta[]>([])
  const [saldo, setSaldo] = useState(0)
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creditoDialogOpen, setCreditoDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  // Poupanca e viagem sao derivados diretamente do state de contas — sem fetch extra
  const [dataPoupanca, setDataPoupanca] = useState<any | null>(null)
  const [dataViagem, setDataViagem] = useState<any | null>(null)
  const [totalPagoCarro, setTotalPagoCarro] = useState(0)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("")
  const [emprestimoDialogOpen, setEmprestimoDialogOpen] = useState(false)
  const [poupancaDialogOpen, setPoupancaDialogOpen] = useState(false)
  const [viagemDialogOpen, setViagemDialogOpen] = useState(false)
  const [totalEmprestado, setTotalEmprestado] = useState(0)
  const [totalConsultorias, setTotalConsultorias] = useState(0)
  const router = useRouter()
  const isOnline = useOnlineStatus()

  const hoje = new Date()
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1)
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear())
  const [mostrarApenasHoje, setMostrarApenasHoje] = useState(false)

  // Perfil 1 = acesso total (Kleber), Perfil 2 = consulta (Pamela)
  const temAcessoTotal = user?.perfil === 1
  const podeEditar = temAcessoTotal

  useEffect(() => {
    // Carregar dados criticos primeiro (saldo + contas), depois secundarios em sequencia
    // para evitar ER_TOO_MANY_USER_CONNECTIONS no MySQL compartilhado do HostGator
    const carregarDados = async () => {
      await fetchSaldo()
      await fetchContas()
      fetchTransacoes()
      fetchEmprestimos()
      fetchConsultorias()
      fetchTotalCarro()
    }
    carregarDados()
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
        // Calcular poupanca e viagem a partir dos dados ja carregados (sem fetch extra)
        const totalPoupanca = data.filter((c: Conta) => c.tipo === "poupanca").reduce((s: number, c: Conta) => s + c.valor, 0)
        const totalViagem = data.filter((c: Conta) => c.tipo === "viagem").reduce((s: number, c: Conta) => s + c.valor, 0)
        setDataPoupanca({ totalDepositado: totalPoupanca })
        setDataViagem({ totalDepositado: totalViagem })
      } else {
        const cachedContas = await offlineStorage.getContas()
        setContas(cachedContas)
        const totalPoupanca = cachedContas.filter((c: Conta) => c.tipo === "poupanca").reduce((s: number, c: Conta) => s + c.valor, 0)
        const totalViagem = cachedContas.filter((c: Conta) => c.tipo === "viagem").reduce((s: number, c: Conta) => s + c.valor, 0)
        setDataPoupanca({ totalDepositado: totalPoupanca })
        setDataViagem({ totalDepositado: totalViagem })
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



  const fetchConsultorias = async () => {
    try {
      const res = await fetch("/api/consultorias")
      if (res.ok) {
        const data = await res.json()
        setTotalConsultorias(Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar consultorias:", error)
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

      fetchContas() // fetchContas ja calcula poupanca e viagem internamente
      fetchSaldo()
      fetchTransacoes()
      setDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro",
          description: "Não foi possível adicionar a conta.",
        variant: "destructive",
      })
    }
  }

  const addCredito = async (valor: number, descricao: string, dataTransacao: string, consultoriaId?: string) => {
    try {
      const response = await fetch("/api/saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor, descricao, data_transacao: dataTransacao, consultoria_id: consultoriaId }),
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
          description: "Não foi possível adicionar crédito.",
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
      const rawInicio = conta.dataInicio || conta.createdAt || new Date().toISOString()
      const inicio = typeof rawInicio === "string"
        ? (rawInicio.includes("T") ? new Date(rawInicio) : new Date(rawInicio + "T00:00:00"))
        : new Date()
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

  const percentualPago = totalMes > 0 ? Math.round((totalPago / totalMes) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">Carregando contas...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-14">
          <div className="flex items-center justify-between h-full">
            <Logo variant="full" size="sm" />
            <div className="flex items-center gap-1">
              <OnlineStatus userName={user?.nome} />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-5 space-y-4 max-w-2xl">

        {/* Welcome + Action Buttons */}
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground leading-tight">
              {'Ola, '}
              <span className="text-gradient">{user?.nome?.split(" ")[0] || "Usuario"}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {meses[mesSelecionado - 1]} de {anoSelecionado}
            </p>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-1.5">
              {podeEditar && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setDialogOpen(true)}
                      size="sm"
                      className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-full px-3 text-xs font-medium"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Nova Conta
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
                      className="h-9 w-9 rounded-full border-border/60 hover:bg-muted/60"
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
                      className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
          <div className="rounded-xl border-l-4 border-l-red-500 border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-start gap-3 fade-up">
            <div className="rounded-full bg-red-500/15 p-1.5 mt-0.5 shrink-0">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-500">
                {contasAtrasadas.length} conta{contasAtrasadas.length > 1 ? "s" : ""} atrasada{contasAtrasadas.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {contasAtrasadas.map((c) => c.nome).join(", ")}
              </p>
            </div>
          </div>
        )}

        {contasProximasVencimento.length > 0 && (
          <div className="rounded-xl border-l-4 border-l-amber-500 border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3 fade-up">
            <div className="rounded-full bg-amber-500/15 p-1.5 mt-0.5 shrink-0">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-500">
                {contasProximasVencimento.length} conta{contasProximasVencimento.length > 1 ? "s" : ""} vencendo em breve
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {contasProximasVencimento.map((c) => c.nome).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Hero Card - Credito Disponivel */}
        <section className="fade-up">
          <div className="rounded-2xl bg-card border border-border/50 p-5 relative overflow-hidden shadow-sm card-hover">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-secondary/5 translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

            <div className="relative">
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
                    Credito Disponivel
                  </p>
                  <p className={`text-3xl md:text-4xl font-bold font-heading tracking-tight ${saldo >= 0 ? "text-foreground" : "text-red-500"}`}>
                    {formatarMoeda(saldo)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {saldo >= 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="h-3 w-3" />
                        Positivo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <ArrowDownRight className="h-3 w-3" />
                        Negativo
                      </span>
                    )}
                  </div>
                </div>

                {/* Circular progress - always visible */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative h-16 w-16">
                    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
                      <circle
                        cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5"
                        className="text-primary"
                        strokeLinecap="round"
                        strokeDasharray={`${percentualPago * 1.634} ${163.4 - percentualPago * 1.634}`}
                        style={{ transition: "stroke-dasharray 0.7s ease-out" }}
                      />
                    </svg>
                    <Wallet className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-xs font-bold text-primary font-heading">{percentualPago}%</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/40">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total do mes</p>
                  <p className="text-sm font-bold font-heading text-foreground mt-0.5">{formatarMoeda(totalMes)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pago</p>
                  <p className="text-sm font-bold font-heading text-emerald-500 mt-0.5">{formatarMoeda(totalPago)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pendente</p>
                  <p className="text-sm font-bold font-heading text-amber-500 mt-0.5">{formatarMoeda(totalMes - totalPago)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${percentualPago}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {pagas} de {contasMesAtual.length} contas pagas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mini Cards Grid */}
        <section className="grid grid-cols-5 gap-2 fade-up">
          {/* Poupanca */}
          <button
            type="button"
            className="rounded-xl border border-border/50 bg-card p-3 text-left transition-all hover:border-amber-500/40 hover:shadow-md active:scale-95 group card-hover"
            onClick={() => setPoupancaDialogOpen(true)}
          >
            <div className="rounded-lg bg-amber-500/10 p-2 w-fit mb-2">
              <PiggyBank className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-none truncate">{'Poupan\u00e7a'}</p>
            <p className="text-xs font-bold font-heading text-foreground mt-1 truncate">{formatarMoeda(totalPoupanca)}</p>
          </button>

          {/* Viagem */}
          <button
            type="button"
            className="rounded-xl border border-border/50 bg-card p-3 text-left transition-all hover:border-sky-500/40 hover:shadow-md active:scale-95 group card-hover"
            onClick={() => setViagemDialogOpen(true)}
          >
            <div className="rounded-lg bg-sky-500/10 p-2 w-fit mb-2">
              <Plane className="h-4 w-4 text-sky-500" />
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-none">Viagem</p>
            <p className="text-xs font-bold font-heading text-foreground mt-1 truncate">{formatarMoeda(totalViagem)}</p>
          </button>

          {/* Carro */}
          <button
            type="button"
            className="rounded-xl border border-border/50 bg-card p-3 text-left transition-all hover:border-zinc-500/40 hover:shadow-md active:scale-95 group card-hover"
            onClick={() => router.push("/carro")}
          >
            <div className="rounded-lg bg-zinc-500/10 p-2 w-fit mb-2">
              <Car className="h-4 w-4 text-zinc-500" />
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-none">Carro</p>
            <p className="text-xs font-bold font-heading text-foreground mt-1 truncate">{formatarMoeda(totalPagoCarro)}</p>
          </button>

          {/* Advogado */}
          <button
            type="button"
            className="rounded-xl border border-border/50 bg-card p-3 text-left transition-all hover:border-indigo-500/40 hover:shadow-md active:scale-95 group card-hover"
            onClick={() => setEmprestimoDialogOpen(true)}
          >
            <div className="rounded-lg bg-indigo-500/10 p-2 w-fit mb-2">
              <Scale className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-none">Advogado</p>
            <p className="text-xs font-bold font-heading text-foreground mt-1 truncate">{formatarMoeda(totalEmprestado)}</p>
          </button>

          {/* Consultorias */}
          <button
            type="button"
            className="rounded-xl border border-border/50 bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-95 group card-hover"
            onClick={() => router.push("/consultorias")}
          >
            <div className="rounded-lg bg-primary/10 p-2 w-fit mb-2">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-none">Consultorias</p>
            <p className="text-xs font-bold font-heading text-foreground mt-1">
              {totalConsultorias} {totalConsultorias === 1 ? "ativa" : "ativas"}
            </p>
          </button>
        </section>

        {/* Transactions List */}
        <section className="pb-6">
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
            podeEditar={podeEditar}
          />
        </section>
      </div>

      {/* Dialogs */}
      <AddContaDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addConta} user={user} />
      <AddCreditoDialog open={creditoDialogOpen} onOpenChange={setCreditoDialogOpen} onAdd={addCredito} />
      <EmprestimoDialog open={emprestimoDialogOpen} onOpenChange={setEmprestimoDialogOpen} onUpdate={fetchEmprestimos} />
      <PoupancaDialog open={poupancaDialogOpen} onOpenChange={setPoupancaDialogOpen} onUpdate={fetchContas} />
      <ViagemDialog open={viagemDialogOpen} onOpenChange={setViagemDialogOpen} onUpdate={fetchContas} />
    </main>
  )
}
