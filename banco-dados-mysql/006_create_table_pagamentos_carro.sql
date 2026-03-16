-- =============================================================================
-- Script 006: Criar Tabela de Pagamentos do Carro
-- Sistema de Controle de Contas - MySQL
-- =============================================================================

USE contas_kleber;

-- Criar tabela de pagamentos do carro
CREATE TABLE IF NOT EXISTS pagamentos_carro (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  valor DECIMAL(10, 2) NOT NULL,
  data_pagamento DATE NOT NULL,
  descricao VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_pagamentos_carro_data (data_pagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
