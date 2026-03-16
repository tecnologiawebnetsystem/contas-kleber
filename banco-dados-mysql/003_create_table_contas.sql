-- ============================================
-- SCRIPT 003: Tabela de Contas
-- Armazena todas as contas do sistema
-- ============================================

USE contas_kleber;

CREATE TABLE IF NOT EXISTS contas (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  vencimento INT,
  tipo ENUM('fixa', 'parcelada', 'diaria', 'poupanca', 'viagem') NOT NULL DEFAULT 'fixa',
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
    'Poupanca',
    'Viagem',
    'Outros'
  ) DEFAULT 'Outros',
  parcelas INT DEFAULT NULL,
  data_inicio DATE DEFAULT NULL,
  data_gasto DATE DEFAULT NULL,
  anexo_diario TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para otimização
CREATE INDEX idx_contas_tipo ON contas(tipo);
CREATE INDEX idx_contas_categoria ON contas(categoria);
CREATE INDEX idx_contas_vencimento ON contas(vencimento);
CREATE INDEX idx_contas_data_gasto ON contas(data_gasto);
CREATE INDEX idx_contas_created ON contas(created_at);
