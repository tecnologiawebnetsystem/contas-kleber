"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"

interface Consultoria {
  id: string
  consultoria: string
  cliente: string
  tipo_contratacao: string
}

interface AddCreditoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (valor: number, descricao: string, data: string, consultoriaId?: string) => void
}

export function AddCreditoDialog({ open, onOpenChange, onAdd }: AddCreditoDialogProps) {
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [dataTransacao, setDataTransacao] = useState(new Date().toISOString().split("T")[0])
  const [consultoriaId, setConsultoriaId] = useState<string>("")
  const [consultorias, setConsultorias] = useState<Consultoria[]>([])
  const [loadingConsultorias, setLoadingConsultorias] = useState(false)

  useEffect(() => {
    if (open) {
      setLoadingConsultorias(true)
      fetch("/api/consultorias")
        .then((r) => r.json())
        .then((data) => setConsultorias(Array.isArray(data) ? data : []))
        .catch(() => setConsultorias([]))
        .finally(() => setLoadingConsultorias(false))
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const valorNum = Number.parseFloat(valor)
    if (valorNum > 0) {
      onAdd(valorNum, descricao || "Adição de crédito", dataTransacao, consultoriaId || undefined)
      setValor("")
      setDescricao("")
      setConsultoriaId("")
      setDataTransacao(new Date().toISOString().split("T")[0])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Adicionar Crédito
          </DialogTitle>
          <DialogDescription>
            Adicione crédito à sua carteira para pagar contas. O saldo será mantido entre os meses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">

          {/* Consultoria de origem */}
          <div className="space-y-2">
            <Label htmlFor="consultoria">Consultoria (opcional)</Label>
            <Select value={consultoriaId} onValueChange={setConsultoriaId} disabled={loadingConsultorias}>
              <SelectTrigger id="consultoria" className="w-full">
                <SelectValue placeholder={loadingConsultorias ? "Carregando..." : "Selecione a consultoria"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma / Outro</SelectItem>
                {consultorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-medium">{c.consultoria}</span>
                    <span className="text-muted-foreground ml-1">— {c.cliente}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataTransacao">Data *</Label>
            <Input
              id="dataTransacao"
              type="date"
              value={dataTransacao}
              onChange={(e) => setDataTransacao(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Ex: Salário, Freelance, etc."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
