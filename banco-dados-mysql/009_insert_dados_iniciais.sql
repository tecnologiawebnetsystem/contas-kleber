-- ============================================
-- SCRIPT 009: Dados Iniciais
-- Insere dados básicos para iniciar o sistema
-- ============================================

USE contas_kleber;

-- Inserir saldo inicial (zerado)
INSERT INTO saldo (id, valor) 
VALUES (UUID(), 0.00)
ON DUPLICATE KEY UPDATE valor = valor;

-- Inserir configuração padrão
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
) VALUES (
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
);

-- Exemplos de pagamentos do carro (opcional - remova se não precisar)
-- INSERT INTO pagamentos_carro (id, valor, data_pagamento, descricao) VALUES
-- (UUID(), 1500.00, '2025-01-15', 'Parcela 1/48 - Financiamento Carro'),
-- (UUID(), 1500.00, '2025-02-15', 'Parcela 2/48 - Financiamento Carro'),
-- (UUID(), 1500.00, '2025-03-15', 'Parcela 3/48 - Financiamento Carro');
