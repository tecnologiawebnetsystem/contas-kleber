-- ============================================
-- SCRIPT 011: Zerar saldo
-- Use este script para resetar o saldo para R$ 0,00
-- caso o valor esteja incorreto por causa de
-- pagamentos registrados sem credito correspondente.
-- ============================================

USE contas_kleber;

-- Zera o saldo existente
UPDATE saldo SET valor = 0.00, updated_at = NOW();

-- Caso nao exista nenhum registro de saldo, insere um zerado
INSERT INTO saldo (valor)
SELECT 0.00
WHERE NOT EXISTS (SELECT 1 FROM saldo LIMIT 1);

SELECT 'Saldo zerado com sucesso!' AS status, valor FROM saldo LIMIT 1;
