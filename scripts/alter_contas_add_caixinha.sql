-- Adiciona o tipo 'caixinha' ao ENUM da tabela contas
-- Execute este script no banco de dados MySQL

ALTER TABLE contas 
  MODIFY COLUMN tipo ENUM('fixa', 'parcelada', 'diaria', 'poupanca', 'viagem', 'caixinha') 
  NOT NULL DEFAULT 'fixa';
