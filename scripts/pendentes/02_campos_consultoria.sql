-- Script 2: Adiciona campos valor_hora, valor_mensal e status na tabela consultorias
-- Execute após o script 01

ALTER TABLE consultorias 
ADD COLUMN IF NOT EXISTS valor_hora DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS valor_mensal DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Ativa';

UPDATE consultorias SET status = 'Ativa' WHERE status IS NULL;
