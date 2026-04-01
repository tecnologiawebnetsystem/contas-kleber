"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WhatsAppSendDialog } from "./whatsapp-send-dialog"
import { EmailCompartilharDialog } from "./email-compartilhar-dialog"
import {
  ArrowUpCircle,
  Trash2,
  Share2,
  Search,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Edit,
  Settings,
} from "lucide-react"
import { useState, useMemo } from "react"
import type { Conta } from "@/types/conta"
import { formatarMoeda } from "@/lib/utils"
import { EditContaDialog } from "./edit-conta-dialog"
import { EditParcelaDialog } from "./edit-parcela-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSwipe } from "@/hooks/use-swipe"
import { useLongPress } from "@/hooks/use-long-press"
import { UndoToast } from "./undo-toast"
import { getDataAtualBrasil } from "@/lib/date-utils"

interface Transacao {
  id: string
  tipo: "credito" | "debito"
  valor: number
  descricao: string
  data_transacao: string
  created_at: string
  referencia_id?: string
}

interface ItemListado {
  id: string
  tipo: "credito" | "conta"
  nome: string
  valor: number
  data: Date
  created_at: Date
  conta?: Conta
}

interface ListaTransacoesProps {
  transacoes: Transacao[]
  contas: Conta[]
  onTogglePago: (contaId: string, mes: number, ano: number) => void
  onDeleteConta: (contaId: string) => void
  onUpdateConta: (id: string, contaAtualizada: Partial<Conta>) => void
  abrirModalWhatsApp: (titulo: string, mensagem: string) => void
  userName?: string
  podeEditar?: boolean
  mesSelecionado: number
  anoSelecionado: number
  onMesChange: (mes: number) => void
  onAnoChange: (ano: number) => void
  mostrarApenasHoje?: boolean
  onToggleMostrarHoje?: (mostrar: boolean) => void
  onAddPagamento: (id: string, mes: number, ano: number, dataPagamento: string, anexo?: string) => void
}

