-- ============================================
-- SCRIPT 007: Tabela de Empréstimos
-- Controle de dinheiro emprestado a terceiros
-- ============================================

USE contas_kleber;

CREATE TABLE IF NOT EXISTS emprestimos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome_pessoa VARCHAR(255) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  data_devolucao DATE DEFAULT NULL,
  devolvido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para otimização
CREATE INDEX idx_emprestimos_devolvido ON emprestimos(devolvido);
CREATE INDEX idx_emprestimos_data_devolucao ON emprestimos(data_devolucao);
