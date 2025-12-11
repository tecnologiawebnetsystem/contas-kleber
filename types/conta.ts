export type TipoConta = "fixa" | "parcelada" | "diaria"

export type Categoria =
  | "Moradia"
  | "Alimentação"
  | "Transporte"
  | "Saúde"
  | "Educação"
  | "Lazer"
  | "Vestuário"
  | "Serviços"
  | "Outros"

export interface Pagamento {
  mes: number
  ano: number
  pago: boolean
  dataPagamento?: string
  anexo?: string
}

export interface Conta {
  id: string
  nome: string
  valor: number
  tipo: TipoConta
  vencimento: number
  categoria?: Categoria // Adicionando categoria
  parcelas?: number
  parcelaAtual?: number
  dataInicio?: string
  dataGasto?: string
  anexoDiario?: string // Adicionando campo para anexo de gastos diários
  pagamentos?: Pagamento[]
  created_at?: string
}
