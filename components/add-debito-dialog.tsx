"use client"

import type React from "react"
import { useState } from "react"
import { ArrowDownCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AddDebitoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (valor: number, descricao: string, data: string) => void
}

export function AddDebitoDialog({ open, onOpenChange, onAdd }: AddDebitoDialogProps) {
  const [valor, setValor] = useState("")
  const [data, setData] = useState(new Date().toISOString().split("T")[0])
  const [descricao, setDescricao] = useState("")

  const reset = () => {
    setValor("")
    setData(new Date().toISOString().split("T")[0])
    setDescricao("")
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const valorNumerico = Number.parseFloat(valor.replace(",", "."))
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0 || !data) return
    onAdd(valorNumerico, descricao.trim() || "Débito", data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[430px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
            Adicionar débito
          </DialogTitle>
          <DialogDescription>Informe o valor, o dia e a descrição. O valor será descontado do saldo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debito-valor">Valor *</Label>
            <Input id="debito-valor" type="number" min="0.01" step="0.01" value={valor} onChange={(event) => setValor(event.target.value)} placeholder="0,00" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debito-data">Dia *</Label>
            <Input id="debito-data" type="date" value={data} onChange={(event) => setData(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debito-descricao">Descrição</Label>
            <Textarea id="debito-descricao" value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Ex.: compra no mercado" rows={3} />
          </div>
          <Button type="submit" className="w-full">Registrar débito</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
