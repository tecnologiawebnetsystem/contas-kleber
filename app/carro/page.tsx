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
import { Car, Plus, ArrowLeft, Trash2, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { formatarMoeda } from "@/utils/formatar-moeda"
import { ThemeToggle } from "@/components/theme-toggle"

type PagamentoCarro = {
  id: string
  valor: number
  data_pagamento: string
  descricao: string
  created_at: string
}

export default function CarroPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [pagamentos, setPagamentos] = useState<PagamentoCarro[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [valor, setValor] = useState("")
  const [dataPagamento, setDataPagamento] = useState("")
  const [descricao, setDescricao] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Verificar se o usuário é o Kleber (PIN 080754)
  const isKleber = user?.pin === "080754"

  useEffect(() => {
    if (!isKleber) {
      router.push("/")
      return
    }
    fetchPagamentos()
  }, [isKleber, router])

  const fetchPagamentos = async () => {
    try {
      const response = await fetch("/api/carro")
      if (!response.ok) throw new Error("Erro ao buscar pagamentos")
      const data = await response.json()
      setPagamentos(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar pagamentos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pagamentos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!valor || !dataPagamento) {
      toast({
        title: "Atenção",
        description: "Preencha o valor e a data do pagamento.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/carro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: parseFloat(valor.replace(/\D/g, "")) / 100,
          data_pagamento: dataPagamento,
          descricao: descricao || "Pagamento do carro",
        }),
      })

      if (!response.ok) throw new Error("Erro ao adicionar pagamento")

      toast({
        title: "Sucesso",
        description: "Pagamento adicionado com sucesso!",
      })

      setValor("")
      setDataPagamento("")
      setDescricao("")
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
      const response = await fetch(`/api/carro?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao deletar pagamento")

      toast({
        title: "Sucesso",
        description: "Pagamento removido com sucesso!",
      })

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

  const totalPago = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0)

  const formatarData = (dataString: string) => {
    const data = new Date(dataString + "T00:00:00")
    return data.toLocaleDateString("pt-BR")
  }

  if (!isKleber) {
    return null
  }

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
                    <p className="text-white/70 text-sm">
                      Controle de pagamentos do veículo
                    </p>
                  </div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Widget de total pago */}
            <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-2xl">
                      <Wallet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Total Pago
                      </p>
                      <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                        {formatarMoeda(totalPago)}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        {pagamentos.length} pagamento(s) registrado(s)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão adicionar */}
            <div className="flex justify-end">
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-slate-700 via-gray-700 to-zinc-700 hover:from-slate-800 hover:via-gray-800 hover:to-zinc-800 text-white shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Pagamento
              </Button>
            </div>

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
                          <TableHead className="font-semibold">Descrição</TableHead>
                          <TableHead className="font-semibold text-right">Valor</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
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
                            <TableCell className="text-muted-foreground">
                              {pagamento.descricao}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatarMoeda(Number(pagamento.valor))}
                            </TableCell>
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
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
