"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, X, FileText } from "lucide-react"
import type { Conta } from "@/types/conta"

interface PagamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conta: Conta
  mes: number
  ano: number
  onConfirm: (dataPagamento: string, anexo?: string) => void
}

export function PagamentoDialog({ open, onOpenChange, conta, mes, ano, onConfirm }: PagamentoDialogProps) {
  const hoje = new Date().toISOString().split("T")[0]
  const [dataPagamento, setDataPagamento] = useState(hoje)
  const [anexo, setAnexo] = useState<string | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAnexo(reader.result as string)
        setNomeArquivo(file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveFile = () => {
    setAnexo(null)
    setNomeArquivo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleConfirm = () => {
    onConfirm(dataPagamento, anexo || undefined)
    setDataPagamento(hoje)
    setAnexo(null)
    setNomeArquivo(null)
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Confirme o pagamento da conta <strong>{conta.nome}</strong> de {meses[mes]}/{ano}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="valor">Valor</Label>
            <Input id="valor" value={`R$ ${conta.valor.toFixed(2)}`} disabled />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dataPagamento">Data do Pagamento</Label>
            <Input
              id="dataPagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              max={hoje}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="anexo">Comprovante de Pagamento (Opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="anexo"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {nomeArquivo ? "Trocar arquivo" : "Anexar comprovante"}
              </Button>
            </div>

            {anexo && nomeArquivo && (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-accent/50">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{nomeArquivo}</span>
                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} className="h-6 w-6">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
