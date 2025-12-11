"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpCircle, Trash2, Share2, Search, Paperclip } from "lucide-react"
import { PagamentoDialog } from "@/components/pagamento-dialog"
import { useState } from "react"
import type { Conta } from "@/types/conta"
import { formatarMoeda } from "@/lib/utils"

interface Transacao {
  id: string
  tipo: "credito" | "debito"
  valor: number
  descricao: string
  data_transacao: string
  created_at: string
  referencia_id?: string
}

interface ListaTransacoesProps {
  transacoes: Transacao[]
  contas: Conta[]
  onTogglePago: (id: string, mes: number, ano: number) => void
  onDelete: (id: string) => void
  onAddPagamento: (id: string, mes: number, ano: number, dataPagamento: string, anexo?: string) => void
  mesSelecionado: number
  anoSelecionado: number
  onMesChange: (mes: number) => void
  onAnoChange: (ano: number) => void
}

export function ListaTransacoes({
  transacoes,
  contas,
  onTogglePago,
  onDelete,
  onAddPagamento,
  mesSelecionado,
  anoSelecionado,
  onMesChange,
  onAnoChange,
}: ListaTransacoesProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState<Conta | null>(null)
  const [anexoVisualizar, setAnexoVisualizar] = useState<string | null>(null)

  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "fixa" | "parcelada" | "diaria" | "credito">("todos")
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

  const mudarMes = (direcao: "anterior" | "proximo") => {
    if (direcao === "anterior") {
      if (mesSelecionado === 0) {
        onMesChange(11)
        onAnoChange(anoSelecionado - 1)
      } else {
        onMesChange(mesSelecionado - 1)
      }
    } else {
      if (mesSelecionado === 11) {
        onMesChange(0)
        onAnoChange(anoSelecionado + 1)
      } else {
        onMesChange(mesSelecionado + 1)
      }
    }
  }

  const itensCombinados = [
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
    ...contas
      .filter((conta) => {
        if (conta.tipo === "fixa") return true
        if (conta.tipo === "diaria") {
          if (!conta.data_gasto) return false
          const dataGasto = new Date(conta.data_gasto)
          return dataGasto.getMonth() === mesSelecionado && dataGasto.getFullYear() === anoSelecionado
        }
        if (conta.tipo === "parcelada") {
          const inicio = new Date(conta.data_inicio!)
          const parcelaAtual = (anoSelecionado - inicio.getFullYear()) * 12 + (mesSelecionado - inicio.getMonth()) + 1
          return parcelaAtual > 0 && parcelaAtual <= conta.parcelas!
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
      })),
  ]

  let itensFiltrados = itensCombinados

  if (busca) {
    itensFiltrados = itensFiltrados.filter((item) => item.nome.toLowerCase().includes(busca.toLowerCase()))
  }

  if (filtroTipo !== "todos") {
    itensFiltrados = itensFiltrados.filter((item) => {
      if (filtroTipo === "credito") return item.tipo === "credito"
      return item.tipo === "conta" && item.conta?.tipo === filtroTipo
    })
  }

  if (filtroStatus !== "todos") {
    itensFiltrados = itensFiltrados.filter((item) => {
      if (item.tipo === "credito") return filtroStatus === "pago"
      const pago = item.conta?.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado) || false
      return filtroStatus === "pago" ? pago : !pago
    })
  }

  itensFiltrados = itensFiltrados.sort((a, b) => {
    if (ordenacao === "data") {
      return b.created_at.getTime() - a.created_at.getTime()
    } else if (ordenacao === "valor") {
      return b.valor - a.valor
    } else {
      return a.nome.localeCompare(b.nome)
    }
  })

  const handleMarcarPago = (conta: Conta) => {
    setContaSelecionada(conta)
    setDialogOpen(true)
  }

  const handleCompartilharWhatsApp = (conta: Conta) => {
    const pagamento = conta.pagamentos?.find((p) => p.mes === mesSelecionado && p.ano === anoSelecionado)
    if (!pagamento) return

    let linhaVencimento = ""
    let linhaParcela = ""
    let linhaAnexo = ""

    if (conta.tipo === "diaria" && conta.data_gasto) {
      const dataGasto = new Date(conta.data_gasto).toLocaleDateString("pt-BR")
      linhaVencimento = `📅 Data do gasto: ${dataGasto}\n`
    } else {
      linhaVencimento = `📌 Vencimento: dia ${conta.vencimento}\n`
    }

    if (conta.tipo === "parcelada") {
      const parcelaAtual = getParcelaAtual(conta)
      linhaParcela = `📦 Parcela: ${parcelaAtual} de ${conta.parcelas}x\n`
    }

    const anexoUrl = pagamento.anexo || conta.anexoDiario
    if (anexoUrl) {
      linhaAnexo = `\n📎 *Comprovante:*\n${anexoUrl}\n`
    }

    const mensagem =
      `✅ *Pagamento Realizado*\n\n` +
      `📄 Conta: ${conta.nome}\n` +
      `💰 Valor: ${formatarMoeda(conta.valor)}\n` +
      `📅 Data do Pagamento: ${new Date(pagamento.dataPagamento!).toLocaleDateString("pt-BR")}\n` +
      linhaVencimento +
      linhaParcela +
      `📊 Mês: ${meses[mesSelecionado]}/${anoSelecionado}` +
      linhaAnexo

    const mensagemEncoded = encodeURIComponent(mensagem)
    window.open(`https://wa.me/?text=${mensagemEncoded}`, "_blank")
  }

  const getParcelaAtual = (conta: Conta) => {
    if (conta.tipo !== "parcelada") return null
    const inicio = new Date(conta.data_inicio!)
    const parcelaAtual = (anoSelecionado - inicio.getFullYear()) * 12 + (mesSelecionado - inicio.getMonth()) + 1
    return parcelaAtual
  }

  const isPago = (conta: Conta) => {
    return conta.pagamentos?.some((p) => p.mes === mesSelecionado && p.ano === anoSelecionado) || false
  }

  if (itensFiltrados.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => mudarMes("anterior")}>
              ← Anterior
            </Button>
            <CardTitle className="text-center">
              {meses[mesSelecionado]}/{anoSelecionado}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => mudarMes("proximo")}>
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => mudarMes("anterior")}>
              ← Anterior
            </Button>
            <CardTitle className="text-center">
              {meses[mesSelecionado]}/{anoSelecionado}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => mudarMes("proximo")}>
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

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                      pago
                        ? "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"
                        : "bg-card hover:bg-accent/50"
                    }`}
                  >
                    <Checkbox
                      checked={pago}
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
                        <h3 className={`font-semibold ${pago ? "line-through text-muted-foreground" : ""}`}>
                          {conta.nome}
                        </h3>
                        {temAnexo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAnexoVisualizar(pagamento?.anexo || conta.anexoDiario || null)}
                            className="h-6 px-2 gap-1 text-xs"
                          >
                            <Paperclip className="h-3 w-3" />
                            Anexo
                          </Button>
                        )}
                        {conta.categoria && (
                          <Badge variant="outline" className="text-xs">
                            {conta.categoria}
                          </Badge>
                        )}
                        {conta.tipo === "parcelada" && (
                          <Badge variant="outline" className="text-xs">
                            {parcelaAtual}/{conta.parcelas}x
                          </Badge>
                        )}
                        {conta.tipo === "fixa" && (
                          <Badge variant="secondary" className="text-xs">
                            Fixa
                          </Badge>
                        )}
                        {conta.tipo === "diaria" && (
                          <Badge variant="default" className="text-xs bg-purple-500">
                            Gasto Diário
                          </Badge>
                        )}
                      </div>
                      {conta.tipo === "diaria" && conta.data_gasto ? (
                        <p className="text-sm text-muted-foreground">
                          Data do gasto: {new Date(conta.data_gasto).toLocaleDateString("pt-BR")}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Vencimento: dia {conta.vencimento}</p>
                      )}
                      {pago && pagamento && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Pago em: {new Date(pagamento.dataPagamento!).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${pago ? "text-muted-foreground" : "text-foreground"}`}>
                          {formatarMoeda(conta.valor)}
                        </p>
                        {pago && (
                          <Badge variant="default" className="text-xs">
                            Pago
                          </Badge>
                        )}
                      </div>

                      {pago && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCompartilharWhatsApp(conta)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                          title="Compartilhar no WhatsApp"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(conta.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </CardContent>
      </Card>

      {contaSelecionada && (
        <PagamentoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          conta={contaSelecionada}
          mes={mesSelecionado}
          ano={anoSelecionado}
          onConfirm={(dataPagamento, anexo) => {
            onAddPagamento(contaSelecionada.id, mesSelecionado, anoSelecionado, dataPagamento, anexo)
            setDialogOpen(false)
            setContaSelecionada(null)
          }}
        />
      )}

      <Dialog open={!!anexoVisualizar} onOpenChange={() => setAnexoVisualizar(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprovante</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted rounded-lg p-4">
            {anexoVisualizar && (
              <img
                src={anexoVisualizar || "/placeholder.svg"}
                alt="Comprovante"
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            )}
          </div>
          <div className="flex justify-end">
            <Button asChild>
              <a href={anexoVisualizar || ""} download="comprovante.jpg">
                Baixar
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
