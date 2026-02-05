"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Search, ArrowLeft, FileDown, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import type { Conta } from "@/types/conta"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { formatarMoeda } from "@/lib/utils"
import { getDataAtualBrasil } from "@/lib/date-utils"
import { format } from "date-fns"

type Filtro = "todos" | "pagos" | "pendentes" | "atrasados" | "proximos"

export default function ConsultaPage() {
  const [todasContas, setTodasContas] = useState<Conta[]>([])
  const [contasFiltradas, setContasFiltradas] = useState<Conta[]>([])
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [contaSelecionada, setContaSelecionada] = useState<string>("todas")
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

      // Adicionar filtro de tipo
      if (tipoSelecionado !== "todos") {
        params.append("tipo", tipoSelecionado)
      }

      // Adicionar filtro de categoria
      if (categoriaSelecionada !== "todos") {
        params.append("categoria", categoriaSelecionada)
      }

      // Adicionar filtro de conta específica
      if (contaSelecionada !== "todas") {
        params.append("conta_id", contaSelecionada)
      }

      // Adicionar filtro de status
      if (filtro !== "todos") {
        params.append("status", filtro)
      }

      const response = await fetch(`/api/contas?${params.toString()}`)
      if (!response.ok) throw new Error("Erro ao buscar contas")
      const data = await response.json()

      let contasFiltradas = data

      if (filtro === "atrasados") {
        contasFiltradas = data.filter((c: Conta) => c.estaAtrasado && !c.isPago)
      } else if (filtro === "proximos") {
        contasFiltradas = data.filter((c: Conta) => c.estaProximo && !c.isPago)
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

  const [anoSelecionado, mesSelecionado] = mesAno
    ? mesAno.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1]

  const exportarParaPDF = () => {
    alert("Funcionalidade de exportar para PDF será implementada em breve!")
  }

  const exportarParaExcel = () => {
    alert("Funcionalidade de exportar para Excel será implementada em breve!")
  }

  if (loading) {
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
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Consulta de Pagamentos</h1>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium">Período</label>
                  <RadioGroup
                    value={filtroPeriodo}
                    onValueChange={(v) => setFiltroPeriodo(v as "periodo" | "todos" | "dia")}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="periodo" id="com-periodo" />
                      <Label htmlFor="com-periodo" className="cursor-pointer">
                        Filtrar por mês/ano
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dia" id="por-dia" />
                      <Label htmlFor="por-dia" className="cursor-pointer">
                        Por dia
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="todos" id="todos-periodos" />
                      <Label htmlFor="todos-periodos" className="cursor-pointer">
                        Todos os períodos
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Mês/Ano</label>
                    <Input
                      type="month"
                      value={mesAno}
                      onChange={(e) => {
                        setMesAno(e.target.value)
                        const [ano, mes] = e.target.value.split("-")
                        setFiltros((prev) => ({ ...prev, periodo: "mes", mes, ano }))
                      }}
                      disabled={filtroPeriodo !== "periodo"}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Dia Específico</label>
                    <Input
                      type="date"
                      value={diaEspecifico}
                      onChange={(e) => {
                        setDiaEspecifico(e.target.value)
                        setFiltros((prev) => ({ ...prev, periodo: "dia", dia: e.target.value }))
                      }}
                      disabled={filtroPeriodo !== "dia"}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Tipo de Conta</label>
                    <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os tipos</SelectItem>
                        {tiposUnicos.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo === "fixa"
                              ? "Fixa"
                              : tipo === "parcelada"
                                ? "Parcelada"
                                : tipo === "diaria"
                                  ? "Diária"
                                  : "Caixinha"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as categorias</SelectItem>
                        {categoriasUnicas.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filtro} onValueChange={(value) => setFiltro(value as Filtro)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pagos">Pagos</SelectItem>
                        <SelectItem value="pendentes">Pendentes</SelectItem>
                        <SelectItem value="atrasados">Atrasados</SelectItem>
                        <SelectItem value="proximos">Próximos do Vencimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Conta</label>
                  <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as contas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as contas</SelectItem>
                      {nomesContasUnicas.map((conta) => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button onClick={executarPesquisa} size="lg">
                    <Search className="mr-2 h-4 w-4" />
                    Pesquisar
                  </Button>
                  {pesquisaRealizada && (
                    <>
                      <Button onClick={exportarParaPDF} size="lg" variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar PDF
                      </Button>
                      <Button onClick={exportarParaExcel} size="lg" variant="outline">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Exportar Excel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {pesquisaRealizada && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="text-2xl font-bold text-primary">
                      {formatarMoeda(
                        contasFiltradas.filter((c) => c.isPago).reduce((sum, conta) => sum + conta.valor, 0),
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {contasFiltradas.filter((c) => c.isPago).length} contas pagas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="text-2xl font-bold text-red-600">
                      {formatarMoeda(
                        contasFiltradas.filter((c) => !c.isPago).reduce((sum, conta) => sum + conta.valor, 0),
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {contasFiltradas.filter((c) => !c.isPago).length} contas pendentes
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Contas de{" "}
                    {filtroPeriodo === "periodo" && mesAno
                      ? `${meses[mesSelecionado - 1]} ${anoSelecionado}`
                      : filtroPeriodo === "dia" && diaEspecifico
                        ? new Date(diaEspecifico + "T00:00:00").toLocaleDateString("pt-BR")
                        : "Todos os Períodos"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conta</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data Pagamento</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contasFiltradas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              Nenhuma conta encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          contasFiltradas.map((conta) => (
                            <TableRow key={`${conta.id}-${conta.parcelaAtual || "unico"}`}>
                              <TableCell className="font-medium">{conta.nome}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {conta.tipo === "fixa"
                                    ? "Fixa"
                                    : conta.tipo === "diaria"
                                      ? "Diária"
                                      : conta.tipo === "caixinha"
                                        ? "Caixinha"
                                        : "Parcelada"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {conta.tipo === "parcelada" ? `${conta.parcelaAtual}/${conta.parcelas}` : "-"}
                              </TableCell>
                              <TableCell>
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
                              <TableCell>R$ {conta.valor.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    conta.tipo === "parcelada"
                                      ? conta.pago
                                        ? "default"
                                        : "secondary"
                                      : conta.pagamentos && conta.pagamentos.length > 0
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {conta.tipo === "parcelada"
                                    ? conta.pago
                                      ? "Pago"
                                      : "Pendente"
                                    : conta.pagamentos && conta.pagamentos.length > 0
                                      ? "Pago"
                                      : "Pendente"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {conta.tipo === "parcelada"
                                  ? conta.dataPagamento
                                    ? format(new Date(conta.dataPagamento + "T00:00:00"), "dd/MM/yyyy")
                                    : "-"
                                  : conta.pagamentos && conta.pagamentos.length > 0
                                    ? format(new Date(conta.pagamentos[0].dataPagamento + "T00:00:00"), "dd/MM/yyyy")
                                    : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <WhatsAppButton conta={conta} />
                              </TableCell>
                            </TableRow>
                          ))
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
    </div>
  )
}
