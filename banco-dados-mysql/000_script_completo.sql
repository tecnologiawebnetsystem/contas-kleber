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
-- 2. TABELA: saldo
-- Controla o saldo disponível do usuário
-- =============================================================================
CREATE TABLE IF NOT EXISTS saldo (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  valor DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_saldo_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. TABELA: contas
-- Armazena todas as contas (fixas, parceladas, diárias, poupança, viagem)
-- =============================================================================
CREATE TABLE IF NOT EXISTS contas (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  vencimento INT DEFAULT NULL,
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_contas_tipo (tipo),
  INDEX idx_contas_categoria (categoria),
  INDEX idx_contas_vencimento (vencimento),
  INDEX idx_contas_data_gasto (data_gasto),
  INDEX idx_contas_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. TABELA: pagamentos
-- Registra os pagamentos realizados para cada conta
-- =============================================================================
CREATE TABLE IF NOT EXISTS pagamentos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conta_id CHAR(36) NOT NULL,
  mes INT NOT NULL CHECK (mes >= 0 AND mes <= 11),
  ano INT NOT NULL,
  data_pagamento DATE DEFAULT NULL,
  anexo TEXT DEFAULT NULL,
  valor_ajustado DECIMAL(15, 2) DEFAULT NULL,
  vencimento_ajustado INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_pagamentos_conta 
    FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE,
  
  CONSTRAINT uk_pagamentos_conta_mes_ano UNIQUE (conta_id, mes, ano),
  
  INDEX idx_pagamentos_conta_id (conta_id),
  INDEX idx_pagamentos_mes_ano (mes, ano),
  INDEX idx_pagamentos_data (data_pagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. TABELA: transacoes
-- Histórico de créditos e débitos
-- =============================================================================
CREATE TABLE IF NOT EXISTS transacoes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tipo ENUM('credito', 'debito') NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  descricao VARCHAR(500) DEFAULT NULL,
  referencia_id CHAR(36) DEFAULT NULL,
  data_transacao DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_transacoes_tipo (tipo),
  INDEX idx_transacoes_referencia (referencia_id),
  INDEX idx_transacoes_data (data_transacao),
  INDEX idx_transacoes_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. TABELA: configuracoes
-- Configurações do sistema (notificações por email e WhatsApp)
-- =============================================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email_destino VARCHAR(255) NOT NULL DEFAULT 'seu-email@exemplo.com',
  notificacoes_ativadas BOOLEAN DEFAULT TRUE,
  notificar_vencimento BOOLEAN DEFAULT TRUE,
  notificar_atraso BOOLEAN DEFAULT TRUE,
  whatsapp_ativado BOOLEAN DEFAULT FALSE,
  whatsapp_numeros JSON DEFAULT NULL,
  notificar_vencimento_whatsapp BOOLEAN DEFAULT TRUE,
  notificar_atraso_whatsapp BOOLEAN DEFAULT TRUE,
  whatsapp_mensagem_template TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. TABELA: emprestimos
-- Controle de dinheiro emprestado para outras pessoas
-- =============================================================================
CREATE TABLE IF NOT EXISTS emprestimos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome_pessoa VARCHAR(255) NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data_devolucao DATE DEFAULT NULL,
  devolvido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_emprestimos_devolvido (devolvido),
  INDEX idx_emprestimos_data_devolucao (data_devolucao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. TABELA: pagamentos_carro
-- Controle de pagamentos do financiamento do carro
-- =============================================================================
CREATE TABLE IF NOT EXISTS pagamentos_carro (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  valor DECIMAL(15, 2) NOT NULL,
  data_pagamento DATE NOT NULL,
  descricao VARCHAR(500) DEFAULT 'Pagamento do carro',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_pagamentos_carro_data (data_pagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. DADOS INICIAIS
-- =============================================================================

-- Inserir saldo inicial (se não existir)
INSERT INTO saldo (id, valor)
SELECT UUID(), 0.00
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM saldo LIMIT 1);

-- Configuração padrão do sistema (se não existir)
INSERT INTO configuracoes (
  id,
  email_destino,
  notificacoes_ativadas,
  notificar_vencimento,
  notificar_atraso,
  whatsapp_ativado,
  whatsapp_numeros,
  notificar_vencimento_whatsapp,
  notificar_atraso_whatsapp,
  whatsapp_mensagem_template
)
SELECT 
  UUID(),
  'seu-email@exemplo.com',
  TRUE,
  TRUE,
  TRUE,
  FALSE,
  '[]',
  TRUE,
  TRUE,
  '🔔 *Alerta de Contas - Talent Money Family*'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM configuracoes LIMIT 1);

-- =============================================================================
-- 10. TABELA: cabelo
-- Controla agendamentos de luz e progressiva (4 de cada)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cabelo (
  id               CHAR(36)                    PRIMARY KEY DEFAULT (UUID()),
  tipo             ENUM('luz','progressiva')   NOT NULL,
  numero           TINYINT                     NOT NULL COMMENT 'Numero do servico: 1, 2, 3 ou 4',
  feita            BOOLEAN                     NOT NULL DEFAULT FALSE,
  data_realizada   DATE                        DEFAULT NULL COMMENT 'Data em que o servico foi realizado',
  created_at       TIMESTAMP                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP                   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_cabelo_tipo_numero (tipo, numero),
  INDEX idx_cabelo_tipo   (tipo),
  INDEX idx_cabelo_feita  (feita)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO cabelo (tipo, numero, feita) VALUES
  ('luz',         1, FALSE),
  ('luz',         2, FALSE),
  ('luz',         3, FALSE),
  ('luz',         4, FALSE),
  ('progressiva', 1, FALSE),
  ('progressiva', 2, FALSE),
  ('progressiva', 3, FALSE),
  ('progressiva', 4, FALSE);

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
SELECT 'Banco de dados criado com sucesso!' AS status;
