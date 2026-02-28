-- Adicionar colunas para ajustes por parcela na tabela pagamentos
-- valor_ajustado: valor diferente para uma parcela especifica (null = usa valor da conta)
-- vencimento_ajustado: dia de vencimento diferente para uma parcela especifica (null = usa vencimento da conta)

ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS valor_ajustado NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vencimento_ajustado INTEGER DEFAULT NULL;
