"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import type { Conta } from "@/types/conta"

interface WhatsAppButtonProps {
  conta: Conta
  mes: number
  ano: number
  dataPagamento: string
  anexo?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function WhatsAppButton({
  conta,
  mes,
  ano,
  dataPagamento,
  anexo,
  variant = "default",
  size = "default",
}: WhatsAppButtonProps) {
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

  const handleWhatsApp = () => {
    const dataFormatada = new Date(dataPagamento + "T00:00:00").toLocaleDateString("pt-BR")
    const mensagem =
      `✅ *Pagamento Realizado*\n\n` +
      `📋 *Conta:* ${conta.nome}\n` +
      `💰 *Valor:* R$ ${conta.valor.toFixed(2)}\n` +
      `📅 *Vencimento:* Dia ${conta.vencimento}\n` +
      `✔️ *Data do Pagamento:* ${dataFormatada}\n` +
      `📆 *Referência:* ${meses[mes]}/${ano}\n\n` +
      (anexo ? `📎 Comprovante anexado` : ``)

    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`
    window.open(url, "_blank")
  }

  return (
    <Button onClick={handleWhatsApp} variant={variant} size={size} className="gap-2">
      <MessageCircle className="h-4 w-4" />
      {size !== "sm" && "WhatsApp"}
    </Button>
  )
}