export function ListaTransacoes({
  transacoes,
  contas,
  onTogglePago,
  onDeleteConta,
  onUpdateConta,
  abrirModalWhatsApp,
  userName,
  podeEditar = true,
  mesSelecionado,
  anoSelecionado,
  onMesChange,
  onAnoChange,
  mostrarApenasHoje = false,
  onToggleMostrarHoje,
  onAddPagamento,
}: ListaTransacoesProps) {
  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [ordenacao, setOrdenacao] = useState<"data" | "valor" | "nome">("data")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState<Conta | null>(null)
  const [anexoVisualizar, setAnexoVisualizar] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [contaParaEditar, setContaParaEditar] = useState<Conta | null>(null)
  const [parcelaDialogOpen, setParcelaDialogOpen] = useState(false)
  const [contaParaEditarParcela, setContaParaEditarParcela] = useState<Conta | null>(null)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("")
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [assuntoEmail, setAssuntoEmail] = useState("")
  const [mensagemEmail, setMensagemEmail] = useState("")
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null)

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

  const voltarMes = () => {
    if (mesSelecionado === 1) {
      onMesChange(12)
      onAnoChange(anoSelecionado - 1)
    } else {
      onMesChange(mesSelecionado - 1)
    }
  }

  const avancarMes = () => {
    if (mesSelecionado === 12) {
      onMesChange(1)
      onAnoChange(anoSelecionado + 1)
    } else {
      onMesChange(mesSelecionado + 1)
    }
  }

  const itensMesAtual = useMemo(() => {
    const todosItens: ItemListado[] = []

    // Processar transações
    todosItens.push(
      ...transacoes
        .filter((t) => t.tipo === "credito")
        .map((t) => ({
          id: t.id,
          tipo: "credito" as const,
          nome: t.descricao,
          valor: t.valor,
          data: new Date(t.data_transacao || t.created_at),
          created_at: new Date(t.created_at),
        })),
    )

    // Processar contas
    // As contas parceladas já vêm expandidas da API com parcelaAtual correto
    const contasFiltradas = contas
      .filter((conta) => {
        if (conta.tipo === "fixa") return true
        if (conta.tipo === "diaria") {
          if (!conta.dataGasto && !conta.data_gasto) return false
          const rawGasto = conta.dataGasto || conta.data_gasto!
          const dataGasto = rawGasto.includes("T") ? new Date(rawGasto) : new Date(rawGasto + "T00:00:00")
          return dataGasto.getMonth() + 1 === mesSelecionado && dataGasto.getFullYear() === anoSelecionado
        }
        if (conta.tipo === "parcelada") {
          // Se a conta já vem expandida da API (tem mesVencimento e anoVencimento)
          if (conta.mesVencimento && conta.anoVencimento) {
            return conta.mesVencimento === mesSelecionado && conta.anoVencimento === anoSelecionado
          }
          // Fallback para cálculo se não vier expandida
          const rawInicio = conta.dataInicio!
          const inicio = rawInicio.includes("T") ? new Date(rawInicio) : new Date(rawInicio + "T00:00:00")
          const parcelaAtual =
            (anoSelecionado - inicio.getFullYear()) * 12 + (mesSelecionado - (inicio.getMonth() + 1)) + 1
          return parcelaAtual > 0 && parcelaAtual <= conta.parcelas!
        }
        if (conta.tipo === "caixinha") {
          if (!conta.dataGasto && !conta.data_gasto) return false
          const rawGasto = conta.dataGasto || conta.data_gasto!
          const dataGasto = rawGasto.includes("T") ? new Date(rawGasto) : new Date(rawGasto + "T00:00:00")
          return dataGasto.getMonth() + 1 === mesSelecionado && dataGasto.getFullYear() === anoSelecionado
        }
        return false
      })
      .map((conta) => ({
        id: `${conta.id}-${conta.parcelaAtual || 0}`, // ID único para cada parcela
        tipo: "conta" as const,
        nome: conta.nome,
        valor: conta.valor,
        data: conta.tipo === "diaria" && conta.data_gasto
          ? (conta.data_gasto.includes("T") ? new Date(conta.data_gasto) : new Date(conta.data_gasto + "T00:00:00"))
          : new Date(),
        created_at: conta.created_at
          ? (conta.created_at.includes("T") ? new Date(conta.created_at) : new Date(conta.created_at + "T00:00:00"))
          : new Date(),
        conta: conta, // Preserva o parcelaAtual que vem da API
      }))

    todosItens.push(...contasFiltradas)

    if (mostrarApenasHoje) {
      const hoje = new Date()
      const diaHoje = hoje.getDate()
      const mesHoje = hoje.getMonth() + 1
      const anoHoje = hoje.getFullYear()

      return todosItens.filter((item) => {
        if (item.tipo === "credito") {
          const dataCredito = new Date(item.data)
          return (
            dataCredito.getDate() === diaHoje &&
            dataCredito.getMonth() + 1 === mesHoje &&
            dataCredito.getFullYear() === anoHoje
          )
        } else {
          // Para contas
          const conta = item.conta!

          // Gastos diários e caixinha
          if (conta.tipo === "diaria" || conta.tipo === "caixinha") {
            const dataGasto = conta.dataGasto || conta.data_gasto
            if (!dataGasto) return false
            const dataGastoDate = new Date(dataGasto + "T00:00:00")
            return (
              dataGastoDate.getDate() === diaHoje &&
              dataGastoDate.getMonth() + 1 === mesHoje &&
              dataGastoDate.getFullYear() === anoHoje
            )
          }

          // Contas fixas e parceladas
          const pagamentoHoje = conta.pagamentos?.find((p) => {
            if (!p.data_pagamento) return false
            const dataPag = new Date(p.data_pagamento + "T00:00:00")
            return (
              dataPag.getDate() === diaHoje && dataPag.getMonth() + 1 === mesHoje && dataPag.getFullYear() === anoHoje
            )
          })

          return !!pagamentoHoje
        }
      })
    }

    return todosItens
  }, [transacoes, contas, mesSelecionado, anoSelecionado, mostrarApenasHoje])

  const itensFiltrados = useMemo(() => {
    let itens = itensMesAtual

    if (busca) {
      itens = itens.filter((item) => item.nome.toLowerCase().includes(busca.toLowerCase()))
    }

    if (filtroTipo !== "todos") {
      itens = itens.filter((item) => {
        if (filtroTipo === "credito") return item.tipo === "credito"
        return item.tipo === "conta" && item.conta?.tipo === filtroTipo
      })
    }

    if (filtroStatus !== "todos") {
      itens = itens.filter((item) => {
        if (item.tipo === "credito") return filtroStatus === "pago"
        const conta = item.conta
        let pago = false
        if (conta?.tipo === "parcelada" && conta.pago !== undefined) {
          pago = conta.pago
        } else {
          pago = conta?.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado) || false
        }
        return filtroStatus === "pago" ? pago : !pago
      })
    }

    return itens.sort((a, b) => {
      if (ordenacao === "data") {
        return b.created_at.getTime() - a.created_at.getTime()
      } else if (ordenacao === "valor") {
        return b.valor - a.valor
      } else {
        return a.nome.localeCompare(b.nome)
      }
    })
  }, [itensMesAtual, busca, filtroTipo, filtroStatus, ordenacao])

  const handleMarcarPago = (conta: Conta) => {
    setContaSelecionada(conta)
    setDialogOpen(true)
  }

  const handleCompartilharWhatsApp = (conta: Conta) => {
    const pagamento = conta.pagamentos?.find((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)

    let mensagem = ""
    let linhaVencimento = ""
    let linhaParcela = ""
    let linhaAnexo = ""

    if (conta.tipo === "diaria" && conta.data_gasto) {
      const dataGasto = (conta.data_gasto.includes("T") ? new Date(conta.data_gasto) : new Date(conta.data_gasto + "T00:00:00")).toLocaleDateString("pt-BR")
      linhaVencimento = `📅 Data: ${dataGasto}\n`
    } else {
      linhaVencimento = `📌 Vencimento: dia ${conta.vencimento}\n`
    }

    if (conta.tipo === "parcelada") {
      const parcelaAtual = getParcelaAtual(conta)
      linhaParcela = `📦 Parcela: ${parcelaAtual} de ${conta.parcelas}x\n`
    }

    // Se tem pagamento registrado
    if (pagamento) {
      const anexoUrl = pagamento.anexo || conta.anexoDiario
      if (anexoUrl) {
        linhaAnexo = `\n📎 *Comprovante:*\n${anexoUrl}\n`
      }

      mensagem =
        `✅ *Pagamento Realizado*\n\n` +
        `📄 Conta: ${conta.nome}\n` +
        `💰 Valor: ${formatarMoeda(conta.valor)}\n` +
        `📅 Data do Pagamento: ${(pagamento.dataPagamento!.includes("T") ? new Date(pagamento.dataPagamento!) : new Date(pagamento.dataPagamento! + "T00:00:00")).toLocaleDateString("pt-BR")}\n` +
        linhaVencimento +
        linhaParcela +
        `📊 Mês: ${meses[mesSelecionado]}/${anoSelecionado}` +
        linhaAnexo
    } else {
      // Conta pendente
      mensagem =
        `⏳ *Conta Pendente*\n\n` +
        `📄 Conta: ${conta.nome}\n` +
        `💰 Valor: ${formatarMoeda(conta.valor)}\n` +
        linhaVencimento +
        linhaParcela +
        `📊 Mês: ${meses[mesSelecionado]}/${anoSelecionado}\n` +
        `\n⚠️ *Aguardando pagamento*`
    }

    abrirModalWhatsApp("Pagamento", mensagem)
  }

  const handleCompartilharEmail = (conta: Conta) => {
    const pagamento = conta.pagamentos?.find((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)

    let assunto = ""
    let mensagem = ""
    let linhaVencimento = ""
    let linhaParcela = ""
    let linhaAnexo = ""
    let linhaCategoria = ""

    // Definir categoria
    if (conta.categoria) {
      linhaCategoria = `Categoria: ${conta.categoria}\n`
    }

    // Definir vencimento
    if (conta.tipo === "diaria" && conta.data_gasto) {
      const dataGasto = (conta.data_gasto.includes("T") ? new Date(conta.data_gasto) : new Date(conta.data_gasto + "T00:00:00")).toLocaleDateString("pt-BR")
      linhaVencimento = `Data: ${dataGasto}\n`
    } else {
      linhaVencimento = `Vencimento: dia ${conta.vencimento}\n`
    }

    // Definir parcela
    if (conta.tipo === "parcelada") {
      const parcelaAtual = getParcelaAtual(conta)
      linhaParcela = `Parcela: ${parcelaAtual} de ${conta.parcelas}x\n`
    }

    // Se tem pagamento registrado
    if (pagamento) {
      const anexoUrl = pagamento.anexo || conta.anexoDiario
      if (anexoUrl) {
        linhaAnexo = `\nComprovante: ${anexoUrl}\n`
      }

      assunto = `Pagamento Realizado - ${conta.nome}`
      mensagem =
        `PAGAMENTO REALIZADO\n\n` +
        `Conta: ${conta.nome}\n` +
        `Valor: ${formatarMoeda(conta.valor)}\n` +
        `Data do Pagamento: ${(pagamento.dataPagamento!.includes("T") ? new Date(pagamento.dataPagamento!) : new Date(pagamento.dataPagamento! + "T00:00:00")).toLocaleDateString("pt-BR")}\n` +
        linhaVencimento +
        linhaParcela +
        linhaCategoria +
        `Mês de Referência: ${meses[mesSelecionado]}/${anoSelecionado}` +
        linhaAnexo +
        `\n\n---\nSistema de Gestão Financeira`
    } else {
      // Conta pendente
      assunto = `Conta Pendente - ${conta.nome}`

      // Template diferente para cada tipo
      if (conta.tipo === "parcelada") {
        const parcelaAtual = getParcelaAtual(conta)
        mensagem =
          `COBRANÇA - PAGAMENTO PARCELADO\n\n` +
          `Prezado(a),\n\n` +
          `Segue informação da parcela pendente:\n\n` +
          `Conta: ${conta.nome}\n` +
          `Valor da Parcela: ${formatarMoeda(conta.valor)}\n` +
          `Parcela: ${parcelaAtual} de ${conta.parcelas}x\n` +
          linhaVencimento +
          linhaCategoria +
          `Mês de Referência: ${meses[mesSelecionado]}/${anoSelecionado}\n` +
          `\nAguardamos a confirmação do pagamento.\n\n` +
          `Atenciosamente,\n` +
          `Gestão Financeira`
      } else if (conta.categoria === "Gasto Viagem") {
        mensagem =
          `DESPESA DE VIAGEM/LAZER\n\n` +
          `Conta: ${conta.nome}\n` +
          `Valor: ${formatarMoeda(conta.valor)}\n` +
          linhaVencimento +
          linhaCategoria +
          `Mês: ${meses[mesSelecionado]}/${anoSelecionado}\n` +
          `\nEsta é uma despesa relacionada a viagem/lazer.\n` +
          `Aguardando processamento do pagamento.\n\n` +
          `---\nSistema de Gestão Financeira`
      } else {
        // Template genérico para conta pendente
        mensagem =
          `CONTA PENDENTE DE PAGAMENTO\n\n` +
          `Prezado(a),\n\n` +
          `Segue informação da conta pendente:\n\n` +
          `Conta: ${conta.nome}\n` +
          `Valor: ${formatarMoeda(conta.valor)}\n` +
          linhaVencimento +
          linhaParcela +
          linhaCategoria +
          `Mês: ${meses[mesSelecionado]}/${anoSelecionado}\n` +
          `\nPor favor, realize o pagamento até o vencimento.\n\n` +
          `Atenciosamente,\n` +
          `Gestão Financeira`
      }
    }

    setAssuntoEmail(assunto)
    setMensagemEmail(mensagem)
    setEmailDialogOpen(true)
  }

  const getParcelaAtual = (conta: Conta) => {
    if (conta.tipo !== "parcelada") return null
    if (conta.parcelaAtual) {
      return conta.parcelaAtual
    }
    // Fallback to calculation if not expanded
    const rawInicio = conta.dataInicio!
    const inicio = rawInicio.includes("T") ? new Date(rawInicio) : new Date(rawInicio + "T00:00:00")
    const parcelaAtual = (anoSelecionado - inicio.getFullYear()) * 12 + (mesSelecionado - (inicio.getMonth() + 1)) + 1
    return parcelaAtual
  }

  const isPago = (conta: Conta) => {
    // Contas parceladas expandidas da API têm campo `pago` direto, sem array `pagamentos`
    if (conta.tipo === "parcelada" && conta.pago !== undefined) {
      return conta.pago
    }
    return conta.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado) || false
  }

  const handleEditarConta = (conta: Conta) => {
    setContaParaEditar(conta)
    setEditDialogOpen(true)
  }

  const handleEditarParcela = (conta: Conta) => {
    setContaParaEditarParcela(conta)
    setParcelaDialogOpen(true)
  }

  const handleSalvarParcela = async (contaId: string, mes: number, ano: number, valorAjustado: number | null, vencimentoAjustado: number | null) => {
    try {
      const res = await fetch(`/api/contas/${contaId}/parcela`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, ano, valorAjustado, vencimentoAjustado }),
      })
      if (!res.ok) throw new Error("Erro ao salvar parcela")
      // Recarregar a pagina para refletir os novos dados
      window.location.reload()
    } catch (error) {
      console.error("Erro ao salvar ajuste de parcela:", error)
    }
  }

  const getCorPorStatus = (conta: Conta, pago: boolean) => {
    const hoje = getDataAtualBrasil()
    hoje.setHours(0, 0, 0, 0)

    let dataVencimento: Date | null = null

    if (conta.tipo === "fixa") {
      dataVencimento = new Date(anoSelecionado, mesSelecionado - 1, conta.vencimento)
    } else if (conta.tipo === "parcelada") {
      if (conta.mesVencimento && conta.anoVencimento) {
        dataVencimento = new Date(conta.anoVencimento, conta.mesVencimento - 1, conta.vencimento)
      } else {
        dataVencimento = new Date(anoSelecionado, mesSelecionado - 1, conta.vencimento)
      }
    } else if (conta.tipo === "diaria" || conta.tipo === "caixinha") {
      dataVencimento = conta.dataGasto ? new Date(conta.dataGasto + "T00:00:00") : null
    }

    const venceHoje =
      dataVencimento &&
      dataVencimento.getDate() === hoje.getDate() &&
      dataVencimento.getMonth() === hoje.getMonth() &&
      dataVencimento.getFullYear() === hoje.getFullYear()

    const estaPendente = !pago && dataVencimento && dataVencimento < hoje

    if (venceHoje && !pago && conta.tipo !== "diaria") {
      return "bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 border-orange-300 dark:border-orange-700"
    } else if (estaPendente && !pago) {
      return "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-300 dark:border-red-700"
    } else if (pago || conta.tipo === "diaria") {
      return "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"
    }

    return "bg-card hover:bg-accent/50"
  }

  const handleDeleteWithUndo = (conta: Conta) => {
    const confirmar = window.confirm(`Tem certeza que deseja excluir "${conta.nome}"?`)
    if (confirmar) {
      onDeleteConta(conta.id)
    }
  }

  const swipeHandlers = useSwipe(
    {
      onSwipeLeft: () => {
        // Arrastar para esquerda = editar
        handleEditarConta(contaSelecionada!)
      },
      onSwipeRight: () => {
        // Arrastar para direita = deletar com desfazer
        handleDeleteWithUndo(contaSelecionada!)
      },
    },
    100,
  )

  const longPressHandlers = useLongPress({
    onLongPress: () => {
      // Long press = menu rápido
      setContaSelecionada(contaSelecionada!)
    },
  })

  const [undoData, setUndoData] = useState<{ action: string; conta: Conta } | null>(null)
  const [showUndo, setShowUndo] = useState(false)

  const handleUndo = () => {
    setShowUndo(false)
    setUndoData(null)
  }

  const isSomenteLeitura = !podeEditar

  const renderHeader = () => (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={voltarMes}
            disabled={mostrarApenasHoje}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-bold font-heading min-w-[160px] text-center text-foreground">
            {mostrarApenasHoje ? "Hoje" : `${meses[mesSelecionado - 1]} ${anoSelecionado}`}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={avancarMes}
            disabled={mostrarApenasHoje}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-full">
            {itensFiltrados.length} {itensFiltrados.length === 1 ? "item" : "itens"}
          </span>
          {onToggleMostrarHoje && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mostrarApenasHoje ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onToggleMostrarHoje(!mostrarApenasHoje)}
                    className={`h-8 w-8 rounded-full ${mostrarApenasHoje ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{mostrarApenasHoje ? "Ver mes completo" : "Ver somente hoje"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-9 bg-muted/40 border-border/40 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
          <SelectTrigger className="h-7 w-auto min-w-[110px] text-xs bg-muted/40 border-border/40 rounded-full px-3">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="credito">Creditos</SelectItem>
            <SelectItem value="fixa">Fixas</SelectItem>
            <SelectItem value="parcelada">Parceladas</SelectItem>
            <SelectItem value="diaria">Gastos Diarios</SelectItem>
            <SelectItem value="caixinha">Caixinha</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
          <SelectTrigger className="h-7 w-auto min-w-[90px] text-xs bg-muted/40 border-border/40 rounded-full px-3">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pago">Pagos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ordenacao} onValueChange={(v: any) => setOrdenacao(v)}>
          <SelectTrigger className="h-7 w-auto min-w-[80px] text-xs bg-muted/40 border-border/40 rounded-full px-3">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="data">Data</SelectItem>
            <SelectItem value="valor">Valor</SelectItem>
            <SelectItem value="nome">Nome</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderCreditoItem = (item: ItemListado) => {
    const dataFormatada = item.data.toLocaleDateString("pt-BR")
    const horaFormatada = item.created_at.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    return (
      <div
        key={item.id}
        className="flex items-center gap-3 px-3 py-3 rounded-xl border-l-[3px] border-l-emerald-500 border border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all"
      >
        <div className="rounded-full bg-emerald-500/15 p-1.5 shrink-0">
          <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-foreground truncate block">{item.nome}</span>
          <span className="text-[11px] text-muted-foreground">
            {dataFormatada} {'\u00e0s'} {horaFormatada}
          </span>
        </div>
        <span className="font-bold text-emerald-500 text-sm whitespace-nowrap shrink-0">
          + {formatarMoeda(item.valor)}
        </span>
      </div>
    )
  }

  const renderContaItem = (item: ItemListado) => {
    const conta = item.conta!
    const pago = isPago(conta)
    const parcelaAtual = getParcelaAtual(conta)
    const pagamento = conta.pagamentos?.find((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)
    const temAnexo = pagamento?.anexo || conta.anexoDiario
    const valorExibido = pagamento?.valorAjustado != null ? pagamento.valorAjustado : conta.valor
    const temAjuste = pagamento?.valorAjustado != null || pagamento?.vencimentoAjustado != null

    // Determine left border color
    const getBorderColor = () => {
      if (pago || conta.tipo === "diaria") return "border-l-emerald-500"
      const hoje = getDataAtualBrasil()
      hoje.setHours(0, 0, 0, 0)
      let dataVencimento: Date | null = null
      if (conta.tipo === "fixa") {
        dataVencimento = new Date(anoSelecionado, mesSelecionado - 1, conta.vencimento)
      } else if (conta.tipo === "parcelada") {
        dataVencimento = new Date(
          conta.anoVencimento || anoSelecionado,
          (conta.mesVencimento || mesSelecionado) - 1,
          conta.vencimento
        )
      }
      if (dataVencimento && dataVencimento < hoje) return "border-l-red-500"
      if (
        dataVencimento &&
        dataVencimento.getDate() === hoje.getDate() &&
        dataVencimento.getMonth() === hoje.getMonth() &&
        dataVencimento.getFullYear() === hoje.getFullYear()
      ) return "border-l-amber-500"
      return "border-l-muted-foreground/30"
    }

    const getTypeBadge = () => {
      if (conta.tipo === "fixa") return { label: "Fixa", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" }
      if (conta.tipo === "parcelada") return { label: `${parcelaAtual}/${conta.parcelas}x`, className: "bg-purple-500/10 text-purple-500 border-purple-500/20" }
      if (conta.tipo === "diaria") return { label: "Diario", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" }
      if (conta.tipo === "caixinha") return { label: "Caixinha", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" }
      return null
    }

    const typeBadge = getTypeBadge()

    return (
      <div
        key={item.id}
        className={`group flex items-center gap-3 px-3 py-3 rounded-xl border border-border/40 bg-card hover:bg-muted/30 transition-all border-l-[4px] ${getBorderColor()}`}
      >
        {/* Status toggle */}
        {!isSomenteLeitura && (
          <button
            type="button"
            onClick={() => {
              if (conta.tipo === "diaria") return
              if (pago) {
                onTogglePago(conta.id, mesSelecionado, anoSelecionado)
              } else {
                handleMarcarPago(conta)
              }
            }}
            disabled={conta.tipo === "diaria"}
            className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
              pago || conta.tipo === "diaria"
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                : "border-border hover:border-primary/60 hover:bg-primary/5"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-label={pago ? "Marcar como pendente" : "Marcar como pago"}
          >
            {(pago || conta.tipo === "diaria") && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
          </button>
        )}

        {/* Name + badges + date */}
        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`text-sm font-medium truncate leading-tight ${
                pago || conta.tipo === "diaria"
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {conta.nome}
            </span>
            {typeBadge && (
              <span className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-semibold border shrink-0 ${typeBadge.className}`}>
                {typeBadge.label}
              </span>
            )}
            {temAnexo && (
              <button
                type="button"
                onClick={() => {
                  const anexoUrl = pagamento?.anexo || conta.anexoDiario || null
                  setAnexoVisualizar(anexoUrl)
                }}
                className="text-muted-foreground/60 hover:text-muted-foreground shrink-0 transition-colors"
              >
                <Paperclip className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground/70 leading-none">
            {conta.tipo === "diaria" && conta.data_gasto
              ? (conta.data_gasto.includes("T") ? new Date(conta.data_gasto) : new Date(conta.data_gasto + "T00:00:00")).toLocaleDateString("pt-BR")
              : conta.tipo === "caixinha" && conta.data_gasto
                ? (conta.data_gasto.includes("T") ? new Date(conta.data_gasto) : new Date(conta.data_gasto + "T00:00:00")).toLocaleDateString("pt-BR")
                : conta.tipo === "fixa"
                  ? `Venc. dia ${conta.vencimento}`
                  : conta.tipo === "parcelada"
                    ? `Parcela ${parcelaAtual} de ${conta.parcelas}`
                    : ""}
            {conta.categoria ? ` · ${conta.categoria}` : ""}
          </span>
        </div>

        {/* Actions */}
        {!isSomenteLeitura && (
          <TooltipProvider>
            <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60" onClick={() => handleCompartilharWhatsApp(conta)}>
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Compartilhar</TooltipContent>
              </Tooltip>
              {(conta.tipo === "parcelada" || conta.tipo === "fixa") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10" onClick={() => handleEditarParcela(conta)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Editar Parcela</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10" onClick={() => handleEditarConta(conta)}>
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Editar Conta</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteWithUndo(conta)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Excluir</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}

        {/* Value */}
        <span
          className={`text-sm font-bold whitespace-nowrap shrink-0 tabular-nums ${
            pago || conta.tipo === "diaria"
              ? "text-muted-foreground line-through decoration-1"
              : "text-foreground"
          } ${temAjuste ? "underline decoration-amber-500/60 decoration-dotted underline-offset-2" : ""}`}
        >
          {formatarMoeda(valorExibido)}
        </span>
      </div>
    )
  }

  if (itensFiltrados.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="p-5">
          {renderHeader()}
        </div>
        <div className="px-5 pb-8">
          <div className="text-center py-12 space-y-3">
            <div className="rounded-full bg-muted/40 p-5 w-fit mx-auto">
              <Search className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum resultado encontrado</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tente ajustar os filtros ou mudar o mes</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="p-5">
          {renderHeader()}
        </div>
        <div className="px-3 pb-4">
          <div className="space-y-1.5">
            {itensFiltrados.map((item) =>
              item.tipo === "credito" ? renderCreditoItem(item) : renderContaItem(item)
            )}
          </div>
        </div>
      </div>

      {showUndo && undoData && <UndoToast message={`${undoData.conta.nome} sera deletada`} onUndo={handleUndo} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {contaSelecionada && (
            <PagamentoDialog
              conta={contaSelecionada}
              mes={mesSelecionado}
              ano={anoSelecionado}
              onConfirm={onAddPagamento}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!anexoVisualizar} onOpenChange={() => setAnexoVisualizar(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
          </DialogHeader>
          {anexoVisualizar && (
            <div className="space-y-4">
              <img src={anexoVisualizar || "/placeholder.svg"} alt="Comprovante" className="w-full rounded-lg" crossOrigin="anonymous" />
              <Button asChild className="w-full">
                <a href={anexoVisualizar} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Comprovante
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditContaDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        conta={contaParaEditar}
        onEdit={onUpdateConta}
      />

      <EditParcelaDialog
        open={parcelaDialogOpen}
        onOpenChange={setParcelaDialogOpen}
        conta={contaParaEditarParcela}
        mes={mesSelecionado}
        ano={anoSelecionado}
        onSave={handleSalvarParcela}
      />

      <WhatsAppSendDialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen} mensagem={mensagemWhatsApp} />
      <EmailCompartilharDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        assunto={assuntoEmail}
        mensagem={mensagemEmail}
      />
    </div>
  )
}

function PagamentoDialog({
  conta,
  mes,
  ano,
  onConfirm,
  onCancel,
}: {
  conta: Conta
  mes: number
  ano: number
  onConfirm: (id: string, mes: number, ano: number, dataPagamento: string, anexo?: string) => void
  onCancel: () => void
}) {
  const hoje = getDataAtualBrasil().toISOString().split("T")[0]
  const [dataPagamento, setDataPagamento] = useState(hoje)
  const [anexo, setAnexo] = useState("")

  const handleConfirm = () => {
    onConfirm(conta.id, mes, ano, dataPagamento, anexo || undefined)
    onCancel()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Conta</label>
        <p className="text-lg font-semibold">{conta.nome}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Valor</label>
        <p className="text-lg font-semibold">{formatarMoeda(conta.valor)}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Data do Pagamento</label>
        <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Anexo (opcional)</label>
        <Input type="url" placeholder="URL do comprovante" value={anexo} onChange={(e) => setAnexo(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleConfirm} className="flex-1">
          Confirmar
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
