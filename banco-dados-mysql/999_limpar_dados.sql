-- =============================================================================
-- Script 999: Limpar Dados do Sistema
-- Sistema de Controle de Contas - MySQL
-- =============================================================================
-- ATENÇÃO: Este script remove TODOS os dados das tabelas!
-- Use com cuidado!
-- =============================================================================

USE contas_kleber;

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar todas as tabelas
TRUNCATE TABLE pagamentos;
TRUNCATE TABLE contas;
TRUNCATE TABLE configuracoes;
TRUNCATE TABLE emprestimos;
TRUNCATE TABLE pagamentos_carro;

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Reinserir configuração padrão
INSERT INTO configuracoes (email_destino, notificacoes_ativadas, notificar_vencimento, notificar_atraso, dias_antecedencia)
VALUES ('seu-email@exemplo.com', FALSE, TRUE, TRUE, 3);

SELECT 'Todos os dados foram removidos com sucesso!' AS status;
