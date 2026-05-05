"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Scissors } from "lucide-react"
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

export function CabeloDialog({ open, onOpenChange, onUpdate }: CabeloDialogProps) {
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(false)
  const [editandoData, setEditandoData] = useState<string | null>(null)
  const [dataTemp, setDataTemp] = useState("")
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

  const handleToggle = async (sessao: Sessao) => {
    // Se vai marcar como feita, abre input de data
    if (!sessao.feita) {
      const hoje = new Date().toISOString().split("T")[0]
      setDataTemp(hoje)
      setEditandoData(sessao.id)
      return
    }
    // Se vai desmarcar
    await salvarSessao(sessao.id, false, null)
  }

  const handleConfirmarData = async (sessao: Sessao) => {
    if (!dataTemp) return
    await salvarSessao(sessao.id, true, dataTemp)
    setEditandoData(null)
    setDataTemp("")
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
      fetchSessoes()
      onUpdate()
    } catch (error) {
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

  const formatarData = (data: string | null) => {
    if (!data) return null
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const renderSessao = (sessao: Sessao, corClasse: string) => {
    const estaEditando = editandoData === sessao.id
    const idReal = !sessao.id.startsWith("luz-") && !sessao.id.startsWith("prog-")

    return (
      <div key={sessao.id} className="flex flex-col gap-1">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent/30 transition-colors">
          <button
            type="button"
            disabled={loading || (!idReal && sessao.feita) || estaEditando}
            onClick={() => idReal ? handleToggle(sessao) : !sessao.feita && setEditandoData(sessao.id) || handleToggle(sessao)}
            className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              sessao.feita
                ? `${corClasse} border-transparent`
                : "border-border/60 hover:border-border"
            } disabled:opacity-50`}
          >
            {sessao.feita && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className={`text-sm flex-1 ${sessao.feita ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {sessao.tipo === "luz" ? "Luz" : "Progressiva"} {sessao.numero}
          </span>
          {sessao.feita && sessao.data_realizada && (
            <span className="text-xs text-muted-foreground">{formatarData(sessao.data_realizada)}</span>
          )}
          {!sessao.feita && !estaEditando && (
            <span className="text-[10px] text-muted-foreground/50">Pendente</span>
          )}
        </div>

        {estaEditando && (
          <div className="flex items-center gap-2 px-2 pb-1">
            <input
              type="date"
              value={dataTemp}
              onChange={(e) => setDataTemp(e.target.value)}
              className="flex-1 text-sm border border-border/60 rounded-md px-2 py-1 bg-background text-foreground"
            />
            <Button
              size="sm"
              onClick={() => handleConfirmarData(sessao)}
              disabled={!dataTemp || loading}
              className="h-7 text-xs px-3"
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setEditandoData(null); setDataTemp("") }}
              className="h-7 text-xs px-2"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-pink-500" />
            Cabelo
          </DialogTitle>
          <DialogDescription>Acompanhe as sessoes de cabelo agendadas</DialogDescription>
        </DialogHeader>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Luzes</p>
            <p className="text-base font-bold text-pink-500">{luzesFeitas}/{TOTAL_LUZES}</p>
            <p className="text-[10px] text-muted-foreground">{TOTAL_LUZES - luzesFeitas} restante{TOTAL_LUZES - luzesFeitas !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Progressivas</p>
            <p className="text-base font-bold text-violet-500">{progressivasFeitas}/{TOTAL_PROGRESSIVAS}</p>
            <p className="text-[10px] text-muted-foreground">{TOTAL_PROGRESSIVAS - progressivasFeitas} restante{TOTAL_PROGRESSIVAS - progressivasFeitas !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Luzes */}
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Luzes</p>
          {luzes.map((s) => renderSessao(s, "bg-pink-500"))}
        </div>

        {/* Progressivas */}
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Progressivas</p>
          {progressivas.map((s) => renderSessao(s, "bg-violet-500"))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
