"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plane, Plus, Trash2 } from "lucide-react"
import { formatarMoeda } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Deposito {
  id: string
  nome: string
  valor: number
  data_gasto?: string
}

interface ViagemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function ViagemDialog({ open, onOpenChange, onUpdate }: ViagemDialogProps) {
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const { toast } = useToast()

  const total = depositos.reduce((sum, d) => sum + d.valor, 0)

  useEffect(() => {
    if (open) fetchDepositos()
  }, [open])

  const fetchDepositos = async () => {
    try {
      const res = await fetch("/api/contas")
      if (res.ok) {
        const data = await res.json()
        const viagem = data.filter((c: any) => c.tipo === "viagem")
        setDepositos(viagem)
      }
    } catch (error) {
      console.error("Erro ao buscar viagem:", error)
    }
  }

  const handleAdicionar = async () => {
    if (!descricao.trim() || !valor) return
    setLoading(true)
    try {
      const hoje = new Date().toISOString().split("T")[0]
      const res = await fetch("/api/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: descricao.trim(),
          valor: parseFloat(valor),
          tipo: "viagem",
          vencimento: new Date().getDate(),
          dataGasto: hoje,
        }),
      })
      if (!res.ok) throw new Error("Erro ao adicionar")
      setDescricao("")
      setValor("")
      setMostrarForm(false)
      fetchDepositos()
      onUpdate()
      toast({ title: "Adicionado com sucesso" })
    } catch (error) {
      toast({ title: "Erro ao adicionar", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleExcluir = async (id: string) => {
    try {
      const res = await fetch(`/api/contas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      fetchDepositos()
      onUpdate()
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-sky-500" />
            Viagem
          </DialogTitle>
          <DialogDescription>Gerencie seu fundo para viagens</DialogDescription>
        </DialogHeader>

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg bg-sky-500/5 border border-sky-500/20 px-3 py-2">
          <span className="text-sm text-muted-foreground">Total economizado</span>
          <span className="text-sm font-bold text-sky-500">{formatarMoeda(total)}</span>
        </div>

        {/* Lista de depositos */}
        <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
          {depositos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum deposito ainda</p>
          )}
          {depositos.map((dep) => (
            <div key={dep.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/30 group">
              <div className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
              <span className="text-sm flex-1 truncate">{dep.nome}</span>
              {dep.data_gasto && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {new Date(dep.data_gasto + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              )}
              <span className="text-sm font-medium">{formatarMoeda(dep.valor)}</span>
              <button
                type="button"
                onClick={() => handleExcluir(dep.id)}
                className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Form para adicionar */}
        {mostrarForm ? (
          <div className="space-y-3 border-t border-border/40 pt-3">
            <div>
              <Label className="text-xs">{"Descri\u00e7\u00e3o"}</Label>
              <Input
                placeholder="Ex: Passagem para Salvador"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdicionar} disabled={loading || !descricao.trim() || !valor} className="flex-1">
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setMostrarForm(false); setDescricao(""); setValor("") }}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => setMostrarForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {"Adicionar Dep\u00f3sito"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
