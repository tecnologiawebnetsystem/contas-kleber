"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Calendar, 
  DollarSign,
  TrendingDown,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Consultoria = {
  id: string
  consultoria: string
  cliente: string
  tipo_contratacao: "CLT" | "PJ" | "Cooperado"
}

type ImpostoDesconto = {
  id: string
  nome: string
  tipo_aplicacao: "PJ" | "CLT" | "AMBOS"
  tipo_calculo: "PERCENTUAL" | "VALOR_FIXO"
  valor_padrao: number
}

type LancamentoItem = {
  id?: string
  imposto_desconto_id: string
  imposto_nome?: string
  tipo_calculo: "PERCENTUAL" | "VALOR_FIXO"
  percentual?: number
  valor_fixo?: number
  valor_base: number
  valor_calculado: number
}

type Lancamento = {
  id: string
  consultoria_id: string
  mes_referencia: string
  valor_bruto: number
  valor_liquido: number
  observacoes?: string
  itens: LancamentoItem[]
  created_at: string
}

type Props = {
  podeEditar: boolean
  consultorias: Consultoria[]
}

type ItemForm = {
  imposto_desconto_id: string
  tipo_calculo: "PERCENTUAL" | "VALOR_FIXO"
  percentual: string
  valor_fixo: string
  selecionado: boolean
}

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

const formatarMesReferencia = (data: string) => {
  const d = new Date(data + "T00:00:00")
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
}

