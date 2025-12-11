"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpCircle, Trash2, Share2, FileText } from "lucide-react"
import { PagamentoDialog } from "@/components/pagamento-dialog"
import { useState } from "react"
import type { Conta } from "@/types/conta"

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
}

export function ListaTransacoes({ transacoes, contas, onTogglePago, onDelete, onAddPagamento }: ListaTransacoesProps) {
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

  const itensCombinados = [
    // Adicionar todas as transações de crédito
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
    // Adicionar todas as contas do mês atual
    ...contas
      .filter((conta) => {
        if (conta.tipo === "fixa") return true
        if (conta.tipo === "diaria") {
          if (!conta.data_gasto) return false
          const dataGasto = new Date(conta.data_gasto)
          return dataGasto.getMonth() === mesAtual && dataGasto.getFullYear() === anoAtual
        }
        if (conta.tipo === "parcelada") {
          const inicio = new Date(conta.data_inicio!)
          const parcelaAtual = (anoAtual - inicio.getFullYear()) * 12 + (mesAtual - inicio.getMonth()) + 1
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
  ].sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

  const handleMarcarPago = (conta: Conta) => {
    setContaSelecionada(conta)
    setDialogOpen(true)
  }

  const handleCompartilharWhatsApp = (conta: Conta) => {
    const pagamento = conta.pagamentos?.find((p) => p.mes === mesAtual && p.ano === anoAtual)
    if (!pagamento) return

    const mensagem =
      `✅ *Pagamento Realizado*\n\n` +
      `📄 Conta: ${conta.nome}\n` +
      `💰 Valor: R$ ${conta.valor.toFixed(2)}\n` +
      `📅 Data do Pagamento: ${new Date(pagamento.dataPagamento!).toLocaleDateString("pt-BR")}\n` +
      `📌 Vencimento: dia ${conta.vencimento}\n` +
      `📊 Mês: ${meses[mesAtual]}/${anoAtual}`

    const mensagemEncoded = encodeURIComponent(mensagem)
    window.open(`https://wa.me/?text=${mensagemEncoded}`, "_blank")
  }

  const getParcelaAtual = (conta: Conta) => {
    if (conta.tipo !== "parcelada") return null
    const inicio = new Date(conta.data_inicio!)
    const parcelaAtual = (anoAtual - inicio.getFullYear()) * 12 + (mesAtual - inicio.getMonth()) + 1
    return parcelaAtual
  }

  const isPago = (conta: Conta) => {
    return conta.pagamentos?.some((p) => p.mes === mesAtual && p.ano === anoAtual) || false
  }

  if (itensCombinados.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {meses[mesAtual]}/{anoAtual}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação registrada ainda.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {meses[mesAtual]}/{anoAtual}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {itensCombinados.map((item) => {
              if (item.tipo === "credito") {
                const dataFormatada = item.data.toLocaleDateString("pt-BR")
                const horaFormatada = item.created_at.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
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
                      <span className="font-bold text-green-600 dark:text-green-400">+ R$ {item.valor.toFixed(2)}</span>
                    </div>
                  </div>
                )
              } else {
                const conta = item.conta!
                const pago = isPago(conta)
                const parcelaAtual = getParcelaAtual(conta)
                const pagamento = conta.pagamentos?.find((p) => p.mes === mesAtual && p.ano === anoAtual)

                return (
                  <div
                    key={item.id}
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
