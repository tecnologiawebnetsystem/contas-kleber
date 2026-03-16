-- =============================================================================
-- SCRIPT COMPLETO - Sistema de Controle de Contas
-- MySQL 8.0+
-- =============================================================================
-- Este arquivo contém toda a estrutura do banco de dados em um único arquivo.
-- Execute este script para criar toda a estrutura de uma vez.
-- =============================================================================

-- =============================================================================
-- 1. CRIAR BANCO DE DADOS
-- =============================================================================
CREATE DATABASE IF NOT EXISTS contas_kleber
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE contas_kleber;

-- =============================================================================
-- 2. TABELA: contas
-- Armazena todas as contas (fixas, parceladas, diárias, poupança, viagem)
-- =============================================================================
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
  
  INDEX idx_contas_tipo (tipo),
  INDEX idx_contas_categoria (categoria),
  INDEX idx_contas_vencimento (vencimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. TABELA: pagamentos
-- Registra os pagamentos realizados para cada conta
-- =============================================================================
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
  
  CONSTRAINT fk_pagamentos_conta 
    FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE,
  
  CONSTRAINT uk_pagamentos_conta_mes_ano UNIQUE (conta_id, mes, ano),
  
  INDEX idx_pagamentos_conta_id (conta_id),
  INDEX idx_pagamentos_mes_ano (mes, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. TABELA: configuracoes
-- Configurações do sistema (notificações por email, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email_destino VARCHAR(255) NOT NULL DEFAULT 'seu-email@exemplo.com',
  notificacoes_ativadas BOOLEAN DEFAULT FALSE,
  notificar_vencimento BOOLEAN DEFAULT TRUE,
  notificar_atraso BOOLEAN DEFAULT TRUE,
  dias_antecedencia INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. TABELA: emprestimos
-- Controle de dinheiro emprestado para outras pessoas
-- =============================================================================
CREATE TABLE IF NOT EXISTS emprestimos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome_pessoa VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_devolucao DATE NOT NULL,
  devolvido BOOLEAN DEFAULT FALSE,
  data_devolvido DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_emprestimos_devolvido (devolvido),
  INDEX idx_emprestimos_data_devolucao (data_devolucao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. TABELA: pagamentos_carro
-- Controle de pagamentos do financiamento do carro
-- =============================================================================
CREATE TABLE IF NOT EXISTS pagamentos_carro (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  valor DECIMAL(10, 2) NOT NULL,
  data_pagamento DATE NOT NULL,
  descricao VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_pagamentos_carro_data (data_pagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. DADOS INICIAIS
-- =============================================================================

-- Configuração padrão do sistema
INSERT INTO configuracoes (email_destino, notificacoes_ativadas, notificar_vencimento, notificar_atraso, dias_antecedencia)
SELECT 'seu-email@exemplo.com', FALSE, TRUE, TRUE, 3
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM configuracoes LIMIT 1);

-- Pagamentos do carro iniciais
INSERT INTO pagamentos_carro (valor, data_pagamento, descricao) VALUES
  (6000.00, '2026-01-15', 'Pagamento do carro'),
  (2000.00, '2026-01-20', 'Pagamento do carro'),
  (380.00, '2026-01-28', 'Pagamento do carro');

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
SELECT 'Banco de dados criado com sucesso!' AS status;
