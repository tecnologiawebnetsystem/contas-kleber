-- ============================================
-- SCRIPT 002: Tabela de Saldo
-- Controla o saldo disponível do usuário
-- ============================================

USE contas_kleber;

CREATE TABLE IF NOT EXISTS saldo (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  valor DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para busca rápida
CREATE INDEX idx_saldo_updated ON saldo(updated_at);