export function LancamentosTab({ podeEditar, consultorias }: Props) {
  const { toast } = useToast()

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [impostos, setImpostos] = useState<ImpostoDesconto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filtro
  const [filtroConsultoria, setFiltroConsultoria] = useState<string>("")

  // Dialog de adicionar/editar
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Lancamento | null>(null)
  const [formConsultoriaId, setFormConsultoriaId] = useState("")
  const [formMesReferencia, setFormMesReferencia] = useState("")
  const [formValorBruto, setFormValorBruto] = useState("")
  const [formObservacoes, setFormObservacoes] = useState("")
  const [formItens, setFormItens] = useState<ItemForm[]>([])

  // Dialog de confirmar exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)

  // Expandir detalhes
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchLancamentos()
    fetchImpostos()
  }, [])

  const fetchLancamentos = async () => {
    try {
      setLoading(true)
      const url = filtroConsultoria 
        ? `/api/lancamentos?consultoria_id=${filtroConsultoria}`
        : "/api/lancamentos"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Erro ao buscar lançamentos")
      const data = await res.json()
      setLancamentos(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar lançamentos:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchImpostos = async () => {
    try {
      const res = await fetch("/api/impostos-descontos")
      if (!res.ok) return
      const data = await res.json()
      setImpostos(data)
    } catch (error) {
      console.error("[v0] Erro ao buscar impostos:", error)
    }
  }

  useEffect(() => {
    fetchLancamentos()
  }, [filtroConsultoria])

  // Calcular impostos filtrados por tipo de contratação
  const impostosDisponiveis = useMemo(() => {
    if (!formConsultoriaId) return impostos
    const consultoria = consultorias.find(c => c.id === formConsultoriaId)
    if (!consultoria) return impostos

    const tipoContratacao = consultoria.tipo_contratacao
    return impostos.filter(imp => {
      if (imp.tipo_aplicacao === "AMBOS") return true
      if (tipoContratacao === "PJ" && imp.tipo_aplicacao === "PJ") return true
      if ((tipoContratacao === "CLT" || tipoContratacao === "Cooperado") && imp.tipo_aplicacao === "CLT") return true
      return false
    })
  }, [formConsultoriaId, consultorias, impostos])

  // Inicializar itens quando mudar a consultoria
  useEffect(() => {
    if (dialogOpen && !editando) {
      setFormItens(impostosDisponiveis.map(imp => ({
        imposto_desconto_id: imp.id,
        tipo_calculo: imp.tipo_calculo,
        percentual: imp.tipo_calculo === "PERCENTUAL" ? String(imp.valor_padrao) : "",
        valor_fixo: imp.tipo_calculo === "VALOR_FIXO" ? String(imp.valor_padrao) : "",
        selecionado: true,
      })))
    }
  }, [impostosDisponiveis, dialogOpen, editando])

  // Calcular valor líquido
  const valorLiquidoCalculado = useMemo(() => {
    const bruto = parseFloat(formValorBruto) || 0
    let totalDescontos = 0

    formItens.forEach(item => {
      if (!item.selecionado) return
      if (item.tipo_calculo === "PERCENTUAL") {
        const perc = parseFloat(item.percentual) || 0
        totalDescontos += (bruto * perc) / 100
      } else {
        totalDescontos += parseFloat(item.valor_fixo) || 0
      }
    })

    return bruto - totalDescontos
  }, [formValorBruto, formItens])

  const abrirDialogNovo = () => {
    setEditando(null)
    setFormConsultoriaId("")
    setFormMesReferencia("")
    setFormValorBruto("")
    setFormObservacoes("")
    setFormItens([])
    setDialogOpen(true)
  }

  const abrirDialogEditar = (lanc: Lancamento) => {
    setEditando(lanc)
    setFormConsultoriaId(lanc.consultoria_id)
    setFormMesReferencia(lanc.mes_referencia.split("T")[0])
    setFormValorBruto(String(lanc.valor_bruto))
    setFormObservacoes(lanc.observacoes || "")
    
    // Mapear itens existentes
    const itensMap = new Map(lanc.itens.map(item => [item.imposto_desconto_id, item]))
    setFormItens(impostosDisponiveis.map(imp => {
      const itemExistente = itensMap.get(imp.id)
      if (itemExistente) {
        return {
          imposto_desconto_id: imp.id,
          tipo_calculo: itemExistente.tipo_calculo,
          percentual: itemExistente.tipo_calculo === "PERCENTUAL" ? String(itemExistente.percentual || 0) : "",
          valor_fixo: itemExistente.tipo_calculo === "VALOR_FIXO" ? String(itemExistente.valor_calculado || 0) : "",
          selecionado: true,
        }
      }
      return {
        imposto_desconto_id: imp.id,
        tipo_calculo: imp.tipo_calculo,
        percentual: imp.tipo_calculo === "PERCENTUAL" ? String(imp.valor_padrao) : "",
        valor_fixo: imp.tipo_calculo === "VALOR_FIXO" ? String(imp.valor_padrao) : "",
        selecionado: false,
      }
    }))
    
    setDialogOpen(true)
  }

  const fecharDialog = () => {
    setDialogOpen(false)
    setEditando(null)
  }

  const handleSubmit = async () => {
    if (!formConsultoriaId || !formMesReferencia || !formValorBruto) {
      toast({ title: "Atenção", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    const itensSelecionados = formItens
      .filter(item => item.selecionado)
      .map(item => ({
        imposto_desconto_id: item.imposto_desconto_id,
        tipo_calculo: item.tipo_calculo,
        percentual: item.tipo_calculo === "PERCENTUAL" ? parseFloat(item.percentual) || 0 : null,
        valor_fixo: item.tipo_calculo === "VALOR_FIXO" ? parseFloat(item.valor_fixo) || 0 : null,
      }))

    setSubmitting(true)
    try {
      const isEditing = !!editando
      const payload = {
        ...(isEditing && { id: editando!.id }),
        consultoria_id: formConsultoriaId,
        mes_referencia: formMesReferencia,
        valor_bruto: parseFloat(formValorBruto),
        observacoes: formObservacoes || null,
        itens: itensSelecionados,
      }

      const res = await fetch("/api/lancamentos", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }

      toast({
        title: isEditing ? "Lançamento atualizado" : "Lançamento adicionado",
        description: `Lançamento de ${formatarMesReferencia(formMesReferencia)} salvo com sucesso.`,
      })

      fecharDialog()
      fetchLancamentos()
    } catch (error: any) {
      console.error("[v0] Erro ao salvar lançamento:", error)
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
      const res = await fetch(`/api/lancamentos?id=${deletandoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast({ title: "Lançamento excluído", description: "Registro removido com sucesso." })
      setDeleteDialogOpen(false)
      setDeletandoId(null)
      fetchLancamentos()
    } catch (error) {
      console.error("[v0] Erro ao excluir lançamento:", error)
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" })
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getConsultoriaNome = (id: string) => {
    const c = consultorias.find(c => c.id === id)
    return c ? `${c.consultoria} - ${c.cliente}` : "—"
  }

  const updateItem = (index: number, field: keyof ItemForm, value: any) => {
    setFormItens(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const getImpostoNome = (id: string) => {
    return impostos.find(imp => imp.id === id)?.nome || "—"
  }

  return (
    <>
      {/* Filtro */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Label htmlFor="filtro-consultoria" className="text-xs text-muted-foreground mb-1.5 block">
            Filtrar por Consultoria
          </Label>
          <Select value={filtroConsultoria} onValueChange={setFiltroConsultoria}>
            <SelectTrigger id="filtro-consultoria" className="w-full sm:max-w-xs">
              <SelectValue placeholder="Todas as consultorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as consultorias</SelectItem>
              {consultorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.consultoria} - {c.cliente}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {podeEditar && (
          <div className="flex items-end">
            <Button size="sm" onClick={abrirDialogNovo} className="h-9 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Novo Lançamento
            </Button>
          </div>
        )}
      </div>

      <Card className="border border-border/40 bg-card shadow-sm">
        <CardHeader className="px-5 pt-5 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Lançamentos Mensais
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhum lançamento encontrado</p>
              {podeEditar && (
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em &quot;Novo Lançamento&quot; para cadastrar.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="w-[40px]" />
                    <TableHead className="font-semibold">Mês/Ano</TableHead>
                    <TableHead className="font-semibold">Consultoria</TableHead>
                    <TableHead className="font-semibold text-right">Bruto</TableHead>
                    <TableHead className="font-semibold text-right">Descontos</TableHead>
                    <TableHead className="font-semibold text-right">Líquido</TableHead>
                    {podeEditar && <TableHead className="w-[90px]" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos.map((lanc) => {
                    const totalDescontos = lanc.valor_bruto - lanc.valor_liquido
                    const isExpanded = expandedIds.has(lanc.id)
                    
                    return (
                      <>
                        <TableRow key={lanc.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleExpand(lanc.id)}
                              aria-label={isExpanded ? "Recolher" : "Expandir"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium capitalize">
                            {formatarMesReferencia(lanc.mes_referencia)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getConsultoriaNome(lanc.consultoria_id)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400">
                              <TrendingUp className="h-3 w-3" />
                              {formatarMoeda(Number(lanc.valor_bruto))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className="flex items-center justify-end gap-1 text-red-600 dark:text-red-400">
                              <TrendingDown className="h-3 w-3" />
                              {formatarMoeda(totalDescontos)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatarMoeda(Number(lanc.valor_liquido))}
                          </TableCell>
                          {podeEditar && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => abrirDialogEditar(lanc)}
                                  aria-label="Editar"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                  onClick={() => confirmarExclusao(lanc.id)}
                                  aria-label="Excluir"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${lanc.id}-details`} className="bg-muted/20">
                            <TableCell colSpan={podeEditar ? 7 : 6} className="p-4">
                              <div className="space-y-3">
                                {lanc.observacoes && (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Observações:</span> {lanc.observacoes}
                                  </p>
                                )}
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-2">Detalhamento dos Descontos:</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {lanc.itens.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-md border border-border/40 bg-background px-3 py-2"
                                      >
                                        <span className="text-sm">{item.imposto_nome || "—"}</span>
                                        <span className="text-sm font-mono text-red-600 dark:text-red-400">
                                          -{formatarMoeda(Number(item.valor_calculado))}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={fecharDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
            <DialogDescription>
              {editando ? "Atualize os dados do lançamento mensal." : "Registre um novo lançamento mensal."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultoria">Consultoria *</Label>
                <Select 
                  value={formConsultoriaId} 
                  onValueChange={setFormConsultoriaId}
                  disabled={!!editando}
                >
                  <SelectTrigger id="consultoria">
                    <SelectValue placeholder="Selecione a consultoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {consultorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.consultoria} - {c.cliente} ({c.tipo_contratacao})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mes_referencia">Mês de Referência *</Label>
                <Input
                  id="mes_referencia"
                  type="month"
                  value={formMesReferencia.slice(0, 7)}
                  onChange={(e) => setFormMesReferencia(e.target.value + "-01")}
                  disabled={!!editando}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_bruto">Valor Bruto (R$) *</Label>
              <Input
                id="valor_bruto"
                type="number"
                step="0.01"
                placeholder="Ex: 15000.00"
                value={formValorBruto}
                onChange={(e) => setFormValorBruto(e.target.value)}
              />
            </div>

            {formConsultoriaId && formItens.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Impostos/Descontos</Label>
                <div className="space-y-2 rounded-lg border border-border/40 p-3">
                  {formItens.map((item, index) => {
                    const bruto = parseFloat(formValorBruto) || 0
                    let valorCalc = 0
                    if (item.selecionado) {
                      if (item.tipo_calculo === "PERCENTUAL") {
                        valorCalc = (bruto * (parseFloat(item.percentual) || 0)) / 100
                      } else {
                        valorCalc = parseFloat(item.valor_fixo) || 0
                      }
                    }

                    return (
                      <div
                        key={item.imposto_desconto_id}
                        className="flex flex-wrap items-center gap-3 rounded-md border border-border/30 bg-muted/30 p-2"
                      >
                        <div className="flex items-center gap-2 min-w-[150px]">
                          <Checkbox
                            id={`item-${index}`}
                            checked={item.selecionado}
                            onCheckedChange={(checked) => updateItem(index, "selecionado", !!checked)}
                          />
                          <Label htmlFor={`item-${index}`} className="text-sm cursor-pointer">
                            {getImpostoNome(item.imposto_desconto_id)}
                          </Label>
                        </div>

                        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                          {item.tipo_calculo === "PERCENTUAL" ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                className="w-20 h-8 text-sm"
                                value={item.percentual}
                                onChange={(e) => updateItem(index, "percentual", e.target.value)}
                                disabled={!item.selecionado}
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                className="w-24 h-8 text-sm"
                                value={item.valor_fixo}
                                onChange={(e) => updateItem(index, "valor_fixo", e.target.value)}
                                disabled={!item.selecionado}
                              />
                            </div>
                          )}
                        </div>

                        <div className="text-sm font-mono text-red-600 dark:text-red-400 min-w-[100px] text-right">
                          {item.selecionado ? `-${formatarMoeda(valorCalc)}` : "—"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Resumo */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valor Líquido Calculado:</span>
                <span className="text-xl font-bold text-primary">
                  {formatarMoeda(valorLiquidoCalculado)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações opcionais sobre este lançamento"
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                rows={2}
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
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
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
    </>
  )
}
