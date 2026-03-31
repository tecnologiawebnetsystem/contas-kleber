"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, FileText, Copy, BookmarkPlus, Bookmark } from "lucide-react"
import type { Conta, TipoConta, Categoria } from "@/types/conta"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  nome: string
  tipo: string
  categoria: string
  subcategoria: string | null
  fornecedor: string | null
  valor_padrao: number | null
}

interface Subcategoria {
  id: string
  categoria: string
  nome: string
}

interface AddContaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (conta: Omit<Conta, "id">) => void
  contaParaDuplicar?: Conta | null
}

const categorias: Categoria[] = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Gasto Viagem",
  "Vestuário",
  "Serviços",
  "Outros",
]

export function AddContaDialog({ open, onOpenChange, onAdd, contaParaDuplicar }: AddContaDialogProps) {
  const { toast } = useToast()
  const [nome, setNome] = useState("")
  const [valor, setValor] = useState("")
  const [tipo, setTipo] = useState<TipoConta>("fixa")
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0])
  const [parcelas, setParcelas] = useState("")
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0])
  const [dataGasto, setDataGasto] = useState(new Date().toISOString().split("T")[0])
  const [categoria, setCategoria] = useState<Categoria>("Outros")
  const [subcategoria, setSubcategoria] = useState("")
  const [fornecedor, setFornecedor] = useState("")
  const [anexo, setAnexo] = useState<string | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const [nomesContas, setNomesContas] = useState<string[]>([])
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(false)
  
  // Templates e subcategorias
  const [templates, setTemplates] = useState<Template[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [salvandoTemplate, setSalvandoTemplate] = useState(false)
  const [activeTab, setActiveTab] = useState("novo")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar dados quando abrir
  useEffect(() => {
    if (open) {
      // Carregar nomes existentes
      fetch("/api/contas")
        .then((res) => res.json())
        .then((data) => {
          const nomes = [...new Set(data.map((c: Conta) => c.nome))]
          setNomesContas(nomes)
        })
        .catch((err) => console.error("[v0] Erro ao buscar nomes:", err))

      // Carregar templates
      setLoadingTemplates(true)
      fetch("/api/templates-contas")
        .then((res) => res.json())
        .then((data) => setTemplates(Array.isArray(data) ? data : []))
        .catch(() => setTemplates([]))
        .finally(() => setLoadingTemplates(false))

      // Carregar subcategorias
      fetch("/api/subcategorias")
        .then((res) => res.json())
        .then((data) => setSubcategorias(Array.isArray(data) ? data : []))
        .catch(() => setSubcategorias([]))
    }
  }, [open])

  // Preencher com conta para duplicar
  useEffect(() => {
    if (open && contaParaDuplicar) {
      setNome(contaParaDuplicar.nome)
      setValor(String(contaParaDuplicar.valor))
      setTipo(contaParaDuplicar.tipo)
      setCategoria(contaParaDuplicar.categoria)
      setSubcategoria((contaParaDuplicar as any).subcategoria || "")
      setFornecedor((contaParaDuplicar as any).fornecedor || "")
      // Ajustar data para o próximo mês se for fixa
      if (contaParaDuplicar.tipo === "fixa") {
        const hoje = new Date()
        const novaData = new Date(hoje.getFullYear(), hoje.getMonth(), contaParaDuplicar.vencimento)
        if (novaData < hoje) {
          novaData.setMonth(novaData.getMonth() + 1)
        }
        setDataVencimento(novaData.toISOString().split("T")[0])
      }
      setActiveTab("novo")
    }
  }, [open, contaParaDuplicar])

  // Subcategorias filtradas pela categoria selecionada
  const subcategoriasFiltradas = subcategorias.filter(s => s.categoria === categoria)

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

  const handleUsarTemplate = (template: Template) => {
    setNome(template.nome)
    setTipo(template.tipo as TipoConta)
    setCategoria(template.categoria as Categoria)
    setSubcategoria(template.subcategoria || "")
    setFornecedor(template.fornecedor || "")
    if (template.valor_padrao) {
      setValor(String(template.valor_padrao))
    }
    setActiveTab("novo")
    toast({ title: "Template aplicado", description: `"${template.nome}" foi carregado.` })
  }

  const handleSalvarComoTemplate = async () => {
    if (!nome || !tipo || !categoria) {
      toast({ title: "Erro", description: "Preencha nome, tipo e categoria para salvar como template.", variant: "destructive" })
      return
    }

    setSalvandoTemplate(true)
    try {
      const res = await fetch("/api/templates-contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          tipo,
          categoria,
          subcategoria: subcategoria || null,
          fornecedor: fornecedor || null,
          valor_padrao: valor ? parseFloat(valor) : null
        })
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      const novoTemplate = await res.json()
      setTemplates(prev => [...prev, novoTemplate])
      toast({ title: "Template salvo", description: `"${nome}" foi salvo como template.` })
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar o template.", variant: "destructive" })
    } finally {
      setSalvandoTemplate(false)
    }
  }

  const handleExcluirTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates-contas?id=${templateId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast({ title: "Template excluído" })
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o template.", variant: "destructive" })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const diaVencimento = tipo === "diaria" ? 1 : new Date(dataVencimento).getDate()

    const novaConta: Omit<Conta, "id"> & { fornecedor?: string; subcategoria?: string } = {
      nome,
      valor: Number.parseFloat(valor),
      tipo,
      vencimento: diaVencimento,
      categoria,
      pagamentos: [],
    }

    // Adicionar campos extras
    if (fornecedor) {
      novaConta.fornecedor = fornecedor
    }
    if (subcategoria) {
      novaConta.subcategoria = subcategoria
    }

    if (tipo === "parcelada") {
      novaConta.parcelas = Number.parseInt(parcelas)
      novaConta.dataInicio = dataInicio
      novaConta.parcelaAtual = 1
    }

    if (tipo === "diaria") {
      novaConta.dataGasto = dataGasto
      if (anexo) {
        novaConta.anexoDiario = anexo
      }
    }

    onAdd(novaConta as Omit<Conta, "id">)
    resetForm()
  }

  const resetForm = () => {
    setNome("")
    setValor("")
    setTipo("fixa")
    setDataVencimento(new Date().toISOString().split("T")[0])
    setParcelas("")
    setDataInicio(new Date().toISOString().split("T")[0])
    setDataGasto(new Date().toISOString().split("T")[0])
    setCategoria("Outros")
    setSubcategoria("")
    setFornecedor("")
    setAnexo(null)
    setNomeArquivo(null)
  }

  const sugestoesFiltradas = nomesContas.filter((n) => n.toLowerCase().includes(nome.toLowerCase()) && n !== nome)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {contaParaDuplicar ? (
              <>
                <Copy className="h-5 w-5 text-primary" />
                Duplicar Conta
              </>
            ) : (
              "Nova Conta"
            )}
          </DialogTitle>
          <DialogDescription>
            {contaParaDuplicar 
              ? `Duplicando "${contaParaDuplicar.nome}". Ajuste os valores conforme necessário.`
              : "Adicione uma conta fixa, parcelada ou gasto diário"
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="novo">Nova Conta</TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5" />
              Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            {loadingTemplates ? (
              <div className="text-center py-8 text-muted-foreground">Carregando templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum template salvo ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crie uma conta e clique em "Salvar como Template" para reutilizar depois.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{template.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.tipo} • {template.categoria}
                        {template.subcategoria && ` • ${template.subcategoria}`}
                        {template.valor_padrao && ` • R$ ${template.valor_padrao.toFixed(2)}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUsarTemplate(template)}
                      >
                        Usar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleExcluirTemplate(template.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="novo" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome da Conta */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Conta *</Label>
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
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-auto">
                      {sugestoesFiltradas.map((sugestao, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
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

              {/* Tipo de Conta */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Conta *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoConta)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixa">Fixa Mensal</SelectItem>
                    <SelectItem value="parcelada">Parcelada</SelectItem>
                    <SelectItem value="diaria">Gasto Diário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
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

              {/* Datas conforme tipo */}
              {tipo !== "diaria" && (
                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Data Vencimento *</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    required
                  />
                </div>
              )}

              {tipo === "diaria" && (
                <div className="space-y-2">
                  <Label htmlFor="dataGasto">Data do Pagamento *</Label>
                  <Input
                    id="dataGasto"
                    type="date"
                    value={dataGasto}
                    onChange={(e) => setDataGasto(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Parcelas */}
              {tipo === "parcelada" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parcelas">Número de Parcelas *</Label>
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
                    <Label htmlFor="dataInicio">Data Início *</Label>
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

              {/* Categoria e Subcategoria */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={categoria} onValueChange={(v) => {
                    setCategoria(v as Categoria)
                    setSubcategoria("") // Reset subcategoria ao mudar categoria
                  }}>
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

                <div className="space-y-2">
                  <Label htmlFor="subcategoria">Subcategoria</Label>
                  <Select value={subcategoria || "nenhuma"} onValueChange={(v) => setSubcategoria(v === "nenhuma" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhuma">Nenhuma</SelectItem>
                      {subcategoriasFiltradas.map((sub) => (
                        <SelectItem key={sub.id} value={sub.nome}>
                          {sub.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fornecedor */}
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor / Beneficiário</Label>
                <Input
                  id="fornecedor"
                  placeholder="Ex: CPFL, Sabesp, Farmácia São Paulo..."
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                />
              </div>

              {/* Anexo para gasto diário */}
              {tipo === "diaria" && (
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

              {/* Botões de ação */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {/* Salvar como Template */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSalvarComoTemplate}
                  disabled={salvandoTemplate || !nome}
                  className="w-full"
                >
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  {salvandoTemplate ? "Salvando..." : "Salvar como Template"}
                </Button>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {contaParaDuplicar ? "Duplicar" : "Adicionar"}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
