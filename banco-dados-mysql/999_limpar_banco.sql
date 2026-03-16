-- ============================================
-- SCRIPT 999: Limpar Banco de Dados
-- CUIDADO: Este script apaga TODOS os dados!
-- ============================================

USE contas_kleber;

-- Desabilitar verificação de chave estrangeira temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar todas as tabelas
TRUNCATE TABLE pagamentos;
TRUNCATE TABLE transacoes;
TRUNCATE TABLE contas;
TRUNCATE TABLE emprestimos;
TRUNCATE TABLE pagamentos_carro;
TRUNCATE TABLE configuracoes;
TRUNCATE TABLE saldo;

-- Reabilitar verificação de chave estrangeira
SET FOREIGN_KEY_CHECKS = 1;

-- Reinserir dados iniciais
INSERT INTO saldo (id, valor) VALUES (UUID(), 0.00);

INSERT INTO configuracoes (
  id,
  email_destino,
  notificacoes_ativadas,
  notificar_vencimento,
  notificar_atraso
) VALUES (
  UUID(),
  'seu-email@exemplo.com',
  TRUE,
  TRUE,
  TRUE
);

SELECT 'Banco de dados limpo e reinicializado!' AS status;
