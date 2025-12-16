"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Calendar, CreditCard, Share2, FileText } from "lucide-react"
import { PagamentoDialog } from "@/components/pagamento-dialog"
import { useState } from "react"
import type { Conta } from "@/types/conta"

interface ListaContasProps {
  contas: Conta[]
  onTogglePago: (id: string, mes: number, ano: number) => void
  onDelete: (id: string) => void
  onAddPagamento: (id: string, mes: number, ano: number, dataPagamento: string, anexo?: string) => void
}

export function ListaContas({ contas, onTogglePago, onDelete, onAddPagamento }: ListaContasProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState<Conta | null>(null)

  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

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

  const contasFiltradas = contas.filter((conta) => {
    if (conta.tipo === "fixa") return true
    if (conta.tipo === "diaria") return true
    if (conta.tipo === "parcelada") {
      const inicio = new Date(conta.data_inicio!)
      const parcelaAtual = (anoAtual - inicio.getFullYear()) * 12 + (mesAtual - inicio.getMonth()) + 1
      return parcelaAtual > 0 && parcelaAtual <= conta.parcelas!
    }
    return false
  })

  const getParcelaAtual = (conta: Conta) => {
    if (conta.tipo !== "parcelada") return null
    const inicio = new Date(conta.data_inicio!)
    const parcelaAtual = (anoAtual - inicio.getFullYear()) * 12 + (mesAtual - inicio.getMonth()) + 1
    return parcelaAtual
  }

  const isPago = (conta: Conta) => {
    return conta.pagamentos?.some((p) => p.mes === mesAtual && p.ano === anoAtual) || false
  }

  const handleMarcarPago = (conta: Conta) => {
    setContaSelecionada(conta)
    setDialogOpen(true)
  }

  const handleCompartilharWhatsApp = (conta: Conta) => {
    const pagamento = conta.pagamentos?.find((p) => p.mes === mesAtual && p.ano === anoAtual)
    if (!pagamento) return

    const dataVencimento = new Date(anoAtual, mesAtual, conta.vencimento).toLocaleDateString("pt-BR")

    const mensagem =
      `✅ *Pagamento Realizado*\n\n` +
      `📄 Conta: ${conta.nome}\n` +
      `💰 Valor: R$ ${conta.valor.toFixed(2)}\n` +
      `📅 Data do Pagamento: ${new Date(pagamento.dataPagamento!).toLocaleDateString("pt-BR")}\n` +
      `📌 Vencimento: ${dataVencimento}\n` +
      `📊 Mês: ${meses[mesAtual]}/${anoAtual}`

    const mensagemEncoded = encodeURIComponent(mensagem)
    window.open(`https://wa.me/?text=${mensagemEncoded}`, "_blank")
  }

  if (contas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhuma conta cadastrada ainda.
            <br />
            Clique em "Nova Conta" para começar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {meses[mesAtual]} de {anoAtual}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contasFiltradas.map((conta) => {
              const pago = isPago(conta)
              const parcelaAtual = getParcelaAtual(conta)
              const pagamento = conta.pagamentos?.find((p) => p.mes === mesAtual && p.ano === anoAtual)

              return (
                <div
                  key={conta.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={pago}
                    onCheckedChange={() => {
                      if (pago) {
                        onTogglePago(conta.id, mesAtual, anoAtual)
                      } else {
                        handleMarcarPago(conta)
                      }
                    }}
                    disabled={conta.tipo === "diaria"}
                    className="h-5 w-5 mt-1"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${pago ? "line-through text-muted-foreground" : ""}`}>
                        {conta.nome}
                      </h3>
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
                        Data do Pagamento: {new Date(conta.data_gasto).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {new Date(anoAtual, mesAtual, conta.vencimento).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {pago && pagamento && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Pago em: {new Date(pagamento.dataPagamento!).toLocaleDateString("pt-BR")}
                        </p>
                        {pagamento.anexo && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={pagamento.anexo}
                              download={`comprovante-${conta.nome}.jpg`}
                              className="text-sm text-primary hover:underline"
                            >
                              Ver comprovante
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${pago ? "text-muted-foreground" : "text-foreground"}`}>
                        R$ {conta.valor.toFixed(2)}
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
            })}
          </div>
        </CardContent>
      </Card>

      {contaSelecionada && (
        <PagamentoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          conta={contaSelecionada}
          mes={mesAtual}
          ano={anoAtual}
          onConfirm={(dataPagamento, anexo) => {
            onAddPagamento(contaSelecionada.id, mesAtual, anoAtual, dataPagamento, anexo)
            setDialogOpen(false)
            setContaSelecionada(null)
          }}
        />
      )}
    </>
  )
}
