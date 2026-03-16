-- =============================================================================
-- Script 002: Criar Tabela de Contas
-- Sistema de Controle de Contas - MySQL
-- =============================================================================

USE contas_kleber;

-- Criar tabela de contas
CREATE TABLE IF NOT EXISTS contas (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  vencimento INT NOT NULL CHECK (vencimento >= 1 AND vencimento <= 31),
  tipo ENUM('fixa', 'parcelada', 'diaria', 'poupanca', 'viagem') NOT NULL,
  categoria ENUM(
    'Moradia',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Gasto Viagem',
    'Vestuário',
    'Serviços',
    'Outros'
  ) DEFAULT 'Outros',
  parcelas INT DEFAULT NULL,
  parcela_atual INT DEFAULT NULL,
  data_inicio DATE DEFAULT NULL,
  data_gasto DATE DEFAULT NULL,
  anexo_diario TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_contas_tipo (tipo),
  INDEX idx_contas_categoria (categoria),
  INDEX idx_contas_vencimento (vencimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
