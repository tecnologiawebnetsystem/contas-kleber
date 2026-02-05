"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"

interface AddCreditoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (valor: number, descricao: string, data: string) => void
}

export function AddCreditoDialog({ open, onOpenChange, onAdd }: AddCreditoDialogProps) {
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [dataTransacao, setDataTransacao] = useState(new Date().toISOString().split("T")[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const valorNum = Number.parseFloat(valor)
    if (valorNum > 0) {
      onAdd(valorNum, descricao || "Adição de crédito", dataTransacao)
      setValor("")
      setDescricao("")
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
