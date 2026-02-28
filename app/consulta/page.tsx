"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ArrowLeft, FileDown, FileSpreadsheet, Check, X, Pencil, Calendar, Filter, DollarSign, Clock, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import type { Conta } from "@/types/conta"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { formatarMoeda } from "@/lib/utils"
import { getDataAtualBrasil } from "@/lib/date-utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { EditContaDialog } from "@/components/edit-conta-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Filtro = "todos" | "pagos" | "pendentes" | "atrasados" | "proximos"

const isContaPaga = (conta: Conta): boolean => {
  if (conta.tipo === "parcelada" && conta.pago !== undefined) {
    return conta.pago
  }
  return (conta.pagamentos && conta.pagamentos.length > 0) || false
}

export default function ConsultaPage() {
  const { toast } = useToast()
  const [todasContas, setTodasContas] = useState<Conta[]>([])
  const [contasFiltradas, setContasFiltradas] = useState<Conta[]>([])
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [contaSelecionada, setContaSelecionada] = useState<string>("todas")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [contaEditando, setContaEditando] = useState<Conta | null>(null)
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("todos")
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("todas")
  const [mesAno, setMesAno] = useState("")
  const [filtroPeriodo, setFiltroPeriodo] = useState<"periodo" | "todos" | "dia">("periodo")
  const [diaEspecifico, setDiaEspecifico] = useState("")
  const [loading, setLoading] = useState(true)
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false)
  const [filtros, setFiltros] = useState<{
    periodo: "mes" | "dia" | "todos"
    mes?: string
    ano?: string
    dia?: string
  }>({
    periodo: "mes",
    mes: "",
    ano: "",
    dia: "",
  })

  const togglePago = async (conta: Conta) => {
    try {
      const pago = isContaPaga(conta)
      const mes = conta.mesVencimento || (conta.pagamentos?.[0]?.mes ? conta.pagamentos[0].mes + 1 : new Date().getMonth() + 1)
      const ano = conta.anoVencimento || conta.pagamentos?.[0]?.ano || new Date().getFullYear()

      if (pago) {
        const response = await fetch(
          `/api/pagamentos?contaId=${conta.id}&mes=${mes}&ano=${ano}`,
          { method: "DELETE" }
        )
        if (!response.ok) throw new Error("Erro ao remover pagamento")
        toast({ title: "Pagamento removido" })
      } else {
        const hoje = getDataAtualBrasil()
        const dataPagamento = format(hoje, "yyyy-MM-dd")
        const response = await fetch("/api/pagamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contaId: conta.id,
            mes: mes,
            ano: ano,
            dataPagamento,
            contaNome: conta.nome,
          }),
        })
        if (!response.ok) throw new Error("Erro ao adicionar pagamento")
        toast({ title: "Pagamento registrado" })
      }
      executarPesquisa()
    } catch (error) {
      console.error("Erro ao alterar pagamento:", error)
      toast({ title: "Erro ao alterar pagamento", variant: "destructive" })
    }
  }

  const handleEditConta = async (id: string, contaAtualizada: Partial<Conta>) => {
    try {
      const response = await fetch(`/api/contas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contaAtualizada),
      })
      if (!response.ok) throw new Error("Erro ao editar conta")
      toast({ title: "Conta atualizada" })
      executarPesquisa()
    } catch (error) {
      console.error("Erro ao editar conta:", error)
      toast({ title: "Erro ao editar conta", variant: "destructive" })
    }
  }

  const fetchContas = async () => {
    try {
      const response = await fetch("/api/contas")
      if (!response.ok) throw new Error("Erro ao buscar contas")
      const data = await response.json()
      setTodasContas(data)
    } catch (error) {
      console.error("Erro ao buscar contas:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContas()
  }, [])

  useEffect(() => {
    const hoje = getDataAtualBrasil()
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")
    const ano = hoje.getFullYear()
    const dia = String(hoje.getDate()).padStart(2, "0")
    setMesAno(`${ano}-${mes}`)
    setDiaEspecifico(`${ano}-${mes}-${dia}`)
    setFiltros({
      periodo: "mes",
      mes: `${mes}`,
      ano: `${ano}`,
    })
  }, [])

  useEffect(() => {
    setPesquisaRealizada(false)
    setContasFiltradas([])
  }, [filtroPeriodo, mesAno, diaEspecifico, tipoSelecionado, categoriaSelecionada, contaSelecionada, filtro])

  useEffect(() => {
    setContaSelecionada("todas")
  }, [tipoSelecionado, categoriaSelecionada])

  const executarPesquisa = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (filtroPeriodo === "periodo" && mesAno) {
        params.append("mes", mesAno)
      } else if (filtroPeriodo === "dia" && diaEspecifico) {
        params.append("dia", diaEspecifico)
      }

      if (tipoSelecionado !== "todos") {
        params.append("tipo", tipoSelecionado)
      }

      if (categoriaSelecionada !== "todos") {
        params.append("categoria", categoriaSelecionada)
      }

      if (contaSelecionada !== "todas") {
        params.append("conta_id", contaSelecionada)
      }

      if (filtro !== "todos") {
        params.append("status", filtro)
      }

      const response = await fetch(`/api/contas?${params.toString()}`)
      if (!response.ok) throw new Error("Erro ao buscar contas")
      const data = await response.json()

      let contasFiltradas = data

      if (filtro === "atrasados") {
        contasFiltradas = data.filter((c: Conta) => c.estaAtrasado && !isContaPaga(c))
      } else if (filtro === "proximos") {
        contasFiltradas = data.filter((c: Conta) => c.estaProximo && !isContaPaga(c))
      }

      setContasFiltradas(contasFiltradas)
    } catch (error) {
      console.error("Erro ao buscar contas:", error)
    } finally {
      setLoading(false)
      setPesquisaRealizada(true)
    }
  }

  const contasFiltradasParaDropdown = todasContas.filter((conta) => {
    if (tipoSelecionado !== "todos" && conta.tipo !== tipoSelecionado) return false
    if (categoriaSelecionada !== "todos" && conta.categoria !== categoriaSelecionada) return false
    return true
  })

  const nomesContasUnicas = Array.from(
    new Map(contasFiltradasParaDropdown.map((c) => [c.id, { id: c.id, nome: c.nome }])).values(),
  )
  const tiposUnicos = Array.from(new Set(todasContas.map((c) => c.tipo).filter(Boolean)))
  const categoriasUnicas = Array.from(new Set(todasContas.map((c) => c.categoria).filter(Boolean)))

  const meses = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ]

  const [anoSelecionado, mesSelecionado] = mesAno
    ? mesAno.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1]

  const exportarParaPDF = () => {
    alert("Funcionalidade de exportar para PDF sera implementada em breve!")
  }

  const exportarParaExcel = () => {
    alert("Funcionalidade de exportar para Excel sera implementada em breve!")
  }

  const totalPago = contasFiltradas.filter((c) => isContaPaga(c)).reduce((sum, conta) => sum + conta.valor, 0)
  const totalPendente = contasFiltradas.filter((c) => !isContaPaga(c)).reduce((sum, conta) => sum + conta.valor, 0)
  const qtdPagas = contasFiltradas.filter((c) => isContaPaga(c)).length
  const qtdPendentes = contasFiltradas.filter((c) => !isContaPaga(c)).length

  if (loading && !pesquisaRealizada) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando consulta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">Consulta de Pagamentos</h1>
              <p className="text-sm text-muted-foreground mt-1">Pesquise e gerencie seus pagamentos</p>
            </div>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Voltar</TooltipContent>
    </Tooltip>
  </TooltipProvider>
          </div>

          {/* Filtros */}
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Filtros</span>
              </div>

              {/* Periodo tabs */}
              <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-4">
                {[
                  { value: "periodo", label: "Por mes" },
                  { value: "dia", label: "Por dia" },
                  { value: "todos", label: "Todos" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFiltroPeriodo(tab.value as "periodo" | "todos" | "dia")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      filtroPeriodo === tab.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Filtros grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Mes/Ano</label>
                  <Input
                    type="month"
                    value={mesAno}
                    onChange={(e) => {
                      setMesAno(e.target.value)
                      const [ano, mes] = e.target.value.split("-")
                      setFiltros((prev) => ({ ...prev, periodo: "mes", mes, ano }))
                    }}
                    disabled={filtroPeriodo !== "periodo"}
                    className="h-9 text-sm disabled:opacity-40"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Dia</label>
                  <Input
                    type="date"
                    value={diaEspecifico}
                    onChange={(e) => {
                      setDiaEspecifico(e.target.value)
                      setFiltros((prev) => ({ ...prev, periodo: "dia", dia: e.target.value }))
                    }}
                    disabled={filtroPeriodo !== "dia"}
                    className="h-9 text-sm disabled:opacity-40"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                  <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {tiposUnicos.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo === "fixa" ? "Fixa" : tipo === "parcelada" ? "Parcelada" : tipo === "diaria" ? "Diaria" : "Caixinha"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                  <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {categoriasUnicas.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={filtro} onValueChange={(value) => setFiltro(value as Filtro)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pagos">Pagos</SelectItem>
                      <SelectItem value="pendentes">Pendentes</SelectItem>
                      <SelectItem value="atrasados">Atrasados</SelectItem>
                      <SelectItem value="proximos">Proximos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Conta</label>
                  <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {nomesContasUnicas.map((conta) => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botoes */}
              <TooltipProvider>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={executarPesquisa} size="icon" disabled={loading} className="h-8 w-8">
                        <Search className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{loading ? "Buscando..." : "Pesquisar"}</TooltipContent>
                  </Tooltip>
                  {pesquisaRealizada && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={exportarParaPDF} size="icon" variant="outline" className="h-8 w-8">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Exportar PDF</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={exportarParaExcel} size="icon" variant="outline" className="h-8 w-8">
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Exportar Excel</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          {pesquisaRealizada && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-border/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Total Pago</p>
                        <p className="text-lg font-bold text-emerald-500 truncate">{formatarMoeda(totalPago)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{qtdPagas} {qtdPagas === 1 ? "conta paga" : "contas pagas"}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Total Pendente</p>
                        <p className="text-lg font-bold text-red-500 truncate">{formatarMoeda(totalPendente)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{qtdPendentes} {qtdPendentes === 1 ? "conta pendente" : "contas pendentes"}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Total Geral</p>
                        <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(totalPago + totalPendente)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{contasFiltradas.length} contas</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Progresso</p>
                        <p className="text-lg font-bold text-foreground">
                          {contasFiltradas.length > 0 ? Math.round((qtdPagas / contasFiltradas.length) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${contasFiltradas.length > 0 ? (qtdPagas / contasFiltradas.length) * 100 : 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela */}
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      {filtroPeriodo === "periodo" && mesAno
                        ? `${meses[mesSelecionado - 1]} ${anoSelecionado}`
                        : filtroPeriodo === "dia" && diaEspecifico
                          ? new Date(diaEspecifico + "T00:00:00").toLocaleDateString("pt-BR")
                          : "Todos os Periodos"}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {contasFiltradas.length} {contasFiltradas.length === 1 ? "resultado" : "resultados"}
                    </Badge>
                  </div>

                  <div className="rounded-lg border border-border/50 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-semibold">Conta</TableHead>
                          <TableHead className="text-xs font-semibold">Tipo</TableHead>
                          <TableHead className="text-xs font-semibold">Parcela</TableHead>
                          <TableHead className="text-xs font-semibold">Vencimento</TableHead>
                          <TableHead className="text-xs font-semibold">Valor</TableHead>
                          <TableHead className="text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-xs font-semibold">Pagamento</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contasFiltradas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <Search className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">Nenhuma conta encontrada</p>
                                <p className="text-xs text-muted-foreground/70">Ajuste os filtros e tente novamente</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          contasFiltradas.map((conta) => {
                            const pago = isContaPaga(conta)
                            return (
                              <TableRow key={`${conta.id}-${conta.parcelaAtual || "unico"}`} className="group">
                                <TableCell className="font-medium text-sm">{conta.nome}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {conta.tipo === "fixa" ? "Fixa" : conta.tipo === "diaria" ? "Diaria" : conta.tipo === "caixinha" ? "Caixinha" : "Parcelada"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {conta.tipo === "parcelada" ? `${conta.parcelaAtual}/${conta.parcelas}` : "-"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {conta.tipo === "parcelada"
                                    ? conta.dataVencimentoCompleta
                                    : conta.tipo === "fixa"
                                      ? format(
                                          new Date(
                                            Number.parseInt(filtros.ano || "0"),
                                            Number.parseInt(filtros.mes || "0") - 1,
                                            conta.vencimento,
                                          ),
                                          "dd/MM/yyyy",
                                        )
                                      : conta.dataGasto
                                        ? format(new Date(conta.dataGasto + "T00:00:00"), "dd/MM/yyyy")
                                        : "-"}
                                </TableCell>
                                <TableCell className="text-sm font-medium">{formatarMoeda(conta.valor)}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    pago
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : "bg-red-500/10 text-red-500"
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${pago ? "bg-emerald-500" : "bg-red-500"}`} />
                                    {pago ? "Pago" : "Pendente"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {conta.tipo === "parcelada"
                                    ? conta.dataPagamento
                                      ? format(new Date(conta.dataPagamento + "T00:00:00"), "dd/MM/yyyy")
                                      : "-"
                                    : conta.pagamentos && conta.pagamentos.length > 0
                                      ? format(new Date(conta.pagamentos[0].dataPagamento + "T00:00:00"), "dd/MM/yyyy")
                                      : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <TooltipProvider>
                                    <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-7 w-7 ${
                                              pago
                                                ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                                : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                            }`}
                                            onClick={() => togglePago(conta)}
                                          >
                                            {pago ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                          {pago ? "Desfazer" : "Pagar"}
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                            onClick={() => {
                                              setContaEditando(conta)
                                              setEditDialogOpen(true)
                                            }}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Editar</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <WhatsAppButton
                                              conta={conta}
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                            />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">WhatsApp</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </TooltipProvider>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <EditContaDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onEdit={handleEditConta}
        conta={contaEditando}
      />
    </div>
  )
}
