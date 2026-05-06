"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Scale } from "lucide-react"
import { formatarMoeda } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LancamentoAdvogado {
  id: string
  nome_pessoa: string
  valor: number
  created_at: string
}

interface EmprestimoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function EmprestimoDialog({ open, onOpenChange, onUpdate }: EmprestimoDialogProps) {
  const [lancamentos, setLancamentos] = useState<LancamentoAdvogado[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")

  useEffect(() => {
    if (open) {
      fetchLancamentos()
    }
  }, [open])

  const fetchLancamentos = async () => {
    try {
      const res = await fetch("/api/emprestimos")
      if (res.ok) {
        const data = await res.json()
        setLancamentos(data)
      }
    } catch (error) {
      console.error("Erro ao buscar lançamentos do advogado:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valor) return

    setLoading(true)
    try {
      const res = await fetch("/api/emprestimos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomePessoa: descricao || "Advogado",
          valor: parseFloat(valor),
          dataDevolucao: new Date().toISOString().split("T")[0],
        }),
      })
      if (res.ok) {
        setDescricao("")
        setValor("")
        setShowForm(false)
        fetchLancamentos()
        onUpdate?.()
      }
    } catch (error) {
      console.error("Erro ao registrar lançamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/emprestimos/${id}`, { method: "DELETE" })
      fetchLancamentos()
      onUpdate?.()
    } catch (error) {
      console.error("Erro ao remover lançamento:", error)
    }
  }

  const TOTAL_CONTRATADO = 13000
  const totalPago = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0)
  const totalRestante = Math.max(0, TOTAL_CONTRATADO - totalPago)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-500" />
            Advogado
          </DialogTitle>
          <DialogDescription>
            Acompanhe os pagamentos ao advogado
          </DialogDescription>
        </DialogHeader>

        {/* Painel de resumo */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/40 bg-card px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground leading-none">Total contratado</span>
            <span className="text-sm font-bold text-foreground">{formatarMoeda(TOTAL_CONTRATADO)}</span>
          </div>
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground leading-none">Já pago</span>
            <span className="text-sm font-bold text-indigo-500">{formatarMoeda(totalPago)}</span>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground leading-none">Restante</span>
            <span className="text-sm font-bold text-amber-500">{formatarMoeda(totalRestante)}</span>
          </div>
        </div>

        {/* Lista de lançamentos */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {lancamentos.map((lanc) => (
            <div
              key={lanc.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/40 bg-card hover:bg-accent/30 transition-colors group"
            >
              <span className="text-sm font-medium text-foreground truncate flex-1">{lanc.nome_pessoa}</span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {new Date(lanc.created_at).toLocaleDateString("pt-BR")}
              </span>
              <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatarMoeda(Number(lanc.valor))}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleDelete(lanc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}

          {lancamentos.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum lançamento registrado</p>
          )}
        </div>

        {/* Form para adicionar */}
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 border-t border-border/40 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição (opcional)</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Honorários, Audiência..."
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{'Valor (R$)'}</Label>
              <Input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="h-8 text-sm"
                required
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adicionar Valor
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
