"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WhatsAppSendDialog } from "./whatsapp-send-dialog"
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
} from "lucide-react"
import { useState, useMemo } from "react"
import type { Conta } from "@/types/conta"
import { formatarMoeda } from "@/lib/utils"
import { EditContaDialog } from "./edit-conta-dialog"
import { Pencil } from "lucide-react"
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
  onTogglePago: (id: string, mes: number, ano: number) => void
  onDelete: (id: string) => void
  onAddPagamento: (id: string, mes: number, ano: number, dataPagamento: string, anexo?: string) => void
  onEdit: (id: string, conta: Partial<Conta>) => void
  mesSelecionado: number
  anoSelecionado: number
  onMesChange: (mes: number) => void
  onAnoChange: (ano: number) => void
  mostrarApenasHoje?: boolean
  onToggleMostrarHoje?: (mostrar: boolean) => void
}

export function ListaTransacoes({
  transacoes,
  contas,
  onTogglePago,
  onDelete,
  onAddPagamento,
  onEdit,
  mesSelecionado,
  anoSelecionado,
  onMesChange,
  onAnoChange,
  mostrarApenasHoje = false,
  onToggleMostrarHoje,
}: ListaTransacoesProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState<Conta | null>(null)
  const [anexoVisualizar, setAnexoVisualizar] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [contaParaEditar, setContaParaEditar] = useState<Conta | null>(null)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("")

  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "fixa" | "parcelada" | "diaria" | "credito" | "caixinha">(
    "todos",
  )
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pago" | "pendente">("todos")
  const [ordenacao, setOrdenacao] = useState<"data" | "valor" | "nome">("data")

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
    const contasFiltradas = contas
      .filter((conta) => {
        if (conta.tipo === "fixa") return true
        if (conta.tipo === "diaria") {
          if (!conta.dataGasto && !conta.data_gasto) return false
          const dataGasto = new Date(conta.dataGasto || conta.data_gasto!)
          return dataGasto.getMonth() + 1 === mesSelecionado && dataGasto.getFullYear() === anoSelecionado
        }
        if (conta.tipo === "parcelada") {
          const inicio = new Date(conta.dataInicio!)
          const parcelaAtual =
            (anoSelecionado - inicio.getFullYear()) * 12 + (mesSelecionado - (inicio.getMonth() + 1)) + 1
          return parcelaAtual > 0 && parcelaAtual <= conta.parcelas!
        }
        if (conta.tipo === "caixinha") {
          if (!conta.dataGasto && !conta.data_gasto) return false
          const dataGasto = new Date(conta.dataGasto || conta.data_gasto!)
          return dataGasto.getMonth() + 1 === mesSelecionado && dataGasto.getFullYear() === anoSelecionado
        }
        return false
      })
      .map((conta) => ({
        id: conta.id,
        tipo: "conta" as const,
        nome: conta.nome,
        valor: conta.valor,
        data: conta.tipo === "diaria" && conta.data_gasto ? new Date(conta.data_gasto) : new Date(),
        created_at: new Date(conta.created_at),
        conta: conta,
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
        const pago = item.conta?.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado) || false
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
      const dataGasto = new Date(conta.data_gasto).toLocaleDateString("pt-BR")
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
        `📅 Data do Pagamento: ${new Date(pagamento.dataPagamento!).toLocaleDateString("pt-BR")}\n` +
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

    setMensagemWhatsApp(mensagem)
    setWhatsappDialogOpen(true)
  }

  const getParcelaAtual = (conta: Conta) => {
    if (conta.tipo !== "parcelada") return null
    const inicio = new Date(conta.dataInicio!)
    const parcelaAtual = (anoSelecionado - inicio.getFullYear()) * 12 + (mesSelecionado - (inicio.getMonth() + 1)) + 1
    return parcelaAtual
  }

  const isPago = (conta: Conta) => {
    return conta.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado) || false
  }

  const handleEditarConta = (conta: Conta) => {
    setContaParaEditar(conta)
    setEditDialogOpen(true)
  }

  const getCorPorStatus = (conta: Conta, pago: boolean) => {
    const hoje = getDataAtualBrasil()
    hoje.setHours(0, 0, 0, 0)

    let dataVencimento: Date | null = null

    if (conta.tipo === "fixa") {
      dataVencimento = new Date(anoSelecionado, mesSelecionado - 1, conta.vencimento)
    } else if (conta.tipo === "parcelada") {
      const dataInicioStr = conta.dataInicio || conta.createdAt
      if (dataInicioStr) {
        const dataInicio = new Date(dataInicioStr + "T00:00:00")
        const mesesDiferenca =
          (anoSelecionado - dataInicio.getFullYear()) * 12 + (mesSelecionado - 1 - dataInicio.getMonth())

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

  if (itensFiltrados.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={voltarMes}>
              ← Anterior
            </Button>
            <CardTitle className="text-center">
              {mostrarApenasHoje ? "Dia de Hoje" : `${meses[mesSelecionado - 1]}/${anoSelecionado}`}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={avancarMes}>
              Próximo →
            </Button>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="credito">Créditos</SelectItem>
                  <SelectItem value="fixa">Fixas</SelectItem>
                  <SelectItem value="parcelada">Parceladas</SelectItem>
                  <SelectItem value="diaria">Gastos Diários</SelectItem>
                  <SelectItem value="caixinha">Caixinha</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ordenacao} onValueChange={(v: any) => setOrdenacao(v)}>
                <SelectTrigger>
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
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum resultado encontrado para os filtros aplicados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={voltarMes} disabled={mostrarApenasHoje}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-semibold">
                {mostrarApenasHoje ? "Dia de Hoje" : `${meses[mesSelecionado - 1]}/${anoSelecionado}`}
              </h2>
              <Button variant="outline" size="icon" onClick={avancarMes} disabled={mostrarApenasHoje}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {onToggleMostrarHoje && (
              <Button
                variant={mostrarApenasHoje ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleMostrarHoje(!mostrarApenasHoje)}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                {mostrarApenasHoje ? "Ver mês completo" : "Dia de hoje"}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="credito">Créditos</SelectItem>
                  <SelectItem value="fixa">Fixas</SelectItem>
                  <SelectItem value="parcelada">Parceladas</SelectItem>
                  <SelectItem value="diaria">Gastos Diários</SelectItem>
                  <SelectItem value="caixinha">Caixinha</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ordenacao} onValueChange={(v: any) => setOrdenacao(v)}>
                <SelectTrigger>
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
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {itensFiltrados.map((item) => {
              if (item.tipo === "credito") {
                const dataFormatada = item.data.toLocaleDateString("pt-BR")
                const horaFormatada = item.created_at.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-sm">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {dataFormatada} às {horaFormatada}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="bg-green-600">
                        Entrada
                      </Badge>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        + {formatarMoeda(item.valor)}
                      </span>
                    </div>
                  </div>
                )
              } else {
                const conta = item.conta!
                const pago = isPago(conta)
                const parcelaAtual = getParcelaAtual(conta)
                const pagamento = conta.pagamentos?.find((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)
                const temAnexo = pagamento?.anexo || conta.anexoDiario

                const corBackground = getCorPorStatus(conta, pago)

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${corBackground}`}
                  >
                    <Checkbox
                      checked={pago || conta.tipo === "diaria"}
                      onCheckedChange={() => {
                        if (pago) {
                          onTogglePago(conta.id, mesSelecionado, anoSelecionado)
                        } else {
                          handleMarcarPago(conta)
                        }
                      }}
                      disabled={conta.tipo === "diaria"}
                      className="h-5 w-5 mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3
                          className={`font-semibold ${pago || conta.tipo === "diaria" ? "line-through text-muted-foreground" : ""}`}
                        >
                          {conta.nome}
                        </h3>
                        {temAnexo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const anexoUrl = pagamento?.anexo || conta.anexoDiario || null
                              setAnexoVisualizar(anexoUrl)
                            }}
                            className="h-6 px-2 gap-1 text-xs"
                          >
                            <Paperclip className="h-3 w-3" />
                            Anexo
                          </Button>
                        )}
                        {conta.categoria && (
                          <Badge variant="secondary" className="text-xs">
                            {conta.categoria}
                          </Badge>
                        )}
                        {conta.tipo === "fixa" && <Badge className="text-xs bg-blue-600">Fixa</Badge>}
                        {conta.tipo === "parcelada" && (
                          <Badge className="text-xs bg-purple-600">
                            {parcelaAtual}/{conta.parcelas}x
                          </Badge>
                        )}
                        {conta.tipo === "diaria" && <Badge className="text-xs bg-purple-600">Gasto Diário</Badge>}
                        {conta.tipo === "caixinha" && <Badge className="text-xs bg-amber-600">Caixinha</Badge>}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {conta.tipo === "diaria" && conta.dataGasto ? (
                          <span>
                            Data do Gasto: {new Date(conta.dataGasto + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        ) : conta.tipo === "caixinha" && conta.dataGasto ? (
                          <span>
                            Data do Gasto: {new Date(conta.dataGasto + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        ) : conta.tipo === "fixa" ? (
                          <span>
                            Vencimento:{" "}
                            {new Date(anoSelecionado, mesSelecionado - 1, conta.vencimento).toLocaleDateString("pt-BR")}
                          </span>
                        ) : conta.tipo === "parcelada" ? (
                          <>
                            <span>
                              Parcela {parcelaAtual} - Vencimento:{" "}
                              {new Date(anoSelecionado, mesSelecionado - 1, conta.vencimento).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{formatarMoeda(conta.valor)}</span>
                      {pago && (
                        <Badge variant="default" className="bg-green-600">
                          Pago
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCompartilharWhatsApp(conta)}
                        className="h-8 w-8"
                      >
                        <Share2 className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditarConta(conta)} className="h-8 w-8">
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(conta.id)} className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </CardContent>
      </Card>

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
              <img src={anexoVisualizar || "/placeholder.svg"} alt="Comprovante" className="w-full rounded-lg" />
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

      <EditContaDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} conta={contaParaEditar} onEdit={onEdit} />

      <WhatsAppSendDialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen} mensagem={mensagemWhatsApp} />
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
