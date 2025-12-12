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

interface AddContaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (conta: Omit<Conta, "id">) => void
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

export function AddContaDialog({ open, onOpenChange, onAdd }: AddContaDialogProps) {
  const [nome, setNome] = useState("")
  const [valor, setValor] = useState("")
  const [tipo, setTipo] = useState<TipoConta>("fixa")
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0])
  const [parcelas, setParcelas] = useState("")
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0])
  const [dataGasto, setDataGasto] = useState(new Date().toISOString().split("T")[0])
  const [categoria, setCategoria] = useState<Categoria>("Outros")
  const [anexo, setAnexo] = useState<string | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const [nomesContas, setNomesContas] = useState<string[]>([])
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    const diaVencimento = tipo === "diaria" ? 1 : new Date(dataVencimento).getDate()

    const novaConta: Omit<Conta, "id"> = {
      nome,
      valor: Number.parseFloat(valor),
      tipo,
      vencimento: diaVencimento,
      categoria,
      pagamentos: [],
    }

    if (tipo === "parcelada") {
      novaConta.parcelas = Number.parseInt(parcelas)
      novaConta.dataInicio = dataInicio
      novaConta.parcelaAtual = 1
    }

    if (tipo === "diaria" || tipo === "caixinha") {
      novaConta.dataGasto = dataGasto
      if (anexo) {
        novaConta.anexoDiario = anexo
      }
    }

    onAdd(novaConta)

    setNome("")
    setValor("")
    setTipo("fixa")
    setDataVencimento(new Date().toISOString().split("T")[0])
    setParcelas("")
    setDataInicio(new Date().toISOString().split("T")[0])
    setDataGasto(new Date().toISOString().split("T")[0])
    setCategoria("Outros")
    setAnexo(null)
    setNomeArquivo(null)
  }

  useEffect(() => {
    if (open) {
      fetch("/api/contas")
        .then((res) => res.json())
        .then((data) => {
          const nomes = [...new Set(data.map((c: Conta) => c.nome))]
          setNomesContas(nomes)
        })
        .catch((err) => console.error("[v0] Erro ao buscar nomes:", err))
    }
  }, [open])

  const sugestoesFiltradas = nomesContas.filter((n) => n.toLowerCase().includes(nome.toLowerCase()) && n !== nome)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
          <DialogDescription>Adicione uma conta fixa, parcelada ou gasto diário</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Conta</Label>
            <div className="relative">
              <Input
                id="nome"
                placeholder="Ex: Luz, Água, Remédio, Gasolina..."
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  setSugestoesVisiveis(e.target.value.length > 0)
                }}
                onFocus={() => setSugestoesVisiveis(nome.length > 0)}
                onBlur={() => setTimeout(() => setSugestoesVisiveis(false), 200)}
                required
              />
              {sugestoesVisiveis && sugestoesFiltradas.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {sugestoesFiltradas.map((sugestao, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setNome(sugestao)
                        setSugestoesVisiveis(false)
                      }}
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoConta)}>
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

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
