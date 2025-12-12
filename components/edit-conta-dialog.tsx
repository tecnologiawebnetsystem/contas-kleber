"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, FileText } from "lucide-react"
import type { Conta, TipoConta, Categoria } from "@/types/conta"

interface EditContaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string, conta: Partial<Conta>) => void
  conta: Conta | null
}

const categorias: Categoria[] = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Vestuário",
  "Serviços",
  "Outros",
]

export function EditContaDialog({ open, onOpenChange, onEdit, conta }: EditContaDialogProps) {
  const [nome, setNome] = useState("")
  const [valor, setValor] = useState("")
  const [tipo, setTipo] = useState<TipoConta>("fixa")
  const [dataVencimento, setDataVencimento] = useState("")
  const [parcelas, setParcelas] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataGasto, setDataGasto] = useState("")
  const [categoria, setCategoria] = useState<Categoria>("Outros")
  const [anexo, setAnexo] = useState<string | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (conta && open) {
      setNome(conta.nome)
      setValor(conta.valor.toString())
      setTipo(conta.tipo)
      if (conta.vencimento) {
        const hoje = new Date()
        const ano = hoje.getFullYear()
        const mes = String(hoje.getMonth() + 1).padStart(2, "0")
        const dia = String(conta.vencimento).padStart(2, "0")
        setDataVencimento(`${ano}-${mes}-${dia}`)
      }
      setCategoria(conta.categoria || "Outros")

      if (conta.tipo === "parcelada") {
        setParcelas(conta.parcelas?.toString() || "")
        setDataInicio(conta.dataInicio || "")
      }

      if (conta.tipo === "diaria" || conta.tipo === "caixinha") {
        setDataGasto(conta.dataGasto || "")
        setAnexo(conta.anexoDiario || null)
        if (conta.anexoDiario) {
          setNomeArquivo("Comprovante anexado")
        }
      }
    }
  }, [conta, open])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!conta) return

    const diaVencimento = tipo === "diaria" || tipo === "caixinha" ? 1 : new Date(dataVencimento).getDate()

    const contaAtualizada: Partial<Conta> = {
      nome,
      valor: Number.parseFloat(valor),
      tipo,
      vencimento: diaVencimento,
      categoria,
    }

    if (tipo === "parcelada") {
      contaAtualizada.parcelas = Number.parseInt(parcelas)
      contaAtualizada.dataInicio = dataInicio
    }

    if (tipo === "diaria" || tipo === "caixinha") {
      contaAtualizada.dataGasto = dataGasto
      if (anexo) {
        contaAtualizada.anexoDiario = anexo
      }
    }

    onEdit(conta.id, contaAtualizada)
    onOpenChange(false)
  }

  if (!conta) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
          <DialogDescription>Altere os dados da conta</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Conta</Label>
            <Input
              id="nome"
              placeholder="Ex: Luz, Água, Remédio, Gasolina..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Conta</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoConta)} disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixa">Fixa Mensal</SelectItem>
                <SelectItem value="parcelada">Parcelada</SelectItem>
                <SelectItem value="diaria">Gasto Diário</SelectItem>
                <SelectItem value="caixinha">Caixinha (Poupança)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">O tipo de conta não pode ser alterado</p>
          </div>

          {tipo !== "diaria" && tipo !== "caixinha" && (
            <div className="space-y-2">
              <Label htmlFor="dataVencimento">Data Vencimento</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                required
              />
            </div>
          )}

          {(tipo === "diaria" || tipo === "caixinha") && (
            <div className="space-y-2">
              <Label htmlFor="dataGasto">{tipo === "caixinha" ? "Data do Depósito" : "Data do Gasto"}</Label>
              <Input
                id="dataGasto"
                type="date"
                value={dataGasto}
                onChange={(e) => setDataGasto(e.target.value)}
                required
              />
            </div>
          )}

          {tipo === "parcelada" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parcelas">Número de Parcelas</Label>
                <Input
                  id="parcelas"
                  type="number"
                  min="2"
                  placeholder="12"
                  value={parcelas}
                  onChange={(e) => setParcelas(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(tipo === "diaria" || tipo === "caixinha") && (
            <div className="space-y-2">
              <Label htmlFor="anexoDiario">Comprovante (Opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="anexoDiario"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
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
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
