export type TipoConta = "fixa" | "parcelada" | "diaria" | "poupanca" | "viagem"

export type Categoria =
  | "Moradia"
  | "Alimentação"
  | "Transporte"
  | "Saúde"
  | "Educação"
  | "Lazer"
  | "Gasto Viagem"
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
  categoria?: Categoria
  parcelas?: number
  parcelaAtual?: number
  dataInicio?: string
  dataGasto?: string
  data_gasto?: string
  data_inicio?: string
  anexoDiario?: string
  pagamentos?: Pagamento[]
  created_at?: string
  createdAt?: string
  updatedAt?: string
  // Campos de contas parceladas expandidas pela API
  pago?: boolean
  mesVencimento?: number
  anoVencimento?: number
  dataPagamento?: string
  anexo?: string
  dataVencimentoCompleta?: string
}
