"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface WhatsAppSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mensagem: string
}

export function WhatsAppSendDialog({ open, onOpenChange, mensagem }: WhatsAppSendDialogProps) {
  const [numero, setNumero] = useState("")
  const [mensagemEditavel, setMensagemEditavel] = useState(mensagem)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (open) {
      setMensagemEditavel(mensagem)
    }
  }, [open, mensagem])

  const formatarNumero = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "")

    if (apenasNumeros.length <= 2) {
      return `(${apenasNumeros}`
    } else if (apenasNumeros.length <= 4) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`
    } else if (apenasNumeros.length <= 9) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 4)} ${apenasNumeros.slice(4)}`
    } else {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 4)} ${apenasNumeros.slice(4, 9)}-${apenasNumeros.slice(9, 13)}`
    }
  }

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    const numeroFormatado = formatarNumero(valor)
    setNumero(numeroFormatado)
  }

  const handleEnviar = async () => {
    const apenasNumeros = numero.replace(/\D/g, "")

    if (apenasNumeros.length < 10 || apenasNumeros.length > 11) {
      toast.error("Número inválido! Use o formato: (XX) XX XXXXX-XXXX ou (XX) XXXX-XXXX")
      return
    }

    if (!mensagemEditavel.trim()) {
      toast.error("Digite uma mensagem para enviar")
      return
    }

    setEnviando(true)

    try {
      const numeroCompleto = `55${apenasNumeros}`

      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: numeroCompleto,
          text: mensagemEditavel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem")
      }

      toast.success("Mensagem enviada via WhatsApp!")
      onOpenChange(false)
      setNumero("")
      setMensagemEditavel(mensagem)
    } catch (error) {
      console.error("[v0] Erro ao enviar WhatsApp:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar via WhatsApp
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-2">
            Remetente: <span className="font-semibold text-foreground">+55 (12) 99220-7444</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="numero">Número do WhatsApp (Brasil)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">+55</span>
              <Input
                id="numero"
                placeholder="(31) 99435-9434"
                value={numero}
                onChange={handleNumeroChange}
                maxLength={18}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Digite apenas o DDD e número (ex: 31994359434)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem (editável)</Label>
            <Textarea
              id="mensagem"
              value={mensagemEditavel}
              onChange={(e) => setMensagemEditavel(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Você pode editar a mensagem antes de enviar</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={handleEnviar} disabled={enviando} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {enviando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
