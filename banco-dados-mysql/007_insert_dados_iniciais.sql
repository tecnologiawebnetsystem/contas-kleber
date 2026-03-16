-- =============================================================================
-- Script 007: Inserir Dados Iniciais
-- Sistema de Controle de Contas - MySQL
-- =============================================================================

USE contas_kleber;

-- =============================================================================
-- Inserir Pagamentos do Carro Iniciais
-- =============================================================================
INSERT INTO pagamentos_carro (valor, data_pagamento, descricao) VALUES
  (6000.00, '2026-01-15', 'Pagamento do carro'),
  (2000.00, '2026-01-20', 'Pagamento do carro'),
  (380.00, '2026-01-28', 'Pagamento do carro');

-- =============================================================================
-- Exemplo de Contas (descomente se quiser dados de exemplo)
-- =============================================================================
/*
-- Contas Fixas de exemplo
INSERT INTO contas (nome, valor, vencimento, tipo, categoria) VALUES
  ('Aluguel', 1500.00, 5, 'fixa', 'Moradia'),
  ('Internet', 99.90, 10, 'fixa', 'Serviços'),
  ('Energia Elétrica', 180.00, 15, 'fixa', 'Moradia'),
  ('Água', 80.00, 20, 'fixa', 'Moradia'),
  ('Plano de Saúde', 450.00, 25, 'fixa', 'Saúde');

-- Conta Parcelada de exemplo
INSERT INTO contas (nome, valor, vencimento, tipo, categoria, parcelas, parcela_atual, data_inicio) VALUES
  ('Geladeira Nova', 250.00, 10, 'parcelada', 'Outros', 12, 1, '2026-01-01');
*/
