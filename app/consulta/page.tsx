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
    const hoje = new Date()
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")
    const ano = hoje.getFullYear()
    const dia = String(hoje.getDate()).padStart(2, "0")
    setMesAno(`${ano}-${mes}`)
    setDiaEspecifico(`${ano}-${mes}-${dia}`)
  }, [])

  useEffect(() => {
    setPesquisaRealizada(false)
    setContasFiltradas([])
  }, [filtroPeriodo, mesAno, diaEspecifico, tipoSelecionado, categoriaSelecionada, contaSelecionada, filtro])

  useEffect(() => {
    setContaSelecionada("todas")
  }, [tipoSelecionado, categoriaSelecionada])

  const executarPesquisa = async () => {
    await fetchContas()
    const semFiltroPeriodo = filtroPeriodo === "todos"
    const filtroDia = filtroPeriodo === "dia"

    const [anoSelecionado, mesSelecionado, diaSelecionado] = diaEspecifico
      ? diaEspecifico.split("-").map(Number)
      : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]

    const [anoMes, mesMes] = mesAno ? mesAno.split("-").map(Number) : [anoSelecionado, mesSelecionado]

    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()
    const diaAtual = hoje.getDate()

    const calcularDataVencimento = (dataInicio: string, numeroParcela: number, diaVencimento: number) => {
      const inicio = new Date(dataInicio)
      const mesInicio = inicio.getMonth()
      const anoInicio = inicio.getFullYear()

      const mesesParaSomar = numeroParcela - 1
      let mesVencimento = mesInicio + mesesParaSomar
      let anoVencimento = anoInicio

      while (mesVencimento > 11) {
        mesVencimento -= 12
        anoVencimento++
      }

      const ultimoDiaDoMes = new Date(anoVencimento, mesVencimento + 1, 0).getDate()
      const diaFinal = Math.min(diaVencimento, ultimoDiaDoMes)

      return new Date(anoVencimento, mesVencimento, diaFinal)
    }

    const todasContasProcessadas: Conta[] = []

    todasContas.forEach((conta) => {
      if (conta.tipo === "parcelada" && conta.parcelas && conta.parcelas > 1) {
        const dataInicio = conta.dataInicio || conta.createdAt
        if (!dataInicio) return

        for (let i = 1; i <= conta.parcelas; i++) {
          const dataVencimento = calcularDataVencimento(dataInicio, i, conta.vencimento)
          const mesVencimento = dataVencimento.getMonth() + 1
          const anoVencimento = dataVencimento.getFullYear()
          const diaVencimento = dataVencimento.getDate()

          if (filtroDia) {
            if (
              diaVencimento !== diaSelecionado ||
              mesVencimento !== mesSelecionado ||
              anoVencimento !== anoSelecionado
            )
              continue
          } else if (!semFiltroPeriodo) {
            if (mesVencimento !== mesMes || anoVencimento !== anoMes) continue
          }

          const dataVencimentoISO = dataVencimento.toISOString().split("T")[0]
          const isPago = conta.pagamentos?.some((p) => p.ano === anoVencimento && p.mes === mesVencimento) || false

          const estaAtrasado = !isPago && dataVencimento < hoje
          const diffDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          const estaProximo = !isPago && diffDias > 0 && diffDias <= 7

          todasContasProcessadas.push({
            ...conta,
            parcelaAtual: i,
            dataVencimento: dataVencimentoISO,
            isPago,
            estaAtrasado,
            estaProximo,
          })
        }
      } else if (conta.tipo === "fixa") {
        if (!semFiltroPeriodo && !filtroDia) {
          const dataCriacao = new Date(conta.createdAt)
          if (dataCriacao > new Date(anoMes, mesMes - 1, 1)) return
        }

        const ano = filtroDia ? anoSelecionado : semFiltroPeriodo ? anoAtual : anoMes
        const mes = filtroDia ? mesSelecionado : semFiltroPeriodo ? mesAtual + 1 : mesMes

        const ultimoDiaDoMes = new Date(ano, mes, 0).getDate()
        const diaVencimento = Math.min(conta.vencimento, ultimoDiaDoMes)
        const dataVencimento = new Date(ano, mes - 1, diaVencimento)

        if (filtroDia && diaVencimento !== diaSelecionado) return

        const isPago = conta.pagamentos?.some((p) => p.ano === ano && p.mes === mes) || false

        const estaAtrasado = !isPago && dataVencimento < hoje
        const diffDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        const estaProximo = !isPago && diffDias > 0 && diffDias <= 7

        todasContasProcessadas.push({
          ...conta,
          dataVencimento: dataVencimento.toISOString().split("T")[0],
          isPago,
          estaAtrasado,
          estaProximo,
        })
      } else if (conta.tipo === "diaria" || conta.tipo === "caixinha") {
        if (!conta.dataGasto) return null

        const dataGasto = new Date(conta.dataGasto + "T00:00:00")
        const mesGasto = dataGasto.getMonth() + 1
        const anoGasto = dataGasto.getFullYear()
        const diaGasto = dataGasto.getDate()

        if (filtroDia) {
          if (diaGasto !== diaSelecionado || mesGasto !== mesSelecionado || anoGasto !== anoSelecionado) return null
        } else if (!semFiltroPeriodo && (mesGasto !== mesMes || anoGasto !== anoMes)) return null

        const isPago = true

        todasContasProcessadas.push({
          ...conta,
          isPago,
          estaAtrasado: false,
          estaProximo: false,
        })
      }
    })

    const resultados = todasContasProcessadas.filter((conta) => {
      if (tipoSelecionado !== "todos" && conta.tipo !== tipoSelecionado) return false
      if (categoriaSelecionada !== "todas" && conta.categoria !== categoriaSelecionada) return false
      if (contaSelecionada !== "todas" && conta.id !== contaSelecionada) return false
      if (filtro === "pagos") return conta.isPago
      if (filtro === "pendentes") return !conta.isPago
      if (filtro === "atrasados") return conta.estaAtrasado
      if (filtro === "proximos") return conta.estaProximo
      return true
    })

    setContasFiltradas(resultados)
    setPesquisaRealizada(true)
  }

  const contasFiltradasParaDropdown = todasContas.filter((conta) => {
    if (tipoSelecionado !== "todos" && conta.tipo !== tipoSelecionado) return false
    if (categoriaSelecionada !== "todas" && conta.categoria !== categoriaSelecionada) return false
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
                      onChange={(e) => setMesAno(e.target.value)}
                      disabled={filtroPeriodo !== "periodo"}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Dia Específico</label>
                    <Input
                      type="date"
                      value={diaEspecifico}
                      onChange={(e) => setDiaEspecifico(e.target.value)}
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
                    <div className="text-2xl font-bold text-green-600">
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
                            <TableRow key={`${conta.id}-${conta.parcelaAtual || "unica"}`}>
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
                                {conta.tipo === "diaria" || conta.tipo === "caixinha"
                                  ? new Date(conta.dataGasto! + "T00:00:00").toLocaleDateString("pt-BR")
                                  : conta.tipo === "parcelada" && conta.dataVencimento
                                    ? new Date(conta.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")
                                    : `Dia ${conta.vencimento}`}
                              </TableCell>
                              <TableCell className="font-semibold">{formatarMoeda(conta.valor)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    conta.isPago
                                      ? "default"
                                      : conta.estaAtrasado
                                        ? "destructive"
                                        : conta.estaProximo
                                          ? "secondary"
                                          : "outline"
                                  }
                                >
                                  {conta.isPago
                                    ? "Pago"
                                    : conta.estaAtrasado
                                      ? "Atrasado"
                                      : conta.estaProximo
                                        ? "Vence em breve"
                                        : "Pendente"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {conta.isPago && conta.tipo !== "diaria" && conta.tipo !== "caixinha"
                                  ? conta.pagamentos?.find((p) => {
                                      const dataVenc = new Date(conta.dataVencimento! + "T00:00:00")
                                      return p.ano === dataVenc.getFullYear() && p.mes === dataVenc.getMonth() + 1
                                    })?.dataPagamento
                                    ? new Date(
                                        conta.pagamentos.find((p) => {
                                          const dataVenc = new Date(conta.dataVencimento! + "T00:00:00")
                                          return p.ano === dataVenc.getFullYear() && p.mes === dataVenc.getMonth() + 1
                                        })!.dataPagamento,
                                      ).toLocaleDateString("pt-BR")
                                    : "-"
                                  : conta.tipo === "diaria" || conta.tipo === "caixinha"
                                    ? new Date(conta.dataGasto! + "T00:00:00").toLocaleDateString("pt-BR")
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
