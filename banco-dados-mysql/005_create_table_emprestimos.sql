-- =============================================================================
-- Script 005: Criar Tabela de Empréstimos
-- Sistema de Controle de Contas - MySQL
-- =============================================================================

USE contas_kleber;

-- Criar tabela de empréstimos (dinheiro emprestado para outras pessoas)
CREATE TABLE IF NOT EXISTS emprestimos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome_pessoa VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_devolucao DATE NOT NULL,
  devolvido BOOLEAN DEFAULT FALSE,
  data_devolvido DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_emprestimos_devolvido (devolvido),
  INDEX idx_emprestimos_data_devolucao (data_devolucao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
