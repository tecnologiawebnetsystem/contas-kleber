"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import type { Conta } from "@/types/conta"

interface EditParcelaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conta: Conta | null
  mes: number
  ano: number
  onSave: (contaId: string, mes: number, ano: number, valorAjustado: number | null, vencimentoAjustado: number | null) => void
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function EditParcelaDialog({ open, onOpenChange, conta, mes, ano, onSave }: EditParcelaDialogProps) {
  const [valor, setValor] = useState("")
  const [diaVencimento, setDiaVencimento] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (conta && open) {
      // Buscar se já existe ajuste para esta parcela
      const pagamento = conta.pagamentos?.find((p) => p.mes === mes && p.ano === ano)
      setValor(pagamento?.valorAjustado?.toString() || conta.valor.toString())
      setDiaVencimento(
        pagamento?.vencimentoAjustado?.toString() || conta.vencimento?.toString() || ""
      )
    }
  }, [conta, open, mes, ano])

  const getParcelaAtual = () => {
    if (!conta || conta.tipo !== "parcelada" || !conta.dataInicio) return null
    const inicio = new Date(conta.dataInicio + "T00:00:00")
    const mesInicio = inicio.getMonth() + 1
    const anoInicio = inicio.getFullYear()
    const diff = (ano - anoInicio) * 12 + (mes - mesInicio) + 1
    return diff
  }

  const parcelaAtual = getParcelaAtual()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conta) return

    setSalvando(true)
    try {
      const valorNum = Number.parseFloat(valor)
      const diaNum = Number.parseInt(diaVencimento)

      // Se os valores são iguais aos originais, salva null (sem ajuste)
      const valorAjustado = valorNum !== conta.valor ? valorNum : null
      const vencimentoAjustado = diaNum !== conta.vencimento ? diaNum : null

      await onSave(conta.id, mes, ano, valorAjustado, vencimentoAjustado)
      onOpenChange(false)
    } finally {
      setSalvando(false)
    }
  }

  if (!conta) return null

  const temAjuste = (() => {
    const pagamento = conta.pagamentos?.find((p) => p.mes === mes && p.ano === ano)
    return pagamento?.valorAjustado != null || pagamento?.vencimentoAjustado != null
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Editar Parcela</DialogTitle>
          <DialogDescription>
            {conta.tipo === "parcelada" && parcelaAtual
              ? `Parcela ${parcelaAtual}/${conta.parcelas} de "${conta.nome}" - ${meses[mes - 1]}/${ano}`
              : `"${conta.nome}" - ${meses[mes - 1]}/${ano}`}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Alterações aqui afetam apenas esta parcela/mês. Para alterar a conta inteira, use "Editar Conta".
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="valor-parcela">Valor desta parcela (R$)</Label>
            <Input
              id="valor-parcela"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
            {Number.parseFloat(valor) !== conta.valor && (
              <p className="text-xs text-amber-500">
                Valor original: R$ {conta.valor.toFixed(2)}
              </p>
            )}
          </div>

          {(conta.tipo === "fixa" || conta.tipo === "parcelada") && (
            <div className="space-y-2">
              <Label htmlFor="vencimento-parcela">Dia de vencimento desta parcela</Label>
              <Input
                id="vencimento-parcela"
                type="number"
                min="1"
                max="31"
                placeholder="Dia"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                required
              />
              {Number.parseInt(diaVencimento) !== conta.vencimento && (
                <p className="text-xs text-amber-500">
                  Vencimento original: dia {conta.vencimento}
                </p>
              )}
            </div>
          )}

          {temAjuste && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setValor(conta.valor.toString())
                setDiaVencimento(conta.vencimento?.toString() || "")
              }}
            >
              Restaurar valores originais
            </Button>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Parcela"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
