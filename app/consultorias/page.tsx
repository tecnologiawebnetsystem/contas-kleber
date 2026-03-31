"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Briefcase,
  Plus,
  ArrowLeft,
  Trash2,
  Pencil,
  Building2,
  Users,
  Receipt,
  Calendar,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { OnlineStatus } from "@/components/online-status"
import { ImpostosDescontosTab } from "@/components/impostos-descontos-tab"
import { LancamentosTab } from "@/components/lancamentos-tab"
import { formatarMoeda } from "@/utils/formatar-moeda"

const TIPOS_CONTRATACAO = ["CLT", "PJ", "Cooperado"] as const
type TipoContratacao = (typeof TIPOS_CONTRATACAO)[number]

type StatusConsultoria = "Ativa" | "Encerrada"

type Consultoria = {
  id: string
  consultoria: string
  cliente: string
  tipo_contratacao: TipoContratacao
  data_inicio: string
  dia_recebimento: number | null
  valor_hora: number | null
  valor_mensal: number | null
  status: StatusConsultoria
  created_at: string
}

const BADGE_COLORS: Record<TipoContratacao, string> = {
  CLT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PJ: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  Cooperado: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
}

function formatarData(dataString: string) {
  if (!dataString) return "—"
  const d = dataString.includes("T") ? new Date(dataString) : new Date(dataString + "T00:00:00")
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR")
}

const EMPTY_FORM = {
  consultoria: "",
  cliente: "",
  tipo_contratacao: "" as TipoContratacao | "",
  data_inicio: "",
  dia_recebimento: "" as string,
  valor_hora: "" as string,
  valor_mensal: "" as string,
  status: "Ativa" as StatusConsultoria,
}

