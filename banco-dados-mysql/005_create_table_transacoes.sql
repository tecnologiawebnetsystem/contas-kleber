-- ============================================
-- SCRIPT 005: Tabela de Transações
-- Histórico de créditos e débitos
-- ============================================

USE contas_kleber;

CREATE TABLE IF NOT EXISTS transacoes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tipo ENUM('credito', 'debito') NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  descricao VARCHAR(500) DEFAULT NULL,
  referencia_id CHAR(36) DEFAULT NULL,
  data_transacao DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para otimização
CREATE INDEX idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX idx_transacoes_referencia ON transacoes(referencia_id);
CREATE INDEX idx_transacoes_data ON transacoes(data_transacao);
CREATE INDEX idx_transacoes_created ON transacoes(created_at);
