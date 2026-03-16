-- ============================================
-- SCRIPT 006: Tabela de Configurações
-- Configurações do sistema e notificações
-- ============================================

USE contas_kleber;

CREATE TABLE IF NOT EXISTS configuracoes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email_destino VARCHAR(255) NOT NULL,
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
