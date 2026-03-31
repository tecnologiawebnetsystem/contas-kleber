-- Adiciona coluna data_recebimento na tabela consultorias
-- Esta coluna armazena o dia do mês em que o pagamento é recebido

ALTER TABLE consultorias 
ADD COLUMN IF NOT EXISTS dia_recebimento INT DEFAULT NULL;

-- Comentário: dia_recebimento representa o dia do mês em que o pagamento é recebido (1-31)
