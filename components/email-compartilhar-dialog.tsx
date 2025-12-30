"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Copy, Check } from "lucide-react"

interface EmailCompartilharDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assunto: string
  mensagem: string
}

export function EmailCompartilharDialog({ open, onOpenChange, assunto, mensagem }: EmailCompartilharDialogProps) {
  const [email, setEmail] = useState("")
  const [copiado, setCopiado] = useState(false)

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensagem)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const handleEnviarEmail = () => {
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`
    window.location.href = mailtoLink
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compartilhar por Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email do destinatário</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>Assunto</Label>
            <Input value={assunto} readOnly className="bg-muted" />
          </div>

          <div>
            <Label>Mensagem</Label>
            <Textarea value={mensagem} readOnly className="min-h-[200px] bg-muted font-mono text-sm" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleEnviarEmail} disabled={!email} className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
            <Button onClick={handleCopiar} variant="outline">
              {copiado ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
