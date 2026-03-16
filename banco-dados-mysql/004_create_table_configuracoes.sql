-- =============================================================================
-- Script 004: Criar Tabela de Configurações
-- Sistema de Controle de Contas - MySQL
-- =============================================================================

USE contas_kleber;

-- Criar tabela de configurações
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

-- Inserir configuração padrão
INSERT INTO configuracoes (email_destino, notificacoes_ativadas, notificar_vencimento, notificar_atraso, dias_antecedencia)
SELECT 'seu-email@exemplo.com', FALSE, TRUE, TRUE, 3
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM configuracoes LIMIT 1);
