"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Building2, RefreshCw, Wallet } from "lucide-react"
import { formatarMoeda } from "@/utils/formatar-moeda"

interface Consultoria {
  id: string
  consultoria: string
  cliente: string
  tipo_contratacao: string
  valor_mensal: number | null
  valor_hora: number | null
}

interface ContaBancaria {
  id: string
  nome: string
  banco: string | null
  tipo: string
  cor: string
}

interface Lancamento {
  id: string
  consultoria_id: string
  valor_liquido: number
  mes_referencia: string
}

const TIPOS_CREDITO = [
  { value: "salario", label: "Salário" },
  { value: "freelance", label: "Freelance" },
  { value: "consultoria", label: "Consultoria" },
  { value: "reembolso", label: "Reembolso" },
  { value: "dividendos", label: "Dividendos" },
  { value: "investimentos", label: "Investimentos" },
  { value: "presente", label: "Presente" },
  { value: "outro", label: "Outro" },
]

interface AddCreditoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (
    valor: number, 
    descricao: string, 
    data: string, 
    consultoriaId?: string,
    tipoCredito?: string,
    contaBancariaId?: string,
    recorrente?: boolean
  ) => void
}

export function AddCreditoDialog({ open, onOpenChange, onAdd }: AddCreditoDialogProps) {
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [dataTransacao, setDataTransacao] = useState(new Date().toISOString().split("T")[0])
  const [consultoriaId, setConsultoriaId] = useState<string>("")
  const [tipoCredito, setTipoCredito] = useState<string>("salario")
  const [contaBancariaId, setContaBancariaId] = useState<string>("")
  const [recorrente, setRecorrente] = useState(false)
  
  const [consultorias, setConsultorias] = useState<Consultoria[]>([])
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loadingConsultorias, setLoadingConsultorias] = useState(false)
  const [loadingContas, setLoadingContas] = useState(false)

  useEffect(() => {
    if (open) {
      // Carregar consultorias
      setLoadingConsultorias(true)
      fetch("/api/consultorias")
        .then((r) => r.json())
        .then((data) => {
          const ativas = Array.isArray(data) ? data.filter((c: Consultoria) => (c as any).status !== "Encerrada") : []
          setConsultorias(ativas)
        })
        .catch(() => setConsultorias([]))
        .finally(() => setLoadingConsultorias(false))

      // Carregar contas bancárias
      setLoadingContas(true)
      fetch("/api/contas-bancarias")
        .then((r) => r.json())
        .then((data) => setContasBancarias(Array.isArray(data) ? data : []))
        .catch(() => setContasBancarias([]))
        .finally(() => setLoadingContas(false))

      // Carregar lançamentos para sugerir valor
      fetch("/api/lancamentos")
        .then((r) => r.json())
        .then((data) => setLancamentos(Array.isArray(data) ? data : []))
        .catch(() => setLancamentos([]))
    }
  }, [open])

  // Preencher valor automaticamente ao selecionar consultoria
  useEffect(() => {
    if (consultoriaId && consultoriaId !== "none") {
      const consultoria = consultorias.find(c => c.id === consultoriaId)
      if (consultoria) {
        // Tentar pegar o último lançamento dessa consultoria
        const lancamentosConsultoria = lancamentos
          .filter(l => l.consultoria_id === consultoriaId)
          .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia))
        
        if (lancamentosConsultoria.length > 0) {
          // Usar valor líquido do último lançamento
          setValor(String(lancamentosConsultoria[0].valor_liquido))
          setDescricao(`Pagamento ${consultoria.consultoria} - ${consultoria.cliente}`)
        } else if (consultoria.valor_mensal) {
          // Se não tem lançamento, usar valor mensal cadastrado
          setValor(String(consultoria.valor_mensal))
          setDescricao(`Pagamento ${consultoria.consultoria} - ${consultoria.cliente}`)
        }
        
        // Definir tipo como consultoria ou salário baseado no tipo de contratação
        if (consultoria.tipo_contratacao === "CLT") {
          setTipoCredito("salario")
        } else {
          setTipoCredito("consultoria")
        }
      }
    }
  }, [consultoriaId, consultorias, lancamentos])

  // Obter valor sugerido para exibição
  const valorSugerido = (() => {
    if (!consultoriaId || consultoriaId === "none") return null
    const consultoria = consultorias.find(c => c.id === consultoriaId)
    if (!consultoria) return null

    const lancamentosConsultoria = lancamentos
      .filter(l => l.consultoria_id === consultoriaId)
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia))

    if (lancamentosConsultoria.length > 0) {
      return { valor: lancamentosConsultoria[0].valor_liquido, fonte: "último lançamento" }
    } else if (consultoria.valor_mensal) {
      return { valor: consultoria.valor_mensal, fonte: "valor mensal cadastrado" }
    }
    return null
  })()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const valorNum = Number.parseFloat(valor)
    if (valorNum > 0) {
      onAdd(
        valorNum, 
        descricao || "Adição de crédito", 
        dataTransacao, 
        consultoriaId && consultoriaId !== "none" ? consultoriaId : undefined,
        tipoCredito,
        contaBancariaId && contaBancariaId !== "none" ? contaBancariaId : undefined,
        recorrente
      )
      resetForm()
      onOpenChange(false)
    }
  }

  const resetForm = () => {
    setValor("")
    setDescricao("")
    setConsultoriaId("")
    setTipoCredito("salario")
    setContaBancariaId("")
    setRecorrente(false)
    setDataTransacao(new Date().toISOString().split("T")[0])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Adicionar Crédito
          </DialogTitle>
          <DialogDescription>
            Adicione crédito à sua carteira para pagar contas. O saldo será mantido entre os meses.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Tipo de Crédito */}
          <div className="space-y-2">
            <Label htmlFor="tipoCredito">Tipo de Crédito *</Label>
            <Select value={tipoCredito} onValueChange={setTipoCredito}>
              <SelectTrigger id="tipoCredito" className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_CREDITO.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Consultoria de origem */}
          <div className="space-y-2">
            <Label htmlFor="consultoria" className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Consultoria (opcional)
            </Label>
            <Select value={consultoriaId || "none"} onValueChange={setConsultoriaId} disabled={loadingConsultorias}>
              <SelectTrigger id="consultoria" className="w-full">
                <SelectValue placeholder={loadingConsultorias ? "Carregando..." : "Selecione a consultoria"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma / Outro</SelectItem>
                {consultorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.consultoria}</span>
                      <span className="text-muted-foreground">— {c.cliente}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        c.tipo_contratacao === "CLT" 
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                          : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      }`}>
                        {c.tipo_contratacao}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="valor">Valor (R$) *</Label>
              {valorSugerido && (
                <span className="text-[10px] text-muted-foreground">
                  Sugerido: {formatarMoeda(valorSugerido.valor)} ({valorSugerido.fonte})
                </span>
              )}
            </div>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="dataTransacao">Data *</Label>
            <Input
              id="dataTransacao"
              type="date"
              value={dataTransacao}
              onChange={(e) => setDataTransacao(e.target.value)}
              required
            />
          </div>

          {/* Conta Bancária */}
          <div className="space-y-2">
            <Label htmlFor="contaBancaria" className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              Conta Bancária (opcional)
            </Label>
            <Select value={contaBancariaId || "none"} onValueChange={setContaBancariaId} disabled={loadingContas}>
              <SelectTrigger id="contaBancaria" className="w-full">
                <SelectValue placeholder={loadingContas ? "Carregando..." : "Selecione a conta"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não especificar</SelectItem>
                {contasBancarias.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: conta.cor || "#3B82F6" }}
                      />
                      <span className="font-medium">{conta.nome}</span>
                      {conta.banco && (
                        <span className="text-muted-foreground text-xs">({conta.banco})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contasBancarias.length === 0 && !loadingContas && (
              <p className="text-xs text-muted-foreground">
                Nenhuma conta bancária cadastrada. Configure em Configurações.
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Ex: Salário referente a março/2024..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Recorrente */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="recorrente" className="text-sm font-medium cursor-pointer">
                  Crédito Recorrente
                </Label>
                <p className="text-xs text-muted-foreground">
                  Repetir automaticamente todo mês
                </p>
              </div>
            </div>
            <Switch
              id="recorrente"
              checked={recorrente}
              onCheckedChange={setRecorrente}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
