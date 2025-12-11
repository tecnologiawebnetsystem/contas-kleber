export type TipoConta = "fixa" | "parcelada" | "diaria"

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
  parcelas?: number
  parcelaAtual?: number
  dataInicio?: string
  dataGasto?: string
  pagamentos?: Pagamento[]
}
