-- Script para limpar todos os dados financeiros do sistema
-- ATENÇÃO: Este script remove TODOS os dados de contas, pagamentos, transações, poupança, etc!
-- Os dados de acesso/autenticação são preservados
-- Execute apenas quando tiver certeza de que deseja começar do zero

-- Limpar todas as transações (créditos, débitos, viagens, etc)
DELETE FROM transacoes;

-- Limpar todos os pagamentos registrados
DELETE FROM pagamentos;

-- Limpar todas as contas (fixas, parceladas, lazer, viagem, etc)
DELETE FROM contas;

-- Limpar todos os depósitos da poupança (caixinha)
DELETE FROM caixinha_depositos;

-- Limpar configuração da poupança (caixinha)
DELETE FROM caixinha_config;

-- Resetar o saldo para zero (mantém o registro mas zera o valor)
UPDATE saldo SET valor = 0, updated_at = NOW();

-- Se não houver registro de saldo, criar um zerado
INSERT INTO saldo (id, valor, updated_at)
SELECT gen_random_uuid(), 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM saldo);

-- OPCIONAL: Descomentar a linha abaixo para limpar também as configurações de notificação
-- DELETE FROM configuracoes;

-- Verificar limpeza (deve retornar 0 para todas as tabelas, exceto saldo que deve ter 1 registro com valor 0)
SELECT 
    (SELECT COUNT(*) FROM contas) as total_contas,
    (SELECT COUNT(*) FROM pagamentos) as total_pagamentos,
    (SELECT COUNT(*) FROM transacoes) as total_transacoes,
    (SELECT COUNT(*) FROM caixinha_depositos) as total_depositos_poupanca,
    (SELECT COUNT(*) FROM caixinha_config) as total_config_poupanca,
    (SELECT COUNT(*) FROM saldo) as total_registros_saldo,
    (SELECT COALESCE(SUM(valor), 0) FROM saldo) as valor_saldo_atual,
    (SELECT COUNT(*) FROM configuracoes) as total_configuracoes;
