-- =============================================================================
-- Script 003: Criar Tabela de Pagamentos
-- Sistema de Controle de Contas - MySQL
-- =============================================================================

USE contas_kleber;

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conta_id CHAR(36) NOT NULL,
  mes INT NOT NULL CHECK (mes >= 0 AND mes <= 11),
  ano INT NOT NULL,
  data_pagamento DATE NOT NULL,
  anexo TEXT DEFAULT NULL,
  valor_ajustado DECIMAL(10, 2) DEFAULT NULL,
  vencimento_ajustado INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Chave estrangeira
  CONSTRAINT fk_pagamentos_conta 
    FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE,
  
  -- Constraint única para evitar duplicatas
  CONSTRAINT uk_pagamentos_conta_mes_ano UNIQUE (conta_id, mes, ano),
  
  -- Índices
  INDEX idx_pagamentos_conta_id (conta_id),
  INDEX idx_pagamentos_mes_ano (mes, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
