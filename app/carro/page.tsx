"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Car, Plus, ArrowLeft, Trash2, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { formatarMoeda } from "@/utils/formatar-moeda"
import { ThemeToggle } from "@/components/theme-toggle"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { offlineStorage } from "@/lib/offline/storage"
import { OnlineStatus } from "@/components/online-status"
import { WifiOff } from "lucide-react"

const CARROS = [
  { value: "palio_sporting", label: "Palio Sporting" },
  { value: "volvo_xc60", label: "Volvo XC60" },
] as const

type CarroValue = (typeof CARROS)[number]["value"]

type PagamentoCarro = {
  id: string
  valor: number
  data_pagamento: string
  descricao: string
  carro: CarroValue
  created_at: string
}

export default function CarroPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  const [pagamentos, setPagamentos] = useState<PagamentoCarro[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [valor, setValor] = useState("")
  const [dataPagamento, setDataPagamento] = useState("")
  const [descricao, setDescricao] = useState("")
  const [carroSelecionado, setCarroSelecionado] = useState<CarroValue | "">("")
  const [submitting, setSubmitting] = useState(false)

  // Perfil 1 = acesso total (Kleber), Perfil 2 = consulta (Pamela)
  const temAcessoTotal = user?.perfil === 1

  useEffect(() => {
    fetchPagamentos()
  }, [])

  // Recarregar dados quando voltar online
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) {
        // Aguarda um pouco para a sincronização terminar e recarrega os dados
        setTimeout(() => {
          fetchPagamentos()
        }, 2000)
      }
    }

    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])

  const fetchPagamentos = async () => {
    try {
      if (isOnline) {
        const response = await fetch("/api/carro")
        if (!response.ok) throw new Error("Erro ao buscar pagamentos")
        const data = await response.json()
        // Ordenar por data decrescente (mais recente primeiro)
        const dadosOrdenados = data.sort((a: PagamentoCarro, b: PagamentoCarro) => 
          new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime()
        )
        setPagamentos(dadosOrdenados)
        // Salvar no cache offline
        await offlineStorage.savePagamentosCarro(dadosOrdenados)
      } else {
        // Buscar do cache offline
        const cachedData = await offlineStorage.getPagamentosCarro()
        setPagamentos(cachedData.sort((a, b) => 
          new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime()
        ))
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar pagamentos:", error)
      // Tentar carregar do cache em caso de erro
      try {
        const cachedData = await offlineStorage.getPagamentosCarro()
        if (cachedData.length > 0) {
          setPagamentos(cachedData.sort((a, b) => 
            new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime()
          ))
          toast({
            title: "Modo Offline",
            description: "Mostrando dados salvos localmente.",
          })
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os pagamentos.",
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os pagamentos.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!valor || !dataPagamento || !carroSelecionado) {
      toast({
        title: "Atenção",
        description: "Preencha o valor, a data e selecione o carro.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    const novoPagamento = {
      id: `temp-${Date.now()}`,
      valor: parseFloat(valor.replace(/\D/g, "")) / 100,
      data_pagamento: dataPagamento,
      descricao: descricao || "Pagamento do carro",
      carro: carroSelecionado as CarroValue,
      created_at: new Date().toISOString(),
    }

    try {
      if (isOnline) {
        const response = await fetch("/api/carro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            valor: novoPagamento.valor,
            data_pagamento: novoPagamento.data_pagamento,
            descricao: novoPagamento.descricao,
            carro: novoPagamento.carro,
          }),
        })

        if (!response.ok) throw new Error("Erro ao adicionar pagamento")

        toast({
          title: "Sucesso",
          description: "Pagamento adicionado com sucesso!",
        })
      } else {
        // Salvar localmente quando offline
        await offlineStorage.addPagamentoCarro(novoPagamento)
        await offlineStorage.addPendingOperation({
          type: "insert",
          table: "carro",
          data: novoPagamento,
        })
        toast({
          title: "Salvo localmente",
          description: "Pagamento será sincronizado quando estiver online.",
        })
      }

      setValor("")
      setDataPagamento("")
      setDescricao("")
      setCarroSelecionado("")
      setDialogOpen(false)
      fetchPagamentos()
    } catch (error) {
      console.error("[v0] Erro ao adicionar pagamento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o pagamento.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      if (isOnline) {
        const response = await fetch(`/api/carro?id=${id}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Erro ao deletar pagamento")

        toast({
          title: "Sucesso",
          description: "Pagamento removido com sucesso!",
        })
      } else {
        // Remover localmente quando offline
        await offlineStorage.removePagamentoCarro(id)
        await offlineStorage.addPendingOperation({
          type: "delete",
          table: "carro",
          data: { id },
        })
        toast({
          title: "Removido localmente",
          description: "A remoção será sincronizada quando estiver online.",
        })
      }

      fetchPagamentos()
    } catch (error) {
      console.error("[v0] Erro ao deletar pagamento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o pagamento.",
        variant: "destructive",
      })
    }
  }

  const formatarValorInput = (value: string) => {
    const numeros = value.replace(/\D/g, "")
    const valorNumerico = parseFloat(numeros) / 100
    if (isNaN(valorNumerico)) return ""
    return valorNumerico.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Valor extra do Palio Sporting (não salvo no banco de dados)
  const VALOR_EXTRA_PALIO = 2000

  const totalPorCarro = CARROS.map((carro) => ({
    ...carro,
    total: pagamentos
      .filter((p) => p.carro === carro.value)
      .reduce((sum, p) => sum + Number(p.valor), 0) + (carro.value === "palio_sporting" ? VALOR_EXTRA_PALIO : 0),
    quantidade: pagamentos.filter((p) => p.carro === carro.value).length,
  }))

  const totalPago = totalPorCarro.reduce((sum, c) => sum + c.total, 0)

  const formatarData = (dataString: string) => {
    if (!dataString) return "—"
    // Se já contém hora (ISO completo), usa direto; senão adiciona T00:00:00 para evitar deslocamento de fuso
    const data = dataString.includes("T")
      ? new Date(dataString)
      : new Date(dataString + "T00:00:00")
    if (isNaN(data.getTime())) return "—"
    return data.toLocaleDateString("pt-BR")
  }

  // Perfil 2 (Pamela) pode visualizar, perfil 1 (Kleber) pode adicionar/deletar
  const podeEditar = temAcessoTotal

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando pagamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 dark:from-slate-950 dark:via-gray-950 dark:to-zinc-950">
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <Card className="shadow-2xl border-2 overflow-hidden">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-slate-700 via-gray-700 to-zinc-700 dark:from-slate-800 dark:via-gray-800 dark:to-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/")}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Car className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      Pagamentos do Carro
                    </h1>
                    <p className="text-white/70 text-sm flex items-center gap-2">
                      Controle de pagamentos do veículo
                      {!isOnline && (
                        <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded-full text-xs">
                          <WifiOff className="h-3 w-3" />
                          Offline
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <OnlineStatus userName={user?.nome} />
                <ThemeToggle />
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Widget de total pago */}
            <Card className="border-primary/20 bg-card shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                      <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Pago
                      </p>
                      <p className="text-3xl font-bold font-heading text-foreground">
                        {formatarMoeda(totalPago)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pagamentos.length} pagamento(s) registrado(s)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de total por carro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {totalPorCarro.map((carro) => {
                const isPalio = carro.value === "palio_sporting"
                return (
                  <Card 
                    key={carro.value} 
                    className={`border-2 bg-card shadow-sm relative overflow-hidden ${
                      isPalio 
                        ? "border-blue-200 dark:border-blue-800" 
                        : "border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 ${
                      isPalio 
                        ? "bg-blue-500" 
                        : "bg-amber-500"
                    }`} />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          isPalio 
                            ? "bg-blue-100 dark:bg-blue-900/30" 
                            : "bg-amber-100 dark:bg-amber-900/30"
                        }`}>
                          <Car className={`h-5 w-5 ${
                            isPalio 
                              ? "text-blue-600 dark:text-blue-400" 
                              : "text-amber-600 dark:text-amber-400"
                          }`} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{carro.label}</p>
                          <p className={`text-xl font-bold ${
                            isPalio 
                              ? "text-blue-700 dark:text-blue-300" 
                              : "text-amber-700 dark:text-amber-300"
                          }`}>
                            {formatarMoeda(carro.total)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {carro.quantidade} pagamento(s)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Botão adicionar - apenas Kleber */}
            {podeEditar && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="bg-gradient-to-r from-slate-700 via-gray-700 to-zinc-700 hover:from-slate-800 hover:via-gray-800 hover:to-zinc-800 text-white shadow-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Pagamento
                </Button>
              </div>
            )}

            {/* Tabela de pagamentos */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pagamentos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Car className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Nenhum pagamento registrado ainda.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900">
                          <TableHead className="font-semibold">Data</TableHead>
                          <TableHead className="font-semibold">Carro</TableHead>
                          <TableHead className="font-semibold">Descrição</TableHead>
                          <TableHead className="font-semibold text-right">Valor</TableHead>
                          {podeEditar && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagamentos.map((pagamento) => (
                          <TableRow
                            key={pagamento.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              {formatarData(pagamento.data_pagamento)}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {CARROS.find((c) => c.value === pagamento.carro)?.label ?? pagamento.carro ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {pagamento.descricao}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {formatarMoeda(Number(pagamento.valor))}
                            </TableCell>
                            {podeEditar && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(pagamento.id)}
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para adicionar pagamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Novo Pagamento
            </DialogTitle>
            <DialogDescription>
              Registre um novo pagamento do carro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="carro">Carro</Label>
              <Select
                value={carroSelecionado}
                onValueChange={(v) => setCarroSelecionado(v as CarroValue)}
              >
                <SelectTrigger id="carro" className="w-full">
                  <SelectValue placeholder="Selecione o carro" />
                </SelectTrigger>
                <SelectContent>
                  {CARROS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(formatarValorInput(e.target.value))}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data do Pagamento</Label>
              <Input
                id="data"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                placeholder="Pagamento do carro"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