export default function ConsultoriasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [consultorias, setConsultorias] = useState<Consultoria[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Aba ativa
  const [activeTab, setActiveTab] = useState("consultorias")

  // Dialog de adicionar/editar
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Consultoria | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Dialog de confirmar exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)

  const podeEditar = user?.perfil === 1

  useEffect(() => {
    fetchConsultorias()
  }, [])

  const fetchConsultorias = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/consultorias")
      if (!res.ok) throw new Error("Erro ao buscar consultorias")
      const data = await res.json()
      setConsultorias(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar consultorias:", error)
      toast({ title: "Erro", description: "Não foi possível carregar as consultorias.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const abrirDialogNovo = () => {
    setEditando(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const abrirDialogEditar = (c: Consultoria) => {
    setEditando(c)
    setForm({
      consultoria: c.consultoria,
      cliente: c.cliente,
      tipo_contratacao: c.tipo_contratacao,
      data_inicio: c.data_inicio.includes("T") ? c.data_inicio.split("T")[0] : c.data_inicio,
      dia_recebimento: c.dia_recebimento ? String(c.dia_recebimento) : "",
      valor_hora: c.valor_hora ? String(c.valor_hora) : "",
      valor_mensal: c.valor_mensal ? String(c.valor_mensal) : "",
      status: c.status || "Ativa",
    })
    setDialogOpen(true)
  }

  const fecharDialog = () => {
    setDialogOpen(false)
    setEditando(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async () => {
    if (!form.consultoria || !form.cliente || !form.tipo_contratacao || !form.data_inicio) {
      toast({ title: "Atenção", description: "Preencha todos os campos.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const isEditing = !!editando
      
      const payload = {
        ...form,
        dia_recebimento: form.dia_recebimento ? parseInt(form.dia_recebimento) : null,
        valor_hora: form.valor_hora ? parseFloat(form.valor_hora) : null,
        valor_mensal: form.valor_mensal ? parseFloat(form.valor_mensal) : null,
      }

      const res = await fetch("/api/consultorias", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editando!.id, ...payload } : payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }

      toast({
        title: isEditing ? "Consultoria atualizada" : "Consultoria adicionada",
        description: isEditing
          ? `${form.consultoria} foi atualizada com sucesso.`
          : `${form.consultoria} foi adicionada com sucesso.`,
      })

      fecharDialog()
      fetchConsultorias()
    } catch (error: any) {
      console.error("[v0] Erro ao salvar consultoria:", error)
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const confirmarExclusao = (id: string) => {
    setDeletandoId(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletandoId) return
    try {
      const res = await fetch(`/api/consultorias?id=${deletandoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast({ title: "Consultoria excluída", description: "Registro removido com sucesso." })
      setDeleteDialogOpen(false)
      setDeletandoId(null)
      fetchConsultorias()
    } catch (error) {
      console.error("[v0] Erro ao excluir consultoria:", error)
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" })
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push("/")}
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-base font-semibold text-foreground">Consultorias</h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <OnlineStatus userName={user?.nome} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-5">

        {/* Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border border-border/40 bg-card p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="rounded-md bg-primary/10 p-1.5">
                <Briefcase className="h-3 w-3 text-primary" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-none">Total</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{consultorias.length}</p>
            <p className="text-[10px] text-muted-foreground">consultoria(s)</p>
          </div>

          {TIPOS_CONTRATACAO.map((tipo) => {
            const count = consultorias.filter((c) => c.tipo_contratacao === tipo).length
            return (
              <div key={tipo} className="rounded-lg border border-border/40 bg-card p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="rounded-md bg-muted p-1.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-none">{tipo}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{count}</p>
                <p className="text-[10px] text-muted-foreground">contrato(s)</p>
              </div>
            )
          })}
        </div>

        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="consultorias" className="gap-1.5 text-xs sm:text-sm">
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Consultorias</span>
              <span className="sm:hidden">Consult.</span>
            </TabsTrigger>
            <TabsTrigger value="impostos" className="gap-1.5 text-xs sm:text-sm">
              <Receipt className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Impostos/Descontos</span>
              <span className="sm:hidden">Impostos</span>
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="gap-1.5 text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lançamentos</span>
              <span className="sm:hidden">Lanç.</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Consultorias */}
          <TabsContent value="consultorias">
            <Card className="border border-border/40 bg-card shadow-sm">
              <CardHeader className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Registro de Consultorias
                  </CardTitle>
                  {podeEditar && (
                    <Button size="sm" onClick={abrirDialogNovo} className="h-8 gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : consultorias.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="rounded-full bg-muted p-4 mb-3">
                      <Briefcase className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhuma consultoria cadastrada</p>
                    {podeEditar && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique em &quot;Adicionar&quot; para cadastrar a primeira.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900">
                          <TableHead className="font-semibold">Consultoria</TableHead>
                          <TableHead className="font-semibold">Cliente</TableHead>
                          <TableHead className="font-semibold">Tipo</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold text-right">Valor/Hora</TableHead>
                          <TableHead className="font-semibold text-right">Valor Mensal</TableHead>
                          <TableHead className="font-semibold">Dia Receb.</TableHead>
                          {podeEditar && <TableHead className="w-[90px]" />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consultorias.map((c) => (
                          <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-medium">{c.consultoria}</TableCell>
                            <TableCell className="text-muted-foreground">{c.cliente}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${BADGE_COLORS[c.tipo_contratacao]}`}
                              >
                                {c.tipo_contratacao}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                                  c.status === "Ativa"
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                    : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                                }`}
                              >
                                {c.status || "Ativa"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {c.valor_hora ? formatarMoeda(c.valor_hora) : "-"}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {c.valor_mensal ? formatarMoeda(c.valor_mensal) : "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.dia_recebimento ? `Dia ${c.dia_recebimento}` : "-"}
                            </TableCell>
                            {podeEditar && (
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => abrirDialogEditar(c)}
                                    aria-label="Editar"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                    onClick={() => confirmarExclusao(c.id)}
                                    aria-label="Excluir"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Impostos/Descontos */}
          <TabsContent value="impostos">
            <ImpostosDescontosTab podeEditar={podeEditar} />
          </TabsContent>

          {/* Aba Lançamentos */}
          <TabsContent value="lancamentos">
            <LancamentosTab podeEditar={podeEditar} consultorias={consultorias} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={fecharDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Consultoria" : "Nova Consultoria"}</DialogTitle>
            <DialogDescription>
              {editando ? "Atualize os dados da consultoria." : "Preencha os dados para cadastrar uma nova consultoria."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="consultoria">Consultoria</Label>
              <Input
                id="consultoria"
                placeholder="Nome da consultoria"
                value={form.consultoria}
                onChange={(e) => setForm((f) => ({ ...f, consultoria: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                placeholder="Nome do cliente"
                value={form.cliente}
                onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_contratacao">Tipo de Contratação</Label>
              <Select
                value={form.tipo_contratacao || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo_contratacao: v as TipoContratacao }))}
              >
                <SelectTrigger id="tipo_contratacao" className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONTRATACAO.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dia_recebimento">Dia do Recebimento</Label>
              <Select
                value={form.dia_recebimento || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, dia_recebimento: v }))}
              >
                <SelectTrigger id="dia_recebimento" className="w-full">
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                    <SelectItem key={dia} value={String(dia)}>
                      Dia {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_hora">Valor/Hora (R$)</Label>
              <Input
                id="valor_hora"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor_hora}
                onChange={(e) => setForm((f) => ({ ...f, valor_hora: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
              <Input
                id="valor_mensal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor_mensal}
                onChange={(e) => setForm((f) => ({ ...f, valor_mensal: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusConsultoria }))}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Encerrada">Encerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={fecharDialog} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : editando ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta consultoria? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
