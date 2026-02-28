"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Check, Trash2, HandCoins } from "lucide-react"
import { formatarMoeda } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Emprestimo {
  id: string
  nome_pessoa: string
  valor: number
  data_devolucao: string
  devolvido: boolean
  data_devolvido?: string
  created_at: string
}

interface EmprestimoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function EmprestimoDialog({ open, onOpenChange, onUpdate }: EmprestimoDialogProps) {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [nomePessoa, setNomePessoa] = useState("")
  const [valor, setValor] = useState("")
  const [dataDevolucao, setDataDevolucao] = useState("")

  useEffect(() => {
    if (open) {
      fetchEmprestimos()
    }
  }, [open])

  const fetchEmprestimos = async () => {
    try {
      const res = await fetch("/api/emprestimos")
      if (res.ok) {
        const data = await res.json()
        setEmprestimos(data)
      }
    } catch (error) {
      console.error("Erro ao buscar emprestimos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomePessoa || !valor || !dataDevolucao) return

    setLoading(true)
    try {
      const res = await fetch("/api/emprestimos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomePessoa,
          valor: parseFloat(valor),
          dataDevolucao,
        }),
      })
      if (res.ok) {
        setNomePessoa("")
        setValor("")
        setDataDevolucao("")
        setShowForm(false)
        fetchEmprestimos()
        onUpdate?.()
      }
    } catch (error) {
      console.error("Erro ao criar emprestimo:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDevolvido = async (emp: Emprestimo) => {
    try {
      await fetch(`/api/emprestimos/${emp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devolvido: !emp.devolvido }),
      })
      fetchEmprestimos()
      onUpdate?.()
    } catch (error) {
      console.error("Erro ao atualizar emprestimo:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/emprestimos/${id}`, { method: "DELETE" })
      fetchEmprestimos()
      onUpdate?.()
    } catch (error) {
      console.error("Erro ao remover emprestimo:", error)
    }
  }

  const pendentes = emprestimos.filter(e => !e.devolvido)
  const devolvidos = emprestimos.filter(e => e.devolvido)
  const totalPendente = pendentes.reduce((sum, e) => sum + Number(e.valor), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-violet-500" />
            Emprestado
          </DialogTitle>
          <DialogDescription>
            Gerencie o dinheiro emprestado para outras pessoas
          </DialogDescription>
        </DialogHeader>

        {/* Total pendente */}
        {pendentes.length > 0 && (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total pendente</span>
            <span className="text-sm font-bold text-violet-500">{formatarMoeda(totalPendente)}</span>
          </div>
        )}

        {/* Lista de emprestimos */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {pendentes.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/40 bg-card hover:bg-accent/30 transition-colors group"
            >
              <button
                type="button"
                onClick={() => handleToggleDevolvido(emp)}
                className="shrink-0 h-3.5 w-3.5 rounded-full border border-violet-500/50 hover:border-violet-500 hover:bg-violet-500/20 flex items-center justify-center transition-all"
                aria-label="Marcar como devolvido"
                title="Marcar como devolvido"
              />
              <span className="text-sm font-medium text-foreground truncate flex-1">{emp.nome_pessoa}</span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {new Date(emp.data_devolucao + "T00:00:00").toLocaleDateString("pt-BR")}
              </span>
              <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatarMoeda(Number(emp.valor))}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleDelete(emp.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}

          {devolvidos.length > 0 && (
            <>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider pt-2 px-1">Devolvidos</p>
              {devolvidos.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/20 bg-card/50 group"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleDevolvido(emp)}
                    className="shrink-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border border-emerald-500 flex items-center justify-center transition-all hover:bg-emerald-600"
                    aria-label="Desmarcar devolvido"
                    title="Desmarcar devolvido"
                  >
                    <Check className="h-2 w-2 text-white" strokeWidth={3} />
                  </button>
                  <span className="text-sm text-muted-foreground line-through truncate flex-1">{emp.nome_pessoa}</span>
                  <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">{formatarMoeda(Number(emp.valor))}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleDelete(emp.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </>
          )}

          {emprestimos.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum emprestimo registrado</p>
          )}
        </div>

        {/* Form para adicionar */}
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 border-t border-border/40 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Pessoa</Label>
              <Input
                value={nomePessoa}
                onChange={(e) => setNomePessoa(e.target.value)}
                placeholder="Ex: Joao"
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{'Data Devolucao'}</Label>
                <Input
                  type="date"
                  value={dataDevolucao}
                  onChange={(e) => setDataDevolucao(e.target.value)}
                  className="h-8 text-sm"
                  required
                />
              </div>
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
            Adicionar Emprestimo
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
