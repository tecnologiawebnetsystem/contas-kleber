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
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Pencil, Receipt, Percent, DollarSign, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ImpostoDesconto = {
  id: string
  nome: string
  tipo_aplicacao: "PJ" | "CLT" | "AMBOS"
  tipo_calculo: "PERCENTUAL" | "VALOR_FIXO"
  valor_padrao: number
  descricao: string | null
  ativo: boolean
  created_at: string
}

const TIPO_APLICACAO_BADGE: Record<string, string> = {
  PJ: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  CLT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  AMBOS: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
}

const EMPTY_FORM = {
  nome: "",
  tipo_aplicacao: "" as "PJ" | "CLT" | "AMBOS" | "",
  tipo_calculo: "PERCENTUAL" as "PERCENTUAL" | "VALOR_FIXO",
  valor_padrao: "",
  descricao: "",
}

type Props = {
  podeEditar: boolean
}

export function ImpostosDescontosTab({ podeEditar }: Props) {
  const { toast } = useToast()

  const [impostos, setImpostos] = useState<ImpostoDesconto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)

  // Dialog de adicionar/editar
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<ImpostoDesconto | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Dialog de confirmar exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)

  useEffect(() => {
    fetchImpostos()
  }, [])

  const fetchImpostos = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/impostos-descontos")
      if (!res.ok) {
        const error = await res.json()
        if (error.error?.includes("doesn't exist") || error.error?.includes("not exist")) {
          setNeedsSetup(true)
          return
        }
        throw new Error(error.error || "Erro ao buscar impostos")
      }
      const data = await res.json()
      setImpostos(data)
      setNeedsSetup(false)
    } catch (error: any) {
      console.error("[v0] Erro ao buscar impostos:", error)
      if (error.message?.includes("doesn't exist") || error.message?.includes("not exist")) {
        setNeedsSetup(true)
      } else {
        toast({ title: "Erro", description: "Não foi possível carregar os impostos.", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    try {
      setSetupLoading(true)
      const res = await fetch("/api/setup-impostos", { method: "POST" })
      if (!res.ok) throw new Error("Erro ao configurar tabelas")
      toast({ title: "Sucesso", description: "Tabelas configuradas com sucesso!" })
      setNeedsSetup(false)
      fetchImpostos()
    } catch (error) {
      console.error("[v0] Erro no setup:", error)
      toast({ title: "Erro", description: "Não foi possível configurar as tabelas.", variant: "destructive" })
    } finally {
      setSetupLoading(false)
    }
  }

  const abrirDialogNovo = () => {
    setEditando(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const abrirDialogEditar = (item: ImpostoDesconto) => {
    setEditando(item)
    setForm({
      nome: item.nome,
      tipo_aplicacao: item.tipo_aplicacao,
      tipo_calculo: item.tipo_calculo,
      valor_padrao: String(item.valor_padrao),
      descricao: item.descricao || "",
    })
    setDialogOpen(true)
  }

  const fecharDialog = () => {
    setDialogOpen(false)
    setEditando(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async () => {
    if (!form.nome || !form.tipo_aplicacao || !form.tipo_calculo) {
      toast({ title: "Atenção", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const isEditing = !!editando
      const payload = {
        ...form,
        valor_padrao: parseFloat(form.valor_padrao) || 0,
        ...(isEditing && { id: editando!.id }),
      }

      const res = await fetch("/api/impostos-descontos", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }

      toast({
        title: isEditing ? "Imposto atualizado" : "Imposto adicionado",
        description: `${form.nome} foi ${isEditing ? "atualizado" : "adicionado"} com sucesso.`,
      })

      fecharDialog()
      fetchImpostos()
    } catch (error: any) {
      console.error("[v0] Erro ao salvar imposto:", error)
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
      const res = await fetch(`/api/impostos-descontos?id=${deletandoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast({ title: "Imposto desativado", description: "Registro desativado com sucesso." })
      setDeleteDialogOpen(false)
      setDeletandoId(null)
      fetchImpostos()
    } catch (error) {
      console.error("[v0] Erro ao excluir imposto:", error)
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" })
    }
  }

  const formatarValor = (valor: number, tipo: string) => {
    if (tipo === "PERCENTUAL") {
      return `${valor.toFixed(2)}%`
    }
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
  }

  if (needsSetup) {
    return (
      <Card className="border border-border/40 bg-card shadow-sm">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="rounded-full bg-amber-500/10 p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Configuração Necessária</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              As tabelas de impostos e descontos ainda não foram criadas. Clique no botão abaixo para configurar o banco de dados.
            </p>
            <Button onClick={handleSetup} disabled={setupLoading} className="gap-2">
              {setupLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  Configurar Tabelas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border border-border/40 bg-card shadow-sm">
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Impostos e Descontos
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
          ) : impostos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhum imposto cadastrado</p>
              {podeEditar && (
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em &quot;Adicionar&quot; para cadastrar o primeiro.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Aplicação</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Valor Padrão</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    {podeEditar && <TableHead className="w-[90px]" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {impostos.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${TIPO_APLICACAO_BADGE[item.tipo_aplicacao]}`}
                        >
                          {item.tipo_aplicacao}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {item.tipo_calculo === "PERCENTUAL" ? (
                            <Percent className="h-3 w-3" />
                          ) : (
                            <DollarSign className="h-3 w-3" />
                          )}
                          {item.tipo_calculo === "PERCENTUAL" ? "Percentual" : "Valor Fixo"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatarValor(Number(item.valor_padrao), item.tipo_calculo)}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {item.descricao || "—"}
                      </TableCell>
                      {podeEditar && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => abrirDialogEditar(item)}
                              aria-label="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={() => confirmarExclusao(item.id)}
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

      {/* Dialog Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={fecharDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Imposto/Desconto" : "Novo Imposto/Desconto"}</DialogTitle>
            <DialogDescription>
              {editando ? "Atualize os dados do imposto ou desconto." : "Preencha os dados para cadastrar um novo imposto ou desconto."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Ex: IRPJ, INSS, Plano de Saúde"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_aplicacao">Aplicação *</Label>
                <Select
                  value={form.tipo_aplicacao}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipo_aplicacao: v as "PJ" | "CLT" | "AMBOS" }))}
                >
                  <SelectTrigger id="tipo_aplicacao">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="AMBOS">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_calculo">Tipo de Cálculo *</Label>
                <Select
                  value={form.tipo_calculo}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipo_calculo: v as "PERCENTUAL" | "VALOR_FIXO" }))}
                >
                  <SelectTrigger id="tipo_calculo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTUAL">Percentual (%)</SelectItem>
                    <SelectItem value="VALOR_FIXO">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_padrao">
                Valor Padrão {form.tipo_calculo === "PERCENTUAL" ? "(%)" : "(R$)"}
              </Label>
              <Input
                id="valor_padrao"
                type="number"
                step={form.tipo_calculo === "PERCENTUAL" ? "0.01" : "0.01"}
                placeholder={form.tipo_calculo === "PERCENTUAL" ? "Ex: 4.80" : "Ex: 150.00"}
                value={form.valor_padrao}
                onChange={(e) => setForm((f) => ({ ...f, valor_padrao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Descrição opcional"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
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
            <DialogTitle>Confirmar desativação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar este imposto/desconto? Ele não aparecerá mais nas opções, mas os lançamentos existentes serão mantidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
