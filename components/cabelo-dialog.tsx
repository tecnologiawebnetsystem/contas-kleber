"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Scissors, Check, X, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const TOTAL_LUZES = 4
const TOTAL_PROGRESSIVAS = 4

interface Sessao {
  id: string
  tipo: "luz" | "progressiva"
  numero: number
  feita: boolean
  data_realizada: string | null
}

interface CabeloDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

// Retorna "YYYY-MM-DD" no fuso local, sem deslocar para UTC
function hojeLocal() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function formatarData(data: string | null) {
  if (!data) return null
  const [yyyy, mm, dd] = data.split("T")[0].split("-")
  return `${dd}/${mm}/${yyyy}`
}

export function CabeloDialog({ open, onOpenChange, onUpdate }: CabeloDialogProps) {
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmando, setConfirmando] = useState<Sessao | null>(null)
  const [dataTemp, setDataTemp] = useState(hojeLocal())
  const { toast } = useToast()

  useEffect(() => {
    if (open) fetchSessoes()
  }, [open])

  const fetchSessoes = async () => {
    try {
      const res = await fetch("/api/cabelo")
      if (res.ok) {
        const data: Sessao[] = await res.json()
        setSessoes(data)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar sessoes de cabelo:", error)
    }
  }

  const abrirConfirmacao = (sessao: Sessao) => {
    setDataTemp(hojeLocal())
    setConfirmando(sessao)
  }

  const fecharConfirmacao = () => {
    setConfirmando(null)
    setDataTemp(hojeLocal())
  }

  const handleConfirmar = async () => {
    if (!confirmando || !dataTemp) return
    await salvarSessao(confirmando.id, true, dataTemp)
    fecharConfirmacao()
  }

  const handleDesmarcar = async (sessao: Sessao) => {
    await salvarSessao(sessao.id, false, null)
  }

  const salvarSessao = async (id: string, feita: boolean, data: string | null) => {
    setLoading(true)
    try {
      const res = await fetch("/api/cabelo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, feita, data_realizada: data }),
      })
      if (!res.ok) throw new Error("Erro ao salvar")
      await fetchSessoes()
      onUpdate()
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const luzes = Array.from({ length: TOTAL_LUZES }, (_, i) => {
    const encontrada = sessoes.find((s) => s.tipo === "luz" && s.numero === i + 1)
    return encontrada ?? { id: `luz-${i + 1}`, tipo: "luz" as const, numero: i + 1, feita: false, data_realizada: null }
  })

  const progressivas = Array.from({ length: TOTAL_PROGRESSIVAS }, (_, i) => {
    const encontrada = sessoes.find((s) => s.tipo === "progressiva" && s.numero === i + 1)
    return encontrada ?? { id: `prog-${i + 1}`, tipo: "progressiva" as const, numero: i + 1, feita: false, data_realizada: null }
  })

  const luzesFeitas = luzes.filter((l) => l.feita).length
  const progressivasFeitas = progressivas.filter((p) => p.feita).length

  const temIdReal = (id: string) => !id.startsWith("luz-") && !id.startsWith("prog-")

  const renderSessao = (sessao: Sessao, cor: { bg: string; text: string; ring: string }) => {
    const real = temIdReal(sessao.id)

    return (
      <div key={sessao.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        sessao.feita ? "border-border/30 bg-muted/30" : "border-border/50 bg-card"
      }`}>
        {/* Checkbox grande para toque */}
        <button
          type="button"
          disabled={loading || !real}
          onClick={() => sessao.feita ? handleDesmarcar(sessao) : abrirConfirmacao(sessao)}
          className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-95 ${
            sessao.feita
              ? `${cor.bg} border-transparent`
              : `border-border/50 ${cor.ring}`
          } disabled:opacity-40`}
          aria-label={sessao.feita ? "Desmarcar" : "Marcar como feita"}
        >
          {sessao.feita && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-none ${sessao.feita ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {sessao.tipo === "luz" ? "Luz" : "Progressiva"} {sessao.numero}
          </p>
          {sessao.feita && sessao.data_realizada ? (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatarData(sessao.data_realizada)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/50 mt-1">Pendente</p>
          )}
        </div>

        {/* Badge de status */}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
          sessao.feita ? "bg-muted text-muted-foreground" : `${cor.bg} bg-opacity-10 ${cor.text}`
        }`}>
          {sessao.feita ? "Feita" : "Agendada"}
        </span>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="rounded-lg bg-pink-500/10 p-1.5">
                <Scissors className="h-4 w-4 text-pink-500" />
              </div>
              Cabelo
            </DialogTitle>
            <DialogDescription className="sr-only">Acompanhe as sessoes de cabelo</DialogDescription>
          </DialogHeader>

          {/* Resumo */}
          <div className="grid grid-cols-2 gap-2 px-5 pb-3">
            <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 px-3 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Luzes</p>
              <p className="text-xl font-bold text-pink-500 leading-none mt-0.5">{luzesFeitas}<span className="text-sm font-normal text-muted-foreground">/{TOTAL_LUZES}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{TOTAL_LUZES - luzesFeitas} restante{TOTAL_LUZES - luzesFeitas !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Progressivas</p>
              <p className="text-xl font-bold text-violet-500 leading-none mt-0.5">{progressivasFeitas}<span className="text-sm font-normal text-muted-foreground">/{TOTAL_PROGRESSIVAS}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{TOTAL_PROGRESSIVAS - progressivasFeitas} restante{TOTAL_PROGRESSIVAS - progressivasFeitas !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Luzes */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-pink-500 uppercase tracking-wider">Luzes</p>
              {luzes.map((s) => renderSessao(s, {
                bg: "bg-pink-500",
                text: "text-pink-600",
                ring: "hover:border-pink-400",
              }))}
            </div>

            {/* Progressivas */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider">Progressivas</p>
              {progressivas.map((s) => renderSessao(s, {
                bg: "bg-violet-500",
                text: "text-violet-600",
                ring: "hover:border-violet-400",
              }))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacao de data — otimizado para mobile */}
      <Dialog open={!!confirmando} onOpenChange={(v) => !v && fecharConfirmacao()}>
        <DialogContent className="w-[92vw] max-w-sm p-5 gap-4">
          <DialogHeader>
            <DialogTitle className="text-base">Confirmar data</DialogTitle>
            <DialogDescription className="text-sm">
              Quando foi feita a{" "}
              <span className="font-semibold text-foreground">
                {confirmando?.tipo === "luz" ? "Luz" : "Progressiva"} {confirmando?.numero}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          {/* Input de data grande para mobile */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data de realização</label>
            <input
              type="date"
              value={dataTemp}
              max={hojeLocal()}
              onChange={(e) => setDataTemp(e.target.value)}
              className="w-full h-12 rounded-xl border border-border/60 bg-background px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={fecharConfirmacao}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-1.5" />
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11 bg-pink-500 hover:bg-pink-600 text-white"
              onClick={handleConfirmar}
              disabled={!dataTemp || loading}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
