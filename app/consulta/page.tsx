"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import type { Conta } from "@/types/conta"
import { WhatsAppButton } from "@/components/whatsapp-button"

type Filtro = "todos" | "pagos" | "pendentes" | "atrasados" | "proximos"

export default function ConsultaPage() {
  const [contas, setContas] = useState<Conta[]>([])
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [busca, setBusca] = useState("")
  const [mesAno, setMesAno] = useState("")
  const [loading, setLoading] = useState(true)

  // Fetch contas from Supabase
  const fetchContas = async () => {
    try {
      const response = await fetch("/api/contas")
      if (!response.ok) throw new Error("Erro ao buscar contas")
      const data = await response.json()
      setContas(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar contas:", error)
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
    setMesAno(`${ano}-${mes}`)
  }, [])

  const [anoSelecionado, mesSelecionado] = mesAno
    ? mesAno.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1]

  console.log("[v0] Mês/Ano selecionado:", { mesAno, anoSelecionado, mesSelecionado })

  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()
  const diaAtual = hoje.getDate()

  const contasFiltradas = contas
    .map((conta) => {
      if (conta.tipo === "diaria") {
        if (!conta.dataGasto) {
          console.log("[v0] Gasto diário sem data:", conta.nome)
          return null
        }

        const dataGasto = new Date(conta.dataGasto + "T00:00:00")
        const mesGasto = dataGasto.getMonth()
        const anoGasto = dataGasto.getFullYear()

        console.log("[v0] Processando gasto diário:", {
          nome: conta.nome,
          dataGasto: conta.dataGasto,
          mesGasto,
          anoGasto,
          mesSelecionado,
          anoSelecionado,
          match: mesGasto === mesSelecionado - 1 && anoGasto === anoSelecionado,
        })

        if (mesGasto !== mesSelecionado - 1 || anoGasto !== anoSelecionado) return null

        return {
          ...conta,
          isPago: true, // Gastos diários já são considerados pagos
          pagamento: {
            mes: mesGasto,
            ano: anoGasto,
            dataPagamento: conta.dataGasto,
            anexo: conta.anexoDiario || conta.pagamentos?.find((p) => p.mes === mesGasto && p.ano === anoGasto)?.anexo,
          },
          estaAtrasado: false,
          estaProximo: false,
        }
      }

      if (conta.tipo === "fixa") {
        const isPago = conta.pagamentos?.some((p) => p.mes === mesSelecionado - 1 && p.ano === anoSelecionado)
        const pagamento = conta.pagamentos?.find((p) => p.mes === mesSelecionado - 1 && p.ano === anoSelecionado)

        const estaAtrasado =
          mesSelecionado - 1 === mesAtual && anoSelecionado === anoAtual && conta.vencimento < diaAtual && !isPago

        const estaProximo =
          mesSelecionado - 1 === mesAtual &&
          anoSelecionado === anoAtual &&
          conta.vencimento - diaAtual <= 3 &&
          conta.vencimento - diaAtual > 0 &&
          !isPago

        return {
          ...conta,
          isPago,
          pagamento,
          estaAtrasado,
          estaProximo,
        }
      }

      if (conta.tipo === "parcelada") {
        const inicio = new Date(conta.dataInicio!)
        const parcelaAtual = (anoSelecionado - inicio.getFullYear()) * 12 + (mesSelecionado - 1 - inicio.getMonth()) + 1

        if (parcelaAtual <= 0 || parcelaAtual > conta.parcelas!) return null

        const isPago = conta.pagamentos?.some((p) => p.mes === mesSelecionado - 1 && p.ano === anoSelecionado)
        const pagamento = conta.pagamentos?.find((p) => p.mes === mesSelecionado - 1 && p.ano === anoSelecionado)

        const estaAtrasado =
          mesSelecionado - 1 === mesAtual && anoSelecionado === anoAtual && conta.vencimento < diaAtual && !isPago

        const estaProximo =
          mesSelecionado - 1 === mesAtual &&
          anoSelecionado === anoAtual &&
          conta.vencimento - diaAtual <= 3 &&
          conta.vencimento - diaAtual > 0 &&
          !isPago

        return {
          ...conta,
          parcelaAtual,
          isPago,
          pagamento,
          estaAtrasado,
          estaProximo,
        }
      }

      return null
    })
    .filter((conta) => conta !== null)
    .filter((conta) => {
      if (filtro === "pagos") return conta.isPago
      if (filtro === "pendentes") return !conta.isPago
      if (filtro === "atrasados") return conta.estaAtrasado
      if (filtro === "proximos") return conta.estaProximo
      return true
    })
    .filter((conta) => conta.nome.toLowerCase().includes(busca.toLowerCase()))

  console.log("[v0] Contas filtradas:", contasFiltradas.length, contasFiltradas)

  const totalGeral = contasFiltradas.reduce((sum, conta) => sum + conta.valor, 0)
  const totalPago = contasFiltradas.filter((c) => c.isPago).reduce((sum, conta) => sum + conta.valor, 0)
  const totalPendente = totalGeral - totalPago

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Consulta de Pagamentos</h1>
              <p className="text-muted-foreground mt-1">Visualize e gerencie seus pagamentos</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Período</label>
                  <Input type="month" value={mesAno} onChange={(e) => setMesAno(e.target.value)} />
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

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome da conta..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalGeral.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{contasFiltradas.length} contas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {contasFiltradas.filter((c) => c.isPago).length} contas pagas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">R$ {totalPendente.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {contasFiltradas.filter((c) => !c.isPago).length} contas pendentes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Contas */}
          <Card>
            <CardHeader>
              <CardTitle>
                Contas de {meses[mesSelecionado - 1]} {anoSelecionado}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Comprovante</TableHead>
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
                        <TableRow key={conta.id}>
                          <TableCell className="font-medium">{conta.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {conta.tipo === "fixa"
                                ? "Fixa"
                                : conta.tipo === "diaria"
                                  ? "Diária"
                                  : `${conta.parcelaAtual}/${conta.parcelas}`}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {conta.tipo === "diaria"
                              ? new Date(conta.dataGasto! + "T00:00:00").toLocaleDateString("pt-BR")
                              : `Dia ${conta.vencimento}`}
                          </TableCell>
                          <TableCell>R$ {conta.valor.toFixed(2)}</TableCell>
                          <TableCell>
                            {conta.isPago ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Pago</Badge>
                            ) : conta.estaAtrasado ? (
                              <Badge variant="destructive">Atrasado</Badge>
                            ) : conta.estaProximo ? (
                              <Badge className="bg-amber-500 hover:bg-amber-600">Vence em breve</Badge>
                            ) : (
                              <Badge variant="secondary">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {conta.pagamento?.dataPagamento
                              ? new Date(conta.pagamento.dataPagamento + "T00:00:00").toLocaleDateString("pt-BR")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {conta.pagamento?.anexo ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement("a")
                                  link.href = conta.pagamento!.anexo!
                                  link.download = `comprovante-${conta.nome}.${conta.pagamento!.anexo!.startsWith("data:application/pdf") ? "pdf" : "jpg"}`
                                  link.click()
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Baixar
                              </Button>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {conta.isPago && conta.pagamento && (
                              <WhatsAppButton
                                conta={conta}
                                mes={mesSelecionado - 1}
                                ano={anoSelecionado}
                                dataPagamento={conta.pagamento.dataPagamento!}
                                anexo={conta.pagamento.anexo}
                                variant="ghost"
                                size="sm"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
