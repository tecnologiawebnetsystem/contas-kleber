-- Script 1: Adiciona coluna dia_recebimento na tabela consultorias
-- Execute este script primeiro

ALTER TABLE consultorias 
ADD COLUMN IF NOT EXISTS dia_recebimento INT DEFAULT NULL;
