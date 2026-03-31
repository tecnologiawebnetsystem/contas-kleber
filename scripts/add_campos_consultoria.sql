-- Adiciona campos de valor/hora, valor mensal e status na tabela consultorias
ALTER TABLE consultorias 
ADD COLUMN IF NOT EXISTS valor_hora DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS valor_mensal DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Ativa';

-- Atualiza registros existentes para ter status 'Ativa'
UPDATE consultorias SET status = 'Ativa' WHERE status IS NULL;
