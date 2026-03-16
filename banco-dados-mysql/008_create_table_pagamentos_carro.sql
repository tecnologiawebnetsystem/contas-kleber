-- ============================================
-- SCRIPT 008: Tabela de Pagamentos do Carro
-- Controle de financiamento do veículo
-- ============================================

USE contas_kleber;

CREATE TABLE IF NOT EXISTS pagamentos_carro (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  valor DECIMAL(15,2) NOT NULL,
  data_pagamento DATE NOT NULL,
  descricao VARCHAR(500) DEFAULT 'Pagamento do carro',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para ordenação por data
CREATE INDEX idx_pagamentos_carro_data ON pagamentos_carro(data_pagamento);
